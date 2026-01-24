# True Cost AI - Backend Deployment Plan

## Current Status ✅

The backend is **already configured** for Railway deployment:

- ✅ **railway.json** - Configured with Docker build context
- ✅ **backend/Dockerfile** - Python 3.11 with Gunicorn
- ✅ **backend/Procfile** - Gunicorn startup command
- ✅ **backend/reqs.txt** - All dependencies listed
- ✅ **Health Check** - `/api/health` endpoint ready

## Deployment Steps

### Step 1: Push to GitHub
```bash
# In the project root directory
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Connect to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `True-Cost-AI` repository

### Step 3: Configure Backend Service
1. In Railway dashboard, click "Add New Service"
2. Select "Backend"
3. Configure the following:

**Service Name:** `truecost-backend`

**Build Command:** (auto-detected from Dockerfile)

**Start Command:** (auto-detected from Procfile)

**Root Directory:** `backend`

### Step 4: Set Environment Variables
Add these variables in Railway dashboard under "Variables":

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET_KEY=your-super-secret-key-change-this

# Optional (for AI features)
GROQ_API_KEY=gsk_your_groq_api_key

# Email (optional)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Step 5: Set Up Database (PostgreSQL)
1. In Railway dashboard, click "Add New Service"
2. Select "Database" → "PostgreSQL"
3. A database will be created automatically
4. Copy the `DATABASE_URL` from the PostgreSQL service
5. Add it to your backend's environment variables

### Step 6: Deploy
1. Click "Deploy" on the backend service
2. Watch the deployment logs
3. Once deployed, you'll get a URL like: `https://truecost-backend.up.railway.app`

### Step 7: Verify Deployment
Visit the health check endpoint:
```
https://your-railway-url.up.railway.app/api/health
```

Should return:
```json
{"status": "healthy", "timestamp": 1234567890}
```

## Required Railway Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Yes |
| `GROQ_API_KEY` | For AI analysis features | No |
| `SMTP_EMAIL` | For sending OTP emails | No |
| `SMTP_PASSWORD` | SMTP app password | No |

## Troubleshooting

### Build Fails
- Ensure `backend/reqs.txt` has correct package names
- Check Python version compatibility

### Health Check Fails
- Verify `DATABASE_URL` is set correctly
- Check that PostgreSQL is running

### 503 Errors
- AI features need `GROQ_API_KEY`
- Check Railway logs for specific errors

## Next Steps

1. **Deploy Backend** → Follow steps above
2. **Update Client** → Point client to new Railway URL
3. **Set Up Custom Domain** (optional) → In Railway settings

