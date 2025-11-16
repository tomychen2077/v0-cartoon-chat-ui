# Netlify Deployment Guide

## Setting Up Environment Variables on Netlify

### Step 1: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Configure Netlify Environment Variables
1. Go to your Netlify site dashboard
2. Navigate to **Site Settings > Build & Deploy > Environment**
3. Click **Add environment variables**
4. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` = your-project.supabase.co URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
   - `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` = https://your-netlify-domain.netlify.app

### Step 3: Redeploy
After adding environment variables, trigger a new deployment in Netlify to apply them.

## Important Notes
- **Never** commit `.env` files to Git
- Use `.env.example` as a template for what variables you need
- All variables starting with `NEXT_PUBLIC_` are exposed to the browser (safe for public values only)
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret and only in Netlify environment variables

## Troubleshooting
If you still see errors after adding env variables:
1. Check that all variable names match exactly (they're case-sensitive)
2. Make sure there are no extra spaces in the values
3. Trigger a manual redeploy in Netlify
4. Check the Netlify build logs for specific errors
