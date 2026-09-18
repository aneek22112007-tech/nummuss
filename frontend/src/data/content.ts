/**
 * All landing-page copy, typed and centralised.
 * Source: Nummuss PRD v5.0 (First Commit 2026 — AWS Ship It).
 * The section order mirrors bitcoinos.build so the scroll choreography is 1:1.
 */

export type PipelineStep = {
  tag: string
  name: string
  detail: string
  /** a deterministic safety gate gets the mint treatment */
  gate?: boolean
  /** which image the side "orb" shows while this step is active */
  orb: OrbKey
  orbCaption: string
}

export type OrbKey = 'reason' | 'aws' | 'evidence' | 'behavior' | 'audit'

export type SafetyGate = {
  layer: string
  title: string
  body: string
  points: string[]
}

export type CounterfactualRow = {
  metric: string
  disciplined: string
  twin: string
  /** highlight the twin (or disciplined) cell in mint */
  highlight?: 'disciplined' | 'twin'
}

export type FailureMode = {
  badge: string
  tone: 'danger' | 'amber' | 'mint'
  title: string
  body: string
  metric: string
}

export type ReplayScenario = {
  tag: string
  title: string
  body: string
  image: string
  accent: boolean
}

export type NavItem = {
  num: string
  title: string
  href: string
  orb: OrbKey
}

export type NavSection = {
  label: string
  items: NavItem[]
}

/* ------------------------------------------------------------------ */
/* Media (public CDNs — swap for your own renders when you have them)  */
/* ------------------------------------------------------------------ */
export const media = {
  orbReason:
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=900&auto=format&fit=crop',
  orbAws:
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=900&auto=format&fit=crop',
  orbEvidence:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=900&auto=format&fit=crop',
  orbBehavior:
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=900&auto=format&fit=crop',
  orbAudit:
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=900&auto=format&fit=crop',
} satisfies Record<string, string>

