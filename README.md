# ExpenseBuddy

A full-stack family expense tracking application with authentication, family management, and secure data sharing.

## Features

- 🔐 **Email-based Authentication** - Registration, login, password reset, email verification
- 👨‍👩‍👧‍👦 **Multi-Family Support** - Create families, invite members, role-based access control
- 💰 **Expense Tracking** - Track purchases and family income with isolation between families
- 📧 **Email System** - Automated notifications for family invitations, password resets, email changes
- 🛡️ **Security** - JWT tokens, password hashing, token blacklisting, double email verification
- 📱 **Responsive UI** - Modern React interface built with BaseUI framework

## Prerequisites

- Docker & Docker Compose - [Installation Guide](https://docs.docker.com/get-docker/)
- Node.js 18+ - [Get latest version](https://nodejs.org/en/)
- Yarn - [Installation Guide](https://yarnpkg.com/getting-started/install)

## Quick Start

### 1. Clone project

```bash
git clone <repository-url>
cd ExpenseBuddy
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

**Edit `.env` file with your configuration** (see [Environment Variables](#environment-variables) section below for details)

### 3. Install dependencies (Development only)

For development without Docker:

```bash
cd packages/client && yarn
cd ../server && yarn
cd ../backup && yarn
cd ../..
```

### 4. Run the application

**Production mode (recommended):**

```bash
chmod +x start.sh
./start.sh --dev
```

**Development mode:**
```bash
# Start MongoDB and Redis
docker-compose up -d mongo redis

# Start server (in one terminal)
cd packages/server && yarn dev

# Start client (in another terminal)  
cd packages/client && yarn start
```

## Environment Variables

All configuration is done through environment variables in the `.env` file. Copy `.env.example` to `.env` and configure the following:

### Required Variables

#### 🔑 JWT Authentication (CRITICAL)
Generate secure random 32+ character strings:

```bash
# Generate JWT secrets (run these commands)
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_EMAIL_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

#### 📧 Email Configuration (REQUIRED)
**Option 1: Gmail SMTP (Recommended for development)**

1. **Get Gmail App Password:**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail" app

2. **Configure in .env:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587  
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

**Option 2: SendGrid (Recommended for production)**

1. **Get SendGrid API Key:**
   - Sign up at [SendGrid](https://sendgrid.com/)
   - Go to Settings → API Keys → Create API Key
   - Copy the API key

2. **Configure in .env:**
   ```
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=noreply@yourdomain.com
   ```

#### 🌐 API Layer Key (Optional)
For currency/location features:

1. **Get API Layer Key:**
   - Sign up at [API Layer](https://apilayer.com/)
   - Copy your API key

2. **Configure in .env:**
   ```
   REACT_APP_APILAYER_KEY=your-apilayer-key
   ```

### Auto-configured Variables
These are automatically set by Docker (no action required):

- `APP_CLIENT_PORT=3000` - Client port
- `APP_SERVER_PORT=8000` - Server port  
- `DATABASE_PORT=27017` - MongoDB port
- `CLIENT_URL=http://localhost:3000` - Frontend URL
- `APP_NAME=ExpenseBuddy` - Application name

## Architecture

- **Frontend:** React 18 + Apollo Client + BaseUI
- **Backend:** Node.js + GraphQL + Express
- **Database:** MongoDB + Redis (JWT blacklist)
- **Authentication:** JWT tokens + email verification
- **Email:** NodeMailer (Gmail/SendGrid support)
- **Deployment:** Docker + Docker Compose

## Application URLs

After running with `./start.sh --dev`:

- **Main App:** http://localhost:8080 (via nginx proxy)
- **Direct Frontend:** http://localhost:3000
- **GraphQL Playground:** http://localhost:8000/graphql
- **GraphQL via Proxy:** http://localhost:8080/graphql

## Development

### Scripts

```bash
# Start in development mode
./start.sh --dev

# Start in production mode
./start.sh

# View logs
docker-compose logs <container_name>

# Stop all services
docker-compose down
```

### Backup Service

Add `credentials.json` file to the `packages/backup` folder to work with Google Drive API.

## Authentication Flow

1. **Registration:** User registers with email + password
2. **Email Verification:** User receives email with verification link
3. **Family Setup:** User creates new family or joins existing one
4. **Family Dashboard:** Access to expense tracking and family management

## Security Features

- 🔐 **JWT tokens** with blacklist support
- 🛡️ **Password hashing** with bcrypt
- 📧 **Email verification** required for activation
- 🔄 **Password reset** with secure tokens
- 👥 **Role-based access** (Owner/Admin/Member)
- 🔒 **Data isolation** between families
- 📝 **Double email verification** for email changes

## Troubleshooting

### Common Issues

**"secretOrPrivateKey must have a value"**
- Make sure JWT secrets are properly set in `.env` and Docker Compose includes them

**"Redis client not initialized"**  
- This is handled gracefully - authentication works without Redis

**Email not sending**
- Check SMTP credentials and Gmail app password
- Verify email service is configured correctly

**Database connection failed**
- Make sure MongoDB container is running: `docker-compose up -d mongo`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`  
5. Submit a pull request

## Support

For questions or issues, please create a GitHub issue or contact the development team.

