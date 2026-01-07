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

async function diagnoseLeaderboard() {
  console.log('='.repeat(60))
  console.log('LEADERBOARD DIAGNOSTIC')
  console.log('='.repeat(60))
  
  // Check user_profiles
  console.log('\n1. Checking user_profiles table...')
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, username, avatar_url, show_in_leaderboard')
    .order('created_at', { ascending: false })
  
  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message)
  } else {
    console.log(`✅ Found ${profiles.length} user profiles`)
    console.log(`   - Opted in to leaderboard: ${profiles.filter(p => p.show_in_leaderboard).length}`)
    console.log(`   - Opted out: ${profiles.filter(p => !p.show_in_leaderboard).length}`)
    
    if (profiles.length > 0) {
      console.log('\n   Sample profiles:')
      profiles.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i+1}. ${p.username} (${p.user_id.substring(0, 8)}...) - Leaderboard: ${p.show_in_leaderboard ? 'Yes' : 'No'}`)
      })
    }
  }
  
  // Check user_progress
  console.log('\n2. Checking user_progress table...')
  const { data: progress, error: progressError } = await supabase
    .from('user_progress')
    .select('*')
    .order('total_sentences', { ascending: false })
  
  if (progressError) {
    console.error('❌ Error fetching progress:', progressError.message)
  } else {
    console.log(`✅ Found ${progress.length} user progress records`)
    
    if (progress.length > 0) {
      console.log('\n   Top 10 by total sentences:')
      progress.slice(0, 10).forEach((p, i) => {
        console.log(`   ${i+1}. User ${p.user_id.substring(0, 8)}... - ${p.total_sentences} sentences, ${p.average_accuracy?.toFixed(1)}% accuracy, ${p.current_streak} day streak`)
      })
      
      // Check for users with no activity
      const noActivity = progress.filter(p => p.total_sentences === 0)
      console.log(`\n   Users with 0 sentences: ${noActivity.length}`)
    }
  }
  
  // Check for orphaned records
  console.log('\n3. Checking for data consistency...')
  
  if (profiles && progress) {
    const profileIds = new Set(profiles.map(p => p.user_id))
    const progressIds = new Set(progress.map(p => p.user_id))
    
    const profilesWithoutProgress = profiles.filter(p => !progressIds.has(p.user_id))
    const progressWithoutProfiles = progress.filter(p => !profileIds.has(p.user_id))
    
    if (profilesWithoutProgress.length > 0) {
      console.log(`   ⚠️  ${profilesWithoutProgress.length} profiles without progress records:`)
      profilesWithoutProgress.slice(0, 5).forEach(p => {
        console.log(`      - ${p.username} (${p.user_id.substring(0, 8)}...)`)
      })
    } else {
      console.log('   ✅ All profiles have progress records')
    }
    
    if (progressWithoutProfiles.length > 0) {
      console.log(`   ⚠️  ${progressWithoutProfiles.length} progress records without profiles:`)
      progressWithoutProfiles.slice(0, 5).forEach(p => {
        console.log(`      - User ${p.user_id.substring(0, 8)}...`)
      })
    } else {
      console.log('   ✅ All progress records have profiles')
    }
  }
  
  // Simulate leaderboard query
  console.log('\n4. Simulating leaderboard query (Total Sentences)...')
  
  const { data: leaderboardProfiles, error: lbProfilesError } = await supabase
    .from('user_profiles')
    .select('user_id, username, avatar_url, show_in_leaderboard')
    .eq('show_in_leaderboard', true)
    .limit(100)
  
  if (lbProfilesError) {
    console.error('❌ Error:', lbProfilesError.message)
  } else if (!leaderboardProfiles || leaderboardProfiles.length === 0) {
    console.log('   ⚠️  No users opted into leaderboard')
  } else {
    const userIds = leaderboardProfiles.map(p => p.user_id)
    
    const { data: lbProgress, error: lbProgressError } = await supabase
      .from('user_progress')
      .select('*')
      .in('user_id', userIds)
    
    if (lbProgressError) {
      console.error('❌ Error:', lbProgressError.message)
    } else {
      // Combine data like the frontend does
      const progressMap = {}
      lbProgress?.forEach(p => {
        progressMap[p.user_id] = p
      })
      
      const leaderboard = leaderboardProfiles
        .map(profile => {
          const prog = progressMap[profile.user_id]
          return {
            username: profile.username,
            total_sessions: prog?.total_sessions || 0,
            total_sentences: prog?.total_sentences || 0,
            average_accuracy: prog?.average_accuracy || 0,
            current_streak: prog?.current_streak || 0
          }
        })
        .sort((a, b) => b.total_sentences - a.total_sentences)
        .slice(0, 10)
      
      console.log(`   ✅ Leaderboard (top 10):`)
      leaderboard.forEach((user, i) => {
        console.log(`   ${i+1}. ${user.username} - ${user.total_sentences} sentences, ${user.average_accuracy?.toFixed(1)}% accuracy, ${user.current_streak} day streak`)
      })
      
      // Check for issues
      const usersWithData = leaderboard.filter(u => u.total_sentences > 0)
      const usersWithoutData = leaderboard.filter(u => u.total_sentences === 0)
      
      console.log(`\n   Users with activity: ${usersWithData.length}`)
      console.log(`   Users without activity: ${usersWithoutData.length}`)
      
      if (usersWithoutData.length > 0) {
        console.log('\n   ⚠️  These users have profiles but no progress data:')
        usersWithoutData.forEach(u => {
          console.log(`      - ${u.username}`)
        })
      }
    }
  }
  
  // Check practice_history
  console.log('\n5. Checking practice_history records...')
  const { data: history, error: historyError } = await supabase
    .from('practice_history')
    .select('user_id, sentence_id, accuracy_score')
    .limit(1000)
  
  if (historyError) {
    console.error('❌ Error fetching history:', historyError.message)
  } else {
    console.log(`✅ Found ${history.length} practice history records`)
    
    // Group by user
    const historyByUser = {}
    history.forEach(h => {
      if (!historyByUser[h.user_id]) {
        historyByUser[h.user_id] = []
      }
      historyByUser[h.user_id].push(h)
    })
    
    const userCount = Object.keys(historyByUser).length
    console.log(`   Spread across ${userCount} users`)
    
    // Check if progress matches history
    if (progress && history.length > 0) {
      console.log('\n   Checking if user_progress matches practice_history:')
      
      let mismatchCount = 0
      Object.keys(historyByUser).forEach(userId => {
        const userHistory = historyByUser[userId]
        const userProgress = progress.find(p => p.user_id === userId)
        
        if (userProgress) {
          const historyCount = userHistory.length
          const progressCount = userProgress.total_sentences
          
          if (historyCount !== progressCount) {
            mismatchCount++
            if (mismatchCount <= 3) {
              console.log(`   ⚠️  User ${userId.substring(0, 8)}... - History: ${historyCount}, Progress: ${progressCount}`)
            }
          }
        }
      })
      
      if (mismatchCount > 0) {
        console.log(`   ⚠️  Found ${mismatchCount} users with mismatched data`)
        console.log('   💡 This might indicate the user_progress table needs to be recalculated')
      } else {
        console.log('   ✅ All user progress data matches practice history')
      }
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('DIAGNOSTIC COMPLETE')
  console.log('='.repeat(60))
}

diagnoseLeaderboard().catch(console.error)
