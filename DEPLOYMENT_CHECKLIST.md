# ✅ Deployment Checklist for Cloudways

## 📋 Pre-Deployment Preparation

### **1. Domain & DNS Setup**
- [ ] Domain name registered
- [ ] DNS A record pointing to Cloudways server IP
- [ ] DNS A record for www subdomain
- [ ] SSL certificate domain ready

### **2. Environment Configuration**
- [ ] Gmail App Password generated for SMTP
- [ ] JWT secret key generated (32+ characters)
- [ ] Database credentials prepared
- [ ] Production environment variables documented

### **3. Code Preparation**
- [ ] All code committed to Git repository
- [ ] No development dependencies in production
- [ ] Environment-specific configurations separated
- [ ] Build scripts tested locally

---

## 🚀 Cloudways Server Setup

### **1. Server Creation**
- [ ] Cloudways account created
- [ ] Server created (2GB+ RAM recommended)
- [ ] Node.js application selected
- [ ] Server location chosen (closest to users)

### **2. Server Access**
- [ ] SSH access configured
- [ ] Server credentials saved securely
- [ ] Firewall rules configured

---

## 🏗️ Application Deployment

### **1. System Dependencies**
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and configured
- [ ] Nginx installed and configured
- [ ] PM2 installed for process management
- [ ] Certbot installed for SSL

### **2. Database Setup**
- [ ] PostgreSQL database created
- [ ] Database user created with proper permissions
- [ ] Database connection tested
- [ ] Migrations run successfully
- [ ] Seed data loaded (if needed)

### **3. Backend Deployment**
- [ ] Code uploaded to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Environment variables configured
- [ ] Application built (`npm run build`)
- [ ] PM2 configuration created
- [ ] Application started with PM2
- [ ] Health check endpoint working

### **4. Frontend Deployment**
- [ ] Frontend built (`npm run build`)
- [ ] Build files uploaded to server
- [ ] Nginx configured to serve static files
- [ ] API proxy configuration working
- [ ] Frontend accessible via domain

### **5. SSL & Security**
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] HTTPS redirect configured
- [ ] Security headers added
- [ ] Firewall configured
- [ ] Database secured

---

## 🧪 Testing & Validation

### **1. Functionality Tests**
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Email verification works
- [ ] User login works
- [ ] Affiliate dashboard accessible
- [ ] Admin panel accessible
- [ ] Analytics dashboard working
- [ ] Email invites functional

### **2. Performance Tests**
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Database queries optimized
- [ ] Static files cached properly

### **3. Security Tests**
- [ ] HTTPS working correctly
- [ ] No sensitive data exposed
- [ ] Authentication working
- [ ] Authorization working
- [ ] Rate limiting active

---

## 📊 Monitoring & Maintenance

### **1. Monitoring Setup**
- [ ] PM2 monitoring configured
- [ ] Log rotation setup
- [ ] Error tracking configured
- [ ] Performance monitoring active

### **2. Backup Configuration**
- [ ] Database backup script created
- [ ] Application backup script created
- [ ] Backup cron job scheduled
- [ ] Backup restoration tested

### **3. Maintenance Tasks**
- [ ] SSL certificate auto-renewal
- [ ] System updates scheduled
- [ ] Log cleanup configured
- [ ] Performance monitoring alerts

---

## 🔧 Post-Deployment Configuration

### **1. Production Environment Variables**
```env
# Update these in your production .env file
DATABASE_URL=postgresql://affiliate_user:secure_password@localhost:5432/affiliate_system_prod
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
SMTP_PASS=your_gmail_app_password
```

### **2. Frontend API Configuration**
```typescript
// Update in shadcn-ui/src/services/api.ts
const API_BASE_URL = 'https://yourdomain.com/api';
```

### **3. Domain Configuration**
- [ ] Update all hardcoded localhost URLs
- [ ] Configure CORS for production domain
- [ ] Update email templates with production URLs

---

## 🚨 Troubleshooting Common Issues

### **Application Won't Start**
```bash
# Check PM2 logs
pm2 logs affiliate-backend

# Check for missing environment variables
pm2 env 0

# Restart application
pm2 restart affiliate-backend
```

### **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U affiliate_user -d affiliate_system_prod

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### **Nginx Issues**
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
curl -I https://yourdomain.com
```

---

## 📞 Support Commands

### **Useful Commands for Maintenance**
```bash
# Check application status
pm2 status
pm2 monit

# View application logs
pm2 logs affiliate-backend --lines 100

# Restart application
pm2 restart affiliate-backend

# Check system resources
htop
df -h
free -h

# Check database status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t
```

---

## ✅ Final Verification

### **Before Going Live**
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring active
- [ ] Backups working
- [ ] SSL certificate valid
- [ ] Domain resolving correctly
- [ ] Email functionality working
- [ ] Admin panel accessible
- [ ] Analytics dashboard functional

### **Go-Live Checklist**
- [ ] DNS propagation complete
- [ ] SSL certificate active
- [ ] Application responding correctly
- [ ] All features working
- [ ] Monitoring alerts configured
- [ ] Backup system tested
- [ ] Support documentation ready

---

## 🎯 Ready for Odoo Integration!

Once all items are checked, your affiliate system will be:
- ✅ **Production-ready** and fully functional
- ✅ **Secure** with SSL and proper authentication
- ✅ **Scalable** with PM2 and proper monitoring
- ✅ **Maintainable** with automated backups and updates
- ✅ **Ready for Odoo integration** with webhook endpoints prepared

Your affiliate system is now ready for the next phase of Odoo integration! 🚀
