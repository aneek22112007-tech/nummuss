from typing import Tuple, Optional
from .schemas import Action, EvidenceQuality, GuardrailResult, GuardrailReasonLabel

def evaluate_behavioral_guardrails(
    action: Action,
    trade_size_val: float,
    portfolio_value: float,
    daily_loss: float,
    max_daily_loss: float,
    consecutive_losses: int,
    evidence_quality: EvidenceQuality
) -> Tuple[bool, GuardrailResult, GuardrailReasonLabel]:
    """
    Layer 2: Behavioral Guardrails
    Applies deterministic trading-discipline rules.
    Returns (is_allowed, guardrail_result, reason_label)
    """
    if action == 'hold':
        return True, 'passed', None

    # 1. Evidence Floor
    if evidence_quality == 'weak':
        return False, 'blocked_low_evidence', 'trading on hunch'

    # 2. Position Cap (No single trade > 5% of portfolio value)
    if trade_size_val > (portfolio_value * 0.05):
        return False, 'blocked_position_cap', 'oversized conviction bet'

    # 3. Daily Loss Cap
    if daily_loss > max_daily_loss:
        return False, 'blocked_daily_loss', 'loss chasing'

    # 4. Cooldown (After 2 consecutive losses, pause)
    if consecutive_losses >= 2:
        return False, 'blocked_cooldown', 'revenge trade after loss'

    return True, 'passed', None
