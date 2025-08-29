# Project Summary
The project is a comprehensive 3-Level Affiliate Marketing System that allows users to manage affiliate registrations, track referrals, and handle commissions. It includes role-based access for Admins, Affiliates, and Clients, and provides features such as email invitations, bonus tracking, and real-time analytics.

# Project Module Description
- **Authentication**: Handles user login, registration, and role management.
- **Dashboard**: Displays user-specific metrics and referral tracking.
- **Email System**: Sends invitations and notifications to users.
- **Commission Management**: Tracks commission statuses and calculations.
- **Bonus System**: Manages tier-based rewards for affiliates.
- **Admin Panel**: Provides analytics and user management features.

# Directory Tree
```
shadcn-ui/
├── README.md                  # Project overview and setup instructions
├── components.json            # Component metadata
├── eslint.config.js           # ESLint configuration
├── index.html                 # Main HTML file
├── package.json               # Project dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── public/                    # Static assets
│   ├── favicon.svg            # Favicon for the application
│   └── robots.txt             # Robots.txt for SEO
├── src/                       # Source files
│   ├── App.css                # Global styles
│   ├── App.tsx                # Main application component
│   ├── components/            # Reusable UI components
│   ├── contexts/              # Context API for state management
│   ├── hooks/                 # Custom hooks
│   ├── pages/                 # Page components
│   ├── services/              # Mock data services
│   └── types/                 # TypeScript types
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.app.json          # TypeScript configuration for app
├── tsconfig.json              # Base TypeScript configuration
├── tsconfig.node.json         # TypeScript configuration for Node
└── vite.config.ts             # Vite configuration
```

# File Description Inventory
- **src/App.tsx**: Entry point of the application, integrates routing and layout.
- **src/components/**: Contains reusable UI components such as buttons, cards, and forms.
- **src/contexts/AuthContext.tsx**: Provides authentication context for user state management.
- **src/hooks/**: Custom hooks for mobile detection and toast notifications.
- **src/pages/**: Contains page components for authentication and dashboards.
- **src/services/mockData.ts**: Simulates backend data for testing and development.
- **src/types/index.ts**: Type definitions for users, commissions, and other entities.

# Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Linting**: ESLint
- **State Management**: Context API
- **Styling**: Tailwind CSS

# Usage
1. **Install Dependencies**: Run `pnpm install` to install project dependencies.
2. **Build Project**: Use `pnpm run build` to create a production build.
3. **Run Development Server**: Execute `pnpm run dev` to start the development server.
