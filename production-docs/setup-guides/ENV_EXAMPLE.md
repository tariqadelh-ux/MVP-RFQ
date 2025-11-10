# Environment Variables Configuration

## Overview
Complete list of environment variables needed for the production RFQ system. Create `.env` files based on these templates.

## n8n Environment Variables

### `.env` for n8n
```bash
# n8n Configuration
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_PATH=/
NODE_ENV=production

# Database (n8n's own database)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=secure_password_here

# Authentication
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_admin_password

# Email Configuration (for n8n notifications)
N8N_EMAIL_MODE=smtp
N8N_SMTP_HOST=smtp.gmail.com
N8N_SMTP_PORT=587
N8N_SMTP_USER=n8n.notifications@binquraya.com
N8N_SMTP_PASS=app_specific_password
N8N_SMTP_SSL=false

# Encryption
N8N_ENCRYPTION_KEY=your-32-character-encryption-key

# Webhook URL (public facing)
WEBHOOK_URL=https://n8n.binquraya.com

# Execution Settings
EXECUTIONS_PROCESS=main
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200
N8N_METRICS=true

# Security
N8N_SECURE_COOKIE=true
```

### n8n Credentials (set in UI)
```yaml
# OpenAI Credentials
openai:
  apiKey: "sk-proj-xxxxxxxxxxxxxxxxxxxx"
  organizationId: "org-xxxxxxxxxxxx" # optional

# Supabase Credentials  
supabase:
  host: "https://xxxxxxxxxxxxx.supabase.co"
  serviceKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx"

# Google Drive Credentials
googleDrive:
  clientId: "xxxxxxxxxxxx.apps.googleusercontent.com"
  clientSecret: "GOCSPX-xxxxxxxxxxxx"
  oauthRedirectUrl: "https://n8n.binquraya.com/oauth2/callback"

# Gmail Credentials (for monitoring)
gmail:
  email: "rfq.monitor@binquraya.com"
  clientId: "xxxxxxxxxxxx.apps.googleusercontent.com"
  clientSecret: "GOCSPX-xxxxxxxxxxxx"

# IMAP Credentials (alternative to Gmail)
imap:
  host: "imap.gmail.com"
  port: 993
  user: "rfq.monitor@binquraya.com"
  password: "app_specific_password"
  secure: true
```

## Dashboard Environment Variables

### `.env.local` for Next.js Dashboard
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# n8n Webhook Endpoints
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.binquraya.com/webhook
N8N_WEBHOOK_TEST_URL=https://n8n.binquraya.com/webhook-test

# Application Settings
NEXT_PUBLIC_APP_URL=https://rfq.binquraya.com
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_POLLING_INTERVAL=1000

# Feature Flags
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Authentication
NEXTAUTH_URL=https://rfq.binquraya.com
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min

# Email Settings (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@binquraya.com
SMTP_PASS=app_specific_password
EMAIL_FROM=Bin Quraya RFQ System <notifications@binquraya.com>

# Google Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry Error Tracking (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxxxxxxxxxxx

# Redis Cache (optional for production)
REDIS_URL=redis://localhost:6379
```

## Supabase Project Configuration

### Database Settings (via Supabase Dashboard)
```yaml
# Connection Pooling
poolMode: "transaction"
poolSize: 15
statementTimeout: 60

# Security
sslMode: "require"
ipAllowList: 
  - "n8n-server-ip"
  - "dashboard-server-ip"

# Performance
maxConnections: 100
sharedBuffers: "256MB"
effectiveCacheSize: "1GB"
```

## Production Deployment Variables

### Docker Environment
```bash
# docker-compose.yml environment
version: '3.8'

services:
  n8n:
    environment:
      - NODE_ENV=production
      - N8N_SECURE_COOKIE=true
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - VUE_APP_URL_BASE_API=https://n8n.binquraya.com/
      
  dashboard:
    environment:
      - NODE_ENV=production
      - PORT=3000
