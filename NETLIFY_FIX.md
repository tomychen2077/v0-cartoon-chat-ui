# Netlify Deployment Fix - REQUIRED ACTION

## ⚠️ CRITICAL: You MUST clear the Publish Directory in Netlify UI

The build is failing because the **Publish directory** is set to `.next/standalone` in your Netlify UI settings. This conflicts with the Next.js plugin.

### Step-by-Step Fix (Takes 2 minutes):

1. **Go to your Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your site

2. **Navigate to Build Settings**
   - Click: **Site settings** (gear icon)
   - Go to: **Build & deploy** → **Build settings**
   - Click: **Edit settings** button

3. **Clear the Publish Directory**
   - Find the **"Publish directory"** field
   - **DELETE/CLEAR** the value (it currently says `.next/standalone`)
   - Leave it **completely blank/empty**
   - Click **Save**

4. **Redeploy**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - OR push a new commit to trigger automatic deploy

### Why This Is Required:

- The `@netlify/plugin-nextjs` plugin **automatically** manages the publish directory
- When you set it manually in the UI, it conflicts with the plugin
- The plugin expects to control where the output goes
- Your `netlify.toml` and `next.config.mjs` are already configured correctly

### After Clearing the Publish Directory:

✅ The plugin will automatically detect the Next.js build output  
✅ The plugin will set the correct publish path  
✅ Your deployment will succeed  

---

**Note:** This is a one-time fix. Once cleared, future deployments will work automatically.

