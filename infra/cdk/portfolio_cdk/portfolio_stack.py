from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Optional

import jsii
from aws_cdk import (
    BundlingOptions,
    CfnOutput,
    Duration,
    ILocalBundling,
    RemovalPolicy,
    Stack,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigwv2_integrations,
    aws_certificatemanager as acm,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_route53 as route53,
    aws_route53_targets as route53_targets,
    aws_s3 as s3,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct

from portfolio_cdk.config import EnvironmentConfig


class PortfolioStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, config: EnvironmentConfig, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        is_prod = config.name == "prod"
        removal_policy = RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY
        auto_delete = not is_prod

        projects_table = dynamodb.Table(
            self,
            "ProjectsTable",
            table_name=f"portfolio-projects-{config.name}",
            partition_key=dynamodb.Attribute(name="project_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            removal_policy=removal_policy,
        )

        media_bucket = s3.Bucket(
            self,
            "MediaBucket",
            bucket_name=f"{self.account}-portfolio-media-{config.name}",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            versioned=True,
            auto_delete_objects=auto_delete,
            removal_policy=removal_policy,
            cors=[
                s3.CorsRule(
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
                    exposed_headers=["ETag"],
                    max_age=3600,
                )
            ],
        )

        site_bucket = s3.Bucket(
            self,
            "SiteBucket",
            bucket_name=f"{self.account}-portfolio-site-{config.name}",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            versioned=True,
            auto_delete_objects=auto_delete,
            removal_policy=removal_policy,
        )

        cms_bucket = s3.Bucket(
            self,
            "CmsBucket",
            bucket_name=f"{self.account}-portfolio-cms-{config.name}",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            versioned=True,
            auto_delete_objects=auto_delete,
            removal_policy=removal_policy,
        )

        user_pool = cognito.UserPool(
            self,
            "CmsUserPool",
            user_pool_name=f"portfolio-cms-{config.name}",
            self_sign_up_enabled=False,
            sign_in_aliases=cognito.SignInAliases(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=False),
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=10,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=removal_policy,
        )

        user_pool_client = user_pool.add_client(
            "CmsWebClient",
            user_pool_client_name=f"portfolio-cms-client-{config.name}",
            generate_secret=False,
            auth_flows=cognito.AuthFlow(user_password=True, user_srp=True),
            prevent_user_existence_errors=True,
        )

        cognito.CfnUserPoolUser(
            self,
            "CmsAdminUser",
            user_pool_id=user_pool.user_pool_id,
            username=config.admin_email,
            desired_delivery_mediums=["EMAIL"],
            force_alias_creation=False,
            user_attributes=[
                cognito.CfnUserPoolUser.AttributeTypeProperty(name="email", value=config.admin_email),
                cognito.CfnUserPoolUser.AttributeTypeProperty(name="email_verified", value="true"),
            ],
        )

        api_function = lambda_.Function(
            self,
            "ApiFunction",
            function_name=f"portfolio-api-{config.name}",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="app.main.handler",
            code=self._build_api_asset(),
            timeout=Duration.seconds(30),
            memory_size=1024,
            environment={
                "DATA_BACKEND": "dynamodb",
                "TABLE_NAME": projects_table.table_name,
                "MEDIA_BUCKET_NAME": media_bucket.bucket_name,
                "MEDIA_BASE_URL": "/media",
                "COGNITO_REGION": config.region,
                "COGNITO_USER_POOL_ID": user_pool.user_pool_id,
                "COGNITO_APP_CLIENT_ID": user_pool_client.user_pool_client_id,
                "DISABLE_AUTH": "false",
                "CORS_ALLOW_ORIGINS": "*",
                "METRIC_NAMESPACE": "PortfolioWebsite",
                "VIEW_METRIC_NAME": "WebsiteViews",
                "DEPLOYMENT_ENV": config.name,
            },
        )
        projects_table.grant_read_write_data(api_function)
        media_bucket.grant_read_write(api_function)
        api_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["cloudwatch:PutMetricData"],
                resources=["*"],
            )
        )

        api = apigwv2.HttpApi(
            self,
            "PortfolioHttpApi",
            api_name=f"portfolio-http-api-{config.name}",
            create_default_stage=True,
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=["*"],
                allow_headers=["*"],
                allow_methods=[apigwv2.CorsHttpMethod.ANY],
                max_age=Duration.hours(1),
            ),
        )

        integration = apigwv2_integrations.HttpLambdaIntegration("ApiIntegration", api_function)
        api.add_routes(path="/", methods=[apigwv2.HttpMethod.ANY], integration=integration)
        api.add_routes(path="/{proxy+}", methods=[apigwv2.HttpMethod.ANY], integration=integration)

        certificate = self._maybe_certificate(config)
        hosted_zone = self._maybe_hosted_zone(config)

        api_origin = origins.HttpOrigin(
            f"{api.http_api_id}.execute-api.{self.region}.{self.url_suffix}",
            protocol_policy=cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        )

        media_oai = cloudfront.OriginAccessIdentity(self, "MediaBucketOAI")
        media_bucket.grant_read(media_oai)
        media_origin = origins.S3BucketOrigin.with_origin_access_identity(
            media_bucket, origin_access_identity=media_oai
        )

        site_oai = cloudfront.OriginAccessIdentity(self, "SiteBucketOAI")
        site_bucket.grant_read(site_oai)
        site_distribution = cloudfront.Distribution(
            self,
            "SiteDistribution",
            default_root_object="index.html",
            domain_names=[config.site_domain] if certificate else None,
            certificate=certificate,
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_identity(
                    site_bucket, origin_access_identity=site_oai
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                compress=True,
            ),
            additional_behaviors={
                "api/*": cloudfront.BehaviorOptions(
                    origin=api_origin,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                ),
                "media/*": cloudfront.BehaviorOptions(
                    origin=media_origin,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                ),
            },
            error_responses=self._spa_error_responses(),
        )

        cms_oai = cloudfront.OriginAccessIdentity(self, "CmsBucketOAI")
        cms_bucket.grant_read(cms_oai)
        cms_distribution = cloudfront.Distribution(
            self,
            "CmsDistribution",
            default_root_object="index.html",
            domain_names=[config.cms_domain] if certificate else None,
            certificate=certificate,
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_identity(
                    cms_bucket, origin_access_identity=cms_oai
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                compress=True,
            ),
            additional_behaviors={
                "api/*": cloudfront.BehaviorOptions(
                    origin=api_origin,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                ),
                "media/*": cloudfront.BehaviorOptions(
                    origin=media_origin,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                ),
            },
            error_responses=self._spa_error_responses(),
        )

        if hosted_zone and certificate:
            route53.ARecord(
                self,
                "SiteAlias",
                zone=hosted_zone,
                record_name=config.site_domain,
                target=route53.RecordTarget.from_alias(route53_targets.CloudFrontTarget(site_distribution)),
            )
            route53.ARecord(
                self,
                "CmsAlias",
                zone=hosted_zone,
                record_name=config.cms_domain,
                target=route53.RecordTarget.from_alias(route53_targets.CloudFrontTarget(cms_distribution)),
            )

        dashboard = cloudwatch.Dashboard(self, "PortfolioDashboard", dashboard_name=f"portfolio-{config.name}")
        view_metric = cloudwatch.Metric(
            namespace="PortfolioWebsite",
            metric_name="WebsiteViews",
            dimensions_map={"Environment": config.name, "Source": "public-site"},
            statistic="Sum",
            period=Duration.days(1),
        )
        dashboard.add_widgets(
            cloudwatch.GraphWidget(title="Website Views (Daily)", left=[view_metric], width=12),
            cloudwatch.GraphWidget(
                title="API Requests / 5XX",
                left=[api.metric_count(), api.metric_server_error()],
                width=12,
            ),
            cloudwatch.GraphWidget(
                title="Lambda Errors / Duration",
                left=[api_function.metric_errors(), api_function.metric_duration()],
                width=12,
            ),
        )

        lambda_error_alarm = cloudwatch.Alarm(
            self,
            "ApiLambdaErrorsAlarm",
            alarm_name=f"portfolio-{config.name}-lambda-errors",
            metric=api_function.metric_errors(period=Duration.minutes(5), statistic="Sum"),
            threshold=1,
            evaluation_periods=1,
        )
        api_5xx_alarm = cloudwatch.Alarm(
            self,
            "Api5xxAlarm",
            alarm_name=f"portfolio-{config.name}-api-5xx",
            metric=api.metric_server_error(period=Duration.minutes(5), statistic="Sum"),
            threshold=5,
            evaluation_periods=1,
        )

        if config.alarm_email:
            topic = sns.Topic(self, "AlarmTopic", topic_name=f"portfolio-{config.name}-alarms")
            topic.add_subscription(subscriptions.EmailSubscription(config.alarm_email))
            lambda_error_alarm.add_alarm_action(cloudwatch_actions.SnsAction(topic))
            api_5xx_alarm.add_alarm_action(cloudwatch_actions.SnsAction(topic))

        site_url = f"https://{config.site_domain}" if certificate else f"https://{site_distribution.distribution_domain_name}"
        cms_url = f"https://{config.cms_domain}" if certificate else f"https://{cms_distribution.distribution_domain_name}"

        CfnOutput(self, "SiteUrl", value=site_url)
        CfnOutput(self, "CmsUrl", value=cms_url)
        CfnOutput(self, "ApiEndpoint", value=api.api_endpoint)
        CfnOutput(self, "SiteBucketName", value=site_bucket.bucket_name)
        CfnOutput(self, "CmsBucketName", value=cms_bucket.bucket_name)
        CfnOutput(self, "MediaBucketName", value=media_bucket.bucket_name)
        CfnOutput(self, "SiteDistributionId", value=site_distribution.distribution_id)
        CfnOutput(self, "CmsDistributionId", value=cms_distribution.distribution_id)
        CfnOutput(self, "SiteDistributionDomain", value=site_distribution.distribution_domain_name)
        CfnOutput(self, "CmsDistributionDomain", value=cms_distribution.distribution_domain_name)
        CfnOutput(self, "UserPoolId", value=user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=user_pool_client.user_pool_client_id)

    def _build_api_asset(self) -> lambda_.Code:
        api_source = Path(__file__).resolve().parents[3] / "services" / "api"
        return lambda_.Code.from_asset(
            str(api_source),
            bundling=BundlingOptions(
                image=lambda_.Runtime.PYTHON_3_12.bundling_image,
                command=[
                    "bash",
                    "-c",
                    "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
                ],
                local=_LocalApiBundling(api_source),
            ),
        )

    @staticmethod
    def _spa_error_responses() -> list[cloudfront.ErrorResponse]:
        return [
            cloudfront.ErrorResponse(
                http_status=403,
                response_http_status=200,
                response_page_path="/index.html",
                ttl=Duration.minutes(5),
            ),
            cloudfront.ErrorResponse(
                http_status=404,
                response_http_status=200,
                response_page_path="/index.html",
                ttl=Duration.minutes(5),
            ),
        ]

    def _maybe_certificate(self, config: EnvironmentConfig) -> Optional[acm.ICertificate]:
        custom = config.custom_domain
        if not custom.enabled:
            return None
        if not custom.certificate_arn:
            raise ValueError("customDomain.certificateArn is required when custom domains are enabled.")
        return acm.Certificate.from_certificate_arn(self, "SharedCertificate", custom.certificate_arn)

    def _maybe_hosted_zone(self, config: EnvironmentConfig) -> Optional[route53.IHostedZone]:
        custom = config.custom_domain
        if not custom.enabled:
            return None
        if not custom.hosted_zone_id or not custom.hosted_zone_name:
            raise ValueError("Hosted zone ID and name are required when custom domains are enabled.")
        return route53.HostedZone.from_hosted_zone_attributes(
            self,
            "HostedZone",
            hosted_zone_id=custom.hosted_zone_id,
            zone_name=custom.hosted_zone_name,
        )


@jsii.implements(ILocalBundling)
class _LocalApiBundling:
    def __init__(self, api_source: Path) -> None:
        self.api_source = api_source

    def try_bundle(self, output_dir: str, _options) -> bool:
        python_exe = shutil.which("python") or shutil.which("py")
        if not python_exe:
            return False

        try:
            subprocess.run(
                [python_exe, "-m", "pip", "install", "-r", str(self.api_source / "requirements.txt"), "-t", output_dir],
                check=True,
                cwd=str(self.api_source),
            )
            shutil.copytree(
                self.api_source,
                output_dir,
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns(
                    ".venv",
                    "__pycache__",
                    ".pytest_cache",
                    "tests",
                    "*.pyc",
                    "*.pyo",
                ),
            )
            return True
        except Exception:
            return False
