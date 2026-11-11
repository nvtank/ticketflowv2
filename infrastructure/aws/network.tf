# Minimal private-networking prerequisite for running the containers built
# from infrastructure/Dockerfile behind a TLS-terminating load balancer.
# Nothing here is internet-reachable except the load balancer's 443
# listener; app and data services stay in private subnets with no public IP
# and no NAT-independent inbound path.

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "tixflow-v2-${var.environment}" }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = false

  tags = { Name = "tixflow-v2-${var.environment}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "tixflow-v2-${var.environment}-private-${count.index}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "tixflow-v2-${var.environment}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "tixflow-v2-${var.environment}-public" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private subnets intentionally have no NAT gateway / default route in this
# baseline: the app containers only need to reach AWS APIs (ECR, SSM) and
# those are reachable without one once VPC endpoints are approved and added
# as a follow-up. Adding a NAT gateway is a paid resource and out of scope
# for this validation-only deliverable.

resource "aws_security_group" "load_balancer" {
  name        = "tixflow-v2-${var.environment}-alb"
  description = "Internet-facing TLS listener only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from the internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "To application targets only"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }
}

resource "aws_security_group" "app" {
  name        = "tixflow-v2-${var.environment}-app"
  description = "Application containers; inbound only from the load balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App port from the load balancer only"
    from_port       = 4100
    to_port         = 4100
    protocol        = "tcp"
    security_groups = [aws_security_group.load_balancer.id]
  }

  egress {
    description = "Outbound to AWS APIs and the data tier"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "data" {
  name        = "tixflow-v2-${var.environment}-data"
  description = "Postgres/Redis; inbound only from application containers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Postgres from app only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "Redis from app only"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# TLS prerequisite: the certificate resource exists so its validation
# records are known ahead of time, but DNS validation and attaching it to a
# real listener are both a production DNS change — gated separately, same
# as every other paid/public-facing step in this configuration.
resource "aws_acm_certificate" "app" {
  domain_name       = var.tls_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}
