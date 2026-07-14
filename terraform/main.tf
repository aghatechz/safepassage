# =================================================================
# SafePassage - AWS Infrastructure (Terraform)
# All resources consolidated into a single main.tf
# Inputs are in variables.tf / terraform.tfvars, outputs in outputs.tf
# =================================================================


# =================================================================
# versions.tf
# =================================================================
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Recommended: keep state in S3 + DynamoDB lock.
  # Uncomment and fill in after the bucket/table exist.
  # backend "s3" {
  #   bucket         = "my-tf-state-bucket"
  #   key            = "axiomra/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "my-tf-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}


# =================================================================
# locals.tf
# =================================================================
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Whether to provision Route 53 records + an ACM cert (only if a domain is given)
  enable_dns = var.domain_name != ""

  fqdn = local.enable_dns ? "${var.subdomain}.${var.domain_name}" : ""

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}


# =================================================================
# kms.tf
# =================================================================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}

# ---------------------------------------------------------------------------
# KMS key — encrypt/decrypt for RDS, S3, CloudWatch Logs and encrypted EBS.
# The key policy MUST grant the CloudWatch Logs service and the Auto Scaling
# service-linked role permission to use the key, otherwise log groups fail to
# create and ASG instances fail to launch (Client.InvalidKMSKey.InvalidState).
# ---------------------------------------------------------------------------
resource "aws_kms_key" "main" {
  description             = "${local.name_prefix} encryption key (RDS, S3, logs, EBS)"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "${local.name_prefix}-key-policy"
    Statement = [
      {
        Sid       = "EnableRootAccountAdmin"
        Effect    = "Allow"
        Principal = { AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowCloudWatchLogs"
        Effect    = "Allow"
        Principal = { Service = "logs.${data.aws_region.current.name}.amazonaws.com" }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      },
      {
        Sid    = "AllowAutoScalingUseOfKey"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowAutoScalingCreateGrant"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
        }
        Action    = "kms:CreateGrant"
        Resource  = "*"
        Condition = { Bool = { "kms:GrantIsForAWSResource" = "true" } }
      },
    ]
  })

  tags = { Name = "${local.name_prefix}-kms" }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}


# =================================================================
# vpc.tf
# =================================================================
# ---------------------------------------------------------------------------
# VPC + Internet Gateway
# ---------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${local.name_prefix}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${local.name_prefix}-igw" }
}

# ---------------------------------------------------------------------------
# Public subnets (one per AZ) — host the ALB and the Auto Scaling EC2 tier
# ---------------------------------------------------------------------------
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-${var.availability_zones[count.index]}"
    Tier = "public"
  }
}

# ---------------------------------------------------------------------------
# Private subnets (one per AZ) — host RDS primary + standby
# ---------------------------------------------------------------------------
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${local.name_prefix}-private-${var.availability_zones[count.index]}"
    Tier = "private"
  }
}

# ---------------------------------------------------------------------------
# NAT Gateway (single, in first public subnet) so private instances can reach
# the internet for updates/patches. Use one-per-AZ for higher availability.
# ---------------------------------------------------------------------------
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${local.name_prefix}-nat-eip" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  depends_on    = [aws_internet_gateway.main]

  tags = { Name = "${local.name_prefix}-nat" }
}

# ---------------------------------------------------------------------------
# Route tables
# ---------------------------------------------------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${local.name_prefix}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "${local.name_prefix}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}


# =================================================================
# security_groups.tf
# =================================================================
# ---------------------------------------------------------------------------
# ALB security group — open to the internet on 80/443
# ---------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Allow HTTP/HTTPS from the internet to the ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-alb-sg" }
}

# ---------------------------------------------------------------------------
# App/EC2 security group — only accepts traffic from the ALB
# ---------------------------------------------------------------------------
resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app-sg"
  description = "Allow app traffic from the ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App port from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  dynamic "ingress" {
    for_each = length(var.allowed_ssh_cidrs) > 0 ? [1] : []
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidrs
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-app-sg" }
}

# ---------------------------------------------------------------------------
# RDS security group — only accepts DB traffic from the app tier
# ---------------------------------------------------------------------------
resource "aws_security_group" "rds" {
  count       = var.create_rds ? 1 : 0
  name        = "${local.name_prefix}-rds-sg"
  description = "Allow DB traffic from the app tier only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "DB from app"
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-rds-sg" }
}


