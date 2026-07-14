#!/bin/bash
# Packer provisioner: bakes the SafePassage app into the AMI.
# Runs on the temporary Packer build instance. Files were uploaded to /tmp.
set -euxo pipefail

# --- packages ---
sudo dnf install -y nginx nodejs npm tar python3

# --- app code (backend + built frontend) from the Build stage bundle ---
sudo rm -rf /opt/app && sudo mkdir -p /opt/app
sudo tar -xzf /tmp/app.tar.gz -C /opt/app
sudo mkdir -p /opt/app/backend/uploads

# --- backend production deps ---
cd /opt/app/backend
sudo npm install --omit=dev --no-audit --no-fund

# --- boot-time secret fetch (keeps secrets OUT of the AMI) ---
sudo install -m 0755 /tmp/fetch-env.sh /usr/local/bin/fetch-env.sh

# --- systemd services ---
sudo install -m 0644 /tmp/safepassage-env.service /etc/systemd/system/safepassage-env.service
sudo install -m 0644 /tmp/safepassage.service     /etc/systemd/system/safepassage.service

# --- nginx (serve frontend, proxy /api + /uploads to the backend) ---
sudo install -m 0644 /tmp/nginx.conf /etc/nginx/nginx.conf

# --- enable so they start automatically on every boot ---
sudo systemctl daemon-reload
sudo systemctl enable nginx safepassage-env.service safepassage.service

echo "=== SafePassage AMI provisioning complete ==="
