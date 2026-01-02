    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

    const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('Starting function...')
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://dmkqgsfxnqljzmuqmkda.supabase.co'
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!

        const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
        })

        const today = new Date().toISOString().split('T')[0]
        console.log('Checking for existing sentences for:', today)

        const { data: existing, error: checkError } = await supabase
        .from('daily_sentences')
        .select('id')
        .eq('date', today)

        if (checkError) {
        console.error('Error checking existing sentences:', checkError)
        throw new Error(`Database check failed: ${checkError.message}`)
        }

        console.log('Existing sentences count:', existing?.length || 0)

        if (existing && existing.length > 0) {
        console.log('Deleting existing sentences for today...')
        const { error: deleteError } = await supabase
            .from('daily_sentences')
            .delete()
            .eq('date', today)
        
        if (deleteError) {
            console.error('Error deleting existing sentences:', deleteError)
            throw new Error(`Failed to delete existing sentences: ${deleteError.message}`)
        }
        }

        console.log('Starting sentence generation...')
    const generatedEntries = await generateSentences(geminiApiKey)
    
    const sentences = generatedEntries.map(entry => ({
      sentence: entry.sentence,
      category: categorizeSentence(entry.sentence),
      date: today,
      difficulty_level: 'medium'
    }))

        console.log('Inserting sentences into database...')
        const { error } = await supabase
        .from('daily_sentences')
        .insert(sentences)

        if (error) {
        console.error('Insert error:', error)
        throw new Error(`Failed to insert sentences: ${error.message}`)
        }

        console.log('Success! Inserted', sentences.length, 'sentences')
        return new Response(
        JSON.stringify({ 
            success: true, 
            message: `Generated ${sentences.length} sentences for ${today}`,
            sentences: sentences.map(s => s.sentence)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Function error:', error)
        return new Response(
        JSON.stringify({ error: error.message }),
        { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
        )
    }
    })

async function generateSentences(apiKey: string): Promise<Array<{sentence: string, tips: string}>> {
  const prompt = `Generate exactly 10 professional IT business communication sentences with improvement tips for practicing speech delivery.

Each entry should have:
1. A sentence (45 to 75 words long, natural IT business context with multiple clauses)
2. Specific improvement tips for tone, speed, and pauses

Format each entry exactly like this:
SENTENCE: [the actual sentence]
TIPS: [specific guidance on tone, speed, and where to pause]

Example:
SENTENCE: We need to migrate the legacy database to PostgreSQL before the Q2 deadline to ensure better performance.
TIPS: Slow down at "migrate" and "PostgreSQL". Pause after "deadline". Use confident tone for the deadline, friendly tone for team benefit.

Generate 10 different entries covering: project updates, technical explanations, client communications, team collaboration, problem-solving, and status reports.

Return ONLY the 10 entries in the format shown above. No extra text.`

  console.log('Calling Gemini API for 10 sentences with tips...')
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Gemini API failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('Gemini response received')

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
    console.error('Unexpected Gemini response structure:', JSON.stringify(data))
    throw new Error('Invalid response structure from Gemini API')
  }

  const text = data.candidates[0].content.parts[0].text.trim()
  const entries = []
  const lines = text.split('\n')
  
  let currentSentence = ''
  let currentTips = ''
  
  for (const line of lines) {
    if (line.startsWith('SENTENCE:')) {
      currentSentence = line.replace('SENTENCE:', '').trim()
    } else if (line.startsWith('TIPS:')) {
      currentTips = line.replace('TIPS:', '').trim()
      if (currentSentence && currentTips) {
        entries.push({ sentence: currentSentence, tips: currentTips })
        currentSentence = ''
        currentTips = ''
      }
    }
  }

  console.log(`Generated ${entries.length} sentence-tip pairs`)
  
  if (entries.length < 10) {
    throw new Error(`Only generated ${entries.length} entries, expected 10`)
  }

  return entries.slice(0, 10)
    }

    function categorizeSentence(sentence: string): string {
    const keywords = {
        'project_update': ['project', 'sprint', 'milestone', 'deadline', 'delivery', 'timeline'],
        'technical': ['system', 'architecture', 'database', 'API', 'infrastructure', 'deployment'],
        'client': ['client', 'customer', 'requirement', 'feedback', 'expectation', 'stakeholder'],
        'team': ['team', 'collaborate', 'meeting', 'standup', 'retrospective', 'planning'],
        'problem_solving': ['issue', 'bug', 'fix', 'solution', 'troubleshoot', 'resolve']
    }

    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => sentence.toLowerCase().includes(word))) {
        return category
        }
    }
    return 'general'
    }
