# 3-Level Affiliate + Email Referral System - System Design

## Implementation Approach

We will implement a comprehensive affiliate marketing system using Laravel 10+ with a service-oriented architecture. The system addresses several complex challenges:

**Difficult Points & Solutions:**
1. **Multi-level Commission Tracking**: Implement recursive affiliate relationship tracking with level-based commission calculations using a self-referential affiliate table structure
2. **Real-time Odoo Integration**: Use webhook-based synchronization with HMAC verification for secure invoice processing and commission calculations
3. **Email Lead Attribution**: Implement cookie-based tracking with 60-day attribution windows and double opt-in confirmation flows
4. **Fraud Prevention**: Deploy multiple validation layers including self-referral detection, duplicate transaction prevention, and suspicious activity monitoring
5. **Scalable Queue Processing**: Use Redis-backed queue system for handling email campaigns, commission calculations, and third-party API calls
6. **Complex Business Logic**: Separate business logic into dedicated service classes for commission calculations, lead management, and tier evaluations

**Framework Selection:**
- **Laravel 10+**: Provides robust ORM, queue system, authentication, and API capabilities
- **MySQL 8**: Supports JSON columns, advanced indexing, and UUID functions for scalable data architecture
- **Redis**: High-performance caching and queue backend for real-time operations
- **Tailwind CSS + Blade**: Responsive UI framework with server-side rendering for optimal performance
- **Chart.js**: Lightweight charting library for affiliate dashboards and analytics

**Architecture Patterns:**
- **Service Layer Pattern**: Business logic encapsulated in dedicated service classes
- **Repository Pattern**: Data access abstraction for testability and maintainability
- **Observer Pattern**: Event-driven architecture for automated workflows
- **Queue Pattern**: Asynchronous processing for email delivery and external API calls
- **Middleware Pattern**: Request filtering for authentication, rate limiting, and security

## Data Structures and Interfaces

The system follows a domain-driven design with clear separation between entities, value objects, and services. All monetary calculations use precise decimal types, and UUIDs ensure scalable primary keys across distributed environments.

## Program Call Flow

The system implements multiple workflows including affiliate registration, commission calculation, lead management, and administrative operations. Each workflow follows a clear request-response pattern with proper error handling and transaction management.

## Database Design

### Core Tables Structure

**users**: Primary authentication and user management
- Supports multiple user roles (admin, affiliate, customer)
- Integration with Laravel's built-in authentication system
- Soft deletes for data retention compliance

**profiles**: Extended user information and preferences  
- UUID-based primary key for distributed architecture
- Flexible JSON metadata storage for future extensibility
- Relationship tracking for user preferences and settings

**affiliates**: Central affiliate management and hierarchy
- Self-referential structure supporting unlimited depth
- Level-based tracking with commission calculation optimization
- Performance metrics caching for dashboard efficiency

**sales**: Transaction tracking and commission attribution
- Unique Odoo invoice integration with duplicate prevention
- Status tracking for payment and refund processing
- Customer email integration for lead conversion tracking

**commission_transactions**: Multi-level commission management
- Supports three-level commission structure (L1/L2/L3)
- Payment status tracking with audit trail
- Rollback capabilities for refund processing

**email_leads**: Lead capture and conversion tracking
- Double opt-in confirmation workflow
- Expiration-based attribution windows
- Consent management and GDPR compliance

**lead_events**: Comprehensive lead activity tracking
- Event-sourcing pattern for complete audit trail
- Flexible metadata storage for campaign analytics
- Integration points for email marketing automation

**affiliate_tiers**: Tier-based bonus and benefit system
- Configurable milestone and performance thresholds
- Dynamic commission boost calculations
- Priority payout and benefit management

**affiliate_monthly_stats**: Performance aggregation and reporting
- Monthly performance snapshots for tier evaluation
- Bonus calculation and payout management
- Historical trending and analytics support

**bonus_transactions**: Tier-based reward management
- Multiple bonus types (milestone, streak, conversion)
- Separate tracking from standard commissions
- Administrative approval and payout workflows

### Indexing Strategy

**Performance Optimization:**
- Composite indexes on frequently queried combinations (affiliate_id + status, period + affiliate_id)
- Foreign key indexes for join optimization
- Unique constraints for business rule enforcement
- JSON indexing for metadata queries where supported

