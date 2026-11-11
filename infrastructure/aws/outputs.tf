output "deploy_role_arn" {
  description = "IAM role ARN the CD workflow (TF2-039) assumes via OIDC. Set this as the AWS_DEPLOY_ROLE_ARN repository/environment variable once applied."
  value       = aws_iam_role.deploy.arn
}

output "ecr_repository_urls" {
  description = "Push targets for the three images built by infrastructure/Dockerfile."
  value = {
    api     = aws_ecr_repository.api.repository_url
    web     = aws_ecr_repository.web.repository_url
    migrate = aws_ecr_repository.migrate.repository_url
  }
}

output "ssm_parameter_names" {
  description = "SecureString parameter names; values must be rotated out of band, never via terraform apply."
  value       = [for p in aws_ssm_parameter.secret : p.name]
}

output "acm_certificate_validation_options" {
  description = "DNS records required to validate the ACM certificate. Creating these records is a production DNS change and stays approval gated."
  value       = aws_acm_certificate.app.domain_validation_options
}

output "vpc_id" {
  value = aws_vpc.main.id
}
