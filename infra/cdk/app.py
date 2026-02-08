#!/usr/bin/env python3
from __future__ import annotations

import os

import aws_cdk as cdk

from portfolio_cdk.config import load_environment_configs
from portfolio_cdk.portfolio_stack import PortfolioStack


app = cdk.App()

environment_name = app.node.try_get_context("environment") or os.getenv("DEPLOY_ENV", "staging")
configs = load_environment_configs()

if environment_name not in configs:
    valid = ", ".join(sorted(configs.keys()))
    raise ValueError(f"Unknown environment '{environment_name}'. Choose one of: {valid}")

selected = configs[environment_name]

PortfolioStack(
    app,
    selected.stack_name,
    config=selected,
    env=cdk.Environment(account=os.getenv("CDK_DEFAULT_ACCOUNT"), region=selected.region),
)

app.synth()

