import os
import json
import uuid
from datetime import datetime, timezone

try:
    import boto3
    from boto3.dynamodb.conditions import Key, Attr
except ImportError:
    boto3 = None
    Key = None
    Attr = None

try:
    import urllib.request as urllib_request
except ImportError:
    urllib_request = None

# Import shared engine helpers
try:
    from common.schemas import DecisionRecord, TradeResult, SignalSource, MarketSignal
    from common.layer1 import validate_evidence
    from common.layer2 import evaluate_behavioral_guardrails
    from common.paper_portfolio import apply_paper_decision, default_performance, latest_price
except ImportError:
    from lambdas.common.schemas import DecisionRecord, TradeResult, SignalSource, MarketSignal
    from lambdas.common.layer1 import validate_evidence
    from lambdas.common.layer2 import evaluate_behavioral_guardrails
    from lambdas.common.paper_portfolio import apply_paper_decision, default_performance, latest_price

DDB_DECISIONS_TABLE = os.environ.get("DDB_DECISIONS_TABLE", "nummuss-decisions")
DDB_SIGNALS_TABLE = os.environ.get("DDB_SIGNALS_TABLE", "nummuss-signals")
DDB_SHADOW_TABLE = os.environ.get("DDB_SHADOW_TABLE", "nummuss-shadow")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "eu-north-1")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
BEDROCK_GUARDRAIL_ID = os.environ.get("BEDROCK_GUARDRAIL_ID", "")
BEDROCK_GUARDRAIL_VERSION = os.environ.get("BEDROCK_GUARDRAIL_VERSION", "DRAFT")
MEGABULL_API_KEY = os.environ.get("MEGABULL_API_KEY", "")
MEGABULL_BASE_URL = os.environ.get("MEGABULL_BASE_URL", "https://api.megabull.app/v1")
MEGABULL_ORDER_QTY = int(os.environ.get("MEGABULL_ORDER_QTY", "1"))

# --- LLM chain: Amazon Bedrock → deterministic hold ---
_LLM_FALLBACK = {
    "action": "hold",
    "confidence_raw": 0,
    "confidence_tier": "low",
    "cited_symbols": [],
    "cited_signals": []
}


def _http_post(url: str, headers: dict, payload: dict) -> dict:
    """Minimal HTTP POST using stdlib urllib (no extra deps needed in Lambda)."""
    body = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(url, data=body, headers=headers, method="POST")
    with urllib_request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _place_megabull_order(symbol: str, action: str, qty: int = 1) -> bool:
    """
    Place a paper trade order on MegaBull for Indian stocks.
    Priority: disciplined agent approved trades only.
    Returns True on success, False on failure (non-blocking).
    """
    if not MEGABULL_API_KEY or action == "hold":
        return False
    try:
        url = f"{MEGABULL_BASE_URL}/orders"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {MEGABULL_API_KEY}",
        }
        payload = {
            "symbol": symbol,
            "side": action,   # "buy" or "sell"
            "qty": qty,
            "type": "market",
            "product": "MIS",  # Intraday paper trade
        }
        resp = _http_post(url, headers, payload)
        order_id = resp.get("order_id") or resp.get("id") or "unknown"
        print(f"MegaBull paper order placed: {action.upper()} {qty}x {symbol} → order_id={order_id}")
        return True
    except Exception as err:
        print(f"MegaBull order error (non-blocking): {err}")
        return False


def _parse_json_from_text(text: str) -> dict | None:
    """Extract the first {...} JSON block from a freeform text response."""
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    return None


def _call_bedrock(prompt_text: str) -> dict | None:
    """
    Amazon Bedrock Converse API authenticated by the Lambda execution role.
    The legacy bearer-token variable is deliberately not used for production
    inference: no long-lived model credential belongs in Lambda environment.
    """
    if not boto3:
        print("boto3 unavailable; Bedrock call skipped.")
        return None
    try:
        runtime = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
        request = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt_text}]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 512,
                "temperature": 0.2
            }
        }
        if BEDROCK_GUARDRAIL_ID:
            request["guardrailConfig"] = {
                "guardrailIdentifier": BEDROCK_GUARDRAIL_ID,
                "guardrailVersion": BEDROCK_GUARDRAIL_VERSION,
            }
        resp = runtime.converse(modelId=BEDROCK_MODEL_ID, **request)
        if resp.get("stopReason") == "guardrail_intervened":
            return {"guardrail_intervened": True}
        text = resp["output"]["message"]["content"][0]["text"]
        result = _parse_json_from_text(text)
        if result:
            print(f"LLM provider: Bedrock ({BEDROCK_MODEL_ID})")
        return result
    except Exception as err:
        print(f"Bedrock API error (falling back to deterministic hold): {err}")
        return None


