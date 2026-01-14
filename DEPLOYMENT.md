# FemmeLux Beauty - Professional Deployment Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Setup](#environment-setup)
3. [Database Management](#database-management)
4. [Image Storage (Cloudinary)](#image-storage-cloudinary)
5. [Error Monitoring (Sentry)](#error-monitoring-sentry)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Staging Environment](#staging-environment)
8. [Railway Deployment](#railway-deployment)
9. [Production Checklist](#production-checklist)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Web App    │    │  Admin App   │    │   Backend    │       │
│  │  (Next.js)   │    │  (Next.js)   │    │  (Express)   │       │
│  │   Vercel     │    │   Vercel     │    │   Railway    │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │   PostgreSQL    │                          │
│                    │    Railway      │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │                │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐         │
│  │ Cloudinary  │    │   Sentry    │    │   Redis     │         │
│  │   (Images)  │    │  (Errors)   │    │  (Cache)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Service | Platform | Purpose |
|---------|----------|---------|
| Admin Panel | Vercel | Admin dashboard |
| Web Storefront | Vercel | Customer-facing store |
| Backend API | Railway | Express API server |
| PostgreSQL | Railway | Primary database |
| Cloudinary | Cloudinary | Image CDN & storage |
| Sentry | Sentry | Error monitoring |

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the backend directory:

```bash
# Server
NODE_ENV=production
PORT=4000

# Database (Railway provides this)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets (generate secure random strings - min 32 chars)
JWT_SECRET=your-64-character-minimum-secret-key-here-generate-randomly
JWT_REFRESH_SECRET=another-64-character-minimum-secret-key-generate-randomly
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (comma-separated origins)
CORS_ORIGIN=https://femmelux.com,https://admin.femmelux.com

# Cloudinary (REQUIRED for production)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Sentry (RECOMMENDED for production)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Redis (optional, for caching)
REDIS_URL=redis://user:password@host:port
```

### Generating Secure Secrets

```bash
# Generate JWT secrets (run twice, once for each secret)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Management

### CRITICAL: No Auto-Migrations in Production

The application does **NOT** run migrations or seeds automatically on startup.

**Why?** The previous setup ran `prisma db seed` on every deployment, which deleted ALL products, brands, and orders. This has been fixed.

### Initial Database Setup

**First time only** - after creating the Railway PostgreSQL database:

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create tables (use migrate, not db push)
npx prisma migrate deploy

# Seed with sample data (ONLY ONCE, and only for fresh databases)
npx prisma db seed
```

### Schema Changes Workflow

1. Make changes to `prisma/schema.prisma`
2. Create a migration locally:
   ```bash
   npx prisma migrate dev --name "describe_your_change"
   ```
3. Test the migration locally
4. Commit the migration files in `prisma/migrations/`
5. Push to GitHub
6. Apply to production:
   ```bash
   npx prisma migrate deploy
   ```

### Railway Database Backups

1. Go to Railway Dashboard → Your PostgreSQL service
2. Click "Settings" tab
3. Enable "Automated Backups"
4. Set backup frequency (recommended: daily)
5. Set retention period (recommended: 7+ days)

### Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database (CAUTION: overwrites existing data)
psql $DATABASE_URL < backup_20240115.sql
```

---

## Image Storage (Cloudinary)

### Why Cloudinary Instead of Base64?

| Aspect | Base64 in DB | Cloudinary |
|--------|--------------|------------|
| Database size | Bloated (10x larger) | Lean |
| Load time | Slow | Fast (CDN) |
| Mobile performance | Poor | Excellent |
| Bandwidth | Server-heavy | CDN-distributed |
| Auto-optimization | None | WebP, resize, etc. |
| Cost | DB storage cost | Free tier available |

### Setup Cloudinary

1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Copy credentials
3. Add to Railway environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ
   ```

### How It Works

- **With Cloudinary**: Images uploaded to CDN, URLs stored in database
- **Without Cloudinary**: Falls back to base64 (development only)

Images are automatically uploaded to Cloudinary when using:
- Bulk Image Search feature
- Product import
- Manual image assignment

### Cloudinary Free Tier

- 25 GB storage
- 25 GB monthly bandwidth
- Automatic image optimization
- Sufficient for ~50,000 product images

---

## Error Monitoring (Sentry)

### Setup Sentry

1. Create account at [sentry.io](https://sentry.io)
2. Create new project → Select "Node.js"
3. Copy the DSN
4. Add to Railway environment:
   ```
   SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
   ```

### What Gets Tracked

- Unhandled exceptions
- Unhandled promise rejections
- Server errors (5xx responses)
- Performance metrics

### What's NOT Tracked

- Client errors (4xx) - these are normal user/validation errors
- Development environment errors

### Viewing Errors

- Real-time alerts via email
- Stack traces with source context
- Environment and user info
- Performance dashboard

---

## CI/CD Pipeline

### GitHub Actions

The pipeline (`.github/workflows/ci.yml`) runs on every push:

```
Push to main/staging
        │
        ▼
┌───────────────┐
│  Lint & Type  │ ← Code quality checks
│    Check      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Build      │ ← Verify all apps build
│    Test       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Security    │ ← npm audit
│    Scan       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Deploy     │ ← Railway auto-deploys
└───────────────┘
```

### Branch Strategy

```
feature/* ──► PR ──► staging ──► main
                         │         │
                         ▼         ▼
                     Staging   Production
```

---

## Staging Environment

### Setting Up Railway Staging

1. **Create Staging Project**
   - Railway Dashboard → New Project
   - Name: `femmelux-staging`

2. **Add PostgreSQL**
   - Add PostgreSQL database to project
   - Separate from production database

3. **Connect GitHub**
   - Connect same repo
   - Set branch to `staging`

4. **Environment Variables**
   - Copy all from production
   - Change `NODE_ENV=staging`
   - Use staging database URL
   - Same Cloudinary (images go to same place)

5. **Domain Setup**
   - `api-staging.femmelux.com`
   - `staging.femmelux.com`

### Testing Flow

1. Create feature branch from `main`
2. Develop locally
3. Push to `staging` branch
4. Test on staging environment
5. Create PR to `main`
6. Merge → auto-deploys to production

---

## Railway Deployment

### Backend Setup

1. **Create Project**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select `femmelux-beauty` repo

2. **Configure Service**
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`

3. **Add PostgreSQL**
   - Click "+ New" → Database → PostgreSQL
   - Copy `DATABASE_URL`

4. **Environment Variables**
   - Add all variables from Environment Setup section

### Important: railway.toml

The `backend/railway.toml` is configured to:
- NOT run migrations automatically
- NOT run seeds automatically
- Only build and start the server

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npx prisma generate && npm run build"

[deploy]
startCommand = "npm start"
```

---

## Production Checklist

### Before Launch

- [ ] All environment variables set in Railway
- [ ] Database backups enabled
- [ ] Cloudinary configured and tested
- [ ] Sentry configured and tested
- [ ] SSL certificates active (automatic)
- [ ] CORS origins correct (no wildcards)
- [ ] Rate limiting configured
- [ ] JWT secrets are unique and 64+ chars

### Monitoring

- [ ] Sentry alerts configured
- [ ] Railway metrics dashboard bookmarked
- [ ] UptimeRobot or similar for uptime monitoring
- [ ] Database size monitoring

### Security

- [ ] JWT secrets rotated periodically
- [ ] Database credentials secure
- [ ] 2FA on Railway, Vercel, GitHub accounts
- [ ] No sensitive data in git
- [ ] API rate limiting enabled

### Performance

- [ ] Images served from Cloudinary CDN
- [ ] Database indexes in place
- [ ] Redis caching (optional)
- [ ] Gzip compression enabled

---

## Troubleshooting

### Database Connection Failed
```bash
# Test connection
npx prisma db pull
```

### Cloudinary Upload Failed
- Verify all three credentials are correct
- Check cloud name matches your account
- Test with Cloudinary dashboard upload

### Sentry Not Receiving Errors
- Verify DSN is correct
- Check `NODE_ENV=production`
- Test: Add `throw new Error('test')` temporarily

### Images Not Loading
- Check Cloudinary dashboard for uploaded images
- Verify URLs in database are Cloudinary URLs (not base64)
- Check browser console for CORS errors

---

## Quick Reference

```bash
# Deploy (auto via git push)
git push origin main

# Run migrations manually
cd backend
npx prisma migrate deploy

# View database
npx prisma studio

# Check Railway logs
railway logs

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Generate secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Support Resources

- Railway: [docs.railway.app](https://docs.railway.app)
- Cloudinary: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- Sentry: [docs.sentry.io](https://docs.sentry.io)
- Prisma: [prisma.io/docs](https://prisma.io/docs)