# =================================================================
# iam.tf
# =================================================================
# ---------------------------------------------------------------------------
# IAM role + instance profile for the EC2 app tier.
# Grants SSM (for keyless access), CloudWatch agent, and read/write to the
# assets bucket.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "${local.name_prefix}-app-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# Managed access via SSM Session Manager (no SSH keys needed)
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent (logs + metrics)
resource "aws_iam_role_policy_attachment" "cw_agent" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Scoped access to the assets bucket + KMS key
data "aws_iam_policy_document" "app_assets" {
  statement {
    sid    = "AssetsBucketObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.assets.arn}/*"]
  }

  statement {
    sid       = "AssetsBucketList"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.assets.arn]
  }

  statement {
    sid    = "UseKmsKey"
    effect = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]
    resources = [aws_kms_key.main.arn]
  }

  statement {
    sid       = "ReadAppSecret"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.db.arn]
  }
}

resource "aws_iam_role_policy" "app_assets" {
  name   = "${local.name_prefix}-app-assets"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app_assets.json
}

resource "aws_iam_instance_profile" "app" {
  name = "${local.name_prefix}-app-profile"
  role = aws_iam_role.app.name
}


# =================================================================
# s3.tf
# =================================================================
# ---------------------------------------------------------------------------
# S3 bucket — application images / static assets (diagram: "Images")
# ---------------------------------------------------------------------------
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-assets-${random_id.bucket_suffix.hex}"

  # Allows Terraform to delete the bucket even though versioning keeps object
  # versions (needed when renaming/recreating the bucket).
  force_destroy = true

  tags = { Name = "${local.name_prefix}-assets" }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

# ---------------------------------------------------------------------------
# Application deployment bundle (backend source + built frontend).
# Stored at a STABLE key so the GitHub Actions CI/CD pipeline can overwrite it
# on every deploy and then trigger an ASG instance refresh. Terraform seeds the
# initial bundle; the pipeline owns updates afterwards.
# ---------------------------------------------------------------------------
resource "aws_s3_object" "app_bundle" {
  bucket = aws_s3_bucket.assets.id
  key    = "deploy/app-latest.tar.gz"
  source = "${path.module}/build/app.tar.gz"
  etag   = filemd5("${path.module}/build/app.tar.gz")

  # The CI/CD pipeline overwrites this object; don't revert its content on apply.
  lifecycle {
    ignore_changes = [etag, source]
  }
}


# =================================================================
# rds.tf
# =================================================================
locals {
  db_port = 5432
}

# ---------------------------------------------------------------------------
# Database strategy
# ---------------------------------------------------------------------------
# create_rds = true  -> Terraform provisions a managed RDS instance.
#                       Requires a paid (non-Free-Tier) account; Free Tier is
#                       limited to a single RDS instance and no Multi-AZ.
# create_rds = false -> Reuse an EXISTING database via var.database_url
#                       (this project's Free Tier account already has the
#                       `safepassage-db` public RDS with the app schema/data).
# The app always reads its connection string from Secrets Manager.
# ---------------------------------------------------------------------------

resource "random_password" "db" {
  count            = var.create_rds ? 1 : 0
  length           = 24
  special          = true
  override_special = "!#$%^&*()-_=+[]{}"
}

resource "aws_db_subnet_group" "main" {
  count      = var.create_rds ? 1 : 0
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${local.name_prefix}-db-subnets" }
}

resource "aws_db_instance" "main" {
  count          = var.create_rds ? 1 : 0
  identifier     = "${local.name_prefix}-db"
  engine         = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp2"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db[0].result
  port     = local.db_port

  multi_az = var.db_multi_az

  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.rds[0].id]
  publicly_accessible    = false

  backup_retention_period = var.db_backup_retention
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  performance_insights_enabled    = var.db_performance_insights
  performance_insights_kms_key_id = var.db_performance_insights ? aws_kms_key.main.arn : null

  deletion_protection       = var.environment == "prod"
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-db-final" : null

  tags = { Name = "${local.name_prefix}-db" }
}

# ---------------------------------------------------------------------------
# App secrets in Secrets Manager (DB connection string + JWT secret).
# EC2 instances fetch this at boot via their IAM role.
# ---------------------------------------------------------------------------
locals {
  effective_database_url = var.create_rds ? "postgresql://${var.db_username}:${random_password.db[0].result}@${aws_db_instance.main[0].address}:${local.db_port}/${var.db_name}" : var.database_url
}

resource "aws_secretsmanager_secret" "db" {
  name                    = "${local.name_prefix}-app-secrets"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    DATABASE_URL = local.effective_database_url
    JWT_SECRET   = var.jwt_secret
    NODE_ENV     = "production"
    PORT         = "5000"
  })
}


