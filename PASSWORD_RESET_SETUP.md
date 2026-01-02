# Password Reset Configuration Guide

## Issue
Password reset was failing with `AuthRetryableFetchError` due to missing Supabase configuration.

## Solution

### 1. Configure Supabase Dashboard Settings

You **MUST** configure your Supabase project settings for password reset to work:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `dmkqgsfxnqljzmuqmkda`
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following URLs:

#### For Local Development:
- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: 
  - `http://localhost:5173/**`
  - `http://localhost:5173/reset-password`

#### For Production (Vercel):
- **Site URL**: `https://ullai.vercel.app` (or `https://prospeak-gold.vercel.app` if not yet updated)
- **Redirect URLs**:
  - `https://ullai.vercel.app/**`
  - `https://ullai.vercel.app/reset-password`

### 2. Email Configuration (Optional but Recommended)

For production, configure custom SMTP in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Configure **SMTP Settings** (or use Supabase's default email service)
3. Customize the **Reset Password** email template

### 3. Environment Variables

The `.env` file has been updated with:
```env
VITE_SITE_URL=http://localhost:5173
```

Update this when deploying to production.

### 4. Testing Password Reset

1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. Try the password reset flow again

## What Was Fixed

1. **Added better error handling** in `src/stores/auth.js`
2. **Added VITE_SITE_URL** environment variable for redirect configuration
3. **Improved error messages** to help diagnose configuration issues

## Common Issues

### "Failed to send reset email"
- Check that your email is registered in the system
- Verify Supabase URL configuration includes the redirect URL
- Check your spam/junk folder

### "Configuration error"
- Supabase site URL is not configured
- Redirect URLs don't match your application URL
- SMTP settings are incorrect (if using custom SMTP)

## Next Steps

1. **Configure Supabase Dashboard** (most important!)
2. Restart your development server
3. Test the password reset flow
4. When deploying to production, update `VITE_SITE_URL` in your hosting platform's environment variables

## Production Deployment Checklist

For Vercel deployment at `https://ullai.vercel.app` (or `https://prospeak-gold.vercel.app` until rebranded):

- [ ] In Vercel dashboard, add environment variable: `VITE_SITE_URL=https://ullai.vercel.app`
- [ ] In Supabase, add `https://ullai.vercel.app/**` to Redirect URLs
- [ ] In Supabase, set Site URL to `https://ullai.vercel.app`
- [ ] Redeploy on Vercel after environment variable changes
- [ ] Test password reset in production environment
- [ ] Verify emails are being sent (check spam folder initially)
