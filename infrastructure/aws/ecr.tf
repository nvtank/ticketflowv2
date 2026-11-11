# One repository per image produced by infrastructure/Dockerfile (TF2-037):
# api, web, migrate. Tags are immutable so a deployed digest can never be
# silently repointed, which TF2-039's "exact image digest" deploy gate
# depends on.

locals {
  ecr_repositories = {
    api     = "tixflow-v2/api"
    web     = "tixflow-v2/web"
    migrate = "tixflow-v2/migrate"
  }
}

resource "aws_ecr_repository" "api" {
  name                 = local.ecr_repositories.api
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "web" {
  name                 = local.ecr_repositories.web
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "migrate" {
  name                 = local.ecr_repositories.migrate
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep at most the 20 most recent untagged layers (failed/superseded
# pushes); never expire a tagged image, since a tagged digest may still be
# the "previous known good" rollback target in TF2-039.
resource "aws_ecr_lifecycle_policy" "expire_untagged" {
  for_each = {
    api     = aws_ecr_repository.api.name
    web     = aws_ecr_repository.web.name
    migrate = aws_ecr_repository.migrate.name
  }

  repository = each.value
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images after 20 are retained"
      selection = {
        tagStatus   = "untagged"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
      action = { type = "expire" }
    }]
  })
}
