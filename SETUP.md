# XP Maestro Cloud - Quick Start Guide

## Step 1: SSH into your VPS

```bash
ssh root@your-vps-ip
cd /var/www/xpmaestrocloud
```

## Step 2: Initialize Node.js Project

```bash
# npm is included with Node.js
npm install
```

## Step 3: Setup Database (PostgreSQL Recommended)

```bash
# Install PostgreSQL on Alma Linux 2
sudo dnf install postgresql-server postgresql-contrib -y

# Initialize PostgreSQL
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE xpmaestrocloud;
CREATE USER xpmaestro WITH PASSWORD 'your-secure-password-here';
ALTER ROLE xpmaestro SET client_encoding TO 'utf8';
ALTER ROLE xpmaestro SET default_transaction_isolation TO 'read committed';
ALTER ROLE xpmaestro SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE xpmaestrocloud TO xpmaestro;
\q
EOF
```

## Step 4: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Important .env values:**
```
DATABASE_URL="postgresql://xpmaestro:your-password@localhost:5432/xpmaestrocloud"
JWT_SECRET="generate-a-long-random-string-here"
VPS_HOST="your-vps-ip"
VPS_USER="root"
VPS_PRIVATE_KEY_PATH="/root/.ssh/id_rsa"
ADMIN_EMAIL="admin@xpmaestrocloud.com"
ADMIN_PASSWORD="your-secure-password"
```

## Step 5: Generate SSH Key (for VPS to VPS communication)

```bash
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -f /root/.ssh/id_rsa -N ""

# Update .env with the path
# VPS_PRIVATE_KEY_PATH=/root/.ssh/id_rsa
```

## Step 6: Setup Prisma Database

```bash
# Run migrations
npm run migrate

# Seed database with admin user
npm run seed
```

## Step 7: Configure Nginx (on your VPS)

```bash
# Install Nginx if not installed
sudo dnf install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create directory for Nginx configs
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Update main Nginx config to include site configs
# Edit /etc/nginx/nginx.conf and add this in the http block:
# include /etc/nginx/sites-enabled/*.conf;
```

## Step 8: Create Node.js Service File

```bash
# Create systemd service file
sudo tee /etc/systemd/system/xpmaestrocloud.service > /dev/null <<EOF
[Unit]
Description=XP Maestro Cloud
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/xpmaestrocloud
ExecStart=/root/.nvm/versions/node/v20.19.6/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable xpmaestrocloud
sudo systemctl start xpmaestrocloud

# Check status
sudo systemctl status xpmaestrocloud
```

## Step 9: Install PM2 (Optional but Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start app with PM2
pm2 start ecosystem.config.js

# Make PM2 startup on reboot
pm2 startup
pm2 save
```

## Step 10: Test the Application

```bash
# Check if server is running
curl http://localhost:3000

# Check health endpoint
curl http://localhost:3000/health

# Try login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xpmaestrocloud.com","password":"your-admin-password"}'
```

## Step 11: Setup Nginx Main Domain

```bash
# Create Nginx config for main domain
sudo tee /etc/nginx/sites-available/xpmaestrocloud.com.conf > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name xpmaestrocloud.com www.xpmaestrocloud.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the config
sudo ln -s /etc/nginx/sites-available/xpmaestrocloud.com.conf /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Step 12: SSL Setup (Let's Encrypt)

```bash
# Install Certbot
sudo dnf install certbot python3-certbot-nginx -y

# Get certificate for main domain
sudo certbot certonly --nginx -d xpmaestrocloud.com -d www.xpmaestrocloud.com

# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Troubleshooting

### Check application logs
```bash
tail -f /var/www/xpmaestrocloud/logs/app.log
tail -f /var/www/xpmaestrocloud/logs/error.log
```

### Check service status
```bash
sudo systemctl status xpmaestrocloud
sudo journalctl -u xpmaestrocloud -f
```

### Check Nginx logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Test database connection
```bash
psql -h localhost -U xpmaestro -d xpmaestrocloud
```

## Next Steps

1. ✅ Basic Node.js/Express setup complete
2. ⏳ Create admin dashboard frontend
3. ⏳ Implement SSL/TLS automation
4. ⏳ Test subdomain creation workflow
5. ⏳ Set up monitoring and alerting
