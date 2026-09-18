import unittest
import json
import sys
import os

# Add backend and lambdas to path for test imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "lambdas")))

from lambdas.common.schemas import MarketSignal, DecisionRecord, ShadowQuery
from lambdas.common.layer1 import validate_evidence
from lambdas.common.layer2 import evaluate_behavioral_guardrails
from lambdas.fetch_signal.app import handler as fetch_handler
from lambdas.reason_decide.app import handler as reason_handler
from lambdas.api_handler.app import handler as api_handler

class TestNummussEngine(unittest.TestCase):

    def test_layer1_evidence_gate(self):
        signals = [
            MarketSignal(signal_id="sig-1", timestamp="2026-09-18T10:00:00Z", symbol="NIFTY50", type="price", content="NIFTY at 21500"),
            MarketSignal(signal_id="sig-2", timestamp="2026-09-18T10:05:00Z", symbol="NIFTY50", type="news", content="RBI rates unchanged")
        ]
        
        # Test valid citations
        valid, quality, msg = validate_evidence(["NIFTY50"], [{"signal_id": "sig-1"}, {"signal_id": "sig-2"}], signals)
        self.assertTrue(valid)
        self.assertEqual(quality, "strong")

        # Test invalid symbol claim
        valid_unsupported, quality_unsupported, msg_unsupported = validate_evidence(["INVALID_SYMBOL"], [{"signal_id": "sig-1"}], signals)
        self.assertFalse(valid_unsupported)
        self.assertIn("Unsupported claim", msg_unsupported)

    def test_layer2_behavioral_guardrails(self):
        # 1. Position Cap Violation (>5% of 100k)
        allowed, res, reason = evaluate_behavioral_guardrails(
            action="buy", trade_size_val=10000.0, portfolio_value=100000.0,
            daily_loss=0, max_daily_loss=20000.0, consecutive_losses=0, evidence_quality="strong"
        )
        self.assertFalse(allowed)
        self.assertEqual(res, "blocked_position_cap")
        self.assertEqual(reason, "oversized conviction bet")

        # 2. Cooldown Violation (consecutive losses >= 2)
        allowed_cd, res_cd, reason_cd = evaluate_behavioral_guardrails(
            action="buy", trade_size_val=1000.0, portfolio_value=100000.0,
            daily_loss=0, max_daily_loss=20000.0, consecutive_losses=2, evidence_quality="strong"
        )
        self.assertFalse(allowed_cd)
        self.assertEqual(res_cd, "blocked_cooldown")
        self.assertEqual(reason_cd, "revenge trade after loss")

        # 3. Daily Loss Limit Violation
        allowed_loss, res_loss, reason_loss = evaluate_behavioral_guardrails(
            action="sell", trade_size_val=2000.0, portfolio_value=100000.0,
            daily_loss=21000.0, max_daily_loss=20000.0, consecutive_losses=0, evidence_quality="strong"
        )
        self.assertFalse(allowed_loss)
        self.assertEqual(res_loss, "blocked_daily_loss")
        self.assertEqual(reason_loss, "loss chasing")

        # 4. Valid Discipline Pass
        allowed_pass, res_pass, reason_pass = evaluate_behavioral_guardrails(
            action="buy", trade_size_val=2000.0, portfolio_value=100000.0,
            daily_loss=1000.0, max_daily_loss=20000.0, consecutive_losses=0, evidence_quality="strong"
        )
        self.assertTrue(allowed_pass)
        self.assertEqual(res_pass, "passed")

    def test_fetch_signal_handler(self):
        res = fetch_handler({}, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertIn("signals", body)
        self.assertGreater(len(body["signals"]), 0)

    def test_reason_decide_handler(self):
        res = reason_handler({}, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertIn("decisions", body)
        self.assertEqual(len(body["decisions"]), 2)

    def test_api_handler_shadow_endpoint(self):
        payload = json.dumps({"symbol": "NIFTY50", "idea": "I lost twice today. I will double my size to recover."})
        event = {"httpMethod": "POST", "path": "/shadow", "body": payload}
        res = api_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["verdict"], "blocked")
        self.assertEqual(body["reason_label"], "revenge trading")

    def test_api_handler_feed_endpoint(self):
        event = {"httpMethod": "GET", "path": "/feed", "queryStringParameters": {"mode": "india_replay", "agent": "disciplined"}}
        res = api_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertIn("decisions", body)

    def test_api_handler_counterfactual_endpoint(self):
        event = {"httpMethod": "GET", "path": "/counterfactual"}
        res = api_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertIn("capital_difference_inr", body)

if __name__ == "__main__":
    unittest.main()
