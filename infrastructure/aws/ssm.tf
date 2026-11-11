# Parameter Store holds the same runtime secrets that
# scripts/setup-staging.py generates locally (see infrastructure/docker-compose.staging.yml):
# DB password, Redis password, JWT secret, ticket signing key. Values are
# never set by Terraform — `value` here is a placeholder that real
# apply/rotation overwrites out of band, so secret material never enters
# Terraform state or this repository.

resource "aws_kms_key" "ssm" {
  description             = "Encrypts tixflow-v2 ${var.environment} SSM SecureString parameters"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "ssm" {
  name          = "alias/tixflow-v2-${var.environment}-ssm"
  target_key_id = aws_kms_key.ssm.key_id
}

locals {
  ssm_secret_names = [
    "db-password",
    "redis-password",
    "jwt-secret",
    "ticket-signing-key",
  ]
}

resource "aws_ssm_parameter" "secret" {
  for_each = toset(local.ssm_secret_names)

  name   = "${var.ssm_parameter_prefix}/${var.environment}/${each.value}"
  type   = "SecureString"
  key_id = aws_kms_key.ssm.key_id
  value  = "REPLACE_OUT_OF_BAND"

  lifecycle {
    # Terraform only owns existence/encryption settings; the real secret is
    # written by a separate, approved rotation step and must never be
    # reverted to this placeholder on the next plan/apply.
    ignore_changes = [value]
  }
}
