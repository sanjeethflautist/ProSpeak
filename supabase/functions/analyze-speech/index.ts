import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== FUNCTION INVOKED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...')
    const { spokenText, originalText, audioBase64 } = await req.json()
    console.log('Body parsed successfully')
    
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
    
    // Create Supabase client - use service role to access user data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Try to get auth header (might be in authorization or Authorization)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    console.log('=== AUTH DEBUG ===')
    console.log('Auth header from request:', authHeader ? 'Present' : 'NULL')
    console.log('All request headers:')
    for (const [key, value] of req.headers.entries()) {
      console.log(`  ${key}: ${value.substring(0, 50)}...`)
    }
    console.log('==================')
    
    // Create service role client for database access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Try to get user from auth header if present
    let user = null
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      user = data.user
      console.log('User from auth header:', user ? user.id : 'null', error ? error.message : '')
    } else {
      console.log('No authorization header found')
    }
    
    let geminiApiKey = Deno.env.get('GEMINI_API_KEY') // Fallback to environment variable
    
    // If user is authenticated, try to get their encrypted API key
    if (user) {
      console.log('Fetching user API key for user:', user.id)
      
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .select('gemini_api_key_encrypted')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (settingsError) {
        console.error('Error fetching user settings:', settingsError)
      } else if (settings?.gemini_api_key_encrypted) {
        console.log('Encrypted key found, decrypting...')
        
        // Decrypt the API key
        const { data: decryptedKey, error: decryptError } = await supabaseAdmin
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

    const prompt = `You are an expert speech coach. Analyze this practice session by comparing the spoken version against the original sentence:

ORIGINAL SENTENCE: "${originalText}"
SPOKEN VERSION: "${spokenText}"
${audioAnalysis}

Provide your analysis in TWO parts:

1. SCORE (0-100): Rate overall performance based on:
   - Word accuracy (compare word-by-word: substitutions, omissions, additions)
   - Pronunciation clarity
   - Speaking pace (ideal: 120-160 WPM)
   - Overall delivery quality
   Output format: "SCORE: XX"

2. FEEDBACK (4-5 sentences maximum): Provide structured, actionable feedback:
   
   a) ACCURACY: Identify specific word substitutions or errors (e.g., "monolithic" → "monalities", "platform" → "blood form"). Be precise.
   
   b) PRONUNCIATION: Point out 2-3 key words that need clearer pronunciation. Suggest focusing on these specific terms.
   
   c) PACE & RHYTHM: Comment on speaking speed ${audioAnalysis ? '(based on measured WPM)' : ''}. If too fast/slow, suggest slowing down or speeding up. Mention where strategic pauses would help (after key phrases).
   
   d) STRENGTHS: Acknowledge one positive aspect (energy, flow, consistency, etc.).
   
   e) ACTION ITEM: End with ONE specific practice tip for immediate improvement.

Output format:
SCORE: XX
FEEDBACK: [Your structured feedback covering accuracy, pronunciation, pace, strengths, and one action item]

Keep it concise (4-5 sentences), specific, and actionable. Focus on comparing the original vs spoken text word-by-word.`

    console.log('Calling Gemini API...')
    console.log('Using model: gemini-2.5-flash')
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
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
      console.error('Gemini API status:', response.status)
      
      // Provide more specific error messages based on status
      let errorMessage = 'AI analysis service unavailable. Please try again later.'
      
      if (response.status === 400) {
        errorMessage = 'Invalid request to AI service. Please check your input.'
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid or expired Gemini API key. Please update your API key in Settings.'
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later or check your Gemini API quota.'
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
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
