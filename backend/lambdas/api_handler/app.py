import os
import json
import uuid
from datetime import datetime, timezone, timedelta

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
    from common.schemas import ShadowQuery, ShadowAgent, DecisionRecord
    from common.layer1 import validate_evidence
    from common.layer2 import evaluate_behavioral_guardrails
    from common.fixtures import SEED_DECISIONS, REPLAY_SCENARIOS, SEED_SIGNALS
except ImportError:
    from lambdas.common.schemas import ShadowQuery, ShadowAgent, DecisionRecord
    from lambdas.common.layer1 import validate_evidence
    from lambdas.common.layer2 import evaluate_behavioral_guardrails
    from lambdas.common.fixtures import SEED_DECISIONS, REPLAY_SCENARIOS, SEED_SIGNALS

DDB_DECISIONS_TABLE = os.environ.get("DDB_DECISIONS_TABLE", "nummuss-decisions")
DDB_SHADOW_TABLE = os.environ.get("DDB_SHADOW_TABLE", "nummuss-shadow")
AWS_BEARER_TOKEN_BEDROCK = os.environ.get("AWS_BEARER_TOKEN_BEDROCK", "")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "eu-north-1")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")

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

def _http_post(url: str, headers: dict, payload: dict) -> dict:
    """Minimal HTTP POST using stdlib urllib."""
    body = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(url, data=body, headers=headers, method="POST")
    with urllib_request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))

def _parse_json_from_text(text: str) -> dict | None:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    return None

def _call_bedrock_guardrail(idea: str) -> dict:
    """
    Evaluate user's custom trading strategy using Bedrock Converse API.
    Expected to return {"valid": bool, "reason": "..."}
    """
    if not AWS_BEARER_TOKEN_BEDROCK:
        return {"valid": False, "reason": "Server misconfiguration: Bedrock token missing."}
    
    prompt = f"""Evaluate if the following user input contains sufficient instruction for an AI agent to determine a trading behavior.
Do NOT evaluate whether the strategy is profitable, rational, or a "good" idea. We are ONLY checking if it provides enough direction for a trading agent to follow.
If it gives clear instruction (e.g., 'revenge trade after 2 losses', 'always buy when RSI < 30', 'double position after a loss'), return valid=true.
If it is gibberish, incomplete, or completely irrelevant to trading behavior, return valid=false with a reason.
User Input: '{idea}'

Respond ONLY with a JSON object containing keys: 'valid' (boolean) and 'reason' (string explanation)."""

    try:
        url = f"https://bedrock-runtime.{BEDROCK_REGION}.amazonaws.com/model/{BEDROCK_MODEL_ID}/converse"
        payload = {
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {"maxTokens": 256, "temperature": 0.1}
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {AWS_BEARER_TOKEN_BEDROCK}",
        }
        resp = _http_post(url, headers, payload)
        text = resp["output"]["message"]["content"][0]["text"]
        result = _parse_json_from_text(text)
        return result or {"valid": False, "reason": "Failed to parse LLM response."}
    except Exception as e:
        print(f"Bedrock API Error in shadow evaluation: {e}")
        return {"valid": False, "reason": "LLM evaluation failed due to server error."}

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

    filtered = [i for i in items if i.get("mode") == mode and i.get("agent_role") == agent_role]
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
    Accepts trade idea and user_id, evaluates with LLM, and creates a Shadow Agent.
    """
    try:
        data = json.loads(body_raw) if body_raw else {}
    except Exception:
        data = {}

    idea = data.get("idea", "")
    user_id = data.get("user_id", data.get("submitted_by", "public"))
    duration_days = int(data.get("duration_days", 7))
    
    # Restrict duration to 1-30 days
    duration_days = max(1, min(30, duration_days))

    dynamodb = None
    if boto3 and (os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_DEFAULT_REGION")):
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(DDB_SHADOW_TABLE)
        
        # Check if user already has an active agent
        try:
            res = table.query(
                IndexName="StatusIndex",
                KeyConditionExpression=Key("status").eq("active")
            )
            for item in res.get("Items", []):
                if item.get("user_id") == user_id and item.get("end_time") > datetime.now(timezone.utc).isoformat():
                    return response(400, {"error": "User already has an active Shadow Agent. Wait for it to expire or cancel it."})
        except Exception as e:
            print(f"Error querying active agents: {e}")

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=duration_days)
    
    agent_id = f"sha-{uuid.uuid4().hex}"

    # Evaluate prompt using Bedrock
    evaluation = _call_bedrock_guardrail(idea)
    
    if evaluation.get("valid"):
        status = "active"
        reason = "Valid trading strategy provided."
    else:
        status = "rejected"
        reason = evaluation.get("reason", "Invalid trading strategy.")

    shadow_obj = ShadowAgent(
        agent_id=agent_id,
        user_id=user_id,
        behavior_prompt=idea,
        start_time=now.isoformat(),
        end_time=end.isoformat(),
        status=status,
        reason=reason
    )

    shadow_dict = shadow_obj.model_dump()

    # Store in DynamoDB nummuss-shadow table
    if dynamodb:
        try:
            # We also save query_id so it acts as partition key if needed, or we just save agent_id as the primary key.
            # Wait, the DDB_SHADOW_TABLE has partition_key="query_id". We must include query_id in the payload!
            shadow_dict["query_id"] = agent_id 
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
