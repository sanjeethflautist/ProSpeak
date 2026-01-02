import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const today = new Date().toISOString().split('T')[0]

console.log('Checking sentences for date:', today)

const { data, error } = await supabase
  .from('daily_sentences')
  .select('*')
  .eq('date', today)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Found sentences:', data?.length || 0)
  if (data && data.length > 0) {
    console.log('Sample sentence:', data[0])
  }
}

// Also check all sentences
const { data: all, error: allError } = await supabase
  .from('daily_sentences')
  .select('date, count')
  .order('date', { ascending: false })
  .limit(5)

if (!allError && all) {
  console.log('All dates with sentences:', all)
}