# =================================================================
# alb.tf
# =================================================================
# ---------------------------------------------------------------------------
# Application Load Balancer (internet-facing, across both public subnets)
# ---------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "prod"

  tags = { Name = "${local.name_prefix}-alb" }
}

resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}-tg"
  port     = var.app_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }

  tags = { Name = "${local.name_prefix}-tg" }
}

# HTTPS listener — only when a cert exists. Otherwise HTTP serves traffic.
resource "aws_lb_listener" "https" {
  count             = local.enable_dns ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# HTTP listener:
#  - with a cert  -> redirect to HTTPS
#  - without cert -> forward directly to the target group
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = local.enable_dns ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  dynamic "default_action" {
    for_each = local.enable_dns ? [] : [1]
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.app.arn
    }
  }
}


# =================================================================
# compute.tf
# =================================================================
# ---------------------------------------------------------------------------
# AMI: use the Packer-baked AMI if provided, else latest Amazon Linux 2023
# ---------------------------------------------------------------------------
data "aws_ami" "al2023" {
  count       = var.ami_id == "" ? 1 : 0
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  effective_ami_id = var.ami_id != "" ? var.ami_id : data.aws_ami.al2023[0].id
}

# ---------------------------------------------------------------------------
# Launch template
# ---------------------------------------------------------------------------
resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = local.effective_ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.app.arn
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  metadata_options {
    http_tokens   = "required" # IMDSv2 only
    http_endpoint = "enabled"
  }

  monitoring {
    enabled = true
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      # Must be >= the AMI snapshot size (Amazon Linux 2023 root = 30GB),
      # otherwise instances baked by Packer fail to launch.
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  # Bootstrap the real SafePassage app (backend service + nginx-served frontend).
  user_data = base64encode(templatefile("${path.module}/userdata.sh.tftpl", {
    bucket     = aws_s3_bucket.assets.id
    key        = aws_s3_object.app_bundle.key
    region     = var.aws_region
    secret_arn = aws_secretsmanager_secret.db.arn
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ---------------------------------------------------------------------------
# Auto Scaling Group across both AZs, registered with the ALB target group
# ---------------------------------------------------------------------------
resource "aws_autoscaling_group" "app" {
  name                      = "${local.name_prefix}-asg"
  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  vpc_zone_identifier       = aws_subnet.public[*].id
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  wait_for_capacity_timeout = "15m"

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  # Rolling replacement on new AMI / launch template (diagram: "Instance refresh")
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
    triggers = ["tag"]
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ---------------------------------------------------------------------------
# Target-tracking scaling policy — keep average CPU near 50%
# (diagram: CloudWatch Alarms -> Trigger Scaling)
# ---------------------------------------------------------------------------
resource "aws_autoscaling_policy" "cpu" {
  name                   = "${local.name_prefix}-cpu-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}


# =================================================================
# acm.tf
# =================================================================
# ---------------------------------------------------------------------------
# ACM certificate for the ALB (DNS-validated via Route 53).
# Only created when a domain_name is supplied.
# ---------------------------------------------------------------------------
data "aws_route53_zone" "main" {
  count        = local.enable_dns ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

resource "aws_acm_certificate" "main" {
  count             = local.enable_dns ? 1 : 0
  domain_name       = local.fqdn
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${local.name_prefix}-cert" }
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.enable_dns ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60

  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "main" {
  count                   = local.enable_dns ? 1 : 0
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}


# =================================================================
# route53.tf
# =================================================================
# ---------------------------------------------------------------------------
# Route 53 alias record -> ALB (diagram: Route 53 -> Internet -> ALB)
# Only created when a domain_name is supplied.
# ---------------------------------------------------------------------------
resource "aws_route53_record" "app" {
  count   = local.enable_dns ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = local.fqdn
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}


# =================================================================
# cloudwatch.tf
# =================================================================
# ---------------------------------------------------------------------------
# CloudWatch Log group for the app tier (diagram: CloudWatch Logs)
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project_name}/${var.environment}/app"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = { Name = "${local.name_prefix}-app-logs" }
}

# ---------------------------------------------------------------------------
# CloudWatch Alarms (diagram: CloudWatch Alarms -> Trigger Scaling)
# The scaling itself is handled by the target-tracking policy; these alarms
# add operational visibility / notification hooks.
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "asg_high_cpu" {
  alarm_name          = "${local.name_prefix}-asg-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Average CPU across the ASG is high"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  treat_missing_data = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name_prefix}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB is returning a high number of 5xx responses"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  treat_missing_data = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count               = var.create_rds ? 1 : 0
  alarm_name          = "${local.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU is sustained high"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main[0].identifier
  }

  treat_missing_data = "notBreaching"
}
