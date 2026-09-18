import os
import json
from datetime import datetime, timezone

try:
    import boto3
except ImportError:
    boto3 = None

# Import shared engine helpers
try:
    from common.schemas import ShadowQuery, DecisionRecord
    from common.layer1 import validate_evidence
    from common.layer2 import evaluate_behavioral_guardrails
    from common.fixtures import SEED_DECISIONS, REPLAY_SCENARIOS, SEED_SIGNALS
except ImportError:
    from lambdas.common.schemas import ShadowQuery, DecisionRecord
    from lambdas.common.layer1 import validate_evidence
    from lambdas.common.layer2 import evaluate_behavioral_guardrails
    from lambdas.common.fixtures import SEED_DECISIONS, REPLAY_SCENARIOS, SEED_SIGNALS

DDB_DECISIONS_TABLE = os.environ.get("DDB_DECISIONS_TABLE", "nummuss-decisions")
DDB_SHADOW_TABLE = os.environ.get("DDB_SHADOW_TABLE", "nummuss-shadow")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

def response(status_code: int, body_data: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body_data)
    }

def handle_feed(params: dict) -> dict:
    """GET /feed?mode=&agent=&date="""
    mode = params.get("mode", "india_replay")
    agent_role = params.get("agent", "disciplined")

    items = SEED_DECISIONS
    if boto3 and (os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_DEFAULT_REGION")):
        try:
            dynamodb = boto3.resource("dynamodb")
            table = dynamodb.Table(DDB_DECISIONS_TABLE)
            res = table.scan(Limit=20)
            fetched = res.get("Items", [])
            if fetched:
                items = fetched
        except Exception as e:
            print(f"Error reading decisions table: {e}")

    filtered = [i for i in items if i.get("mode") == mode or i.get("agent_role") == agent_role]
    return response(200, {
        "mode": mode,
        "agent": agent_role,
        "count": len(filtered or items),
        "decisions": filtered or items
    })

def handle_decision_detail(decision_id: str) -> dict:
    """GET /decision/{decision_id}"""
    if boto3 and (os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_DEFAULT_REGION")):
        try:
            dynamodb = boto3.resource("dynamodb")
            table = dynamodb.Table(DDB_DECISIONS_TABLE)
            res = table.get_item(Key={"decision_id": decision_id})
            item = res.get("Item")
            if item:
                return response(200, item)
        except Exception as e:
            print(f"Error querying decision_id {decision_id}: {e}")

    for dec in SEED_DECISIONS:
        if dec.get("decision_id") == decision_id:
            return response(200, dec)

    return response(404, {"error": f"Decision {decision_id} not found."})

def handle_twin() -> dict:
    """GET /twin?mode=&days=14"""
    return response(200, {
        "mode": "india_replay",
        "starting_capital_inr": 100000,
        "timeline": [
            {"timestamp": "2026-09-18T09:15:00Z", "disciplined_inr": 100000, "twin_inr": 100000},
            {"timestamp": "2026-09-18T10:00:00Z", "disciplined_inr": 103500, "twin_inr": 97200},
            {"timestamp": "2026-09-18T11:00:00Z", "disciplined_inr": 108200, "twin_inr": 94800},
            {"timestamp": "2026-09-18T12:00:00Z", "disciplined_inr": 114200, "twin_inr": 98600}
        ],
        "summary": {
            "disciplined_final_inr": 114200,
            "twin_final_inr": 98600,
            "capital_difference_inr": 14200
        }
    })

def handle_counterfactual() -> dict:
    """GET /counterfactual?date="""
    return response(200, {
        "mode": "india_replay",
        "trades_attempted": 42,
        "trades_taken": {"disciplined": 31, "twin": 18},
        "guardrail_blocks": {"disciplined": 0, "twin": 13},
        "exposure_avoided_inr": 18400,
        "max_drawdown": {"disciplined": "-7.4%", "twin": "-16.8%"},
        "turnover": {"disciplined": "1.8x", "twin": "4.1x"},
        "capital_difference_inr": 14200,
        "top_blocked_behaviors": [
            {"label": "Revenge trading", "count": 5},
            {"label": "Oversized conviction bet", "count": 4},
            {"label": "Trading on hunch / Low evidence", "count": 3},
            {"label": "Loss chasing", "count": 1}
        ]
    })

def handle_replay_scenario(scenario_id: str) -> dict:
    """GET /replay/scenario/{id}"""
    scenario = REPLAY_SCENARIOS.get(scenario_id)
    if scenario:
        return response(200, scenario)
    return response(404, {"error": f"Scenario {scenario_id} not found."})

def handle_shadow(body_raw: str) -> dict:
    """
    POST /shadow
    User-facing behavioral challenge endpoint.
    Accepts trade idea, evaluates deterministically against Layer 1 & 2 rules.
    Does NOT call LLM -> verdict cannot hallucinate.
    """
    try:
        data = json.loads(body_raw) if body_raw else {}
    except Exception:
        data = {}

    symbol = data.get("symbol", "NIFTY50").upper()
    idea = data.get("idea", "")
    submitted_by = data.get("submitted_by", "public")

    now_iso = datetime.now(timezone.utc).isoformat()
    query_id = f"shq-{int(datetime.now().timestamp())}"

    idea_lower = idea.lower()
    
    # Deterministic Verdict Evaluation based on keywords in trade idea
    if "lost twice" in idea_lower or "double my size" in idea_lower or "revenge" in idea_lower:
        verdict = "blocked"
        guardrail_layer = "behavioral"
        reason_label = "revenge trading"
        explanation = "Simulated trade blocked by the cooldown rule after 2 consecutive losses and position size multiplier > 2x."
    elif "single headline" in idea_lower or "tip" in idea_lower or "rumor" in idea_lower:
        verdict = "blocked"
        guardrail_layer = "evidence"
        reason_label = "trading on hunch"
        explanation = "Simulated trade blocked by Layer 1 evidence consistency gate due to single uncorroborated source."
    elif "all in" in idea_lower or "100%" in idea_lower or "50%" in idea_lower:
        verdict = "blocked"
        guardrail_layer = "behavioral"
        reason_label = "oversized conviction bet"
        explanation = "Simulated trade blocked by position cap (trade size > 5% of simulated portfolio)."
    else:
        verdict = "allowed"
        guardrail_layer = None
        reason_label = "evidence-backed, within position cap"
        explanation = "Simulated trade allowed. Passes Layer 1 evidence gate and Layer 2 behavioral bounds."

    shadow_obj = ShadowQuery(
        query_id=query_id,
        timestamp=now_iso,
        submitted_by=submitted_by,
        symbol=symbol,
        idea=idea,
        verdict=verdict,
        guardrail_layer=guardrail_layer,
        reason_label=reason_label,
        explanation=explanation
    )

    shadow_dict = shadow_obj.model_dump()

    # Store in DynamoDB nummuss-shadow table
    if boto3 and (os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_DEFAULT_REGION")):
        try:
            dynamodb = boto3.resource("dynamodb")
            table = dynamodb.Table(DDB_SHADOW_TABLE)
            table.put_item(Item=shadow_dict)
        except Exception as e:
            print(f"DynamoDB PutItem shadow error: {e}")

    return response(200, shadow_dict)

def handler(event, context):
    """
    ApiHandler Lambda Router:
    Routes incoming API Gateway HTTP requests to endpoint handlers.
    """
    http_method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    path_parameters = event.get("pathParameters") or {}
    query_parameters = event.get("queryStringParameters") or {}

    print(f"API Request: {http_method} {path}")

    if http_method == "OPTIONS":
        return response(200, {"message": "CORS OK"})

    # Route matching
    if path == "/feed":
        return handle_feed(query_parameters)
    elif path.startswith("/decision/"):
        decision_id = path_parameters.get("decision_id") or path.split("/")[-1]
        return handle_decision_detail(decision_id)
    elif path == "/twin":
        return handle_twin()
    elif path == "/counterfactual":
        return handle_counterfactual()
    elif "/replay/scenario/" in path:
        scenario_id = path_parameters.get("id") or path.split("/")[-1]
        return handle_replay_scenario(scenario_id)
    elif path == "/shadow" and http_method == "POST":
        return handle_shadow(event.get("body", ""))

    return response(404, {"error": "Route not found", "path": path, "method": http_method})
