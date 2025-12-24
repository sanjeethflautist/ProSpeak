// Text-to-Speech using Web Speech API with natural voice selection
export const speakText = (text) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Get available voices and select a natural-sounding one
    const voices = window.speechSynthesis.getVoices()
    
    // Priority order: Google/Chrome voices > Microsoft voices > Others
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && (
        voice.name.includes('Google') ||
        voice.name.includes('Chrome') ||
        voice.name.includes('Natural') ||
        voice.name.includes('Premium') ||
        voice.name.includes('Enhanced')
      )
    ) || voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Microsoft')
    ) || voices.find(voice => voice.lang.startsWith('en'))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    // Optimized settings for conversational, natural speech
    utterance.rate = 0.92 // Conversational pace
    utterance.pitch = 1.05 // Slightly higher for warmth
    utterance.volume = 0.9 // Comfortable volume

    utterance.onend = () => resolve()
    utterance.onerror = (error) => reject(error)

    window.speechSynthesis.speak(utterance)
  })
}

// Stop current speech
export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

// Speech Recognition with Audio Recording
export class SpeechRecognizer {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported')
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true // Enable continuous to handle natural pauses
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1
    this.isListening = false
    this.finalTranscript = ''
    this.interimTranscript = ''
    
    // Audio recording properties
    this.mediaRecorder = null
    this.audioChunks = []
    this.audioBlob = null
    
    // Silence detection for natural pauses
    this.silenceTimer = null
    this.lastSpeechTime = null
  }

  async start() {
    return new Promise(async (resolve, reject) => {
      if (this.isListening) {
        reject(new Error('Already listening'))
        return
      }

      this.finalTranscript = ''
      this.interimTranscript = ''
      this.audioChunks = []
      this.audioBlob = null
      
      let hasReceivedSpeech = false
      const MAX_RECORDING_TIME = 30000 // 30 seconds max
      const SILENCE_THRESHOLD = 6000 // 6 seconds of silence before auto-stop
      let maxTimeTimer = null
      
      // Clear any existing silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }
      this.lastSpeechTime = Date.now()

      // Start audio recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.mediaRecorder = new MediaRecorder(stream)
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data)
          }
        }
        
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
          stream.getTracks().forEach(track => track.stop())
        }
        
        this.mediaRecorder.start()
      } catch (error) {
        console.error('Audio recording error:', error)
        reject(new Error('Failed to access microphone'))
        return
      }

      this.recognition.onresult = (event) => {
        let interim = ''
        
        // Reset silence timer on any speech activity
        this.lastSpeechTime = Date.now()
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer)
        }
        
        // Set new silence timer
        this.silenceTimer = setTimeout(() => {
          if (this.isListening && hasReceivedSpeech) {
            console.log('Extended silence detected, stopping recording...')
            this.stop()
          }
        }, SILENCE_THRESHOLD)
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            this.finalTranscript += transcript + ' '
            hasReceivedSpeech = true
          } else {
            interim += transcript
          }
        }
        
        this.interimTranscript = interim
        
        // Show user that speech is being detected
        if (interim || this.finalTranscript) {
          hasReceivedSpeech = true
        }
      }

      this.recognition.onerror = (event) => {
        if (maxTimeTimer) clearTimeout(maxTimeTimer)
        if (this.silenceTimer) clearTimeout(this.silenceTimer)
        this.isListening = false
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop()
        }
        
        console.error('Speech recognition error:', event.error)
        
        // Don't reject on 'no-speech' if we have some transcript
        if (event.error === 'no-speech' && hasReceivedSpeech) {
          // Trigger end to process what we have
          return
        }
        
        if (event.error === 'no-speech') {
          reject(new Error('No speech detected. Please speak clearly into the microphone.'))
        } else if (event.error !== 'aborted') {
          reject(new Error(`Recognition error: ${event.error}`))
        }
      }

      this.recognition.onend = () => {
        if (maxTimeTimer) clearTimeout(maxTimeTimer)
        if (this.silenceTimer) clearTimeout(this.silenceTimer)
        this.isListening = false
        
        // Stop audio recording
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop()
          // Wait for the blob to be ready
          setTimeout(() => {
            const finalText = this.finalTranscript.trim()
            if (finalText) {
              resolve({ 
                transcript: finalText, 
                confidence: 0.9,
                audioBlob: this.audioBlob 
              })
            } else {
              reject(new Error('No speech detected. Please try speaking again.'))
            }
          }, 100)
        } else {
          const finalText = this.finalTranscript.trim()
          if (finalText) {
            resolve({ 
              transcript: finalText, 
              confidence: 0.9,
              audioBlob: this.audioBlob 
            })
          } else {
            reject(new Error('No speech detected. Please try speaking again.'))
          }
        }
      }

      try {
        this.recognition.start()
        this.isListening = true
        
        // Set maximum recording time to prevent hanging
        maxTimeTimer = setTimeout(() => {
          if (this.isListening) {
            console.log('Max recording time reached, stopping...')
            this.stop()
          }
        }, MAX_RECORDING_TIME)
      } catch (error) {
        reject(error)
      }
    })
  }

  stop() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
    if (this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }
}

// Calculate similarity between two strings (Levenshtein distance normalized)
export const calculateAccuracy = (original, spoken) => {
  const s1 = original.toLowerCase().trim()
  const s2 = spoken.toLowerCase().trim()

  const distance = levenshteinDistance(s1, s2)
  const maxLength = Math.max(s1.length, s2.length)
  const similarity = (1 - distance / maxLength) * 100

  return Math.max(0, Math.min(100, similarity)).toFixed(2)
}

// Levenshtein distance algorithm
const levenshteinDistance = (str1, str2) => {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// AI-powered voice analysis using Supabase Edge Function
export const analyzeVoiceWithAI = async (spokenText, originalText, audioBlob) => {
  console.log('=== AI Analysis Starting ===')
  console.log('Spoken:', spokenText)
  console.log('Original:', originalText)
  console.log('Audio blob available:', !!audioBlob)
  
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    // Convert audio blob to base64 for sending
    let audioBase64 = null
    if (audioBlob) {
      const arrayBuffer = await audioBlob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
      audioBase64 = btoa(binary)
      console.log('Audio converted to base64, size:', audioBase64.length)
    }
    
    console.log('Calling Supabase Edge Function...')
    const response = await fetch(
      `${supabaseUrl}/functions/v1/analyze-speech`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          spokenText,
          originalText,
          audioBase64
          // API key will be retrieved server-side from encrypted storage
        })
      }
    )

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      throw new Error(`AI analysis failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('API Response data:', data)
    console.log('AI Score:', data.aiScore)
    console.log('AI Analysis:', data.analysis)
    console.log('=== AI Analysis Complete ===')
    
    return {
      analysis: data.analysis,
      aiScore: data.aiScore
    }
  } catch (error) {
    console.error('=== AI Analysis Error ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    return null
  }
}
