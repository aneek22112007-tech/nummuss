# Deploying Nummuss on AWS

This repository deploys a low-cost serverless stack: a private S3 frontend behind
CloudFront, API Gateway, three application Lambdas and a shared layer, DynamoDB,
an evidence S3 bucket, EventBridge, SQS, and a Bedrock Guardrail.

The frontend and API are served from one CloudFront domain. The browser requests
`/api/*`; CloudFront removes `/api` and forwards the request to API Gateway.

## What you need from AWS

Do not put root-account credentials, S3 keys, DynamoDB keys, or Lambda keys in
this repository. The CDK stack creates the resources and injects their names and
IDs into the functions.

Before deployment, obtain or configure:

1. An AWS account with the USD 150 promotional credits attached, its 12-digit
   account ID, and a supported Bedrock region. Keep the entire stack in that one
   region; `us-east-1` is the safest default if you have not verified availability
   elsewhere.
2. A short-lived AWS CLI profile, preferably AWS IAM Identity Center (SSO), that
   can bootstrap and deploy CDK. For an initial personal development deployment,
   `AdministratorAccess` is the simple option. For a shared account, have an AWS
   administrator provide a scoped CloudFormation/CDK deploy role instead.
3. Access to the Anthropic Claude 3 Haiku model in Amazon Bedrock in the selected
   region. This is enabled in the Bedrock console; it is not an API key.
4. Optional: a Google OAuth web client ID if Google sign-in should work. Add the
   deployed CloudFront URL to that client's Authorized JavaScript origins. No
   Google client secret belongs in this Vite application.

No AWS application secret is required for the current code. The checked-in
backend `.env.example` contains only local-development placeholders; the deployed
function environment is defined by CDK.

## One-time workstation setup

Use Python 3.11 for the CDK application. The Lambda runtime is also Python 3.11.
From the repository root:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
npm install --prefix ../frontend
npm install --global aws-cdk
```

Authenticate without storing an access key in source control:

```bash
aws configure sso --profile nummuss
aws sso login --profile nummuss
export AWS_PROFILE=nummuss
export AWS_REGION=us-east-1
aws sts get-caller-identity
```

If your organization does not use SSO, create an IAM deploy user or assume a
deploy role and export its temporary `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
and `AWS_SESSION_TOKEN`. Never use the root account for this.

Bootstrap CDK once per account/region:

```bash
cd backend
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$AWS_REGION
```

## Deploy

Build first—the CDK stack uploads `frontend/dist` as part of deployment:

```bash
cd frontend
npm run build

cd ../backend
cdk synth -c stage=dev
cdk deploy -c stage=dev
```

CDK outputs `FrontendUrl`, `ApiUrl`, `EvidenceBucketName`, and `GuardrailId` at
the end. Open `FrontendUrl` and test `/feed` and `/shadow` through the UI.

For a non-disposable deployment, use `-c stage=prod`. Production tables and
buckets are retained if the stack is deleted; development data is removed.

## Cost guardrails for a $150-credit account

- Keep the default 10-minute schedule while testing. It runs roughly 4,320 times
  per month and invokes Claude 3 Haiku once per completed ingestion cycle.
- Do not enable CloudFront access logging, API Gateway detailed metrics, X-Ray,
  or DynamoDB PITR unless you have a reason; they are intentionally absent here.
- In Billing and Cost Management, create monthly budgets at $25, $75, and $125
  with email alerts. Budgets alert; they do not automatically stop services.
- Set a CloudWatch alarm on Lambda errors and inspect `NummussDLQ` after a test
  deployment. These operational alarms are an account-level choice because their
  notification email/SNS target is not in this repository.
- Remove the development stack when you are finished testing with
  `cdk destroy -c stage=dev`. This deletes development data by design.

## Important application limitations

- This is a simulation, not a brokerage integration. It uses seed signals and
  never places trades.
- The API is intentionally public for the demo. Frontend email login is browser
  storage only, and Google token contents are not verified by a backend. Do not
  use it to protect private user or trading data. Add Cognito or a verified
  server-side identity flow before treating it as an authenticated product.
- The API handler currently uses DynamoDB scans for the demo feed. That is fine
  at this scale but should become a query-oriented access pattern before high
  traffic or a large decision history.