export const orbImages: Record<OrbKey, string> = {
  reason: media.orbReason,
  aws: media.orbAws,
  evidence: media.orbEvidence,
  behavior: media.orbBehavior,
  audit: media.orbAudit,
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */
export const navSections: NavSection[] = [
  {
    label: 'Product',
    items: [
      { num: '01', title: 'The Experiment', href: '#experiment', orb: 'reason' },
      { num: '02', title: 'Safety Gates', href: '#gates', orb: 'aws' },
      { num: '03', title: 'India Replay', href: '#replay', orb: 'behavior' },
      { num: '04', title: 'Counterfactual', href: '#counterfactual', orb: 'evidence' },
    ],
  },
  {
    label: 'Company',
    items: [
      { num: '05', title: 'Home', href: '#top', orb: 'reason' },
      { num: '06', title: 'Vision', href: '#vision', orb: 'audit' },
      { num: '07', title: 'Shadow Challenge', href: '#shadow', orb: 'evidence' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Hero / marquee / vision                                             */
/* ------------------------------------------------------------------ */
export const hero = {
  titleLines: ['Discipline,', 'Enforce the', 'Trade'] as const,
  subtitle:
    'The behavioral safety layer for AI trading agents. Same signals, same model, same code path — one agent disciplined, one exposed to documented failure patterns — and the system measures the counterfactual difference.',
  primaryCta: { label: 'See the Experiment', href: '#experiment' },
  secondaryCta: { label: 'Challenge the Agent', href: '#shadow' },
  badge: 'First Commit 2026 · Ship It Track · Simulation Only',
}

export const marqueeItems = [
  'Revenge Trading',
  'Overtrading / FOMO',
  'Tip Chasing',
  'Overconfidence',
  'Averaging Down',
  'Evidence-Gated Decisions',
]

export const vision = {
  label: 'Vision',
  headingLead: 'Enforce the',
  headingAccent: 'Discipline',
  body:
    'India does not have an information shortage in retail trading — it has a discipline and risk-control problem. Nummuss sits between an AI agent and its execution path, at the exact decision point where risky behavior becomes an executable action: position size, repeated losses, stale evidence, overtrading, impulsive re-entry.',
  strongPrefix:
    'India does not have an information shortage in retail trading — it has a discipline and risk-control problem.',
}

export const stats = {
  label: 'The Evidence',
  bigTop: '87.7%',
  bigBottom: 'Lost in FY26',
  caption:
    'SEBI\u2019s FY25\u2013FY26 research: 87.7% of individual equity-derivatives traders lost money, with \u20b991,685 crore in aggregate net losses. Options accounted for ~92% of individual losses — and the loss-making behavior persisted. Nummuss does not predict markets. It targets the decision point where a risky behavior becomes an executable action.',
  cards: [
    { value: '\u20b991,685 cr', label: 'Aggregate net losses · FY26', mint: true },
    { value: '~92%', label: 'Of losses from options', mint: false },
    { value: 'Persistent', label: 'Loss-making behavior repeated', mint: false },
  ],
}

/* ------------------------------------------------------------------ */
/* Positioning rows ("Warnings are not enough")                        */
/* ------------------------------------------------------------------ */
export type ProblemRow = {
  idx: string
  strike: string
  answer?: boolean
  body: string
  emphasis: string
}

export const problems: ProblemRow[] = [
  {
    idx: '01',
    strike: 'A warning you can ignore',
    emphasis: 'enforced, logged, replayable',
    body: 'Broker nudges show risk warnings before execution — but a warning can still be dismissed. Nummuss demonstrates enforced, logged, replayable guardrails. We don\u2019t pitch \u201cwe warn.\u201d',
  },
  {
    idx: '02',
    strike: 'A lock without a reason',
    emphasis: 'behavioral trigger',
    body: 'F&O kill switches stop the day — but never explain why. Nummuss identifies the behavioral trigger and shows exactly why a specific action was blocked. We don\u2019t claim \u201cwe invented trading locks.\u201d',
  },
  {
    idx: '03',
    strike: 'Analytics without behavior',
    emphasis: 'behavioral safety layer',
    body: 'Options platforms show payoffs and positions — but model instruments, not the agent. Nummuss is a behavioral safety layer, focused on how the agent decides, not just what it holds.',
  },
  {
    idx: '04',
    strike: 'Risk tools without proof',
    emphasis: 'what changes when discipline is enforced',
    body: 'Emerging products market revenge-trading and overtrading controls — but never show the counterfactual. Nummuss measures what changes when discipline is enforced under the same signal stream.',
  },
  {
    idx: 'Nummuss',
    strike: 'The counterfactual answer',
    answer: true,
    emphasis: 'what the counterfactual twin did instead',
    body: '\u201cThis proposed action matches a failure mode. Here is the exact evidence. Here is the guardrail that blocked it. Here is what the counterfactual twin did instead.\u201d',
  },
]

/* ------------------------------------------------------------------ */
/* Pinned pipeline                                                     */
/* ------------------------------------------------------------------ */
export const pipelineSteps: PipelineStep[] = [
  {
    tag: 'Ingest',
    name: 'fetch-signal · EventBridge → Lambda',
    detail: 'normalize · hash · store → S3 + DynamoDB',
    orb: 'reason',
    orbCaption: 'EventBridge · 10 min cycle',
  },
  {
    tag: 'Reason',
    name: 'reason-and-decide × 2 agents → Amazon Bedrock',
    detail: 'forced Decision JSON · safe HOLD fallback',
    orb: 'reason',
    orbCaption: 'Amazon Bedrock',
  },
  {
    tag: 'Layer 0',
    name: 'Bedrock Guardrails',
    detail: 'prompt attacks · PII · denied topics',
    gate: true,
    orb: 'aws',
    orbCaption: 'Layer 0 · AWS managed',
  },
  {
    tag: 'Layer 1',
    name: 'Evidence Consistency Gate',
    detail: 'deterministic · cited tickers/prices verified',
    gate: true,
    orb: 'evidence',
    orbCaption: 'Layer 1 · Evidence gate',
  },
  {
    tag: 'Layer 2',
    name: 'Behavioral Guardrails',
    detail: 'position cap · loss cap · cooldown · evidence floor',
    gate: true,
    orb: 'behavior',
    orbCaption: 'Layer 2 · Behavioral',
  },
  {
    tag: 'Execute',
    name: 'Paper execution / India Replay fill',
    detail: 'simulation only · no real capital',
    orb: 'audit',
    orbCaption: 'Simulated execution',
  },
  {
    tag: 'Audit',
    name: 'DynamoDB ledger → S3 evidence → API → dashboard',
    detail: 'every decision auditable',
    orb: 'audit',
    orbCaption: 'DynamoDB audit ledger',
  },
]

export const pipelineCopy = {
  label: 'How it works',
  headingLines: ['One Signal.', 'Two Agents.', 'Three Gates.'],
  lead:
    'Every 10 minutes, EventBridge triggers one pipeline. Both agents — disciplined and undisciplined twin — receive the exact same signal stream. The twin is a configuration fork, not a second stack.',
}

/* ------------------------------------------------------------------ */
/* Safety gates                                                        */
/* ------------------------------------------------------------------ */
export const safetyGates: SafetyGate[] = [
  {
    layer: 'Layer 0 · AWS Managed',
    title: 'Bedrock Guardrails',
    body:
      'Applied to both agents. Untrusted market text is treated as hostile input; AWS-managed safety controls run on model inputs and outputs.',
    points: [
      'Prompt-attack resistance',
      'Sensitive information / PII',
      'Denied topics & content safety',
      'Controlled malicious-fixture verification',
    ],
  },
  {
    layer: 'Layer 1 · Deterministic',
    title: 'Evidence Consistency Gate',
    body:
      'Application logic, not an LLM judgment. Every claim is checked against stored source records before a decision survives.',
    points: [
      'Every ticker present in normalized context',
      'Every price traceable to a signal snapshot',
      'Every citation maps to signal_id + S3 evidence',
      'Stale or single-source → reduced quality → HOLD',
    ],
  },
  {
    layer: 'Layer 2 · The Variable',
    title: 'Behavioral Guardrails',
    body:
      'Deterministic trading-discipline rules before execution — each block gets a named failure mode. The twin bypasses this layer; that is the experiment.',
    points: [
      'Position cap — no trade > 5% of portfolio',
      'Daily loss cap — \u20b920,000 / $200 → stop',
      'Cooldown — 2 losses → pause 4 cycles',
      'Evidence floor — low quality → forced HOLD',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Counterfactual panel                                                */
/* ------------------------------------------------------------------ */
export const counterfactual = {
  label: 'Counterfactual Impact',
  headingLines: ['What Discipline', 'Actually Changed'],
  lead:
    'In this controlled replay, the disciplined agent avoided \u20b918,400 of simulated exposure and ended \u20b914,200 above the twin. A simulation output — not claimed savings for a real user.',
  rows: [
    { metric: 'Trades attempted', disciplined: '42', twin: '42' },
    { metric: 'Trades taken', disciplined: '31', twin: '18' },
    { metric: 'Guardrail blocks', disciplined: '0', twin: '13', highlight: 'twin' },
    { metric: 'Exposure avoided', disciplined: '\u2014', twin: '\u20b918,400', highlight: 'twin' },
    { metric: 'Max drawdown', disciplined: '-7.4%', twin: '-16.8%' },
    { metric: 'Turnover', disciplined: '1.8x', twin: '4.1x' },
  ] as CounterfactualRow[],
  capitalDifference: '\u20b914,200',
  chartCaption: { start: '\u20b91,00,000 start', clock: 'Replay clock \u2192' },
}

/* ------------------------------------------------------------------ */
/* Failure modes                                                       */
/* ------------------------------------------------------------------ */
export const failureModes: FailureMode[] = [
  {
    badge: 'Failure Mode',
    tone: 'danger',
    title: 'Revenge Trading',
    body: 'Increases size after a loss streak instead of pausing.',
    metric: 'Position size multiplier after loss · blocked cooldown events',
  },
  {
    badge: 'Failure Mode',
    tone: 'amber',
    title: 'Overtrading / FOMO',
    body: 'Prefers acting over holding even when evidence is weak.',
    metric: 'Trade frequency · hold rate · time between trades',
  },
  {
    badge: 'Failure Mode',
    tone: 'mint',
    title: 'Tip Chasing',
    body: 'Treats one dramatic headline as sufficient confirmation.',
    metric: 'Source count · corroboration score',
  },
  {
    badge: 'Failure Mode',
    tone: 'danger',
    title: 'Overconfidence',
    body: 'States high confidence despite weak evidence.',
    metric: 'Confidence vs evidence-quality mismatch',
  },
  {
    badge: 'Failure Mode',
    tone: 'amber',
    title: 'Averaging Down',
    body: 'Increases exposure to a losing position.',
    metric: 'Exposure change while mark-to-market is negative',
  },
  {
    badge: 'The Control',
    tone: 'mint',
    title: 'Disciplined Agent',
    body:
      'Cites only supplied sources. Weak or contradictory evidence produces HOLD — never forced activity.',
    metric: 'Every block labeled · every decision auditable',
  },
]

/* ------------------------------------------------------------------ */
/* India Replay (horizontal scroll rail)                               */
/* ------------------------------------------------------------------ */
export const replay = {
  label: 'India Replay Mode',
  headingLines: ['Same NIFTY Evidence.', 'Two Outcomes.'],
  lead:
    'Historical NIFTY 50 fixtures with timestamped market-event headlines, \u20b91,00,000 simulated starting capital, and three preselected scenarios. All fills simulated. No NSE order is ever sent — the UI says so, always.',
  note: 'India Replay · simulated fills only · not live NSE trading',
}

export const replayScenarios: ReplayScenario[] = [
  {
    tag: 'Scenario 01',
    title: 'Expiry-Style Volatility',
    body:
      'Expiry-day whipsaw on NIFTY. The twin chases momentum into the spike; the disciplined agent waits for corroboration, then sizes normally.',
    image:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1100&auto=format&fit=crop',
    accent: false,
  },
  {
    tag: 'Scenario 02',
    title: 'Loss-Streak Re-Entry',
    body:
      'Two consecutive losses. The twin doubles size to recover — revenge trading. The cooldown gate pauses the disciplined agent for 4 cycles.',
    image:
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1100&auto=format&fit=crop',
    accent: true,
  },
  {
    tag: 'Scenario 03',
    title: 'Dramatic News, Contradicted',
    body:
      'One explosive headline, one contradicting source. Tip chasing gets blocked by the evidence floor; the disciplined agent holds.',
    image:
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1100&auto=format&fit=crop',
    accent: false,
  },
  {
    tag: 'The Panel',
    title: 'Counterfactual Panel',
    body:
      'Trades · blocks · exposure avoided · drawdown · capital gap. Every number derived from the same replay inputs. Live paper, replay and test rows are always visually separated.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1100&auto=format&fit=crop',
    accent: true,
  },
]

/* ------------------------------------------------------------------ */
/* Shadow mode                                                         */
/* ------------------------------------------------------------------ */
export const shadow = {
  label: 'Shadow Mode',
  headingLines: ['Challenge', 'the Agent'],
  lead:
    'POST /shadow accepts a short trade idea and returns a deterministic verdict using the same Evidence Consistency Gate and behavioral engine. No LLM call — the verdict cannot hallucinate.',
  note:
    'Rate-limited to 10 req/min/IP · input size-limited · PII-screened · no broker write access. Every verdict is stored with provenance: public, team, or tester.',
}

export type ShadowExchange = {
  request: string
  verdict: 'BLOCKED' | 'ALLOWED'
  reason: string
  signals: string[]
}

export const shadowExchanges: ShadowExchange[] = [
  {
    request:
      'POST /shadow { "symbol": "NIFTY50", "idea": "I lost twice today. I will double my size to recover." }',
    verdict: 'BLOCKED',
    reason: 'revenge trading',
    signals: [
      'signals: 2 consecutive losses + position multiplier > 2x',
      'explanation: simulated trade blocked by the cooldown rule',
    ],
  },
  {
    request:
      'POST /shadow { "symbol": "NIFTY50", "idea": "Wait for two corroborating sources before sizing up." }',
    verdict: 'ALLOWED',
    reason: 'evidence-backed, within position cap',
    signals: ['signals: 2 corroborating sources · evidence quality: strong'],
  },
]

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */
export const footer = {
  label: 'Join us',
  headingLines: ['Build the', 'Counterfactual', 'Proof'],
  note:
    'Simulation only. No real capital. Not investment advice. Built on Amazon Bedrock, Lambda, DynamoDB, S3, EventBridge, API Gateway and Amplify.',
  exploreLabel: 'Explore',
  exploreLinks: [
    { label: 'The Experiment', href: '#experiment' },
    { label: 'Safety Gates', href: '#gates' },
    { label: 'Counterfactual', href: '#counterfactual' },
    { label: 'India Replay', href: '#replay' },
    { label: 'Failure Modes', href: '#modes' },
    { label: 'Shadow Challenge', href: '#shadow' },
  ],
  community: [],
  legalLeft: 'Simulation only · No real capital · Not investment advice',
  legalRight: '\u00a92026 Nummuss · First Commit · AWS Ship It',
  bigWordLeft: 'NUMMU',
  bigWordRight: 'SS',
}
