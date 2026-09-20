# Nummuss

**The behavioral safety layer for AI trading agents.**

India does not have an information shortage in retail trading — it has a discipline and risk-control problem. Nummuss sits between an AI agent and its execution path, at the exact decision point where risky behavior becomes an executable action: position size, repeated losses, stale evidence, overtrading, impulsive re-entry.

> **Note**: Simulation only. No real capital. Not investment advice.

---

## The Experiment: Three Agents

Nummuss demonstrates its value by running a controlled counterfactual experiment. Every 10 minutes, one signal stream feeds three configuration-forked agents:

1. **The Disciplined Agent**: Bound by a 3-layer deterministic safety gate — the "safe" benchmark.
2. **The Undisciplined Twin**: Receives the same signals and model, but intentionally bypasses Layer 2 behavioral guardrails. Purpose: measure the cost of revenge trading, FOMO, and overconfidence.
3. **The Shadow Agent** *(user-defined)*: A fully customizable paper-trading agent you create via `/shadow`. Supply any behavioral prompt — "always buy when RSI < 30", "double my size after a loss" — and watch it compete against the predefined agents for up to 30 days.

By tracking all three agents under the same market context, Nummuss measures the **counterfactual difference** — exactly what capital is saved (or lost) by enforcing discipline.

---

## Architecture

```
         User (Dashboard)
              │
    ┌─────────┴──────────┐
    │ POST /shadow        │ GET /feed, /decisions
    ▼                     ▼
 API Gateway ──────── api_handler Lambda
    │                     │
    │ Bedrock Guardrail    │ (sufficiency check)
    │ (Is idea valid?)     │
    └──────────────────► nummuss-shadow (DynamoDB)
                          ▲
                          │ Active shadow agents
                          │
 EventBridge (every 10m)  │
    │                     │
    ▼                     │
 fetch_signal Lambda ─────┘
    │
    ├── Saves market data ──► nummuss-signals (DynamoDB)
    │
    └── Invokes ──► reason_decide Lambda
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        Fetch Signals  Base LLM   Custom LLM
        (DynamoDB)   (Bedrock)   (per Shadow)
              │          │          │
              └──────────┴──────────┘
                         │
              Layer 1 & 2 Guardrails
                         │
                         ▼
              nummuss-decisions (DynamoDB)
                         │
                         ▼
              React Frontend Dashboard
```

---

## The Three Safety Gates

Every LLM-generated decision is evaluated against three gates before it can be recorded:

1. **Layer 0 (AWS Managed)**: Bedrock Guardrails scan for prompt-injection attacks, sensitive information, and denied topics. Untrusted market text is treated as hostile input.
2. **Layer 1 (Evidence Consistency)**: Deterministic logic checks that every claim, ticker, and price cited by the agent maps directly to a stored, verified signal. Stale or single-source evidence forces a `HOLD`.
3. **Layer 2 (Behavioral Guardrails)**: Deterministic trading discipline rules — position caps, daily loss limits, cooldown periods. This is the variable layer bypassed by the Undisciplined Twin.

---

## Shadow Function

Previously a simple testing endpoint, the Shadow Function is now a fully automated agent lifecycle:

- **Create** (`POST /shadow`): Supply a `user_id`, a custom `idea`, and a `duration_days` (1–30).
- **Validation**: `api_handler` calls Bedrock to check *sufficiency* — "Does this text contain actionable trading instructions?" — without judging whether the strategy is profitable.
- **Execution**: The validated Shadow Agent is automatically picked up by the `reason_decide` cron job and runs a **paper-only** portfolio (max 5% allocation per trade) until its `end_time` expires.
- **Comparison**: Track your agent's performance in real-time against both predefined agents via `GET /shadow/active` and `GET /shadow/{agent_id}/performance`.
- **Limit**: One active Shadow Agent per user at a time, enforced atomically in DynamoDB.

---

## AWS Services

Nummuss is built natively on AWS using a serverless architecture:

| Service | Role |
|---|---|
| **Amazon Bedrock** | LLM reasoning (Claude 3 Haiku) + Layer 0 Guardrails + Shadow idea validation |
| **AWS Lambda** | `fetch_signal`, `reason_decide`, `api_handler` — event-driven Python execution |
| **Amazon DynamoDB** | `nummuss-signals`, `nummuss-decisions`, `nummuss-shadow` — audit ledger & state |
| **Amazon S3** | Immutable evidence snapshots + static frontend hosting |
| **Amazon EventBridge** | 10-minute cron to trigger the signal → reasoning pipeline |
| **Amazon API Gateway** | Rate-limited REST API for the React dashboard |
| **Amazon CloudFront** | CDN + API path rewrite (`/api/*` → API Gateway) |
| **AWS CDK (Python)** | Infrastructure as Code for repeatable deployment |

---

## Running Locally

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in your values
python local_server.py           # starts a local FastAPI dev server
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env             # set VITE_API_BASE_URL etc.
npm run dev
```

### Full AWS Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for required AWS permissions, Bedrock model enablement, budget controls, and the full `cdk synth` / `cdk deploy` command sequence.

Quick deploy scripts are also available:
- **Linux/macOS**: `./deploy.sh`
- **Windows**: `./deploy.ps1`

---

## Features

- **Twin Agent Counterfactual**: Watch the Disciplined and Undisciplined agents diverge in real-time on the same signals — quantifying the dollar cost of behavioral failure modes.
- **Shadow Mode**: Create a custom 1–30 day paper-trading agent with any behavioral prompt. Bedrock validates instruction sufficiency before creation; its bounded paper portfolio is benchmarked against both predefined agents.
- **India Replay Mode**: Scrub through historical NIFTY 50 scenarios and watch how all three agents would have behaved.
- **Full Auditability**: Every decision — blocked or executed — includes a citations array mapping to S3 evidence and the exact guardrail that evaluated it.
- **Security Verification**: Built-in UI to demonstrate Layer 0 guardrail interception of prompt-injection attempts.

---

*Built for the Bharat Builds Tour 2026.*
