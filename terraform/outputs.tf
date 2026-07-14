output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "Public DNS name of the ALB"
  value       = aws_lb.main.dns_name
}

output "app_url" {
  description = "URL to reach the app"
  value       = local.enable_dns ? "https://${local.fqdn}" : "http://${aws_lb.main.dns_name}"
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.app.name
}

output "rds_endpoint" {
  description = "Terraform-managed RDS endpoint (empty when reusing an existing DB)"
  value       = var.create_rds ? aws_db_instance.main[0].address : "(reusing existing database via database_url)"
}

output "app_secret_arn" {
  description = "Secrets Manager ARN holding the app secrets (DATABASE_URL, JWT)"
  value       = aws_secretsmanager_secret.db.arn
}

output "assets_bucket" {
  description = "S3 assets bucket name"
  value       = aws_s3_bucket.assets.bucket
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "log_group_name" {
  description = "CloudWatch log group for the app"
  value       = aws_cloudwatch_log_group.app.name
}
