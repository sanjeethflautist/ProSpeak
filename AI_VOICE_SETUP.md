# AI Voice Setup Guide

This guide will help you set up AI-generated natural voice for the Listen functionality.

## Overview

The app now uses **Google Cloud Text-to-Speech API** to generate high-quality, natural-sounding business voices instead of the browser's built-in robotic voice.

## Features

✅ **Professional British Business Voice** - Neural2 voice for natural speech
✅ **Automatic Fallback** - Uses browser TTS if server is unavailable
✅ **Mobile Optimized** - Works perfectly on phones and tablets
✅ **No User Configuration** - Seamless experience once set up

## Setup Instructions

### Step 1: Get Google Cloud API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Cloud Text-to-Speech API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Text-to-Speech API"
   - Click "Enable"
4. Create an API key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - **Important**: Restrict the API key to only "Cloud Text-to-Speech API"

### Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Settings" > "Edge Functions" > "Secrets"
3. Add a new secret:
   - Name: `GOOGLE_CLOUD_API_KEY`
   - Value: Your Google Cloud API key from Step 1
4. Save the secret

### Step 3: Deploy the Edge Function

Deploy the new `generate-speech` function:

```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project (replace with your project ref)
npx supabase link --project-ref your-project-ref

# Deploy the function
npx supabase functions deploy generate-speech
```

### Step 4: Test the Setup

1. Open your app
2. Click on any sentence's "Listen" button
3. You should hear a natural, professional British voice
4. If you see any errors, check:
   - API key is correctly set in Supabase
   - Function is deployed successfully
   - API is enabled in Google Cloud Console

## Voice Options

The default voice is `en-GB-Neural2-B` (Professional British Male). You can change this in [`supabase/functions/generate-speech/index.ts`](supabase/functions/generate-speech/index.ts):

Available voices:
- `en-GB-Neural2-A` - British Female
- `en-GB-Neural2-B` - British Male (default)
- `en-GB-Neural2-C` - British Female (alternative)
- `en-GB-Neural2-D` - British Male (alternative)
- `en-US-Neural2-D` - American Male
- `en-US-Neural2-F` - American Female

## ⚠️ Billing Responsibility

**IMPORTANT: You are responsible for your own Google Cloud and Gemini API subscriptions and any associated costs.**

- U'llai is **NOT responsible** for any charges from Google Cloud or Gemini API
- U'llai securely transmits your data to Google services using your personal API keys
- All billing is between you and Google
- Monitor your usage and set up billing alerts in your Google Cloud Console

## Cost Information

Google Cloud TTS pricing (as of 2024):
- **Free Tier**: 1 million characters/month for Neural2 voices
- **Paid**: $16 per 1 million characters after free tier

For typical usage (practicing 10-20 sentences per day):
- Average sentence: 50-100 characters
- Daily usage: ~500-2000 characters
- Monthly: ~15,000-60,000 characters
- **Cost**: FREE (well within free tier)

**Recommendation:** Set up billing alerts in Google Cloud Console to avoid unexpected charges.

## Troubleshooting

### Voice not playing / fallback to browser TTS
- Check Supabase function logs for errors
- Verify API key is set correctly
- Ensure Google Cloud TTS API is enabled
- Check API key restrictions aren't too strict

### "Quota exceeded" error
- You've exceeded the free tier
- Add billing to your Google Cloud project
- Or reduce usage

### Poor audio quality on mobile
- This should not happen with the new AI voice
- If it does, check network connection
- Try clearing browser cache

## Fallback Behavior

The app is designed to gracefully handle failures:
1. **Primary**: AI-generated voice from Google Cloud
2. **Fallback**: Browser's built-in TTS
3. **User Experience**: Seamless - users won't see errors

## Recording Improvements

Along with AI voice, the recording functionality has been improved:

### Desktop
- ✅ Stable recording
- ✅ Clear interim results
- ✅ Quick stop/start

### Mobile & Tablet
- ✅ Continuous recording mode
- ✅ Auto-restart on interruption
- ✅ Better microphone handling
- ✅ Improved error messages
- ✅ Platform-specific optimizations

### Common Mobile Issues Fixed
- Recording stopping mid-speech
- No speech detected errors
- Microphone permission issues
- Audio format compatibility

## Testing on Different Devices

### Desktop (Laptop/PC)
```
Chrome/Edge: Full support ✅
Firefox: Full support ✅
Safari: Full support ✅
```

### Mobile
```
iOS Safari: Full support ✅
iOS Chrome: Full support ✅
Android Chrome: Full support ✅
Android Firefox: Full support ✅
```

### Tablets
```
iPad: Full support ✅
Android Tablets: Full support ✅
```

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase function logs
3. Verify API keys are set correctly
4. Test on different devices/browsers