**Query Optimization:**
- Covering indexes for dashboard summary queries
- Partial indexes for active records only
- Date-based partitioning considerations for historical data
- Full-text indexing for search functionality

## API Architecture

### RESTful API Design

**Authentication Layer:**
- Laravel Sanctum for stateless API authentication
- Role-based access control with middleware
- API rate limiting and throttling
- CORS configuration for frontend integration

**Endpoint Structure:**
- Versioned API endpoints (/api/v1/)
- Resource-based URL patterns
- Consistent HTTP status codes and error responses
- JSON:API specification compliance for complex relationships

**Security Implementation:**
- HMAC signature verification for webhooks
- Input validation and sanitization
- SQL injection prevention through ORM
- XSS protection with output encoding

### Webhook Architecture

**Odoo Integration:**
- Secure webhook endpoint with HMAC verification
- Idempotent processing for duplicate webhook handling
- Transaction rollback capabilities for failed processing
- Comprehensive logging and monitoring

**Event Processing:**
- Queue-based webhook processing for reliability
- Dead letter queue for failed webhook handling
- Exponential backoff for retry logic
- Webhook signature validation and IP whitelisting

## Service Layer Architecture

### CommissionService

**Responsibilities:**
- Multi-level commission calculation with configurable rates
- Transaction creation and management
- Refund and reversal processing
- Fraud detection and validation

**Key Methods:**
- `calculateForInvoice()`: Processes Odoo invoice data and calculates commissions
- `createTransactions()`: Creates commission records for all applicable levels
- `reverseForInvoice()`: Handles refund scenarios with proper reversals
- `validateTransaction()`: Implements fraud detection rules

### LeadService  

**Responsibilities:**
- Email lead capture and validation
- Double opt-in confirmation workflow
- Attribution window management
- Conversion tracking and affiliate matching

**Key Methods:**
- `inviteLead()`: Creates new lead with consent validation
- `confirmLead()`: Processes opt-in confirmations
- `matchLeadToInvoice()`: Attributes conversions to affiliates
- `expireLeads()`: Manages attribution window expiration

### OdooClient

**Responsibilities:**
- Bidirectional Odoo API integration
- Webhook payload processing
- Invoice data synchronization
- Error handling and retry logic

**Key Methods:**
- `fetchInvoice()`: Retrieves invoice data from Odoo
- `processWebhook()`: Handles incoming webhook notifications
- `verifySignature()`: Validates webhook authenticity
- `syncRecentInvoices()`: Batch synchronization for reliability

## Queue System Design

### Job Categories

**Email Processing:**
- Lead invitation emails with personalization
- Commission payout notifications
- Monthly performance reports
- Tier achievement celebrations

**Data Processing:**
- Commission calculation jobs for complex hierarchies  
- Monthly tier evaluation and bonus calculation
- Lead expiration and cleanup tasks
- Performance metric aggregation

**External Integration:**
- Odoo invoice synchronization jobs
- Webhook retry processing for failed requests
- Third-party email service integration
- Analytics data export and reporting

### Queue Configuration

**Performance Optimization:**
- Redis-backed queue for high throughput
- Multiple queue workers for parallel processing
- Priority-based job processing
- Failed job handling with exponential backoff

**Reliability Features:**
- Job timeout configuration for long-running tasks
- Dead letter queue for permanent failures
- Job progress tracking and monitoring
- Automatic retry with configurable attempts

## Security Architecture

### Authentication & Authorization

**Multi-layer Security:**
- Laravel Breeze for web authentication
- Sanctum for API token management
- Role-based access control (RBAC)
- Session security with CSRF protection

**Access Control Implementation:**
- Middleware-based route protection
- Resource-based authorization policies
- API endpoint rate limiting
- Administrative privilege escalation controls

### Fraud Prevention

**Detection Mechanisms:**
- Self-referral detection through email matching
- Duplicate transaction prevention via unique constraints
- Suspicious activity pattern recognition
- Manual review flags for high-risk transactions

**Security Monitoring:**
- Comprehensive audit logging for all financial transactions
- Real-time fraud scoring for new affiliates
- IP-based access control and geolocation validation
- Automated alerts for unusual activity patterns

### Data Protection

**Privacy Compliance:**
- GDPR-compliant data handling and consent management
- Right to deletion with proper data anonymization
- Data encryption at rest and in transit
- Access logging and audit trail maintenance

