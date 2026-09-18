from datetime import datetime, timezone
import json
from .schemas import MarketSignal, DecisionRecord, SignalSource, TradeResult, Action
from .layer1 import validate_evidence
from .layer2 import evaluate_behavioral_guardrails

# Mock Data
mock_signals = [
    MarketSignal(
        signal_id="sig-1",
        timestamp=datetime.now(timezone.utc).isoformat(),
        symbol="NIFTY50",
        type="news",
        content="Market panic as global indices drop 5%. NIFTY expected to open gap down."
    ),
    MarketSignal(
        signal_id="sig-2",
        timestamp=datetime.now(timezone.utc).isoformat(),
        symbol="NIFTY50",
        type="price",
        content="Current Price: 21500, previous close 21800."
    )
]

def run_decision_cycle(agent_role: str, action: Action, trade_size: float, consecutive_losses: int):
    # Simulated LLM output
    cited_symbols = ["NIFTY50"]
    cited_signals = [{"signal_id": "sig-1", "excerpt": "Market panic"}]
    
    # Layer 1
    is_valid, evidence_quality, l1_msg = validate_evidence(cited_symbols, cited_signals, mock_signals)
    
    # Layer 2
    is_allowed = True
    guardrail_res = "passed"
    reason = None
    
    if agent_role == 'disciplined':
        is_allowed, guardrail_res, reason = evaluate_behavioral_guardrails(
            action=action,
            trade_size_val=trade_size,
            portfolio_value=100000.0,
            daily_loss=1000.0,
            max_daily_loss=20000.0,
            consecutive_losses=consecutive_losses,
            evidence_quality=evidence_quality
        )
    
    trade_status = "simulated" if is_allowed else "rejected"
    
    # Construct Decision Record
    record = DecisionRecord(
        decision_id=f"dec-{int(datetime.now().timestamp())}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        mode="india_replay",
        market_context="INDIA_REPLAY",
        agent_role=agent_role, # type: ignore
        symbol="NIFTY50",
        action=action, # type: ignore
        confidence_tier="high",
        confidence_raw=85,
        evidence_quality=evidence_quality,
        sources=[SignalSource(**s) for s in cited_signals],
        guardrail_layer="behavioral" if not is_allowed else None,
        guardrail_result=guardrail_res, # type: ignore
        guardrail_reason_label=reason, # type: ignore
        test_fixture=True,
        trade=TradeResult(status=trade_status), # type: ignore
        outcome_tracked=False
    )
    
    return record.model_dump_json(indent=2)

if __name__ == "__main__":
    print("--- Running Undisciplined Agent (Revenge Trade) ---")
    undisciplined_res = run_decision_cycle("undisciplined", "buy", 15000.0, 3)
    print(undisciplined_res)
    
    print("\n--- Running Disciplined Agent (Revenge Trade Blocked) ---")
    disciplined_res = run_decision_cycle("disciplined", "buy", 15000.0, 3)
    print(disciplined_res)
