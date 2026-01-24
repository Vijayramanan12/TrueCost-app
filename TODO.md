# True Cost AI - Railway Deployment Checklist

## Phase 1: Backend Deployment on Railway

- [ ] 1.1 Push latest code to GitHub
- [ ] 1.2 Create Railway project
- [ ] 1.3 Add PostgreSQL database to Railway
- [ ] 1.4 Deploy backend service with Dockerfile
- [ ] 1.5 Set environment variables (DATABASE_URL, JWT_SECRET_KEY, GROQ_API_KEY)
- [ ] 1.6 Verify health check endpoint works
- [ ] 1.7 Copy the Railway backend URL

## Phase 2: Client Configuration Update

- [ ] 2.1 Update vite.config.ts with new Railway backend URL
- [ ] 2.2 Or create .env file with VITE_API_URL for Railway backend
- [ ] 2.3 Test local development with Railway backend

## Phase 3: Production Deployment

- [ ] 3.1 Deploy client to Netlify (already configured via netlify.toml)
- [ ] 3.2 Update client environment variables in Netlify
- [ ] 3.3 Test full application flow
- [ ] 3.4 Configure custom domain (optional)

## Notes

- Railway Backend URL format: `https://your-service-name.up.railway.app`
- Client uses VITE_API_URL environment variable to connect to backend
- For local development, use .env file with VITE_API_URL

