# Deployment Instructions for Fixes

## Issues Fixed
1. ✅ Daily sentences not being added to database automatically
2. ✅ Recording not working on mobile phones

## 🔧 Issue 1: Daily Sentences Cron Job

### What was wrong:
- The pg_cron scheduler was never set up in Supabase
- The generate-daily-sentences function existed but was never scheduled to run automatically

### Solution:
A new migration file has been created: `supabase/migrations/20251229000000_setup_daily_cron.sql`

### Steps to Deploy:

#### Option A: Deploy via Supabase CLI (Recommended)
```bash
# From project root directory
cd /Users/snayak/Desktop/projects/communication

# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref dmkqgsfxnqljzmuqmkda

# Push the migration to your database
supabase db push
```

#### Option B: Run SQL Manually in Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/dmkqgsfxnqljzmuqmkda
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the contents of `supabase/migrations/20251229000000_setup_daily_cron.sql`
4. Click "Run" to execute

### Verify the Cron Job:
After deployment, verify the cron job is scheduled:
```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- Should show a job named 'generate-daily-sentences' running at '1 0 * * *'
```

### Test Manually:
You can trigger the function manually to test:
```sql
SELECT
  net.http_post(
    url:='https://dmkqgsfxnqljzmuqmkda.supabase.co/functions/v1/generate-daily-sentences',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3Fnc2Z4bnFsanptdXFta2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTEzOTUsImV4cCI6MjA4MjA2NzM5NX0.WBLdRtoL7gVpkBm5JBItUu4mVq9RerJpnP_SJsqLRK4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;

-- Then check if sentences were created
SELECT COUNT(*) FROM daily_sentences WHERE date = CURRENT_DATE;
```

## 📱 Issue 2: Mobile Recording Not Working

### What was wrong:
- Mobile browsers require HTTPS (secure context) for microphone access
- The code didn't have proper error handling for mobile devices
- Different browsers support different audio formats

### Changes Made in `src/lib/speech.js`:

1. **Better browser detection and error messages**
   - Clearer error messages for different failure scenarios
   - Detection of mobile devices
   - Check for secure context (HTTPS)

2. **Mobile-specific audio recording**
   - Support for multiple audio formats (webm, mp4, wav)
   - Use timeslice recording for mobile devices
   - Better audio constraints (echo cancellation, noise suppression)

3. **Improved error handling**
   - Specific error messages for permission denied, no microphone, etc.
   - Warning if not in secure context

### Deploy Frontend Changes:

#### For Vercel (Current deployment):
```bash
# Commit the changes
git add src/lib/speech.js
git commit -m "Fix mobile recording with better error handling and format support"

# Push to main branch (auto-deploys to Vercel)
git push origin main
```

#### Test Locally:
```bash
# Start the dev server
npm run dev

# NOTE: Test on mobile requires HTTPS!
# Use ngrok or similar to test with HTTPS on mobile:
# npm install -g ngrok
# ngrok http 5173
```

## ⚠️ Important: HTTPS Requirement for Mobile

Mobile browsers (especially iOS Safari) **REQUIRE HTTPS** for:
- Microphone access (`getUserMedia`)
- Speech Recognition API

### Your Production URL:
✅ Already HTTPS: `https://prospeak-gold.vercel.app` (consider updating to ullai.vercel.app)

### For Testing:
- Desktop: Works on `http://localhost:5173` (localhost is exempt)
- Mobile: **Must use HTTPS** - use your Vercel URL or ngrok

## 🧪 Testing Checklist

### Test Daily Sentences:
- [ ] Verify cron job is scheduled in Supabase
- [ ] Manually trigger the function once
- [ ] Check that 10 sentences appear in daily_sentences table
- [ ] Wait until next day (or change system date) to verify auto-generation

### Test Mobile Recording:
- [ ] Deploy frontend to Vercel (HTTPS)
- [ ] Open app on iPhone/Android
- [ ] Try to start recording - should request microphone permission
- [ ] Verify recording works and transcription appears
- [ ] Check that clear error messages appear if permission denied

## 📝 Maintenance Commands

### View Cron Jobs:
```sql
SELECT * FROM cron.job;
```

### View Cron Job Execution History:
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Unschedule the Job (if needed):
```sql
SELECT cron.unschedule('generate-daily-sentences');
```

### Reschedule with Different Time:
```sql
-- Unschedule first
SELECT cron.unschedule('generate-daily-sentences');

-- Then schedule at new time (example: 2:30 AM)
SELECT cron.schedule(
  'generate-daily-sentences',
  '30 2 * * *',
  $$ ...rest of the SQL... $$
);
```

## 🔍 Troubleshooting

### If sentences are not generated:
1. Check cron job exists: `SELECT * FROM cron.job;`
2. Check execution logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`
3. Verify the edge function is deployed: Check Supabase Functions dashboard
4. Manually test the function using the SQL command above
5. Check Supabase function logs for errors

### If mobile recording still doesn't work:
1. Verify you're accessing via HTTPS (check URL starts with https://)
2. Check browser console for specific error messages
3. Ensure microphone permissions are granted in phone settings
4. Try different browsers (Chrome, Safari, Firefox)
5. Clear browser cache and reload

## 📞 Support
If issues persist, check:
- Supabase Dashboard > Functions (for edge function logs)
- Supabase Dashboard > Database > Query (to manually check tables)
- Browser console (F12) for JavaScript errors
