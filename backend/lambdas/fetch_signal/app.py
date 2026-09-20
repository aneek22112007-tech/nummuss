import os
import json
import hashlib
import uuid
from datetime import datetime, timezone

try:
    import boto3
except ImportError:
    boto3 = None

try:
    import urllib.request as urllib_request
except ImportError:
    urllib_request = None

# Import shared engine helpers
try:
    from common.schemas import MarketSignal
except ImportError:
    from lambdas.common.schemas import MarketSignal

DDB_SIGNALS_TABLE = os.environ.get("DDB_SIGNALS_TABLE", "nummuss-signals")
S3_EVIDENCE_BUCKET = os.environ.get("S3_EVIDENCE_BUCKET", "nummuss-evidence")
REASON_DECIDE_FUNCTION_NAME = os.environ.get("REASON_DECIDE_FUNCTION_NAME")
ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "")
ALPHA_VANTAGE_SYMBOLS = os.environ.get("ALPHA_VANTAGE_SYMBOLS", "")

# ------------------------------------------------
# Alpha Vantage helpers (stdlib urllib, no deps)
# ------------------------------------------------

def _av_get(params: dict) -> dict:
    """Make a GET request to Alpha Vantage and return parsed JSON."""
    params["apikey"] = ALPHA_VANTAGE_API_KEY
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"https://www.alphavantage.co/query?{qs}"
    req = urllib_request.Request(url, headers={"User-Agent": "nummuss/1.0"})
    with urllib_request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _fetch_alpha_vantage_price(symbol: str) -> dict | None:
    """
    Fetch the latest intraday price candle for a symbol via Alpha Vantage
    TIME_SERIES_INTRADAY. Returns a raw signal dict or None on failure.
    Note: Alpha Vantage uses US ticker symbols. For Indian stocks use BSE/NSE
    suffix e.g. RELIANCE.BSE. NIFTY50 is mapped to ^NSEI (not supported in
    intraday, so we use GLOBALQUOTE as fallback).
    """
    try:
        # Use GLOBAL_QUOTE for broad compatibility (works for Indian BSE tickers too)
        data = _av_get({"function": "GLOBAL_QUOTE", "symbol": symbol})
        quote = data.get("Global Quote", {})
        price = quote.get("05. price", "N/A")
        change_pct = quote.get("10. change percent", "N/A")
        volume = quote.get("06. volume", "N/A")
        if price == "N/A":
            print(f"Alpha Vantage price: no data for {symbol}")
            return None
        content = (
            f"{symbol} price ₹{price} ({change_pct}), "
            f"volume {volume}. Source: Alpha Vantage GLOBAL_QUOTE."
        )
        return {"symbol": symbol, "type": "price", "content": content}
    except Exception as err:
        print(f"Alpha Vantage price fetch error for {symbol}: {err}")
        return None


def _fetch_alpha_vantage_news(symbol: str) -> list[dict]:
    """
    Fetch top 3 news headlines for a symbol via Alpha Vantage NEWS_SENTIMENT.
    Returns a list of raw signal dicts.
    """
    results = []
    try:
        data = _av_get({
            "function": "NEWS_SENTIMENT",
            "tickers": symbol,
            "limit": "3",
            "sort": "LATEST"
        })
        feed = data.get("feed", [])
        for article in feed[:3]:
            title = article.get("title", "")
            source = article.get("source", "Alpha Vantage News")
            sentiment = article.get("overall_sentiment_label", "Neutral")
            content = f"[{source}] {title} — Sentiment: {sentiment}."
            results.append({"symbol": symbol, "type": "news", "content": content})
    except Exception as err:
        print(f"Alpha Vantage news fetch error for {symbol}: {err}")
    return results


def _build_live_signals(symbols: list[str]) -> list[dict]:
    """
    Fetch live price and news signals for each symbol from Alpha Vantage.
    """
    raw_signals = []
    for symbol in symbols:
        price_sig = _fetch_alpha_vantage_price(symbol)
        if price_sig:
            raw_signals.append(price_sig)
        news_sigs = _fetch_alpha_vantage_news(symbol)
        raw_signals.extend(news_sigs)

    return raw_signals


