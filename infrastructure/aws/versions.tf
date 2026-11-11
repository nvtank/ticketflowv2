terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Remote state is intentionally not configured here. Until a backend is
  # approved and provisioned, `terraform init` uses the local backend and no
  # `terraform apply` is authorized against this configuration. See
  # ../../docs/operations/AWS_RUNBOOK.md for the gated apply procedure.
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "tixflow-v2"
      ManagedBy = "terraform"
      Env       = var.environment
    }
  }
}
