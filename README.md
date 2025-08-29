# 3-Level Affiliate System

A complete affiliate marketing system with React frontend and Node.js backend supporting 3-level commission tracking.

## 🚀 Features

### Frontend (React + TypeScript + TailwindCSS)
- ✅ **Authentication System** - Login/Register with JWT
- ✅ **Affiliate Dashboard** - Comprehensive analytics and stats
- ✅ **Admin Panel** - Complete management interface
- ✅ **3-Level Commission Tracking** - Visual representation of referral tree
- ✅ **Referral Link Management** - Generate and track custom links
- ✅ **Email Invite System** - Send invitations directly from dashboard
- ✅ **Real-time Stats** - Earnings, conversions, tier progress
- ✅ **Responsive Design** - Works on all devices

### Backend (Node.js + Express + PostgreSQL)
- ✅ **RESTful API** - Complete API for all operations
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **PostgreSQL Database** - Robust relational database
- ✅ **3-Level Commission Logic** - Automatic commission calculation
- ✅ **Transaction Tracking** - Complete purchase attribution
- ✅ **Admin Management** - Bulk operations and reporting
- ✅ **Email Integration Ready** - SMTP configuration support
- ✅ **Rate Limiting** - API protection and security

## 📁 Project Structure

```
/
├── shadcn-ui/          # React Frontend
│   ├── src/
│   │   ├── components/ # UI Components
│   │   ├── pages/      # Page Components  
│   │   ├── services/   # API Services
│   │   ├── contexts/   # React Context
│   │   └── types/      # TypeScript Types
│   └── package.json
├── server/             # Node.js Backend
│   ├── src/
│   │   ├── controllers/# Route Handlers
│   │   ├── models/     # Database Models
│   │   ├── routes/     # API Routes
│   │   ├── middleware/ # Auth & Validation
│   │   └── database/   # DB Setup & Migrations
│   └── package.json
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL 13+

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb affiliate_system

# Or using psql
psql -U postgres
CREATE DATABASE affiliate_system;
```

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migrate

# Seed with test data (optional)
npm run seed

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd shadcn-ui

# Install dependencies  
pnpm install

# Start frontend development server
pnpm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 👥 Test Credentials

After running `npm run seed` in the server directory:

### Admin Account
- **Email**: admin@affiliate.com
- **Password**: admin123

### Affiliate Accounts
- **Email**: john@example.com / **Password**: password123 / **Referral**: JOHN2024
- **Email**: sarah@example.com / **Password**: password123 / **Referral**: SARAH2024  
- **Email**: mike@example.com / **Password**: password123 / **Referral**: MIKE2024

## 🏗️ System Architecture

### Commission Structure
- **Level 1 (Direct)**: 15% commission
- **Level 2**: 5% commission  
- **Level 3**: 2.5% commission

### Tier System
- **Bronze**: $0 - $499 earnings
- **Silver**: $500 - $1,999 earnings
- **Gold**: $2,000 - $4,999 earnings
- **Platinum**: $5,000+ earnings

### Database Schema
- **users** - User accounts and referral relationships
- **affiliate_links** - Trackable referral links
- **transactions** - Purchase records with attribution
- **commissions** - Multi-level commission tracking
- **email_invites** - Email invitation tracking
- **bonuses** - Special rewards and bonuses

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token

### Affiliate Management  
- `GET /api/affiliate/dashboard` - Dashboard stats
- `POST /api/affiliate/links` - Generate referral link
- `GET /api/affiliate/links` - Get all referral links
- `POST /api/affiliate/email-invite` - Send email invite
- `GET /api/affiliate/referral-tree` - Get referral hierarchy

### Transaction Processing
- `POST /api/transaction/record` - Record new transaction (public)
- `GET /api/transaction/affiliate` - Get affiliate transactions

### Admin Operations
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/affiliates` - List all affiliates
- `GET /api/admin/transactions` - List all transactions
- `POST /api/admin/commissions/approve` - Approve commissions
- `POST /api/admin/commissions/pay` - Mark commissions as paid

## 🚀 Production Deployment

### Environment Variables
Configure these in production:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secure-secret-key
NODE_ENV=production

# Email (optional)
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password

# Commission Rates
LEVEL_1_COMMISSION=15
LEVEL_2_COMMISSION=5  
LEVEL_3_COMMISSION=2.5
```

### Build for Production
```bash
# Backend
cd server
npm run build
npm start

# Frontend  
cd shadcn-ui
pnpm run build
# Deploy dist/ folder to your hosting provider
```

## 📊 Key Features Implemented

1. **Multi-Level Affiliate System** - Complete 3-level referral tracking
2. **Automated Commission Calculation** - Real-time commission processing  
3. **Comprehensive Analytics** - Detailed stats and reporting
4. **Referral Link Management** - Custom link generation and tracking
5. **Email Invite System** - Built-in invitation functionality
6. **Admin Management Panel** - Complete administrative controls
7. **Tier-Based Rewards** - Progressive affiliate tier system
8. **Transaction Attribution** - Accurate referral tracking
9. **Real-time Dashboard** - Live stats and performance metrics
10. **Secure Authentication** - JWT-based security system

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS + Shadcn/UI
- React Query for state management
- Axios for API calls
- React Hook Form for forms
- Recharts for data visualization

### Backend  
- Node.js + Express.js
- PostgreSQL with native driver
- JWT authentication
- Bcrypt password hashing
- Joi validation
- Rate limiting and security headers

### DevOps Ready
- Environment configuration
- Database migrations
- Seed data for testing
- Error handling and logging
- CORS and security middleware
- API rate limiting

This is a production-ready affiliate system that can handle real-world traffic and transactions!