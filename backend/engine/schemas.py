from typing import Optional, List, Literal
from pydantic import BaseModel, Field

MarketMode = Literal['live_paper', 'india_replay']
AgentRole = Literal['disciplined', 'undisciplined']
Action = Literal['buy', 'sell', 'hold']
ConfidenceTier = Literal['low', 'medium', 'high']
EvidenceQuality = Literal['weak', 'medium', 'strong']
GuardrailLayer = Optional[Literal['content', 'evidence', 'behavioral']]

GuardrailResult = Literal[
    'passed',
    'blocked_prompt_attack',
    'blocked_pii',
    'blocked_denied_topic',
    'blocked_unsupported_claim',
    'blocked_position_cap',
    'blocked_daily_loss',
    'blocked_cooldown',
    'blocked_low_evidence'
]

GuardrailReasonLabel = Optional[Literal[
    'revenge trade after loss',
    'oversized conviction bet',
    'trading on hunch',
    'loss chasing',
    'overtrading'
]]

TradeStatus = Literal['filled', 'simulated', 'rejected', 'pending']

class SignalSource(BaseModel):
    signal_id: str
    excerpt: str

class TradeResult(BaseModel):
    status: TradeStatus

class DecisionRecord(BaseModel):
    decision_id: str
    timestamp: str  # ISO-8601 UTC
    mode: MarketMode
    market_context: Literal['US_live', 'INDIA_REPLAY']
    agent_role: AgentRole
    symbol: str
    action: Action
    confidence_tier: ConfidenceTier
    confidence_raw: int = Field(ge=0, le=100)
    evidence_quality: EvidenceQuality
    sources: List[SignalSource]
    guardrail_layer: GuardrailLayer = None
    guardrail_result: GuardrailResult
    guardrail_reason_label: GuardrailReasonLabel = None
    test_fixture: bool
    trade: TradeResult
    outcome_tracked: bool

class ShadowQuery(BaseModel):
    query_id: str
    submitted_by: Literal['public', 'team', 'tester']
    symbol: str
    idea: str
    verdict: Literal['blocked', 'allowed']
    guardrail_layer: GuardrailLayer = None
    reason_label: str
    explanation: str

class MarketSignal(BaseModel):
    signal_id: str
    timestamp: str
    symbol: str
    type: Literal['price', 'news']
    content: str
