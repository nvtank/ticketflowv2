# AWS IaC (TF2-038) — not applied

Least-privilege GitHub OIDC deploy role, ECR repositories, SSM parameter
placeholders + KMS key, and minimal VPC/network/ACM prerequisites for the
images built by `infrastructure/Dockerfile` (TF2-037).

```sh
cd infrastructure/aws
terraform fmt -check -recursive
terraform init -backend=false   # no remote backend is configured yet
terraform validate
```

`terraform plan`/`apply` require real AWS credentials and a separate
approval — see [`../../docs/operations/AWS_RUNBOOK.md`](../../docs/operations/AWS_RUNBOOK.md).
No AWS resource, paid or otherwise, has been created by this configuration.
Static-validation evidence: [`../../docs/operations/evidence/aws-iac-validate-2026-11-11.json`](../../docs/operations/evidence/aws-iac-validate-2026-11-11.json).
