#!/bin/bash
# Runs at every boot (before the app service). Fetches app secrets from
# Secrets Manager using the instance's IAM role and writes the backend .env.
# Secrets are NEVER baked into the AMI.
set -euo pipefail

SECRET_NAME="${SECRET_NAME:-safepassage-dev-app-secrets}"
REGION="${REGION:-us-east-1}"

SECRET=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$REGION" --query SecretString --output text)
DB_URL=$(printf '%s' "$SECRET" | python3 -c "import sys,json;print(json.load(sys.stdin)['DATABASE_URL'])")
JWT=$(printf '%s' "$SECRET" | python3 -c "import sys,json;print(json.load(sys.stdin)['JWT_SECRET'])")

cat > /opt/app/backend/.env <<ENVFILE
DATABASE_URL=$DB_URL
JWT_SECRET=$JWT
NODE_ENV=production
PORT=5000
ENVFILE
chmod 600 /opt/app/backend/.env
