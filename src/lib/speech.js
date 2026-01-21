import { supabase } from './supabase.js'

let currentAudio = null

// Speak text using browser's built-in TTS with best voice selection
export async function speakText(text) {
  // Stop any currently playing audio
  stopSpeaking()

  return await speakWithBrowserTTS(text)
}

// Use browser's built-in TTS with enhanced natural voice settings
async function speakWithBrowserTTS(text) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'))
      return
    }

    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    // Let the AI/browser handle rate and pitch naturally
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Get available voices
    let voices = window.speechSynthesis.getVoices()
    
    // Function to select best voice
    const selectBestVoice = (voiceList) => {
      // Filter out non-English voices first
      const englishVoices = voiceList.filter(v => v.lang.startsWith('en'))
      
      if (englishVoices.length === 0) {
        return voiceList[0] // Fallback to any voice
      }
      
      // Priority order for natural-sounding English voices
      const voicePriority = [
        // Premium/Enhanced voices (usually sound best)
        v => v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Natural'),
        // Google voices (high quality)
        v => v.name.includes('Google'),
        // Samantha (Mac voice - very natural)
        v => v.name.includes('Samantha'),
        // Microsoft voices
        v => v.name.includes('Microsoft'),
        // British English male
        v => v.lang === 'en-GB' && (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('George')),
        // British English female
        v => v.lang === 'en-GB' && (v.name.includes('Female') || v.name.includes('Kate') || v.name.includes('Serena')),
        // Any British English
        v => v.lang === 'en-GB',
        // US English male
        v => v.lang === 'en-US' && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Mark')),
        // US English female  
        v => v.lang === 'en-US' && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha')),
        // Any US English
        v => v.lang === 'en-US',
        // Any English
        v => v.lang.startsWith('en'),
      ]
      
      for (const criterion of voicePriority) {
        const voice = englishVoices.find(criterion)
        if (voice) return voice
      }
      
      return englishVoices[0]
    }
    
    // If voices not loaded yet, wait for them
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices()
        const bestVoice = selectBestVoice(voices)
        if (bestVoice) {
          utterance.voice = bestVoice
          console.log('Selected voice:', bestVoice.name, bestVoice.lang)
        }
        window.speechSynthesis.speak(utterance)
      }
    } else {
      const bestVoice = selectBestVoice(voices)
      if (bestVoice) {
        utterance.voice = bestVoice
        console.log('Selected voice:', bestVoice.name, bestVoice.lang)
      }
      window.speechSynthesis.speak(utterance)
    }

    utterance.onend = () => resolve()
    utterance.onerror = (error) => reject(error)
  })
}

