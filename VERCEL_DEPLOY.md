# Vercel Deployment Guide

## Quick Deploy

1. **Push your code to GitHub** (if not already)

2. **Import to Vercel**
   - Go to: https://vercel.com
   - Click: **Add New** → **Project**
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - In Vercel project settings, go to **Environment Variables**
   - Add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-vercel-domain.vercel.app
     ```

4. **Deploy**
   - Click **Deploy**
   - Vercel will automatically build and deploy your Next.js app

## Why Vercel is Better

✅ **Zero Configuration** - Next.js works out of the box  
✅ **Automatic Optimizations** - Built-in performance features  
✅ **Edge Functions** - Serverless functions at the edge  
✅ **Instant Deploys** - Fast builds and deployments  
✅ **No Plugin Issues** - Native Next.js support  

## Environment Variables Setup

### Get Your Supabase Credentials
1. Go to Supabase Dashboard → Settings → API
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Add to Vercel
1. Project Settings → Environment Variables
2. Add each variable for **Production**, **Preview**, and **Development**
3. Redeploy after adding variables

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## That's It!

Vercel handles everything automatically. No build configuration needed! 🚀

