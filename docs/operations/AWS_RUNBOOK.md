# AWS IaC runbook (TF2-038)

Scope: `infrastructure/aws/` defines a least-privilege GitHub OIDC deploy role,
three ECR repositories, SSM parameter placeholders with their own KMS key,
and the minimal VPC/subnet/security-group/ACM-certificate prerequisites a
TLS-terminating deploy of the TF2-037 images would need.

**Nothing in this runbook has been applied.** `terraform apply`, DNS
validation of the ACM certificate, and any paid resource remain gated behind
a separate, explicit approval — consistent with every other Sprint 2
deliverable in this repository. Evidence of what _was_ checked is at
[`../operations/evidence/aws-iac-validate-2026-11-11.json`](evidence/aws-iac-validate-2026-11-11.json):
`terraform fmt -check`, `terraform validate`, and a credential-less
`terraform plan` (which fails as expected, confirming apply cannot run by
accident in this environment).

## What's intentionally out of scope here

- No frontend hosting resources on AWS. Per [CR-20261112-003](../qlda/changes/CR-20261112-003-vercel-hosting-split.md), `apps/web` deploys to Vercel (Hobby tier, Node 24.x) with its own global CDN and HTTPS. AWS only scopes backend services (`apps/api`, database, and cache).
- No NAT gateway (paid; private subnets reach AWS APIs via VPC endpoints as
  a follow-up, not a NAT gateway).
- No ALB/listener resource yet — attaching one is meaningless before the
  ACM certificate is DNS-validated, which is itself gated (see below).
- No remote Terraform state backend — `versions.tf` uses the local backend
  until one is approved and provisioned; do not add a backend block and run
  `terraform init -migrate-state` without that approval.
- No secret values. The SSM parameters are created with a placeholder
  (`REPLACE_OUT_OF_BAND`) and `lifecycle.ignore_changes` on `value`, so a
  real secret can be written once (outside Terraform) and will never be
  reverted by a later `apply`.

## Prerequisites before anyone runs `apply`

1. An AWS account/credentials authorized by whoever owns billing for this
   project — not the assignee's personal account.
2. Decide the real value of `tls_domain_name` (a domain actually owned by
   the project) and get sign-off that registering/validating it is
   approved, since ACM DNS validation is a production DNS change.
3. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in the
   real `github_org`/`github_repo`/`environment`/`tls_domain_name`.
4. `cd infrastructure/aws && terraform init` (still no backend configured —
   add one only as its own reviewed change).

## Gated apply procedure

1. `terraform plan -out=tfplan` and have the plan reviewed by the
   independent reviewer named on the Issue (not the person running it).
2. Only after that review: `terraform apply tfplan`.
3. Record the real outputs (`deploy_role_arn`, `ecr_repository_urls`,
   `ssm_parameter_names`, `vpc_id`) in a new evidence file under
   `docs/operations/evidence/`, dated and attributed, the same way
   `aws-iac-validate-2026-11-11.json` records the static checks.
4. Rotate real values into the four SSM parameters via
   `aws ssm put-parameter --overwrite` (never via `terraform apply`,
   which would otherwise be a no-op because of `ignore_changes`).
5. Set the `AWS_DEPLOY_ROLE_ARN` variable/secret on the GitHub
   `github_deploy_environment` (default `production`) environment so the
   TF2-039 CD workflow's real-deploy job can assume `deploy_role_arn`. Do
   not set it at the repository level — the trust policy's `sub` condition
   already restricts assumption to that one environment, and keeping the
   variable scoped the same way avoids a mismatch.
6. ACM DNS validation (`acm_certificate_validation_options` in the plan
   output) and attaching the certificate to a real listener are a separate,
   explicitly approved production DNS change — do not create those DNS
   records as a side effect of this apply.

## Rollback of the infrastructure itself

`terraform destroy` on this configuration is also apply-equivalent and
needs the same approval as step 2 above. The ECR repositories are not
`force_delete`, so a destroy fails loudly instead of silently discarding
pushed images — if that's ever actually wanted, delete images explicitly
first and record why.
