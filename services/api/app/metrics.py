from __future__ import annotations

import boto3


def put_view_metric(*, region_name: str, namespace: str, metric_name: str, environment: str, source: str) -> None:
    cloudwatch = boto3.client("cloudwatch", region_name=region_name)
    cloudwatch.put_metric_data(
        Namespace=namespace,
        MetricData=[
            {
                "MetricName": metric_name,
                "Dimensions": [
                    {"Name": "Environment", "Value": environment},
                    {"Name": "Source", "Value": source},
                ],
                "Value": 1.0,
                "Unit": "Count",
            }
        ],
    )

