import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate context-appropriate analysis prompt based on content type
function generateAnalysisPrompt(
  originalText: string, 
  spokenText: string, 
  audioAnalysis: string,
  contentType: string,
  category: string | null
): string {
  const baseInstruction = `You are an expert speech coach. LISTEN to the provided audio (if available) and analyze this practice session by comparing the spoken version against the original text.

ORIGINAL TEXT: "${originalText}"
${spokenText !== "(Audio Provided)" ? `SPOKEN VERSION: "${spokenText}"` : "Note: Analyze the audio directly."}
${audioAnalysis}`

  let contextualGuidance = ''
  
  // Determine content-specific guidance
  switch (contentType) {
    case 'custom':
      switch (category) {
        case 'presentation':
          contextualGuidance = `
This is a PRESENTATION practice. Focus on:
- Professional delivery and confidence
- Clear articulation for audience comprehension
- Strategic pausing for emphasis and audience engagement
- Pacing that maintains audience attention (not too fast, allows for processing)
- Authoritative but approachable tone`
          break
          
        case 'meeting':
          contextualGuidance = `
This is MEETING DIALOGUE practice. Focus on:
- Natural conversational flow
- Clear communication without being overly formal
- Appropriate pacing for discussion (allowing for interruption/response)
- Professional but accessible tone
- Key points articulated with clarity`
          break
          
        case 'speech':
          contextualGuidance = `
This is a FORMAL SPEECH practice. Focus on:
- Compelling delivery with emotional resonance
- Clear enunciation for larger audiences
- Dramatic pausing for effect
- Varied pacing to maintain engagement
- Confident, inspiring tone`
          break
          
        case 'conversation':
          contextualGuidance = `
This is CASUAL CONVERSATION practice. Focus on:
- Natural, relaxed delivery
- Conversational pacing (comfortable, not rushed)
- Authentic tone without over-formality
- Clear pronunciation while maintaining naturalness
- Engaging, friendly delivery`
          break
          
        case 'reading':
          contextualGuidance = `
This is READING/NARRATION practice. Focus on:
- Consistent, clear enunciation
- Appropriate pacing for comprehension
- Expression that brings the text to life
- Smooth flow without stumbling
- Engaging tone that maintains listener interest`
          break
          
        default:
          contextualGuidance = `
This is GENERAL CUSTOM CONTENT practice. Focus on:
- Overall clarity and comprehension
- Natural delivery appropriate to the content
- Consistent pacing
- Clear pronunciation of key terms
- Confident, authentic expression`
      }
      break
      
    case 'business':
    default:
      contextualGuidance = `
This is BUSINESS COMMUNICATION practice. Focus on:
- Professional delivery and confidence
- Clear pronunciation of business/technical terms
- Appropriate pacing for professional settings (120-160 WPM ideal)
- Strategic pausing for emphasis
- Authoritative yet accessible tone`
  }

  const outputFormat = `
Provide your analysis in TWO parts:

1. SCORE (0-100): Rate overall performance based on:
   - Word accuracy (compare word-by-word: substitutions, omissions, additions)
   - Pronunciation clarity
   - Speaking pace ${audioAnalysis ? '(measured WPM)' : ''}
   - Delivery quality appropriate to the content type
   - Overall effectiveness
   Output format: "SCORE: XX"

2. FEEDBACK (4-5 sentences maximum): Provide structured, actionable feedback:
   
   a) ACCURACY: Identify specific word substitutions or errors. Be precise with examples.
   
   b) PRONUNCIATION: Point out 2-3 key words that need clearer pronunciation.
   
   c) PACE & DELIVERY: Comment on speaking speed and rhythm. Suggest improvements appropriate to the content type.
   
   d) STRENGTHS: Acknowledge one positive aspect (energy, flow, clarity, tone, etc.).
   
   e) ACTION ITEM: End with ONE specific practice tip for immediate improvement.

Output format:
SCORE: XX
FEEDBACK: [Your structured feedback covering accuracy, pronunciation, pace, strengths, and one action item]

Keep it concise (4-5 sentences), specific, and actionable.`

  return `${baseInstruction}${contextualGuidance}${outputFormat}`
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
    const { spokenText, originalText, audioBase64, contentType = 'business', category = null } = await req.json()
    console.log('Body parsed successfully')
    console.log('Content type:', contentType, 'Category:', category)
    
    // Input validation
    if (!originalText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: originalText' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!spokenText && !audioBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing input: provide spokenText or audioBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Limit text length to prevent abuse (increased for custom content)
    if ((spokenText && spokenText.length > 5000) || originalText.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Text too long. Maximum 5000 characters.' }),
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
      // Without accurate duration decoding, we'll skip local WPM calc
      audioAnalysis = `
(Audio provided for analysis)
Please estimate the speaking pace and delivery quality from the audio directly.`
    }

    // If spokenText is missing, we rely on audio analysis
    const isAudioOnly = !spokenText && audioBase64;
    const prompt = generateAnalysisPrompt(originalText, spokenText || "(Audio Provided)", audioAnalysis, contentType, category)

    console.log('Calling Gemini API...')
    // User requested gemini-2.5-flash
    const modelName = 'gemini-2.5-flash'; 
    console.log(`Using model: ${modelName}`)
    
    const requestBody: any = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    if (audioBase64) {
       requestBody.contents[0].parts.push({
         inline_data: {
           mime_type: "audio/webm", // Assuming webm from frontend
           data: audioBase64
         }
       });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify(requestBody)
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
      } else {
         // Include upstream error details for debugging
         try {
            const errObj = JSON.parse(errorText);
            if (errObj.error && errObj.error.message) {
                errorMessage += ` (${errObj.error.message})`;
            } else {
                errorMessage += ` (${errorText})`;
            }
         } catch (e) {
             errorMessage += ` (${errorText.substring(0, 100)})`;
         }
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
