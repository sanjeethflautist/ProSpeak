import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
)

async function checkPracticeSessions() {
  console.log('Checking practice_sessions table...\n')
  
  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .limit(100)
  
  if (error) {
    console.error('Error:', error.message)
    return
  }
  
  console.log(`Found ${data.length} practice sessions`)
  
  if (data.length > 0) {
    // Group by user
    const sessionsByUser = {}
    data.forEach(session => {
      if (!sessionsByUser[session.user_id]) {
        sessionsByUser[session.user_id] = []
      }
      sessionsByUser[session.user_id].push(session)
    })
    
    console.log(`\nSpread across ${Object.keys(sessionsByUser).length} users:\n`)
    
    Object.keys(sessionsByUser).forEach(userId => {
      const sessions = sessionsByUser[userId]
      const totalSentences = sessions.length
      const avgAccuracy = sessions.reduce((sum, s) => sum + parseFloat(s.accuracy_score), 0) / sessions.length
      
      console.log(`User ${userId.substring(0, 8)}...`)
      console.log(`  - Sessions: ${totalSentences}`)
      console.log(`  - Avg Accuracy: ${avgAccuracy.toFixed(1)}%`)
      console.log(`  - Sample session: ${JSON.stringify(sessions[0], null, 2)}\n`)
    })
  } else {
    console.log('\n⚠️  No practice sessions found!')
    console.log('This means users have been practicing but the data is not being saved.')
  }
}

checkPracticeSessions().catch(console.error)