def normalize_text(text: str) -> str:
    """Normalize text by stripping excessive whitespace and formatting."""
    if not text:
        return ""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return " ".join(lines)

def hash_payload(content: str) -> str:
    """Compute SHA-256 hash string of signal content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def handler(event, context):
    """
    fetch_signal Lambda Handler:
    1. Fetches live price + news signals from Alpha Vantage.
    2. Normalizes, hashes, and stores each signal in DynamoDB & S3.
    3. Invokes reason_decide Lambda asynchronously.
    """
    print("Executing fetch_signal handler...")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Determine input signals
    if isinstance(event, dict) and "signals" in event:
        # Explicit signals injected via event (e.g. from a test)
        raw_inputs = event["signals"]
        print(f"Using {len(raw_inputs)} signals from event payload.")
    elif ALPHA_VANTAGE_API_KEY and ALPHA_VANTAGE_SYMBOLS:
        symbols = [s.strip() for s in ALPHA_VANTAGE_SYMBOLS.split(",") if s.strip()]
        print(f"Fetching live signals from Alpha Vantage for: {symbols}")
        raw_inputs = _build_live_signals(symbols)
    else:
        raise RuntimeError("Live market data is not configured. Set ALPHA_VANTAGE_API_KEY and ALPHA_VANTAGE_SYMBOLS.")

    if not raw_inputs:
        return {
            "statusCode": 503,
            "body": json.dumps({"error": "No live market signals were returned by the configured provider.", "signals": []})
        }

    processed_signals = []

    # Initialize AWS clients lazily
    dynamodb = None
    s3 = None
    lambda_client = None
    if boto3 and (os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_DEFAULT_REGION")):
        try:
            dynamodb = boto3.resource("dynamodb")
            s3 = boto3.client("s3")
            lambda_client = boto3.client("lambda") if REASON_DECIDE_FUNCTION_NAME else None
        except Exception as e:
            raise RuntimeError(f"Unable to initialize AWS clients: {e}") from e

    for item in raw_inputs:
        symbol = str(item.get("symbol", "")).upper()
        if not symbol:
            raise ValueError("Every market signal must include a symbol.")
        sig_type = item.get("type", "news")
        raw_content = item.get("content", "")

        normalized = normalize_text(raw_content)
        content_hash = hash_payload(normalized)
        sig_id = f"sig-{symbol.lower()}-{content_hash[:8]}-{uuid.uuid4().hex[:12]}"
        s3_key = f"evidence/{symbol}/{sig_id}.json"

        signal_record = MarketSignal(
            signal_id=sig_id,
            timestamp=now_iso,
            symbol=symbol,
            type=sig_type,
            content=normalized,
            s3_key=s3_key,
            hash=content_hash
        )

        record_dict = signal_record.model_dump()

        # Write to S3 evidence store
        if s3:
            try:
                s3.put_object(
                    Bucket=S3_EVIDENCE_BUCKET,
                    Key=s3_key,
                    Body=json.dumps(record_dict, indent=2),
                    ContentType="application/json"
                )
            except Exception as err:
                raise RuntimeError(f"Unable to persist evidence {s3_key}: {err}") from err

        # Write to DynamoDB signals ledger
        if dynamodb:
            try:
                table = dynamodb.Table(DDB_SIGNALS_TABLE)
                table.put_item(Item=record_dict)
            except Exception as err:
                raise RuntimeError(f"Unable to persist signal {sig_id}: {err}") from err

        processed_signals.append(record_dict)

    if lambda_client and REASON_DECIDE_FUNCTION_NAME:
        try:
            lambda_client.invoke(
                FunctionName=REASON_DECIDE_FUNCTION_NAME,
                InvocationType="Event",
                Payload=json.dumps({"source": "nummuss.fetch_signal"}).encode("utf-8")
            )
        except Exception as err:
            raise RuntimeError(f"Unable to invoke reason-and-decide Lambda: {err}") from err

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": f"Successfully processed {len(processed_signals)} market signals.",
            "signals": processed_signals
        })
    }