**System Security:**
- SQL injection prevention through parameterized queries
- XSS protection with output encoding
- CSRF token validation for state-changing operations
- Secure session management with proper timeout

## Scalability Considerations

### Database Optimization

**Performance Strategies:**
- Read replica configuration for reporting queries
- Database connection pooling for efficient resource usage
- Query optimization with proper indexing
- Data archival strategy for historical records

**Scaling Architecture:**
- Horizontal scaling support with UUID-based keys
- Database sharding considerations for multi-tenant architecture
- Caching layer with Redis for frequently accessed data
- CDN integration for static asset delivery

### Application Scaling

**Infrastructure Design:**
- Load balancer configuration for multi-server deployment
- Stateless application design for horizontal scaling
- Queue worker scaling based on job volume
- Auto-scaling policies for traffic spikes

**Caching Strategy:**
- Redis-based caching for database query results
- Application-level caching for computed values
- HTTP caching headers for API responses
- Cache invalidation strategies for data consistency

## Integration Patterns

### Odoo Integration

**Synchronization Methods:**
- Real-time webhook processing for immediate updates
- Batch synchronization for data consistency checks
- Error handling with manual reconciliation capabilities
- Data validation and transformation layers

**Security Implementation:**
- HMAC signature verification for webhook authenticity
- IP whitelisting for additional security
- Encrypted API credentials storage
- Request logging and monitoring

### Email Service Integration

**Delivery Architecture:**
- Multiple email provider support (Mailgun, SendGrid, SES)
- Queue-based delivery for reliability
- Bounce and complaint handling
- Template management and personalization

**Compliance Features:**
- Unsubscribe link management
- Double opt-in confirmation workflows
- Email preference management
- Delivery tracking and analytics

## Deployment Architecture

### Infrastructure Requirements

**Server Specifications:**
- Multi-server setup with load balancing
- Dedicated database server with replication
- Redis server for caching and queues  
- SSL termination and security hardening

**Monitoring & Logging:**
- Application performance monitoring (APM)
- Database performance tracking
- Queue job monitoring and alerting
- Security event logging and analysis

### Development Workflow

**Environment Management:**
- Local development with Docker containers
- Staging environment for testing
- Production deployment with zero-downtime
- Database migration and rollback procedures

**Quality Assurance:**
- Automated testing with PHPUnit
- Code quality analysis with static analyzers
- Security scanning and vulnerability assessment
- Performance testing and load testing

## Anything UNCLEAR

**Clarifications Needed:**

1. **Odoo Customization Scope**: The PRD mentions custom fields in Odoo (`x_affiliate_key`, `x_discount_applied`). Need clarification on:
   - Odoo version and edition (Community vs Enterprise)
   - Existing customization capabilities and limitations
   - API access levels and permissions required

2. **Email Lead Attribution Logic**: Need clarification on edge cases:
   - How to handle multiple affiliates claiming the same lead
   - Priority rules when both referral key and email lead attribution apply
   - Handling of expired leads that convert after the attribution window

3. **Commission Calculation Edge Cases**: 
   - How to handle partial refunds and their impact on commissions
   - Commission calculation when invoices are modified after initial processing
   - Handling of currency conversion if operating in multiple currencies

4. **Tier Evaluation Timing**:
   - Exact timing for monthly tier evaluation (beginning, middle, or end of month)
   - How to handle affiliates who join mid-month
   - Retroactive tier adjustments and their impact on existing commissions

5. **Data Retention and Compliance**:
   - Data retention periods for different types of records
   - GDPR compliance requirements for EU affiliates/customers
   - Right to deletion and its impact on financial records and audit trails

6. **Performance and Scale Expectations**:
   - Expected number of concurrent users and transaction volume
   - Peak load scenarios and performance requirements
   - Geographic distribution and latency requirements

**Recommendations for Resolution:**

1. **Stakeholder Workshops**: Conduct sessions with business stakeholders to clarify business rules and edge cases
2. **Technical Discovery**: Perform technical assessment of existing Odoo installation and API capabilities  
3. **Prototype Development**: Build small-scale prototypes to validate integration patterns
4. **Compliance Review**: Engage legal team for data protection and financial compliance requirements
5. **Performance Testing**: Establish benchmarks and performance criteria early in development

These clarifications should be addressed during the requirements refinement phase to ensure successful system implementation.