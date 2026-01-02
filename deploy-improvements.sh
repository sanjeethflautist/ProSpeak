#!/bin/bash

# Deployment Script for Recording & Voice Improvements
# This script helps deploy the new AI voice functionality

echo "🚀 Deploying Recording & Voice Improvements"
echo "==========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged into Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Logged into Supabase"
echo ""

# Deploy the generate-speech function
echo "📦 Deploying generate-speech function..."
supabase functions deploy generate-speech

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
else
    echo "❌ Function deployment failed!"
    exit 1
fi

echo ""
echo "⚠️  IMPORTANT: Configure Google Cloud API Key"
echo "==========================================="
echo ""
echo "To enable AI voice, you need to:"
echo "1. Get a Google Cloud API key with Text-to-Speech enabled"
echo "2. Add it to Supabase secrets:"
echo ""
echo "   supabase secrets set GOOGLE_CLOUD_API_KEY=your_api_key_here"
echo ""
echo "Or set it in Supabase Dashboard:"
echo "   Settings > Edge Functions > Secrets"
echo ""
echo "📖 See AI_VOICE_SETUP.md for detailed instructions"
echo ""
echo "✅ Deployment complete!"
