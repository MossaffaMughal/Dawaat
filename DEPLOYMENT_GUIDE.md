# Deployment Guide - Dawaat E-Commerce Platform

**Status**: ✅ READY FOR PRODUCTION  
**Date**: April 1, 2026

---

## Pre-Deployment Checklist

### Backend

- [x] All 7 route modules configured
- [x] All 6 controllers implemented
- [x] Database migrations completed
- [x] Environment variables documented
- [x] Error handling implemented
- [x] CORS configured
- [x] Server startup verified (port 5000)

### Frontend

- [x] React app compiles without errors
- [x] All 3 context providers configured
- [x] All routes implemented
- [x] CSS styling complete
- [x] Responsive design verified
- [x] API client configured
- [x] Frontend loads successfully (port 3000)

### Database

- [x] 14 tables created
- [x] New columns added to existing tables
- [x] Constraints and foreign keys defined
- [x] Default settings initialized
- [x] Indexes created for performance

---

## Environment Variables & Configuration

### Backend (.env)

```
DATABASE_URL=postgresql://username:password@localhost:5432/dawaat
NODE_ENV=production
JWT_SECRET=your_secret_key_here
PORT=5000
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### Frontend (.env)

```
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

---

## Deployment Steps

### Option 1: Vercel (Recommended)

#### Backend Deployment (Vercel)

1. **Install Vercel CLI**:

```bash
npm install -g vercel
```

2. **Configure backend/vercel.json** (already exists):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

3. **Deploy**:

```bash
cd backend
vercel --prod
```

