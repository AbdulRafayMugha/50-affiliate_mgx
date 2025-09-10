#!/bin/bash

# Affiliate System Deployment Script for Cloudways
# Run this script on your Cloudways server

set -e  # Exit on any error

echo "🚀 Starting Affiliate System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/affiliate-system"
DOMAIN="yourdomain.com"
DB_NAME="affiliate_system_prod"
DB_USER="affiliate_user"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "App Directory: $APP_DIR"
echo "Domain: $DOMAIN"
echo "Database: $DB_NAME"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root. Use a regular user with sudo privileges.${NC}"
    exit 1
fi

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Install system dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Setup PostgreSQL database
echo -e "${YELLOW}🗄️ Setting up PostgreSQL database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD 'secure_password_123';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Configure PostgreSQL
echo -e "${YELLOW}⚙️ Configuring PostgreSQL...${NC}"
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
sudo systemctl restart postgresql

# Create PM2 log directory
echo -e "${YELLOW}📝 Creating PM2 log directory...${NC}"
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Setup Nginx configuration
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/affiliate-system > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Frontend (React App)
    location / {
        root $APP_DIR/shadcn-ui/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/affiliate-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3001

# Create backup script
echo -e "${YELLOW}💾 Creating backup script...${NC}"
sudo tee /home/$USER/backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
DB_NAME="$DB_NAME"

mkdir -p \$BACKUP_DIR

# Database backup
pg_dump -h localhost -U $DB_USER \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/app_backup_\$DATE.tar.gz $APP_DIR

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /home/$USER/backup.sh

# Setup daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup.sh") | crontab -

echo -e "${GREEN}✅ Server setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Upload your application code to: $APP_DIR"
echo "2. Update the .env file with your production settings"
echo "3. Run: cd $APP_DIR/server && npm install && npm run build && npm run migrate"
echo "4. Run: cd $APP_DIR/shadcn-ui && npm install && npm run build"
echo "5. Start the application: pm2 start $APP_DIR/server/ecosystem.config.js"
echo "6. Get SSL certificate: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo -e "${GREEN}🎉 Deployment script completed successfully!${NC}"
