variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Deployment environment name (staging or production)."
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be \"staging\" or \"production\"."
  }
}

variable "github_org" {
  description = "GitHub organization or user that owns the repository allowed to assume the OIDC deploy role."
  type        = string
  default     = "nvtank"
}

variable "github_repo" {
  description = "GitHub repository name allowed to assume the OIDC deploy role."
  type        = string
  default     = "ticketflowv2"
}

variable "github_deploy_environment" {
  description = "GitHub Actions `environment:` name whose protection rules gate the real deploy job (see TF2-039 cd.yml). The trust policy only accepts tokens minted for this environment, not arbitrary branches."
  type        = string
  default     = "production"
}

variable "ssm_parameter_prefix" {
  description = "Path prefix under which the deploy role may read SSM parameters. Must stay namespaced per environment so staging and production roles cannot read each other's secrets."
  type        = string
  default     = "/tixflow-v2"
}

variable "vpc_cidr" {
  description = "CIDR block for the application VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets that host the application and database services. No public IPs."
  type        = list(string)
  default     = ["10.42.1.0/24", "10.42.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets that host only the load balancer."
  type        = list(string)
  default     = ["10.42.101.0/24", "10.42.102.0/24"]
}

variable "availability_zones" {
  description = "Availability zones matching private_subnet_cidrs/public_subnet_cidrs by index."
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "tls_domain_name" {
  description = "Public hostname the ACM certificate and HTTPS listener will serve. DNS validation and listener attachment stay pending until a domain is actually approved and owned (see TF2-038 acceptance: paid/DNS changes remain approval gated)."
  type        = string
  default     = "staging.tixflow.example"
}
