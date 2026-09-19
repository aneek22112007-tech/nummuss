import os
import json
import hashlib
import uuid
from datetime import datetime, timezone

try:
    import boto3
except ImportError:
    boto3 = None

# Import shared engine helpers
try:
    from common.schemas import MarketSignal
    from common.fixtures import SEED_SIGNALS
except ImportError:
    from lambdas.common.schemas import MarketSignal
    from lambdas.common.fixtures import SEED_SIGNALS

DDB_SIGNALS_TABLE = os.environ.get("DDB_SIGNALS_TABLE", "nummuss-signals")
S3_EVIDENCE_BUCKET = os.environ.get("S3_EVIDENCE_BUCKET", "nummuss-evidence")
REASON_DECIDE_FUNCTION_NAME = os.environ.get("REASON_DECIDE_FUNCTION_NAME")

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
    Fetches, normalizes, hashes, and stores market signals in DynamoDB & S3.
    """
    print("Executing fetch_signal handler...")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Determine input signals: from event, live news, or preselected fixtures
    raw_inputs = event.get("signals") if isinstance(event, dict) and "signals" in event else SEED_SIGNALS

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
        symbol = item.get("symbol", "NIFTY50").upper()
        sig_type = item.get("type", "news")
        raw_content = item.get("content", "")
        
        normalized = normalize_text(raw_content)
        content_hash = hash_payload(normalized)
        # Keep each scheduled run auditable instead of overwriting a prior signal
        # with the same fixture/content hash.
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
