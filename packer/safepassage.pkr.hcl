packer {
  required_plugins {
    amazon = {
      version = ">= 1.3.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "region" {
  type    = string
  default = "us-east-1"
}

# Base image: latest Amazon Linux 2023 (x86_64)
source "amazon-ebs" "app" {
  region        = var.region
  instance_type = "t3.micro"
  ssh_username  = "ec2-user"
  ami_name      = "safepassage-app-{{timestamp}}"

  source_ami_filter {
    filters = {
      name                = "al2023-ami-*-x86_64"
      virtualization-type = "hvm"
      root-device-type    = "ebs"
    }
    owners      = ["amazon"]
    most_recent = true
  }

  tags = {
    Name      = "safepassage-app"
    Project   = "safepassage"
    ManagedBy = "Packer"
  }
}

build {
  name    = "safepassage"
  sources = ["source.amazon-ebs.app"]

  # Upload the app bundle (produced by the Build stage) and the config files.
  provisioner "file" {
    source      = "app.tar.gz"
    destination = "/tmp/app.tar.gz"
  }
  provisioner "file" {
    source      = "packer/files/fetch-env.sh"
    destination = "/tmp/fetch-env.sh"
  }
  provisioner "file" {
    source      = "packer/files/safepassage-env.service"
    destination = "/tmp/safepassage-env.service"
  }
  provisioner "file" {
    source      = "packer/files/safepassage.service"
    destination = "/tmp/safepassage.service"
  }
  provisioner "file" {
    source      = "packer/files/nginx.conf"
    destination = "/tmp/nginx.conf"
  }

  # Bake everything in.
  provisioner "shell" {
    script = "packer/scripts/provision.sh"
  }

  # Write the resulting AMI id to a manifest the Deploy stage reads.
  post-processor "manifest" {
    output     = "packer-manifest.json"
    strip_path = true
  }
}
