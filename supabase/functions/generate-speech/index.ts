import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's Gemini API key from Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          useBrowserTTS: true,
          message: 'Not authenticated'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Import Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          useBrowserTTS: true,
          message: 'Authentication failed'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's encrypted Gemini API key
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('gemini_api_key_encrypted')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (settingsError || !settings?.gemini_api_key_encrypted) {
      return new Response(
        JSON.stringify({ 
          useBrowserTTS: true,
          message: 'No API key configured'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Decrypt the API key
    const { data: decrypted, error: decryptError } = await supabaseClient
      .rpc('decrypt_api_key', {
        encrypted_key: settings.gemini_api_key_encrypted,
        user_secret: user.id
      })
    
    if (decryptError || !decrypted) {
      return new Response(
        JSON.stringify({ 
          useBrowserTTS: true,
          message: 'Failed to decrypt API key'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const googleApiKey = decrypted

    // Prepare text with SSML for natural business speech
    // Add pauses at commas and periods, emphasis on key words
    const ssmlText = `<speak>
      <prosody rate="medium" pitch="medium">
        ${text}
      </prosody>
    </speak>`

    // Call Google Cloud Text-to-Speech API
    // Using Neural2 voices for high quality, natural-sounding speech
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { ssml: ssmlText },  // Use SSML instead of plain text
          voice: {
            languageCode: 'en-GB',
            name: 'en-GB-Neural2-B', // Professional British male voice
            // Alternatives:
            // 'en-GB-Neural2-A' - Female British voice
            // 'en-GB-Neural2-C' - Female British voice (different)
            // 'en-GB-Neural2-D' - Male British voice (alternative)
            // 'en-US-Neural2-D' - Professional US male voice
            // 'en-US-Neural2-F' - Professional US female voice
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,  // Natural speed
            pitch: 0.0,         // Natural pitch
            volumeGainDb: 0.0,
            effectsProfileId: ['headphone-class-device'], // Optimized for mobile/headphones
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Google TTS API error:', error)
      
      // Return fallback to browser TTS
      return new Response(
        JSON.stringify({ 
          useBrowserTTS: true,
          message: 'Server TTS temporarily unavailable'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    
    // Return the base64 encoded audio
    return new Response(
      JSON.stringify({ 
        audioContent: data.audioContent,
        format: 'mp3',
        useBrowserTTS: false
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-speech function:', error)
    
    // Return graceful fallback
    return new Response(
      JSON.stringify({ 
        useBrowserTTS: true,
        message: 'Error generating speech, using fallback'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