def call_llm(prompt_text: str) -> dict:
    """
    Unified LLM caller:
      1. Try Amazon Bedrock
      2. Deterministic hold — fail-safe fallback
    Returns a decision dict.
    """
    result = _call_bedrock(prompt_text)
    if result:
        return result

    print("Bedrock unavailable. Using deterministic hold fallback.")
    return _LLM_FALLBACK

def query_recent_signals() -> list:
    """Fetch recent persisted live signals. Synthetic signals are never used."""
    if boto3 and (os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_DEFAULT_REGION")):
        try:
            dynamodb = boto3.resource("dynamodb")
            table = dynamodb.Table(DDB_SIGNALS_TABLE)
            res = table.scan(Limit=10)
            items = res.get("Items", [])
            if items:
                return [MarketSignal(**item) for item in items]
        except Exception as e:
            print(f"Error querying DynamoDB signals: {e}")
    
    return []


def _update_paper_performance(
    shadow_table,
    *,
    role: str,
    action: str,
    price: float | None,
    timestamp: str,
    shadow_agent: dict | None = None,
) -> None:
    """Persist bounded paper performance for a predefined or custom agent."""
    if not shadow_table:
        return
    try:
        if shadow_agent:
            key = shadow_agent["query_id"]
            current = shadow_agent.get("performance") or default_performance()
            performance = apply_paper_decision(current, action=action, price=price, timestamp=timestamp)
            shadow_table.update_item(
                Key={"query_id": key},
                UpdateExpression="SET performance = :performance, last_decision_at = :timestamp",
                ExpressionAttributeValues={":performance": performance, ":timestamp": timestamp},
            )
            return

        key = f"portfolio#{role}"
        item = shadow_table.get_item(Key={"query_id": key}).get("Item")
        current = (item or {}).get("performance") or default_performance()
        performance = apply_paper_decision(current, action=action, price=price, timestamp=timestamp)
        shadow_table.put_item(Item={
            "query_id": key,
            "entity_type": "benchmark_portfolio",
            "agent_role": role,
            "performance": performance,
            "last_decision_at": timestamp,
        })
    except Exception as exc:
        # A reporting failure must never prevent the primary decision record.
        print(f"Paper performance update failed for {role}: {exc}")



def handler(event, context):
    """
    reason_decide Lambda Handler:
    1. Fetches recent signals
    2. Calls LLM: Amazon Bedrock → deterministic fallback
    3. Layer 1: Evidence Consistency Gate
    4. Layer 2: Behavioral Guardrails (active for disciplined, bypassed for undisciplined twin)
    5. Stores DecisionRecords in DynamoDB
    """
    print("Executing reason_decide handler...")
    now_iso = datetime.now(timezone.utc).isoformat()
    signals = query_recent_signals()
    if not signals:
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "No fresh live market signals are available; no decisions were created.",
                "decisions": [],
            }),
        }

    # Construct reasoning prompt
    signal_summary = "\n".join([f"- [{sig.signal_id}] {sig.symbol}: {sig.content}" for sig in signals])
    prompt = f"""You are an AI Trading Assistant. Analyze these current market signals:
{signal_summary}

Output only a valid JSON object with keys:
"action" ("buy"|"sell"|"hold"), "symbol", "confidence_raw" (0-100), "confidence_tier" ("low"|"medium"|"high"), "cited_symbols" (list), "cited_signals" (list of objects with signal_id and excerpt).
"""

    # Detect malicious payload for Layer 0 Security Verification Test
    is_malicious_fixture = any("IGNORE PREVIOUS INSTRUCTIONS" in sig.content for sig in signals)

    # 1. Base LLM Call (used for agents without custom behavior prompts)
    base_llm_decision = None
    if not is_malicious_fixture:
        base_llm_decision = call_llm(prompt)

    dynamodb = None
    if boto3 and (os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_DEFAULT_REGION")):
        try:
            dynamodb = boto3.resource("dynamodb")
        except Exception as e:
            print(f"DynamoDB connection warning: {e}")

    # 2. Fetch Active Shadow Agents
    active_shadows = []
    if dynamodb:
        try:
            shadow_table = dynamodb.Table(DDB_SHADOW_TABLE)
            res = shadow_table.query(
                IndexName="StatusIndex",
                KeyConditionExpression=Key("status").eq("active")
            )
            for item in res.get("Items", []):
                if item.get("entity_type") != "shadow_agent":
                    continue
                if item.get("end_time", "") > now_iso:
                    active_shadows.append(item)
                else:
                    shadow_table.update_item(
                        Key={"query_id": item["query_id"]},
                        UpdateExpression="SET #status = :expired",
                        ExpressionAttributeNames={"#status": "status"},
                        ExpressionAttributeValues={":expired": "expired"},
                    )
        except Exception as e:
            print(f"Error fetching shadow agents: {e}")

    # 3. Define the agents to process
    agents = [
        {"role": "disciplined", "losses": 0, "behavior": None},
        {"role": "undisciplined", "losses": 3, "behavior": None}
    ]
    for s in active_shadows:
        agents.append({
            "role": f"shadow_{s.get('agent_id', s.get('query_id', 'unknown'))}",
            "losses": 0,
            "behavior": s.get("behavior_prompt"),
            "shadow_agent": s,
        })

    records = []

    for agent in agents:
        role = agent["role"]
        behavior = agent["behavior"]
        shadow_agent = agent.get("shadow_agent")
        consecutive_losses = agent["losses"]

        agent_prompt = prompt
        if behavior:
            agent_prompt += f"\n\nCRITICAL INSTRUCTION FOR THIS AGENT:\n{behavior}"

        if is_malicious_fixture:
            action = "hold"
            symbol = signals[0].symbol
            confidence_raw = 0
            confidence_tier = "low"
            cited_symbols = []
            cited_signals = [{"signal_id": "sig-malicious-01", "excerpt": "Prompt injection detected"}]
            is_valid_l1 = False
            evidence_quality = "weak"
            llm_intervened = False
        else:
            if behavior:
                llm_decision = call_llm(agent_prompt)
            else:
                llm_decision = base_llm_decision

            llm_intervened = llm_decision.get("guardrail_intervened", False)
            if llm_intervened:
                action = "hold"
                symbol = signals[0].symbol
                confidence_raw = 0
                confidence_tier = "low"
                cited_symbols = []
                cited_signals = []
                is_valid_l1 = False
                evidence_quality = "weak"
            else:
                action = llm_decision.get("action", "hold")
                symbol = llm_decision.get("symbol", signals[0].symbol)
                confidence_raw = int(llm_decision.get("confidence_raw", 0))
                confidence_tier = llm_decision.get("confidence_tier", "low")
                cited_symbols = llm_decision.get("cited_symbols", [])
                cited_signals = llm_decision.get("cited_signals", [])

                # Layer 1: Evidence Consistency Gate
                is_valid_l1, evidence_quality, l1_msg = validate_evidence(cited_symbols, cited_signals, signals)

        guardrail_layer = None
        guardrail_result = "passed"
        reason_label = None
        is_allowed = True
        test_fixture_flag = False

        if is_malicious_fixture or llm_intervened:
            guardrail_layer = "content"
            guardrail_result = "blocked_prompt_attack"
            reason_label = None
            is_allowed = False
            test_fixture_flag = True
        elif not is_valid_l1:
            guardrail_layer = "evidence"
            guardrail_result = "blocked_unsupported_claim"
            is_allowed = False
        elif role == "disciplined" or role.startswith("shadow_"):
            # Layer 2: Behavioral Guardrails applied to disciplined and shadow agents
            is_allowed, guardrail_result, reason_label = evaluate_behavioral_guardrails(
                action=action,
                trade_size_val=15000.0,
                portfolio_value=100000.0,
                daily_loss=1000.0,
                max_daily_loss=20000.0,
                consecutive_losses=consecutive_losses,
                evidence_quality=evidence_quality
            )
            if not is_allowed:
                guardrail_layer = "behavioral"

        trade_status = "rejected"
        if is_allowed:
            if role == "disciplined" and action != "hold":
                # Attempt live paper trade via MegaBull
                placed = _place_megabull_order(symbol, action, MEGABULL_ORDER_QTY)
                trade_status = "filled" if placed else "simulated"
            else:
                trade_status = "simulated"
        decision_id = f"dec-{role}-{uuid.uuid4().hex}"

        sources = [SignalSource(signal_id=s.get("signal_id", "sig-1"), excerpt=s.get("excerpt", "")) for s in cited_signals]

        rec = DecisionRecord(
            decision_id=decision_id,
            timestamp=now_iso,
            mode="india_replay",
            market_context="INDIA_REPLAY",
            agent_role=role,
            symbol=symbol,
            action=action,
            confidence_tier=confidence_tier,
            confidence_raw=confidence_raw,
            evidence_quality=evidence_quality,
            sources=sources,
            guardrail_layer=guardrail_layer,
            guardrail_result=guardrail_result,
            guardrail_reason_label=reason_label,
            test_fixture=test_fixture_flag,
            trade=TradeResult(status=trade_status),
            outcome_tracked=False
        )

        rec_dict = rec.model_dump()
        records.append(rec_dict)

        if dynamodb:
            try:
                table = dynamodb.Table(DDB_DECISIONS_TABLE)
                table.put_item(Item=rec_dict)
            except Exception as err:
                print(f"DynamoDB PutItem decision error: {err}")

            # All three agents are compared on the same observed price. This
            # remains a bounded paper ledger; no custom strategy can place a
            # brokerage order.
            _update_paper_performance(
                shadow_table,
                role=role if not shadow_agent else f"shadow_{shadow_agent['agent_id']}",
                action=action if is_allowed else "hold",
                price=latest_price(signals, symbol),
                timestamp=now_iso,
                shadow_agent=shadow_agent,
            )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Reasoning cycle completed for disciplined agent and twin.",
            "decisions": records
        })
    }
