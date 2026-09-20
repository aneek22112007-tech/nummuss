from aws_cdk import (
    Duration,
    Stack,
    RemovalPolicy,
    CfnOutput,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_lambda as _lambda,
    aws_events as events,
    aws_events_targets as targets,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_sqs as sqs,
)
from constructs import Construct
import os

class BackendStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Use `-c stage=prod` for production. Development stacks are disposable;
        # production data is retained if the stack is ever removed.
        stage = (self.node.try_get_context("stage") or "dev").lower()
        is_production = stage == "prod"
        data_removal_policy = RemovalPolicy.RETAIN if is_production else RemovalPolicy.DESTROY

        # ==========================================
        # 1. STORAGE: DYNAMODB & S3
        # ==========================================

        # Signals Ledger
        signals_table = dynamodb.Table(
            self, "NummussSignalsTable",
            partition_key=dynamodb.Attribute(name="signal_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=data_removal_policy
        )

        # Decisions Ledger
        decisions_table = dynamodb.Table(
            self, "NummussDecisionsTable",
            partition_key=dynamodb.Attribute(name="decision_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=data_removal_policy
        )
        decisions_table.add_global_secondary_index(
            index_name="ModeAgentIndex",
            partition_key=dynamodb.Attribute(name="mode", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.STRING)
        )

        # Shadow Query Table
        shadow_table = dynamodb.Table(
            self, "NummussShadowTable",
            partition_key=dynamodb.Attribute(name="query_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=data_removal_policy
        )

        # Evidence Bucket
        evidence_bucket = s3.Bucket(
            self, "NummussEvidenceBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=data_removal_policy,
            auto_delete_objects=not is_production
        )

        # DLQ
        dlq = sqs.Queue(
            self, "NummussDLQ",
            encryption=sqs.QueueEncryption.SQS_MANAGED,
            retention_period=Duration.days(14),
            removal_policy=data_removal_policy
        )

        # ==========================================
        # 2. COMPUTE: LAMBDA FUNCTIONS
        # ==========================================

        common_layer = _lambda.LayerVersion(
            self, "CommonLayer",
            code=_lambda.Code.from_asset("lambdas"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_11]
        )

        # Fetch Signal Lambda
        fetch_signal_lambda = _lambda.Function(
            self, "FetchSignalLambda",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambdas/fetch_signal"),
            handler="app.handler",
            environment={
                "DDB_SIGNALS_TABLE": signals_table.table_name,
                "S3_EVIDENCE_BUCKET": evidence_bucket.bucket_name,
                "ALPHA_VANTAGE_API_KEY": os.environ.get("ALPHA_VANTAGE_API_KEY", ""),
                "ALPHA_VANTAGE_SYMBOLS": os.environ.get("ALPHA_VANTAGE_SYMBOLS", "NIFTY50,RELIANCE,TCS"),
                "PYTHONPATH": "/var/runtime:/opt"
            },
            layers=[common_layer],
            dead_letter_queue_enabled=True,
            dead_letter_queue=dlq,
            timeout=Duration.seconds(30),
            memory_size=256
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
                "AWS_BEARER_TOKEN_BEDROCK": os.environ.get("AWS_BEARER_TOKEN_BEDROCK", ""),
                "BEDROCK_REGION": os.environ.get("BEDROCK_REGION", "eu-north-1"),
                "BEDROCK_MODEL_ID": os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"),
                "MEGABULL_API_KEY": os.environ.get("MEGABULL_API_KEY", ""),
                "MEGABULL_BASE_URL": os.environ.get("MEGABULL_BASE_URL", "https://api.megabull.app/v1"),
                "MEGABULL_ORDER_QTY": os.environ.get("MEGABULL_ORDER_QTY", "1"),
                "PYTHONPATH": "/var/runtime:/opt"
            },
            layers=[common_layer],
            timeout=Duration.seconds(60),
            memory_size=256,
            dead_letter_queue_enabled=True,
            dead_letter_queue=dlq,
            retry_attempts=1
        )

        decisions_table.grant_write_data(reason_decide_lambda)
        signals_table.grant_read_data(reason_decide_lambda)
        evidence_bucket.grant_read(reason_decide_lambda)

        # Ingestion invokes reasoning only after it has persisted the latest signals.
        fetch_signal_lambda.add_environment("REASON_DECIDE_FUNCTION_NAME", reason_decide_lambda.function_name)
        reason_decide_lambda.grant_invoke(fetch_signal_lambda)

        # API Handler Lambda
        api_handler_lambda = _lambda.Function(
            self, "ApiHandlerLambda",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambdas/api_handler"),
            handler="app.handler",
            environment={
                "DDB_DECISIONS_TABLE": decisions_table.table_name,
                "DDB_SHADOW_TABLE": shadow_table.table_name,
                "PYTHONPATH": "/var/runtime:/opt"
            },
            layers=[common_layer],
            timeout=Duration.seconds(15),
            memory_size=256
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
                throttling_burst_limit=5,
                metrics_enabled=False,
                data_trace_enabled=False,
                logging_level=apigateway.MethodLoggingLevel.ERROR
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

        # ==========================================
        # 4. FRONTEND: PRIVATE S3 + CLOUDFRONT
        # ==========================================
        frontend_bucket = s3.Bucket(
            self, "NummussFrontendBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=data_removal_policy,
            auto_delete_objects=not is_production
        )

        # Keep API Gateway resources unprefixed while the public CloudFront
        # endpoint exposes /api/*.
        api_path_rewrite = cloudfront.Function(
            self, "ApiPathRewrite",
            runtime=cloudfront.FunctionRuntime.JS_2_0,
            code=cloudfront.FunctionCode.from_inline(
                "function handler(event) {\n"
                "  var request = event.request;\n"
                "  request.uri = request.uri.replace(/^\\/api(?=\\/|$)/, '');\n"
                "  return request;\n"
                "}"
            )
        )

        distribution = cloudfront.Distribution(
            self, "NummussDistribution",
            default_root_object="index.html",
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            price_class=cloudfront.PriceClass.PRICE_CLASS_200,
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(frontend_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(5)
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(5)
                )
            ]
        )

        distribution.add_behavior(
            "api/*",
            origins.RestApiOrigin(api),
            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
            cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
            origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
            function_associations=[cloudfront.FunctionAssociation(
                event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                function=api_path_rewrite
            )]
        )

        # Run `npm run build` in frontend/ before `cdk deploy`; the production
        # Vite environment routes API calls through /api on this distribution.
        s3deploy.BucketDeployment(
            self, "DeployFrontend",
            sources=[s3deploy.Source.asset("../frontend/dist")],
            destination_bucket=frontend_bucket,
            distribution=distribution,
            distribution_paths=["/*"]
        )
        CfnOutput(self, "FrontendUrl", value=f"https://{distribution.distribution_domain_name}")
        CfnOutput(self, "ApiUrl", value=api.url)
        CfnOutput(self, "EvidenceBucketName", value=evidence_bucket.bucket_name)
        CfnOutput(self, "GuardrailId", value=content_guardrail.attr_guardrail_id)