4. **Configure Environment Variables in Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` (PostgreSQL connection string)
   - Add `JWT_SECRET` (strong random string)
   - Set `NODE_ENV` = production

5. **Update Database Connection**:
   - Create PostgreSQL instance (AWS RDS, Neon, Supabase)
   - Update DATABASE_URL with production credentials
   - Run migrations on production database (if needed):
   ```bash
   npm run migrate
   ```

#### Frontend Deployment (Vercel)

1. **Configure frontend/.env.production**:

```
REACT_APP_API_URL=https://your-backend-api.vercel.app
```

2. **Deploy**:

```bash
cd frontend
vercel --prod
```

3. **Configure Vercel Project Settings**:
   - Set root directory: `frontend/`
   - Build command: `npm run build`
   - Output directory: `build`

---

### Option 2: Traditional Server (AWS EC2, DigitalOcean, Heroku)

#### Backend Setup

1. **Install Node.js** (v16+):

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PostgreSQL**:

```bash
sudo apt-get install postgresql postgresql-contrib
```

3. **Clone & Setup**:

```bash
git clone <your-repo>
cd Dawaat/backend
npm install
```

4. **Configure Environment**:

```bash
nano .env
# Add DATABASE_URL, JWT_SECRET, etc.
```

5. **Run Migrations**:

```bash
npm run migrate
```

6. **Start Server**:

```bash
npm start
# Or use PM2 for production:
npm install -g pm2
pm2 start src/server.js --name "dawaat-api"
pm2 save
pm2 startup
```

#### Frontend Setup

1. **Build**:

```bash
cd frontend
npm run build
```

2. **Serve with Nginx**:

```bash
sudo apt-get install nginx
sudo cp build/* /var/www/html/
sudo systemctl start nginx
```

3. **Configure Nginx for SPA routing**:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass https://your-backend-url;
    }
}
```

---

## Database Migration for Production

### PostgreSQL Setup (Cloud)

**Option A: AWS RDS**

1. Create RDS instance (PostgreSQL 13+)
2. Note connection string
3. Add to `.env`: `DATABASE_URL=postgresql://...`

**Option B: Supabase (Recommended)**

1. Create Supabase project
2. Get PostgreSQL connection string
3. Copy to DATABASE_URL

**Option C: Neon**

1. Create Neon project
2. Copy PostgreSQL URL
3. Add to environment variables

### Run Migrations

```bash
# Local testing
cd backend
npm run migrate

# Production (ensure DATABASE_URL is set)
DATABASE_URL=<production-db-url> npm run migrate
```

---

## SSL/HTTPS Configuration

### Let's Encrypt (if using traditional server)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
# Auto-renewal:
sudo systemctl enable certbot.timer
```

### Vercel (Automatic)

- HTTPS enabled by default
- Auto-renewing SSL certificates

---

## Domain Setup

### Update DNS Records

1. **A Record**: Points to your server IP

   ```
   dawaat.yourdomain.com  → Your Server IP
   api.yourdomain.com     → Your Backend IP/URL
   ```

2. **CNAME Record** (if using Vercel):
   ```
   frontend → cname.vercel-dns.com
   api      → cname.vercel-dns.com
   ```

### Update CORS in Backend

Update `src/server.js`:

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "https://yourdomain.com",
  credentials: true,
};
app.use(cors(corsOptions));
```

---

## Email Service Setup (Optional but Recommended)

### Password Reset Emails

**Option A: SendGrid**

1. Create SendGrid account
2. Get API key
3. Install package: `npm install @sendgrid/mail`
4. Update `userController.js`:

```javascript
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// In requestPasswordReset function:
const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
await sgMail.send({
  to: email,
  from: "noreply@yourdomain.com",
  subject: "Reset Your Password",
  html: `<a href="${resetLink}">Reset Password</a>`,
});
```

**Option B: AWS SES**
Similar implementation using AWS SDK

---

## Monitoring & Logging

### Backend Logging

Install Winston:

```bash
npm install winston
```

Update `src/server.js`:

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "dawaat-api" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Use: logger.info('Server started');
```

### Frontend Error Tracking

Consider: Sentry, LogRocket, or New Relic

---

## Performance Optimization

### Frontend

- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Code splitting enabled (built into Create React App)
- [ ] Minimize CSS/JS bundles
- [ ] Cache static assets

**Check frontend build**:

```bash
cd frontend
npm run build
npm install -g serve
serve -s build
```

### Backend

- [ ] Database query optimization (indexes already created)
- [ ] Redis caching (optional for future)
- [ ] Rate limiting (optional)
- [ ] Pagination for large result sets

---

## Security Hardening

### Backend Security

1. **Update Dependencies**:

```bash
npm audit
npm audit fix
```

2. **Add Rate Limiting**:

```bash
npm install express-rate-limit
```

3. **Add Helmet.js**:

```bash
npm install helmet
```

Update `src/server.js`:

```javascript
const helmet = require("helmet");
app.use(helmet());
```

4. **Validate Input**: Already implemented in controllers

5. **SQL Injection**: Already prevented (parameterized queries)

### Frontend Security

1. **XSS Prevention**: React auto-escapes by default
2. **CSRF Protection**: JWT in secure cookies
3. **Dependency Audit**:

```bash
npm audit
npm audit fix
```

### Database Security

1. **Backups**: Enable automated backups (AWS RDS, Supabase)
2. **Connection Security**: Use SSL connections
3. **User Permissions**: Limit database user privileges
4. **Encryption**: Enable at-rest encryption

---

## Testing in Production

### Smoke Tests

1. **Backend Health Check**:

```bash
curl https://api.yourdomain.com/api/health
```

2. **Frontend Load**:

```bash
curl https://yourdomain.com
```

3. **API Endpoint Tests**:

```bash
# Test search
curl https://api.yourdomain.com/api/products?search=journal

# Test shipping cost
curl https://api.yourdomain.com/api/orders/shipping/cost

# Test user profile (with token)
curl -H "Authorization: Bearer TOKEN" \
  https://api.yourdomain.com/api/users/profile/1
```

### User Acceptance Testing (UAT)

1. Register new user
2. Search products
3. Add to cart
4. Apply price filters
5. Add to wishlist
6. Complete guest checkout
7. Complete authenticated checkout
8. View profile
9. Change password
10. Admin: Edit shipping cost

---

## Post-Deployment Checklist

- [ ] All pages load without 404 errors
- [ ] Search functionality works
- [ ] Price filters work
- [ ] Wishlist adds/removes items
- [ ] Checkout processes orders for both guest and authenticated users
- [ ] Admin dashboard loads
- [ ] Admin can change shipping cost
- [ ] User profile page loads and edits work
- [ ] Password reset token generation works
- [ ] All API responses are valid JSON
- [ ] No console errors in browser DevTools
- [ ] Database backups are configured
- [ ] Monitoring/logging is active
- [ ] SSL certificate is valid
- [ ] CORS headers are correct

---

## Rollback Procedure

If issues occur:

1. **Backend Rollback**:

```bash
vercel rollback  # Vercel
# Or redeploy previous version
```

2. **Frontend Rollback**:

```bash
vercel --prod  # Deploy previous build
```

3. **Database Rollback**:

```bash
# Use backup/snapshot (should be set up before deployment)
```

---

## Monitoring & Maintenance

### Daily

- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Check database size

### Weekly

- [ ] Review user feedback
- [ ] Check dependency updates
- [ ] Verify backups successful

### Monthly

- [ ] Security audit
- [ ] Performance review
- [ ] Update dependencies

---

## Contact & Support

**Technical Issues**:

- Check `backend/error.log` for API errors
- Check browser DevTools Console for frontend errors
- Verify database connection
- Check environment variables

**User Issues**:

- Use contact form: `/contact` endpoint
- Review `contacts` table for submissions
- Email notifications (if email service set up)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Browser (User/Admin)                  │
├─────────────────────────────────────────────────┤
│        Frontend (React on Vercel/Nginx)         │
│  ├─ Home, Products, Cart, Checkout             │
│  ├─ Profile, Auth, Admin Dashboard             │
│  └─ Search, Filters, Wishlist UI               │
├─────────────────────────────────────────────────┤
│         Backend API (Node.js on Vercel)        │
│  ├─ /api/products (search, filters)            │
│  ├─ /api/orders (create, shipping)             │
│  ├─ /api/users (profile, password)             │
│  ├─ /api/wishlist (add, remove)                │
│  ├─ /api/auth (login, google oauth)            │
│  └─ /api/admin (settings, dashboard)           │
├─────────────────────────────────────────────────┤
│    PostgreSQL Database (AWS RDS/Supabase)      │
│  ├─ Users, Products, Orders, Reviews           │
│  ├─ Wishlist, Password Tokens, Settings        │
│  └─ Automatic Backups                          │
└─────────────────────────────────────────────────┘
```

---

## Production URLs

Once deployed:

- **Frontend**: https://yourdomain.com
- **Backend API**: https://api.yourdomain.com
- **Admin Dashboard**: https://yourdomain.com/admin

---

## Success Criteria

✅ All 8 features working in production  
✅ No console errors  
✅ Database responsive  
✅ API response time < 500ms  
✅ Zero 500 errors for 24 hours  
✅ Users can complete full purchase flow  
✅ Admin can manage shipping cost

---

## Questions or Issues?

Refer to:

- TEST_RESULTS.md - Testing summary
- E2E_TESTING_GUIDE.md - Feature testing details
- Backend README - API documentation
- Frontend README - Component documentation

---

**Deployment Guide Version**: 1.0  
**Last Updated**: April 1, 2026  
**Status**: READY FOR PRODUCTION DEPLOYMENT
