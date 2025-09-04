# Coordinator Role Implementation

This document outlines the implementation of the Coordinator role in the Al-Syed Affiliate System.

## Overview

The Coordinator role has been added as a third role alongside Admin and Affiliate, with specific features and restrictions designed to manage a subset of affiliates.

## Database Changes

### 1. Users Table Updates
- **Role Column**: Extended to support `'coordinator'` role
- **Coordinator ID**: Added `coordinator_id` column (nullable foreign key to users.id)
- **Indexes**: Added performance indexes for `coordinator_id` and `role` columns

### 2. Migration
- Migration file: `server/src/database/migrate-coordinator.ts`
- Run with: `npx ts-node src/database/migrate-coordinator.ts`

## Authentication & Authorization

### 1. Updated Middleware
- Added `requireCoordinator` middleware in `server/src/middleware/auth.ts`
- Supports both coordinator and admin roles for coordinator routes

### 2. Role-Based Access Control
- Coordinators can only access their assigned affiliates
- All queries are filtered by `coordinator_id` for coordinators
- Admins retain full access to all data

## Coordinator Features

### 1. Dashboard (`/api/coordinator/dashboard`)
- **Overview Stats**: Shows only data for assigned affiliates
  - Total affiliates assigned
  - Active affiliates
  - Total commissions generated
  - Pending commissions
  - Total referrals

### 2. Affiliate Management (`/api/coordinator/affiliates`)
- **View Affiliates**: List only affiliates assigned to the coordinator
- **Affiliate Details**: View detailed information for assigned affiliates
- **Status Management**: Activate/deactivate assigned affiliates
- **Assignment**: Assign/remove affiliates (admin functionality)

### 3. Referrals (`/api/coordinator/referrals`)
- **Referral List**: View referrals made by assigned affiliates
- **Filtered Data**: Only shows referrals from coordinator's network

### 4. Payments (`/api/coordinator/payments`)
- **Payment History**: View payments related to assigned affiliates
- **Commission Tracking**: Monitor commission payments for network

### 5. Commissions (`/api/coordinator/commissions`)
- **Commission Overview**: View commissions earned by assigned affiliates
- **Status Tracking**: Monitor pending/paid commissions

### 6. Email Referrals (`/api/coordinator/email-referrals`)
- **Send Referrals**: Send referral emails to potential clients
- **Referral Tracking**: Monitor email referral performance
- **Own Referral Key**: Access to coordinator's personal referral code

## Role Restrictions

### Coordinators CAN:
- ✅ View & manage only assigned affiliates (`affiliates.coordinator_id = logged_in_coordinator.id`)
- ✅ Add clients under assigned affiliates
- ✅ Share their own referral key
- ✅ Activate/deactivate assigned affiliates
- ✅ Send email referrals
- ✅ View commissions and payments for their network

### Coordinators CANNOT:
- ❌ See affiliates or clients belonging to other coordinators
- ❌ Access global settings (admin only)
- ❌ Manage other coordinators
- ❌ Access admin-only features

### Admins:
- ✅ Retain full access to all data
- ✅ Can assign/remove affiliates from coordinators
- ✅ Can manage all coordinators

## API Endpoints

### Coordinator Routes (`/api/coordinator/`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/dashboard` | Coordinator dashboard overview | Coordinator |
| GET | `/affiliates` | List assigned affiliates | Coordinator |
| GET | `/affiliates/:id` | Get affiliate details | Coordinator |
| PATCH | `/affiliates/:id/status` | Update affiliate status | Coordinator |
| GET | `/referrals` | List referrals from network | Coordinator |
| GET | `/payments` | List payments for network | Coordinator |
| GET | `/commissions` | List commissions for network | Coordinator |
| POST | `/email-referrals` | Send email referral | Coordinator |
| GET | `/email-referrals` | List sent email referrals | Coordinator |
| GET | `/referral-key` | Get coordinator's referral key | Coordinator |
| POST | `/affiliates/:id/assign` | Assign affiliate to coordinator | Coordinator/Admin |
| DELETE | `/affiliates/:id/assign` | Remove affiliate from coordinator | Coordinator/Admin |

## Seeded Coordinators

Three coordinators have been created with the following credentials:

| Name | Email | Password | Referral Code |
|------|-------|----------|---------------|
| Hadi | hadi@coordinator.com | coordinator123 | 0F8BCKA0 |
| Nouman | nouman@coordinator.com | coordinator123 | OK9U49AN |
| Naveed | naveed@coordinator.com | coordinator123 | 62QCMC4H |

## Implementation Files

### Backend Files Created/Modified:
- `server/src/database/migrate-coordinator.ts` - Database migration
- `server/src/database/seed-coordinators.ts` - Coordinator seeding
- `server/src/controllers/coordinatorController.ts` - Coordinator controller
- `server/src/routes/coordinator.ts` - Coordinator routes
- `server/src/models/User.ts` - Updated with coordinator methods
- `server/src/models/Commission.ts` - Added coordinator-specific methods
- `server/src/models/EmailReferral.ts` - Updated for coordinator use
- `server/src/middleware/auth.ts` - Added coordinator middleware
- `server/src/middleware/validation.ts` - Updated validation schemas
- `server/src/index.ts` - Added coordinator routes

## Usage Examples

### 1. Login as Coordinator
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "hadi@coordinator.com", "password": "coordinator123"}'
```

### 2. Get Coordinator Dashboard
```bash
curl -X GET http://localhost:3001/api/coordinator/dashboard \
  -H "Authorization: Bearer <coordinator_token>"
```

### 3. List Assigned Affiliates
```bash
curl -X GET http://localhost:3001/api/coordinator/affiliates \
  -H "Authorization: Bearer <coordinator_token>"
```

### 4. Send Email Referral
```bash
curl -X POST http://localhost:3001/api/coordinator/email-referrals \
  -H "Authorization: Bearer <coordinator_token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "client@example.com", "name": "John Doe", "message": "Join our affiliate program!"}'
```

## Security Considerations

1. **Data Isolation**: Coordinators can only access data for their assigned affiliates
2. **Role Validation**: All coordinator routes validate the user's role
3. **Affiliate Assignment**: Only admins can assign/remove affiliates from coordinators
4. **Token Security**: JWT tokens include role information for authorization

## Future Enhancements

1. **Frontend Implementation**: Create coordinator dashboard UI
2. **Advanced Analytics**: Add more detailed reporting for coordinators
3. **Notification System**: Implement notifications for coordinator activities
4. **Bulk Operations**: Add bulk affiliate management features
5. **Performance Metrics**: Add coordinator performance tracking

## Testing

To test the coordinator functionality:

1. Run the migration: `npx ts-node src/database/migrate-coordinator.ts`
2. Seed coordinators: `npx ts-node src/database/seed-coordinators.ts`
3. Start the server: `npm run dev`
4. Use the API endpoints with coordinator credentials

The implementation maintains consistency with the existing design patterns and follows the same security and validation principles used throughout the application.
