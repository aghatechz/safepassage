aws_region   = "us-east-1"
project_name = "safepassage"
environment  = "dev"

# Networking
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

# DNS + TLS (empty = skip Route 53 / ACM, serve over HTTP on the ALB DNS name)
domain_name = ""
subdomain   = "app"

# Compute
instance_type        = "t3.micro"
ami_id               = ""
asg_min_size         = 2
asg_max_size         = 6
asg_desired_capacity = 2
app_port             = 80

# Database (Free Tier friendly: single-AZ, minimal backups, no Perf Insights)
db_engine               = "postgres"
db_engine_version       = "16.4"
db_instance_class       = "db.t3.micro"
db_allocated_storage    = 20
db_name                 = "appdb"
db_username             = "appadmin"
db_multi_az             = false # Free Tier cannot do Multi-AZ; set true on a paid account
db_backup_retention     = 0     # 0 avoids the Free Tier backup-retention limit
db_performance_insights = false

allowed_ssh_cidrs = []
