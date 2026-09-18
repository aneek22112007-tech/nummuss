from aws_cdk import (
    Duration,
    Stack,
    RemovalPolicy,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_events as events,
    aws_events_targets as targets,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_sqs as sqs,
)
from constructs import Construct

class BackendStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ==========================================
        # 1. STORAGE: DYNAMODB & S3
        # ==========================================

        # Signals Ledger
        signals_table = dynamodb.Table(
            self, "NummussSignalsTable",
            table_name="nummuss-signals",
            partition_key=dynamodb.Attribute(name="signal_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Decisions Ledger
        decisions_table = dynamodb.Table(
            self, "NummussDecisionsTable",
            table_name="nummuss-decisions",
            partition_key=dynamodb.Attribute(name="decision_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
        )
        decisions_table.add_global_secondary_index(
            index_name="ModeAgentIndex",
            partition_key=dynamodb.Attribute(name="mode", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.STRING)
        )

        # Shadow Query Table
        shadow_table = dynamodb.Table(
            self, "NummussShadowTable",
            table_name="nummuss-shadow",
            partition_key=dynamodb.Attribute(name="query_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Evidence Bucket
        evidence_bucket = s3.Bucket(
            self, "NummussEvidenceBucket",
            bucket_name=f"nummuss-evidence-{self.account}-{self.region}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # DLQ
        dlq = sqs.Queue(self, "NummussDLQ")

        # ==========================================
        # 2. COMPUTE: LAMBDA FUNCTIONS
        # ==========================================

        # Fetch Signal Lambda
        fetch_signal_lambda = _lambda.Function(
            self, "FetchSignalLambda",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambdas/fetch_signal"),
            handler="app.handler",
            environment={
                "DDB_SIGNALS_TABLE": signals_table.table_name,
                "S3_EVIDENCE_BUCKET": evidence_bucket.bucket_name
            },
            dead_letter_queue_enabled=True,
            dead_letter_queue=dlq,
            timeout=Duration.seconds(30)
        )

        signals_table.grant_write_data(fetch_signal_lambda)
        evidence_bucket.grant_write(fetch_signal_lambda)

        # Reason and Decide Lambda
        reason_decide_lambda = _lambda.Function(
            self, "ReasonDecideLambda",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambdas/reason_decide"),
            handler="app.handler",
            environment={
                "DDB_DECISIONS_TABLE": decisions_table.table_name,
                "DDB_SIGNALS_TABLE": signals_table.table_name,
                "S3_EVIDENCE_BUCKET": evidence_bucket.bucket_name,
                "BEDROCK_MODEL_ID": "anthropic.claude-3-haiku-20240307-v1:0"
            },
            timeout=Duration.seconds(60),
            dead_letter_queue_enabled=True,
            dead_letter_queue=dlq
        )

        decisions_table.grant_write_data(reason_decide_lambda)
        signals_table.grant_read_data(reason_decide_lambda)
        evidence_bucket.grant_read(reason_decide_lambda)

        reason_decide_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel", "bedrock:ApplyGuardrail"],
            resources=["*"]
        ))

        # API Handler Lambda
        api_handler_lambda = _lambda.Function(
            self, "ApiHandlerLambda",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambdas/api_handler"),
            handler="app.handler",
            environment={
                "DDB_DECISIONS_TABLE": decisions_table.table_name,
                "DDB_SHADOW_TABLE": shadow_table.table_name
            }
        )

        decisions_table.grant_read_data(api_handler_lambda)
        shadow_table.grant_read_write_data(api_handler_lambda)

        # ==========================================
        # 3. TRIGGERS: EVENTBRIDGE & API GATEWAY
        # ==========================================

        rule = events.Rule(
            self, "FetchSignalScheduleRule",
            schedule=events.Schedule.rate(Duration.minutes(10))
        )
        rule.add_target(targets.LambdaFunction(fetch_signal_lambda))

        # API Gateway
        api = apigateway.RestApi(
            self, "NummussApi",
            rest_api_name="Nummuss API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS
            ),
            deploy_options=apigateway.StageOptions(
                throttling_rate_limit=10,
                throttling_burst_limit=5
            )
        )

        api_integration = apigateway.LambdaIntegration(api_handler_lambda)

        feed = api.root.add_resource("feed")
        feed.add_method("GET", api_integration)

        decision = api.root.add_resource("decision")
        decision_id = decision.add_resource("{decision_id}")
        decision_id.add_method("GET", api_integration)

        twin = api.root.add_resource("twin")
        twin.add_method("GET", api_integration)

        counterfactual = api.root.add_resource("counterfactual")
        counterfactual.add_method("GET", api_integration)

        replay = api.root.add_resource("replay")
        scenario = replay.add_resource("scenario")
        scenario_id = scenario.add_resource("{id}")
        scenario_id.add_method("GET", api_integration)

        shadow = api.root.add_resource("shadow")
        shadow.add_method("POST", api_integration)
