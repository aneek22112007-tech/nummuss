from typing import Optional, List, Literal, Dict, Any

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

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

if HAS_PYDANTIC:
    class SignalSource(BaseModel):
        signal_id: str
        excerpt: str

    class TradeResult(BaseModel):
        status: TradeStatus

    class DecisionRecord(BaseModel):
        decision_id: str
        timestamp: str
        mode: MarketMode
        market_context: str
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
        test_fixture: bool = False
        trade: TradeResult
        outcome_tracked: bool = False

    class ShadowQuery(BaseModel):
        query_id: str
        timestamp: str = ""
        submitted_by: Literal['public', 'team', 'tester'] = 'public'
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
        s3_key: Optional[str] = None
        hash: Optional[str] = None

else:
    from dataclasses import dataclass, field, asdict

    class BaseSchema:
        def model_dump(self) -> Dict[str, Any]:
            res = {}
            for k, v in self.__dict__.items():
                if isinstance(v, BaseSchema):
                    res[k] = v.model_dump()
                elif isinstance(v, list):
                    res[k] = [elem.model_dump() if isinstance(elem, BaseSchema) else elem for elem in v]
                else:
                    res[k] = v
            return res

    @dataclass
    class SignalSource(BaseSchema):
        signal_id: str
        excerpt: str

    @dataclass
    class TradeResult(BaseSchema):
        status: TradeStatus

    @dataclass
    class DecisionRecord(BaseSchema):
        decision_id: str
        timestamp: str
        mode: MarketMode
        market_context: str
        agent_role: AgentRole
        symbol: str
        action: Action
        confidence_tier: ConfidenceTier
        confidence_raw: int
        evidence_quality: EvidenceQuality
        sources: List[SignalSource]
        guardrail_result: GuardrailResult
        trade: TradeResult
        guardrail_layer: GuardrailLayer = None
        guardrail_reason_label: GuardrailReasonLabel = None
        test_fixture: bool = False
        outcome_tracked: bool = False

    @dataclass
    class ShadowQuery(BaseSchema):
        query_id: str
        symbol: str
        idea: str
        verdict: Literal['blocked', 'allowed']
        reason_label: str
        explanation: str
        timestamp: str = ""
        submitted_by: Literal['public', 'team', 'tester'] = 'public'
        guardrail_layer: GuardrailLayer = None

    @dataclass
    class MarketSignal(BaseSchema):
        signal_id: str
        timestamp: str
        symbol: str
        type: Literal['price', 'news']
        content: str
        s3_key: Optional[str] = None
        hash: Optional[str] = None
