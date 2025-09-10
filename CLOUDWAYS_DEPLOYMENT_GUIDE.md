# 🚀 Cloudways Deployment Guide for Affiliate System

## 📋 Project Readiness Assessment

### ✅ **YES, Your Project is Ready for Deployment!**

Your affiliate system is production-ready with:
- ✅ **Complete Backend API** with all endpoints
- ✅ **Frontend React Application** with modern UI
- ✅ **Database Schema** with migrations
- ✅ **Authentication System** with JWT
- ✅ **Email System** with SMTP configuration
- ✅ **Analytics Dashboard** with real data
- ✅ **Commission System** fully functional
- ✅ **Admin Panel** with all management features

---

## 🏗️ Cloudways Deployment Steps

### **Step 1: Create Cloudways Account & Server**

1. **Sign up at [Cloudways.com](https://www.cloudways.com)**
2. **Create New Server:**
   - **Cloud Provider**: DigitalOcean, AWS, or Google Cloud
   - **Server Size**: 2GB RAM minimum (4GB recommended)
   - **Location**: Choose closest to your users
   - **Application**: Node.js
   - **Server Name**: `affiliate-system-prod`

### **Step 2: Server Configuration**

1. **Access Your Server via SSH:**
   ```bash
   ssh master@your-server-ip
   ```

2. **Install Required Software:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx (if not already installed)
   sudo apt install nginx -y
   ```

### **Step 3: Database Setup**

1. **Create PostgreSQL Database:**
   ```bash
   sudo -u postgres psql
   ```
   
   ```sql
   CREATE DATABASE affiliate_system_prod;
   CREATE USER affiliate_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE affiliate_system_prod TO affiliate_user;
   \q
   ```

2. **Configure PostgreSQL:**
   ```bash
   sudo nano /etc/postgresql/14/main/postgresql.conf
   ```
   
   Update these settings:
   ```conf
   listen_addresses = 'localhost'
   port = 5432
   ```
   
   ```bash
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   ```
   
   Add this line:
   ```conf
   local   all             affiliate_user                    md5
   ```
   
   ```bash
   sudo systemctl restart postgresql
   ```

### **Step 4: Deploy Backend Application**

1. **Create Application Directory:**
   ```bash
   mkdir -p /var/www/affiliate-system
   cd /var/www/affiliate-system
   ```

2. **Upload Your Code:**
   ```bash
   # Option 1: Using Git (Recommended)
   git clone https://github.com/your-username/affiliate-system.git .
   
   # Option 2: Using SCP/SFTP
   # Upload your project files to /var/www/affiliate-system
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install --production
   ```

4. **Create Production Environment File:**
   ```bash
   nano .env
   ```
   
   Add these production variables:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://affiliate_user:your_secure_password@localhost:5432/affiliate_system_prod
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=affiliate_system_prod
   DB_USER=affiliate_user
   DB_PASSWORD=your_secure_password
   
   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   
   # Commission Configuration
   LEVEL_1_COMMISSION=15
   LEVEL_2_COMMISSION=5
   LEVEL_3_COMMISSION=2.5
   
   # Company Email Configuration
   COMPANY_EMAIL=info@reffalplan.com
   COMPANY_NAME=ReffalPlan
   
   # SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=info@reffalplan.com
   SMTP_PASS=your_gmail_app_password
   FROM_EMAIL=info@reffalplan.com
   FROM_NAME=ReffalPlan Affiliate System
   ```

5. **Build and Run Database Migrations:**
   ```bash
   npm run build
   npm run migrate
   npm run seed
   ```

6. **Test Backend:**
   ```bash
   npm start
   # Test: curl http://localhost:3001/health
   ```

### **Step 5: Deploy Frontend Application**

1. **Build Frontend:**
   ```bash
   cd ../shadcn-ui
   npm install
   npm run build
   ```

2. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/affiliate-system
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       # Frontend (React App)
       location / {
           root /var/www/affiliate-system/shadcn-ui/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
           
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
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Static files caching
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **Enable Site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/affiliate-system /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### **Step 6: Process Management with PM2**

1. **Create PM2 Configuration:**
   ```bash
   cd /var/www/affiliate-system/server
   nano ecosystem.config.js
   ```
   
   Add this configuration:
   ```javascript
   module.exports = {
     apps: [{
       name: 'affiliate-backend',
       script: 'dist/index.js',
       cwd: '/var/www/affiliate-system/server',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       error_file: '/var/log/pm2/affiliate-backend-error.log',
       out_file: '/var/log/pm2/affiliate-backend-out.log',
       log_file: '/var/log/pm2/affiliate-backend.log'
     }]
   };
   ```

2. **Start Application with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### **Step 7: SSL Certificate (Let's Encrypt)**

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. **Get SSL Certificate:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### **Step 8: Domain Configuration**

1. **Point Your Domain to Cloudways:**
   - Add A record: `@` → `your-server-ip`
   - Add A record: `www` → `your-server-ip`

2. **Update Frontend API URL:**
   ```bash
   nano /var/www/affiliate-system/shadcn-ui/src/services/api.ts
   ```
   
   Change the API base URL:
   ```typescript
   const API_BASE_URL = 'https://yourdomain.com/api';
   ```

3. **Rebuild Frontend:**
   ```bash
   cd /var/www/affiliate-system/shadcn-ui
   npm run build
   ```

---

## 🔧 Post-Deployment Configuration

### **1. Security Hardening**

```bash
# Configure Firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3001

# Secure PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: ssl = on
sudo systemctl restart postgresql
```

### **2. Monitoring Setup**

```bash
# Install monitoring tools
sudo npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### **3. Backup Configuration**

```bash
# Create backup script
nano /home/master/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/master/backups"
DB_NAME="affiliate_system_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U affiliate_user $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/affiliate-system

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
chmod +x /home/master/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/master/backup.sh
```

---

## 🚀 Deployment Checklist

### **Pre-Deployment:**
- [ ] Domain name registered and configured
- [ ] Gmail App Password generated for SMTP
- [ ] Database credentials prepared
- [ ] JWT secret key generated (32+ characters)
- [ ] All environment variables documented

### **Deployment:**
- [ ] Cloudways server created and configured
- [ ] PostgreSQL database created
- [ ] Backend deployed and tested
- [ ] Frontend built and deployed
- [ ] Nginx configured
- [ ] PM2 process manager setup
- [ ] SSL certificate installed
- [ ] Domain DNS configured

### **Post-Deployment:**
- [ ] Application accessible via HTTPS
- [ ] Database migrations completed
- [ ] Test user accounts created
- [ ] Email functionality tested
- [ ] Analytics dashboard working
- [ ] Backup system configured
- [ ] Monitoring setup
- [ ] Security hardening completed

---

## 🔍 Testing Your Deployment

### **1. Health Checks:**
```bash
# Backend health
curl https://yourdomain.com/api/health

# Frontend accessibility
curl https://yourdomain.com
```

### **2. Test User Registration:**
1. Visit `https://yourdomain.com`
2. Register a new affiliate account
3. Check email verification
4. Test login functionality

### **3. Admin Panel Test:**
1. Login with admin credentials
2. Check analytics dashboard
3. Test commission management
4. Verify email invite functionality

---

## 📞 Support & Maintenance

### **Useful Commands:**
```bash
# Check application status
pm2 status

# View logs
pm2 logs affiliate-backend

# Restart application
pm2 restart affiliate-backend

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

### **Common Issues & Solutions:**

1. **Application won't start:**
   ```bash
   pm2 logs affiliate-backend
   # Check for missing environment variables or database connection issues
   ```

2. **Database connection errors:**
   ```bash
   sudo systemctl status postgresql
   # Ensure PostgreSQL is running and credentials are correct
   ```

3. **SSL certificate issues:**
   ```bash
   sudo certbot certificates
   # Check certificate status and renew if needed
   ```

---

## 🎯 Ready for Odoo Integration!

Once deployed, your affiliate system will be ready for Odoo integration. The system includes:
- ✅ **Webhook endpoints** ready for Odoo
- ✅ **Commission tracking** system
- ✅ **Transaction processing** capabilities
- ✅ **Email notification** system
- ✅ **Admin management** panel

Your production environment will be fully functional and ready for the next phase of Odoo integration! 🚀
