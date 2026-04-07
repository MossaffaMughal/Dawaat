# Vercel Backend Environment Variables Setup

## Critical for CORS to work at production (https://dawaat-backend.vercel.app):

Add these to your Vercel project environment variables:

### Frontend Domain

```
FRONTEND_URL=https://www.dawaat.pk
```

Or alternatively (comma-separated):

```
FRONTEND_URL=https://dawaat.pk,https://www.dawaat.pk
```

### How to set on Vercel:

1. Go to https://vercel.com/dashboard
2. Select your **backend** project
3. Click **Settings** → **Environment Variables**
4. Add the variables above
5. Redeploy (Settings → Deployments → Redeploy)

### Database Variables (keep existing)

- DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SECRET_KEY

### The Backend Now Automatically Supports:

- ✅ https://www.dawaat.pk (hardcoded production domain)
- ✅ https://dawaat.pk (hardcoded production domain)
- ✅ https://localhost:3000 (local dev)
- ✅ https://dawaat-frontend-\*.vercel.app (Vercel preview deployments)
- ✅ Any domains in FRONTEND_URL or CORS_ORIGIN env vars

## Testing After Deploy:

Check Vercel logs to see:

- `[CORS] ✅ Origin ALLOWED` = working
- `[CORS] ❌ Origin BLOCKED` = will also show why it was rejected

Go to: Settings → Deployments → [Latest] → Logs