```

### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: rfq-secrets
type: Opaque
stringData:
  supabase-url: "https://xxxxxxxxxxxxx.supabase.co"
  supabase-anon-key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx"
  supabase-service-key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx"
  openai-api-key: "sk-proj-xxxxxxxxxxxxxxxxxxxx"
  n8n-encryption-key: "your-32-character-encryption-key"
```

## Environment-Specific Configurations

### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_API_TIMEOUT=60000 # Longer timeout for debugging
N8N_PUSH_BACKEND=websocket
LOG_LEVEL=debug
```

### Staging
```bash
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
N8N_METRICS=true
LOG_LEVEL=info
```

### Production
```bash
NODE_ENV=production
N8N_METRICS=true
N8N_METRICS_PREFIX=n8n_
LOG_LEVEL=warn
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX=1000
```

## Security Best Practices

### 1. Secret Generation
```bash
# Generate secure secrets
openssl rand -hex 32  # For encryption keys
openssl rand -base64 32  # For passwords

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Environment Variable Management
```bash
# Use dotenv-vault for secure storage
npx dotenv-vault@latest new
npx dotenv-vault@latest login
npx dotenv-vault@latest push

# Or use cloud secret managers
# AWS Secrets Manager
# Google Secret Manager
# Azure Key Vault
```

### 3. Rotation Schedule
- API Keys: Every 90 days
- Passwords: Every 60 days
- Encryption Keys: Every 180 days
- JWT Secrets: Every 90 days

## Monitoring Environment Variables

### Application Monitoring
```bash
# DataDog
DD_API_KEY=xxxxxxxxxxxx
DD_APP_KEY=xxxxxxxxxxxx
DD_SITE=datadoghq.com

# New Relic
NEW_RELIC_LICENSE_KEY=xxxxxxxxxxxx
NEW_RELIC_APP_NAME=binquraya-rfq

# Prometheus
PROMETHEUS_PORT=9090
PROMETHEUS_RETENTION=15d
```

### Logging
```bash
# CloudWatch (AWS)
AWS_REGION=eu-central-1
CLOUDWATCH_LOG_GROUP=/aws/ecs/rfq-system

# LogDNA
LOGDNA_INGESTION_KEY=xxxxxxxxxxxx
LOGDNA_HOSTNAME=rfq-production

# Elasticsearch
ELASTICSEARCH_URL=https://es.binquraya.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=xxxxxxxxxxxx
```

## Backup Configuration

### Database Backups
```bash
# Automated backup settings
BACKUP_SCHEDULE="0 2 * * *" # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH=s3://binquraya-backups/rfq/

# S3 Credentials for backups
AWS_ACCESS_KEY_ID=xxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxx
AWS_DEFAULT_REGION=eu-central-1
```

## Testing Environment Variables

### E2E Testing
```bash
# Cypress
CYPRESS_BASE_URL=http://localhost:3000
CYPRESS_SUPABASE_URL=https://test-xxxxx.supabase.co
CYPRESS_TEST_EMAIL=test@binquraya.com
CYPRESS_TEST_PASSWORD=test_password

# Playwright
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
```

## Troubleshooting Common Issues

### Missing Variables Checklist
```bash
# n8n not starting
- Check: N8N_ENCRYPTION_KEY (required)
- Check: Database connection variables
- Check: N8N_HOST and N8N_PORT

# Supabase connection failing
- Check: SUPABASE_SERVICE_ROLE_KEY (not anon key for backend)
- Check: URL includes https://
- Check: No trailing slash in URL

# Email not working
- Check: Gmail app-specific password (not regular password)
- Check: SMTP settings match provider
- Check: Firewall allows SMTP ports

# OpenAI errors
- Check: API key starts with sk-
- Check: Organization ID if using org account
- Check: Rate limits not exceeded
```

## Quick Setup Script

```bash
#!/bin/bash
# setup-env.sh

# Copy example files
cp .env.example .env
cp .env.local.example .env.local

# Generate secrets
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env.local

# Reminder
echo "Remember to:"
echo "1. Add your Supabase credentials"
echo "2. Add your OpenAI API key"
echo "3. Configure email settings"
echo "4. Set up Google Drive OAuth"
```

Make this executable: `chmod +x setup-env.sh`
