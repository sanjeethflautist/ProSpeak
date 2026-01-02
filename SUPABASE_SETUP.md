# Supabase Edge Functions Setup

## Deploy the Edge Function

1. **Install Supabase CLI**:
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Set secrets**:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Deploy the function**:
   ```bash
   supabase functions deploy generate-daily-sentences
   ```

## Set up pg_cron for Daily Execution

Go to your Supabase SQL Editor and run:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run daily at 00:01 AM
SELECT cron.schedule(
  'generate-daily-sentences',
  '1 0 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-sentences',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- To manually trigger it for testing:
SELECT
  net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-sentences',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;

-- View scheduled jobs:
SELECT * FROM cron.job;

-- Remove the job if needed:
SELECT cron.unschedule('generate-daily-sentences');
```

## Manual Testing

You can also call the edge function via HTTP:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-sentences' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## Benefits

✅ **No separate backend server needed**
✅ **Serverless** - only runs when needed
✅ **Built-in scaling**
✅ **Automatic HTTPS**
✅ **Free tier available**
✅ **Database cron jobs** - native to Postgres