// Stop speaking
export function stopSpeaking() {
  // Stop browser TTS if playing
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

// Get audio format based on device
function getAudioFormat() {
  const userAgent = navigator.userAgent.toLowerCase()
  const isAndroid = /android/.test(userAgent)
  const isIOS = /iphone|ipad|ipod/.test(userAgent)

  if (isAndroid) {
    return 'audio/webm;codecs=opus'
  } else if (isIOS) {
    return 'audio/mp4'
  }
  return 'audio/webm'
}

// Speech Recognition Class - Enhanced for all platforms
export class SpeechRecognizer {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported')
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = 'en-GB'
    
    // Configure based on platform
    const isAndroid = /android/i.test(navigator.userAgent)
    this.isAndroid = isAndroid // Store this property
    
    // Android works best with simpler settings to avoid "popping" and duplicates
    if (isAndroid) {
      this.recognition.continuous = false // Android often fails with continuous
      this.recognition.interimResults = false // Disable partial results to avoid UI jumping
      this.recognition.maxAlternatives = 1
    } else {
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.maxAlternatives = 1
    }

    this.mediaRecorder = null
    this.audioChunks = []
    this.active = false
    this.collectedText = ''
    this.shouldRestart = false
    this.restartAttempts = 0
    this.maxRestartAttempts = 50  // Significantly increased to handle long sessions/pauses

    this.onResult = null
    this.onError = null
  }

  async start() {
    if (this.active) return

    this.active = true
    this.shouldRestart = true
    this.collectedText = ''
    this.audioChunks = []
    this.restartAttempts = 0

    // Start audio recording
    try {
      // Check if we are on Android where simultaneous recording might cause issues with SpeechRecognition
      const isAndroid = /android/i.test(navigator.userAgent)
      
      // On Android, we prioritize SpeechRecognition (text) over MediaRecorder (audio file)
      // because they often conflict when accessing the microphone simultaneously via different APIs.
      // This ensures the "no speech detected" error is resolved.
      if (!isAndroid) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        })
        const mimeType = getAudioFormat()
        
        // Check if the mimeType is supported
        const options = MediaRecorder.isTypeSupported(mimeType) 
          ? { mimeType } 
          : {}
        
        this.mediaRecorder = new MediaRecorder(stream, options)
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data)
          }
        }

        this.mediaRecorder.onerror = (error) => {
          console.error('MediaRecorder error:', error)
        }

        this.mediaRecorder.start(1000) // Collect data every second for mobile stability
      } else {
        console.log('Android detected: Skipping MediaRecorder to ensure SpeechRecognition works')
      }
    } catch (error) {
      // Only log error, don't stop the whole process as SpeechRecognition might still work
      console.error('Microphone/MediaRecorder access error:', error)
      // we don't return here, we let SpeechRecognition try its best
    }

    // Setup recognition handlers
    this.recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        this.collectedText += finalTranscript
      }
      
      // On Androids with continuous=false, single results are always final
      // We need to accumulate them manually across restarts
      if (this.isAndroid && !this.recognition.continuous && finalTranscript) {
        console.log('Android partial result:', finalTranscript)
      }

      if (this.onResult) {
        this.onResult({
          transcript: this.collectedText + interimTranscript,
          isFinal: false
        })
      }
    }

    this.recognition.onend = () => {
      // Auto-restart for continuous recording until user stops
      // On Android (continuous=false), this happens frequently, so we treat it as normal flow
      if (this.shouldRestart && this.active && this.restartAttempts < this.maxRestartAttempts) {
        this.restartAttempts++
        if (!this.isAndroid) { 
           console.log(`Auto-restarting recognition (attempt ${this.restartAttempts})`)
        }
        
        // Immediate restart for Android to minimize gap
        const delay = this.isAndroid ? 10 : 100
        
        setTimeout(() => {
          if (this.active && this.shouldRestart) {
            try {
              this.recognition.start()
            } catch (e) {
              // Ignore "already started" errors
              if (e.name !== 'InvalidStateError') {
                 console.error('Failed to restart recognition:', e)
              }
            }
          }
        }, delay) 
      }
    }

    this.recognition.onerror = (event) => {
      console.error('Recognition error:', event.error)
      
      // Handle specific errors
      if (event.error === 'no-speech') {
        // Just continue listening, don't show error
        return
      }
      
      if (event.error === 'aborted') {
        // User stopped intentionally
        return
      }
      
      if (event.error === 'audio-capture') {
        this.active = false
        if (this.onError) {
          this.onError(new Error('No microphone found. Please check your device.'))
        }
        return
      }
      
      if (event.error === 'not-allowed') {
        this.active = false
        if (this.onError) {
          this.onError(new Error('Microphone permission denied.'))
        }
        return
      }

      if (event.error === 'network') {
        this.active = false
        if (this.onError) {
          this.onError(new Error('Network error. Please check your connection.'))
        }
        return
      }

      // For other errors, try to continue
      console.log('Continuing after error:', event.error)
    }

    // Start recognition
    try {
      this.recognition.start()
    } catch (error) {
      console.error('Failed to start recognition:', error)
      this.active = false
      if (this.onError) {
        this.onError(new Error('Failed to start recording. Please try again.'))
      }
    }
  }

  async stop() {
    if (!this.active) return null

    this.active = false
    this.shouldRestart = false

    // Stop recognition (ignore errors if it already stopped itself)
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch (e) {
        console.log('Recognition already stopped')
      }
    }

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
      
      // Stop all tracks
      const tracks = this.mediaRecorder.stream.getTracks()
      tracks.forEach(track => track.stop())
    }

    // Wait for audio blob to be ready
    await new Promise(resolve => setTimeout(resolve, 500))

    let audioBlob = null
    if (this.audioChunks.length > 0) {
      const mimeType = getAudioFormat()
      // Use the actual mimeType from the recorded chunks
      const actualMimeType = this.audioChunks[0].type || mimeType
      audioBlob = new Blob(this.audioChunks, { type: actualMimeType })
    }

    const finalText = this.collectedText.trim()

    if (this.onResult) {
      this.onResult({
        transcript: finalText,
        isFinal: true
      })
    }

    return {
      text: finalText,
      audioBlob
    }
  }
}

// Calculate accuracy using Levenshtein distance
export function calculateAccuracy(original, spoken) {
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim()
  
  const s1 = normalize(original)
  const s2 = normalize(spoken)
  
  if (s1 === s2) return 100
  if (!s1 || !s2) return 0

  const m = s1.length
  const n = s2.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  const maxLen = Math.max(m, n)
  const accuracy = ((maxLen - dp[m][n]) / maxLen) * 100
  return Math.round(accuracy)
}

// Analyze voice with AI
export async function analyzeVoiceWithAI(spokenText, originalText, audioBlob, contentType = 'business', category = null) {
  try {
    // Get the current session to ensure auth token is passed
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('Session check:', session ? 'Session exists' : 'No session')
    
    if (!session) {
      throw new Error('Not authenticated. Please log in again.')
    }
    
    let base64Audio = null
    let mimeType = null

    if (audioBlob) {
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      mimeType = audioBlob.type
    } else {
      console.warn('No audio blob provided for AI analysis (likely Android device). Sending text only.')
    }

    console.log('Calling analyze-speech with direct fetch...')
    
    // Use direct fetch instead of supabase.functions.invoke to have full control over headers
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-speech`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        spokenText,
        originalText,
        audioBase64: base64Audio,
        mimeType: mimeType,
        contentType,
        category
      })
    })

    console.log('Function response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Function error response:', errorText)
      throw new Error(`Function returned ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    console.log('Function success data:', data)
    
    return data
  } catch (error) {
    console.error('AI analysis error:', error)
    throw error
  }
}

