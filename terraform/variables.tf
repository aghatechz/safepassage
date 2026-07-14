variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name, used as a prefix for resource names"
  type        = string
  default     = "axiomra"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# ---------------------------------------------------------------------------
# Networking
# ---------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to use (diagram shows AZ A and AZ B)"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# ---------------------------------------------------------------------------
# DNS / TLS
# ---------------------------------------------------------------------------
variable "domain_name" {
  description = "Root domain managed in Route 53 (e.g. example.com). Leave empty to skip Route 53 + ACM."
  type        = string
  default     = ""
}

variable "subdomain" {
  description = "Subdomain that points at the ALB (e.g. app -> app.example.com)"
  type        = string
  default     = "app"
}

# ---------------------------------------------------------------------------
# Compute / Auto Scaling
# ---------------------------------------------------------------------------
variable "instance_type" {
  description = "EC2 instance type for the app tier"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "Baked AMI ID (from HashiCorp Packer). If empty, latest Amazon Linux 2023 is used."
  type        = string
  default     = ""
}

variable "asg_min_size" {
  description = "Minimum number of instances in the Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum number of instances in the Auto Scaling Group"
  type        = number
  default     = 6
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in the Auto Scaling Group"
  type        = number
  default     = 2
}

variable "app_port" {
  description = "Port the application listens on behind the ALB"
  type        = number
  default     = 80
}

variable "health_check_path" {
  description = "ALB target group health check path"
  type        = string
  default     = "/"
}

# ---------------------------------------------------------------------------
# Database (RDS)
# ---------------------------------------------------------------------------
variable "db_engine" {
  description = "RDS engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "16.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Master username"
  type        = string
  default     = "appadmin"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ standby replica. NOTE: not available on Free Tier accounts."
  type        = bool
  default     = false
}

variable "db_backup_retention" {
  description = "Automated backup retention in days. Free Tier is limited; 0 disables backups."
  type        = number
  default     = 1
}

variable "db_performance_insights" {
  description = "Enable Performance Insights. Not supported on some micro instances / Free Tier."
  type        = bool
  default     = false
}

variable "create_rds" {
  description = "Provision a Terraform-managed RDS. false = reuse an existing DB via database_url (required on Free Tier)."
  type        = bool
  default     = false
}

variable "database_url" {
  description = "Existing PostgreSQL connection string (used when create_rds = false)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret injected into the backend."
  type        = string
  default     = ""
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------
variable "allowed_ssh_cidrs" {
  description = "CIDRs allowed to reach instances over SSH (keep tight!). Empty list disables SSH."
  type        = list(string)
  default     = []
}
