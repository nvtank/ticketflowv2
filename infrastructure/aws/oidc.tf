# GitHub Actions OIDC federation: lets the CD workflow (TF2-039) assume an
# AWS role without any long-lived access key stored in GitHub secrets.

data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]
}

# Trust policy: only the CD workflow run minted for this repository's
# `github_deploy_environment` (a protected GitHub environment with required
# reviewers) may assume this role — not any branch, any fork, or any other
# repository. This is what makes the "protected environment approval" gate
# in TF2-039 actually enforceable at the AWS layer, not just in YAML.
data "aws_iam_policy_document" "deploy_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:environment:${var.github_deploy_environment}"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name                 = "tixflow-v2-${var.environment}-github-deploy"
  assume_role_policy   = data.aws_iam_policy_document.deploy_trust.json
  max_session_duration = 3600
}

# ECR: push/pull scoped to this environment's three repositories only, no
# `ecr:*` and no `Resource = "*"` except the one read-only action AWS
# requires to be account-wide (GetAuthorizationToken has no resource type).
data "aws_iam_policy_document" "deploy_ecr" {
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
    ]
    resources = [
      aws_ecr_repository.api.arn,
      aws_ecr_repository.web.arn,
      aws_ecr_repository.migrate.arn,
    ]
  }
}

resource "aws_iam_role_policy" "deploy_ecr" {
  name   = "ecr-push-pull"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy_ecr.json
}

# SSM: read-only, namespaced under this environment's parameter prefix only.
# KMS decrypt is scoped to the one CMK used for those SecureString params.
data "aws_iam_policy_document" "deploy_ssm" {
  statement {
    sid    = "SsmReadNamespace"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
    resources = [
      "arn:aws:ssm:${var.aws_region}:*:parameter${var.ssm_parameter_prefix}/${var.environment}/*",
    ]
  }

  statement {
    sid       = "KmsDecryptSsm"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.ssm.arn]
  }
}

resource "aws_iam_role_policy" "deploy_ssm" {
  name   = "ssm-read-namespace"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy_ssm.json
}
