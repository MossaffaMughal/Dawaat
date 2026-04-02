# Deployment Instructions for Vercel

## Prerequisites

- GitHub account (push your code here)
- Vercel account
- PostgreSQL database (e.g., AWS RDS, Supabase, Railway)

## Step 1: Prepare Your Repository

1. Initialize Git in your project root:

   ```bash
   git init
   cd Dawaat
   ```

2. Create a `.gitignore` file:

   ```
   node_modules/
   .env
   .env.local
   dist/
   build/
   ```

3. Create a root `package.json` for workspace management (optional but recommended):

   ```bash
   npm init -y
   ```

4. Commit and push to GitHub

## Step 2: Deploy Backend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Framework**: Other
   - **Build Command**: `npm install && npm run migrate`
   - **Environment Variables**: Add all from `.env`

5. Deploy and note the backend URL (e.g., `https://dawaat-api.vercel.app`)

## Step 3: Deploy Frontend to Vercel

1. Create a new Vercel project
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Environment Variables**:
     - `REACT_APP_API_URL`: Your backend URL from Step 2

3. Deploy

## Step 4: Database Setup

1. Create a PostgreSQL database (Supabase, Railway, or AWS RDS)
2. Get connection string
3. Add to backend environment variables on Vercel:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

## Step 5: Run Migrations

After setting up the database:

1. Go to Vercel project settings
2. Open terminal
3. Run migrations (this may be automatic on first deploy)

## Important Notes

- Keep `.env` files OUT of git (they contain sensitive info)
- Use Vercel environment variables for all secrets
- Test locally before deploying
- Admin emails must be verified in your system
- Set up CORS in backend for your frontend domain

## Vercel Pricing

- Frontend: Free tier available
- Backend: May need paid tier for database connections
- Database: Use managed services like Supabase (free tier available)

## Monitoring

Monitor your deployments via Vercel dashboard:

- Build logs
- Runtime errors
- Performance metrics

## Updates

To deploy updates:

1. Push changes to GitHub
2. Vercel automatically redeploys
3. Or manually redeploy from Vercel dashboard
