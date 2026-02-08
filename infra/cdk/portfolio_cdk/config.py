from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional


@dataclass
class CustomDomainConfig:
    enabled: bool
    hosted_zone_id: str
    hosted_zone_name: str
    certificate_arn: str


@dataclass
class EnvironmentConfig:
    name: str
    stack_name: str
    region: str
    admin_email: str
    site_domain: str
    cms_domain: str
    alarm_email: str
    custom_domain: CustomDomainConfig


def _parse_custom_domain(data: Dict) -> CustomDomainConfig:
    return CustomDomainConfig(
        enabled=bool(data.get("enabled", False)),
        hosted_zone_id=str(data.get("hostedZoneId", "")).strip(),
        hosted_zone_name=str(data.get("hostedZoneName", "")).strip(),
        certificate_arn=str(data.get("certificateArn", "")).strip(),
    )


def load_environment_configs(config_file: Optional[Path] = None) -> Dict[str, EnvironmentConfig]:
    path = config_file or Path(__file__).resolve().parent.parent / "config" / "environments.json"
    with path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)

    parsed: Dict[str, EnvironmentConfig] = {}
    for env_name, values in raw.items():
        parsed[env_name] = EnvironmentConfig(
            name=env_name,
            stack_name=values["stackName"],
            region=values.get("region", "us-west-2"),
            admin_email=values["adminEmail"],
            site_domain=values["siteDomain"],
            cms_domain=values["cmsDomain"],
            alarm_email=values.get("alarmEmail", ""),
            custom_domain=_parse_custom_domain(values.get("customDomain", {})),
        )
    return parsed

