import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { spokenText, originalText, audioBase64 } = await req.json()
    
    // Input validation
    if (!spokenText || !originalText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Limit text length to prevent abuse
    if (spokenText.length > 1000 || originalText.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Text too long. Maximum 1000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate audio size if present (max 5MB base64 ~= 3.75MB raw)
    if (audioBase64 && audioBase64.length > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Audio file too large. Maximum 5MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Create Supabase client to access user data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    let geminiApiKey = Deno.env.get('GEMINI_API_KEY') // Fallback to environment variable
    
    // If user is authenticated, try to get their encrypted API key
    if (user) {
      console.log('Fetching user API key for user:', user.id)
      
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('gemini_api_key_encrypted')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (settingsError) {
        console.error('Error fetching user settings:', settingsError)
      } else if (settings?.gemini_api_key_encrypted) {
        console.log('Encrypted key found, decrypting...')
        
        // Decrypt the API key
        const { data: decryptedKey, error: decryptError } = await supabase
          .rpc('decrypt_api_key', {
            encrypted_key: settings.gemini_api_key_encrypted,
            user_secret: user.id
          })
        
        if (decryptError) {
          console.error('Error decrypting API key:', decryptError)
        } else if (decryptedKey) {
          geminiApiKey = decryptedKey
          console.log('Using user-provided API key')
        }
      } else {
        console.log('No user API key found, using environment variable')
      }
    }
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set')
      throw new Error('GEMINI_API_KEY not available. Please provide an API key in settings or contact administrator.')
    }

    console.log('Gemini API Key present:', !!geminiApiKey)

    let audioAnalysis = ''
    
    // If audio is provided, analyze it
    if (audioBase64) {
      console.log('Audio received, analyzing...')
      
      // Decode base64 audio
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
      const audioBlob = new Blob([audioBytes], { type: 'audio/webm' })
      
      // Calculate approximate duration and speaking rate
      const audioDuration = audioBytes.length / (16000 * 2) // Rough estimate
      const wordCount = spokenText.split(' ').length
      const wordsPerMinute = Math.round((wordCount / audioDuration) * 60)
      
      console.log(`Audio analysis: ${wordCount} words in ~${audioDuration.toFixed(1)}s = ${wordsPerMinute} WPM`)
      
      audioAnalysis = `
Speaking Rate: ${wordsPerMinute} words per minute ${wordsPerMinute < 120 ? '(slow)' : wordsPerMinute > 160 ? '(fast)' : '(good pace)'}.
Audio Duration: ${audioDuration.toFixed(1)} seconds.`
    }

    const prompt = `You are an expert speech coach. Analyze this practice session:

Original sentence: "${originalText}"
Spoken version: "${spokenText}"
${audioAnalysis}

Provide your analysis in TWO parts:

1. SCORE (0-100): Rate the overall performance considering accuracy, clarity, pace, and delivery. Output format: "SCORE: XX"

2. FEEDBACK (3-4 sentences): Provide encouraging analysis covering:
   - Accuracy and clarity of the spoken text
   - Speaking pace and rhythm ${audioAnalysis ? '(based on the audio metrics above)' : ''}
   - Suggested improvements for pronunciation, pacing, or pauses
   - One positive observation and encouragement

Output format:
SCORE: XX
FEEDBACK: Your detailed feedback here...

Keep it concise, actionable, and encouraging.`

    console.log('Calling Gemini API...')
    console.log('Using model: gemini-2.5-flash')
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    )

    console.log('Gemini API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      // Don't leak detailed API errors to client
      return new Response(
        JSON.stringify({ error: 'AI analysis service unavailable. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const fullResponse = data.candidates[0].content.parts[0].text.trim()
    
    console.log('=== Gemini Full Response ===')
    console.log(fullResponse)
    console.log('===========================')
    
    // Parse score and feedback
    const scoreMatch = fullResponse.match(/SCORE:\s*(\d+)/)
    const feedbackMatch = fullResponse.match(/FEEDBACK:\s*(.+)/s)
    
    console.log('Score match:', scoreMatch)
    console.log('Feedback match:', feedbackMatch ? 'Found' : 'Not found')
    
    const aiScore = scoreMatch ? parseInt(scoreMatch[1]) : 75 // Default score if parsing fails
    const analysis = feedbackMatch ? feedbackMatch[1].trim() : fullResponse
    
    console.log('Parsed AI Score:', aiScore)
    console.log('Parsed Analysis length:', analysis.length)

    return new Response(
      JSON.stringify({ analysis, aiScore }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    // Don't leak internal error details
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request.' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
