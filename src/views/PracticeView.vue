<template>
  <div class="practice-container" @click="handleContainerClick">
    <Navbar :has-local-settings="true" @open-settings="goToSettings" />

    <!-- API Key Warning Banner -->
    <div v-if="!hasApiKey" class="warning-banner" @click="goToSettings">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          <strong>API features unavailable</strong>
          <p>Add your Gemini API key for AI feedback</p>
        </div>
        <span class="warning-action">Click to add →</span>
      </div>
    </div>

    <div class="practice-content">
      <h1 class="page-title">Today's Practice</h1>
      
      <div v-if="loading" class="loading">Loading today's sentence...</div>

      <div v-else-if="sentence" class="practice-card">
        <div class="header">
          <div class="header-actions">
            <span class="category-badge">{{ formatCategory(sentence.category) }}</span>
            <button @click="refreshSentence" class="refresh-btn" :disabled="loading" title="Get a different sentence">
              <RefreshCw :size="18" />
            </button>
          </div>
        </div>

        <div class="sentence-display">
          <p class="sentence">{{ sentence.sentence }}</p>
        </div>

        <div class="controls">
          <button @click="toggleAudio" class="control-btn play-btn" :disabled="false">
            <div class="btn-content">
              <Square v-if="isPlaying" :size="18" class="btn-icon-svg" />
              <Volume2 v-else :size="18" class="btn-icon-svg" />
              <span class="btn-text">{{ isPlaying ? 'Stop' : 'Listen' }}</span>
            </div>
          </button>

          <button 
            @click="toggleRecording" 
            class="control-btn record-btn"
            :class="{ recording: isRecording }"
            :disabled="analyzingAI"
          >
            <div class="btn-content">
              <Mic :size="20" class="btn-icon-svg" />
              <span class="btn-text">
                <template v-if="analyzingAI">Analyzing...</template>
                <template v-else-if="isRecording">Stop Recording</template>
                <template v-else>Start Recording</template>
              </span>
            </div>
          </button>
        </div>

        <!-- Recording indicator -->
        <div v-if="isRecording" class="recording-indicator">
          <div class="recording-pulse"></div>
          <span class="recording-text">Recording in progress... Speak clearly</span>
          <span class="recording-interim" v-if="userTranscript">{{ userTranscript }}</span>
        </div>

        <div v-if="userTranscript" class="results">
          <div class="results-header">
            <h3>Your Recording:</h3>
            <button 
              v-if="recordedAudioBlob" 
              @click="togglePlayRecording" 
              class="play-recording-btn"
              :class="{ playing: isPlayingRecording }"
            >
              <span v-if="isPlayingRecording">⏸️ Pause</span>
              <span v-else>▶️ Play Your Voice</span>
            </button>
          </div>
          <p class="user-text">{{ userTranscript }}</p>

          <div class="scores-container">
            <div class="score-card">
              <div class="score-label">Completeness Score</div>
              <div class="score-value" :class="accuracyClass">
                {{ accuracyScore }}%
              </div>
              <div class="score-description">Word accuracy</div>
            </div>

            <div v-if="aiScore > 0" class="score-card ai-score-card">
              <div class="score-label">AI Communication Score</div>
              <div class="score-value" :class="getAIScoreClass(aiScore)">
                {{ aiScore }}%
              </div>
              <div class="score-description">Delivery & clarity</div>
            </div>
          </div>

          <div class="feedback">
            <p v-if="accuracyScore >= 90" class="excellent">🎉 Excellent! Almost perfect!</p>
            <p v-else-if="accuracyScore >= 70" class="good">👍 Good job! Keep practicing!</p>
            <p v-else class="needs-work">💪 Keep trying! Practice makes perfect!</p>
          </div>

          <div v-if="analyzingAI" class="ai-analyzing">
            <p>🤖 AI analyzing your speech...</p>
          </div>

          <div v-if="aiAnalysis" class="ai-analysis">
            <h4>{{ aiScore > 0 ? '🎯 AI Coach Feedback:' : 'AI analysis not performed' }}</h4>
            <p>{{ aiAnalysis }}</p>
          </div>

          <button @click="tryAgain" class="control-btn retry-btn">
            🔄 Try Again
          </button>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <div class="modal-content" @click.stop>
        <button @click="showSettings = false" class="modal-close-btn" aria-label="Close settings">✕</button>
        <h2>⚙️ Settings</h2>
        
        <div class="settings-section">
          <h3>🤖 Gemini API Key</h3>
          <p class="api-key-description">
            Your Gemini API key enables AI speech analysis and feedback. 
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key here</a>
          </p>
          <div class="api-key-input-group">
            <input 
              v-model="apiKeyInput" 
              type="password" 
              placeholder="Enter your Gemini API key"
              class="api-key-input"
            />
            <button @click="saveApiKey" class="btn-primary" :disabled="savingApiKey">
              {{ savingApiKey ? 'Saving...' : (hasApiKey ? 'Update' : 'Save') }}
            </button>
            <button 
              v-if="hasApiKey" 
              @click="deleteApiKey" 
              class="btn-danger-outline"
              :disabled="deletingApiKey"
            >
              {{ deletingApiKey ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
          <p v-if="hasApiKey" class="api-key-status success">✅ API key saved - AI analysis enabled</p>
          <p v-else class="api-key-status warning">⚠️ No API key - AI analysis unavailable</p>
        </div>

        <div class="settings-section">
          <h3>👤 Account</h3>
          <button @click="handleLogoutFromSettings" class="btn-secondary" style="width: 100%;">🚪 Logout</button>
        </div>

        <div class="settings-section">
          <h3>⚠️ Danger Zone</h3>
          
          <div class="danger-action">
            <div class="danger-info">
              <h4>🔄 Start Fresh</h4>
              <p>Delete all your practice data (sessions, scores, progress) but keep your account.</p>
            </div>
            <button @click="confirmReset = true" class="btn-danger">Reset Data</button>
          </div>

          <div class="danger-action">
            <div class="danger-info">
              <h4>🗑️ Delete Account</h4>
              <p>Permanently delete your account and all data. This cannot be undone.</p>
            </div>
            <button @click="confirmDelete = true" class="btn-danger">Delete Account</button>
          </div>
        </div>

        <button @click="showSettings = false" class="btn-secondary">Close</button>
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <div v-if="confirmReset" class="modal-overlay" @click="confirmReset = false">
      <div class="modal-content confirm-modal" @click.stop>
        <h2>⚠️ Confirm Reset</h2>
        <p>Are you sure you want to delete all your practice data? This will remove:</p>
        <ul>
          <li>All practice sessions</li>
          <li>Progress statistics</li>
          <li>Achievements and scores</li>
        </ul>
        <p><strong>Your account will remain active.</strong></p>
        <div class="modal-actions">
          <button @click="resetUserData" class="btn-danger" :disabled="resetting">
            {{ resetting ? 'Resetting...' : 'Yes, Reset My Data' }}
          </button>
          <button @click="confirmReset = false" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="confirmDelete" class="modal-overlay" @click="confirmDelete = false">
      <div class="modal-content confirm-modal" @click.stop>
        <h2>⚠️ Confirm Account Deletion</h2>
        <p>Are you sure you want to permanently delete your account?</p>
        <p><strong>This action cannot be undone!</strong></p>
        <div class="modal-actions">
          <button @click="deleteAccount" class="btn-danger" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Yes, Delete My Account' }}
          </button>
          <button @click="confirmDelete = false" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshCw, Volume2, Square, Mic } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { usePracticeStore } from '../stores/practice'
import { speakText, stopSpeaking, SpeechRecognizer, calculateAccuracy, analyzeVoiceWithAI } from '../lib/speech'
import Navbar from '../components/Navbar.vue'

const router = useRouter()
const authStore = useAuthStore()
const practiceStore = usePracticeStore()

const sentence = ref(null)
const loading = ref(true)
const error = ref('')
const isPlaying = ref(false)
const isRecording = ref(false)
const userTranscript = ref('')
const accuracyScore = ref(0)
const aiScore = ref(0)
const aiAnalysis = ref('')
const analyzingAI = ref(false)
const startTime = ref(null)
const showSettings = ref(false)
const confirmReset = ref(false)
const confirmDelete = ref(false)
const resetting = ref(false)
const deleting = ref(false)

// Gemini API Key (used for AI analysis)
const apiKeyInput = ref('')
const savingApiKey = ref(false)
const deletingApiKey = ref(false)
const hasApiKey = ref(false)

const recordedAudioBlob = ref(null)
const isPlayingRecording = ref(false)
const audioElement = ref(null)

let recognizer = null

const handleContainerClick = () => {
  // This will be handled by the navbar's menu overlay
  // No need to manually close menu here
}

const handleEscKey = (e) => {
  if (e.key === 'Escape') {
    if (confirmDelete.value) {
      confirmDelete.value = false
    } else if (confirmReset.value) {
      confirmReset.value = false
    } else if (showSettings.value) {
      showSettings.value = false
    }
  }
}

const accuracyClass = computed(() => {
  if (accuracyScore.value >= 90) return 'excellent'
  if (accuracyScore.value >= 70) return 'good'
  return 'needs-work'
})

const getAIScoreClass = (score) => {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  return 'needs-work'
}

const formatCategory = (category) => {
  if (!category) return ''
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const refreshSentence = async () => {
  try {
    loading.value = true
    error.value = ''
    // Reset current practice state
    userTranscript.value = ''
    accuracyScore.value = 0
    aiScore.value = 0
    aiAnalysis.value = ''
    recordedAudioBlob.value = null
    // Fetch a new sentence (will get a random one from today's sentences)
    sentence.value = await practiceStore.fetchTodaySentence()
  } catch (err) {
    error.value = err.message || 'Failed to load new sentence'
  } finally {
    loading.value = false
  }
}

// Consolidated onMounted hook
onMounted(async () => {
  // Add keyboard event listener
  window.addEventListener('keydown', handleEscKey)
  
  // Load voices for better TTS quality
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices()
    // Some browsers need this event
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices()
    }
  }
  
  try {
    // Initialize speech recognizer
    try {
      recognizer = new SpeechRecognizer()
      console.log('Speech recognizer initialized successfully')
    } catch (err) {
      console.error('Speech recognizer initialization failed:', err)
      error.value = 'Speech recognition not supported in this browser. Please use Chrome or Edge.'
    }

    // Check if API key exists (used for AI analysis)
    hasApiKey.value = await authStore.hasGeminiApiKey()

    // Fetch today's sentence
    sentence.value = await practiceStore.fetchTodaySentence()
  } catch (err) {
    console.error('Initialization error:', err)
    error.value = err.message || 'Failed to load sentence'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})

const toggleAudio = async () => {
  if (isPlaying.value) {
    stopSpeaking()
    isPlaying.value = false
    return
  }
  
  if (!sentence.value) return

  try {
    isPlaying.value = true
    error.value = ''
    await speakText(sentence.value.sentence)
  } catch (err) {
    console.log('Audio stopped or error:', err)
  } finally {
    isPlaying.value = false
  }
}

const toggleRecording = async () => {
  if (isRecording.value) {
    // User clicked to stop recording manually
    // Immediately set state to stopped for instant UI feedback
    isRecording.value = false
    await stopRecording()
    return
  }
  
  // Immediately set state to recording for instant UI feedback
  isRecording.value = true
  startRecording()
}

const startRecording = async () => {
  if (!recognizer) {
    error.value = 'Speech recognition not available'
    isRecording.value = false
    return
  }

  // Note: isRecording is already set to true in toggleRecording for instant feedback
  console.log('Starting speech recognition...')

  // Stop any ongoing audio playback
  if (isPlaying.value) {
    stopSpeaking()
    isPlaying.value = false
  }

  try {
    error.value = ''
    userTranscript.value = ''
    accuracyScore.value = 0
    aiScore.value = 0
    aiAnalysis.value = ''
    startTime.value = Date.now()
    
    // Setup result handler for interim results
    recognizer.onResult = (result) => {
      if (result && result.transcript) {
        userTranscript.value = result.transcript
      }
    }
    
    // Setup error handler
    recognizer.onError = (err) => {
      console.error('Recognition error:', err)
      error.value = err.message || 'Recording error occurred'
      isRecording.value = false
    }
    
    await recognizer.start()
  } catch (err) {
    console.error('Recording error:', err)
    error.value = err.message || 'Failed to record. Please check microphone permissions and try again.'
    isRecording.value = false
  }
}

const stopRecording = async () => {
  if (!recognizer) return
  
  try {
    console.log('Stopping recording...')
    const result = await recognizer.stop()
    
    if (!result || !result.text) {
      error.value = 'No speech detected. Please try again.'
      return
    }
    
    console.log('Recording stopped, text:', result.text)
    userTranscript.value = result.text
    recordedAudioBlob.value = result.audioBlob

    // Calculate accuracy
    accuracyScore.value = parseFloat(calculateAccuracy(sentence.value.sentence, result.text))

    // Get AI analysis with audio (only if completeness score >= 40%)
    if (accuracyScore.value >= 40) {
      console.log('Starting AI analysis...')
      analyzingAI.value = true
      try {
        const aiResult = await analyzeVoiceWithAI(
          result.text, 
          sentence.value.sentence, 
          result.audioBlob
        )
        console.log('AI Analysis result:', aiResult)
        if (aiResult && aiResult.aiScore) {
          aiAnalysis.value = aiResult.analysis
          aiScore.value = aiResult.aiScore
          console.log('✅ AI Score set to:', aiScore.value)
        } else {
          console.warn('AI analysis returned null or missing aiScore:', aiResult)
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError)
      } finally {
        analyzingAI.value = false
      }
    } else {
      console.log('Skipping AI analysis - completeness score below 40%')
      aiAnalysis.value = 'Speak more to perform AI analysis. The sentence was too short to provide meaningful feedback.'
      aiScore.value = 0
    }

    // Calculate duration
    const duration = Math.floor((Date.now() - startTime.value) / 1000)

    // Save session
    await practiceStore.savePracticeSession(
      sentence.value.id,
      accuracyScore.value,
      duration,
      aiScore.value
    )
  } catch (err) {
    console.error('Stop recording error:', err)
    error.value = err.message || 'Failed to process recording.'
  }
}

const tryAgain = () => {
  userTranscript.value = ''
  accuracyScore.value = 0
  aiAnalysis.value = ''
  aiScore.value = 0
  error.value = ''
  recordedAudioBlob.value = null
  isPlayingRecording.value = false
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
}

const togglePlayRecording = () => {
  if (!recordedAudioBlob.value) return
  
  if (isPlayingRecording.value) {
    audioElement.value?.pause()
    isPlayingRecording.value = false
    return
  }
  
  const audioUrl = URL.createObjectURL(recordedAudioBlob.value)
  audioElement.value = new Audio(audioUrl)
  
  audioElement.value.onended = () => {
    isPlayingRecording.value = false
    URL.revokeObjectURL(audioUrl)
  }
  
  audioElement.value.onerror = () => {
    isPlayingRecording.value = false
    error.value = 'Failed to play recording'
    URL.revokeObjectURL(audioUrl)
  }
  
  audioElement.value.play()
  isPlayingRecording.value = true
}

const goToSettings = async () => {
  showSettings.value = true
  // Load current API key status when opening settings
  apiKeyInput.value = ''
  hasApiKey.value = await authStore.hasGeminiApiKey()
}

const saveApiKey = async () => {
  if (!apiKeyInput.value.trim()) {
    alert('Please enter an API key')
    return
  }
  
  try {
    savingApiKey.value = true
    await authStore.saveGeminiApiKey(apiKeyInput.value.trim())
    hasApiKey.value = true
    alert('✅ Gemini API key saved! AI analysis enabled.')
    apiKeyInput.value = ''
  } catch (error) {
    console.error('Save API key error:', error)
    alert('❌ Failed to save API key: ' + error.message)
  } finally {
    savingApiKey.value = false
  }
}

const deleteApiKey = async () => {
  if (!confirm('Are you sure you want to delete your API key? You will lose AI analysis features.')) {
    return
  }
  
  try {
    deletingApiKey.value = true
    await authStore.deleteGeminiApiKey()
    hasApiKey.value = false
    apiKeyInput.value = ''
    alert('✅ API key deleted.')
  } catch (error) {
    console.error('Delete API key error:', error)
    alert('❌ Failed to delete API key: ' + error.message)
  } finally {
    deletingApiKey.value = false
  }
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

const handleLogoutFromSettings = async () => {
  await authStore.signOut()
  router.push('/login')
}

const resetUserData = async () => {
  try {
    resetting.value = true
    await practiceStore.resetUserData()
    confirmReset.value = false
    showSettings.value = false
    alert('✅ Your data has been reset successfully!')
  } catch (error) {
    console.error('Reset error:', error)
    alert('❌ Failed to reset data: ' + error.message)
  } finally {
    resetting.value = false
  }
}

const deleteAccount = async () => {
  try {
    deleting.value = true
    await authStore.deleteAccount()
    confirmDelete.value = false
    router.push('/login')
  } catch (error) {
    console.error('Delete account error:', error)
    alert('❌ Failed to delete account: ' + error.message)
    deleting.value = false
  }
}
</script>

<style scoped>
.practice-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.practice-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px 60px 20px;
}

.page-title {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 30px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.warning-banner {
  background: linear-gradient(135deg, #ff9a00 0%, #ff6b6b 100%);
  color: white;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.warning-banner:hover {
  background: linear-gradient(135deg, #ff8800 0%, #ff5555 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.warning-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.warning-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.warning-text {
  flex: 1;
}

.warning-text strong {
  display: block;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.warning-text p {
  margin: 0;
  opacity: 0.95;
  font-size: 0.9rem;
}

.warning-action {
  font-weight: 600;
  white-space: nowrap;
  font-size: 1rem;
}

.practice-content {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  color: white;
  font-size: 1.2rem;
  padding: 40px;
}

.practice-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 50px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  overflow-x: hidden;
  max-width: 100%;
}

.practice-card:hover {
  box-shadow: 0 24px 96px rgba(0, 0, 0, 0.18);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-badge {
  background: #667eea;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.refresh-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  transform: rotate(180deg) scale(1.1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.sentence-display {
  background: transparent;
  padding: 20px 0;
  border-radius: 0;
  margin-bottom: 30px;
  border-left: none;
  box-shadow: none;
  transition: all 0.3s ease;
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
}

.sentence-display:hover {
  transform: none;
  box-shadow: none;
}

.sentence {
  font-size: 1.15rem;
  line-height: 1.75;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-align: justify;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: none;
  white-space: normal;
  max-width: 100%;
  display: block;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.control-btn {
  flex: 1;
  min-width: 200px;
  padding: 18px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-icon {
  font-size: 1.3rem;
}

.btn-icon-svg {
  stroke-width: 2.5;
}

.btn-text {
  font-size: 1.05rem;
}

.ai-badge {
  font-size: 0.7rem;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-weight: 500;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.play-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
}

.play-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(76, 175, 80, 0.5);
}

.record-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.record-btn.recording {
  animation: pulse 1.5s infinite;
  background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);
  box-shadow: 0 4px 20px rgba(244, 67, 54, 0.5);
}

.record-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
}

.record-btn.recording:hover:not(:disabled) {
  box-shadow: 0 6px 25px rgba(244, 67, 54, 0.6);
}

.retry-btn {
  background: #667eea;
  color: white;
  margin-top: 20px;
}

.retry-btn:hover {
  background: #5568d3;
}

.control-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.record-btn:disabled {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  box-shadow: 0 4px 15px rgba(158, 158, 158, 0.3);
}

.results {
  margin-top: 30px;
  padding: 0;
  background: transparent;
  border-radius: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 15px;
  flex-wrap: wrap;
}

.play-recording-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
}

.play-recording-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.play-recording-btn.playing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);
}

.play-recording-btn.playing:hover {
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.results h3 {
  margin-top: 0;
  color: #667eea;
}

.user-text {
  padding: 15px;
  background: white;
  border-radius: 10px;
  margin: 15px 0;
  font-size: 1rem;
  color: #333;
  text-align: justify;
  max-height: 350px;
  overflow-y: auto;
  overflow-x: hidden;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: none;
  white-space: normal;
  line-height: 1.6;
  max-width: 100%;
  display: block;
}

.scores-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.score-card {
  background: transparent;
  border-radius: 0;
  padding: 20px 0;
  text-align: center;
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.score-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0;
  background: transparent;
}

.score-card:hover {
  transform: none;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.ai-score-card::before {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.ai-score-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 50%, rgba(240, 147, 251, 0.12) 100%);
  border-color: rgba(102, 126, 234, 0.25);
}

.ai-score-card:hover {
  border-color: rgba(102, 126, 234, 0.4);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.25);
}

.score-label {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  color: #6b7280;
}

.score-value {
  font-size: 3.2rem;
  font-weight: 800;
  margin: 15px 0;
  letter-spacing: -1.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.score-value.excellent {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 12px rgba(16, 185, 129, 0.3);
}

.score-value.good {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 12px rgba(251, 191, 36, 0.3);
}

.score-value.needs-work {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 12px rgba(239, 68, 68, 0.3);
}

.score-description {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ai-score-card .score-label {
  color: #667eea;
  font-weight: 800;
}

.score-value {
  font-size: 3.2rem;
  font-weight: 800;
  margin: 15px 0;
  letter-spacing: -1.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.score-value.excellent {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-value.good {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-value.needs-work {
  background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-score-card .score-value.excellent {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: brightness(1.2);
}

.ai-score-card .score-value.good {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: brightness(1.2);
}

.ai-score-card .score-value.needs-work {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: brightness(1.2);
}

.score-description {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-top: 5px;
}

.ai-score-card .score-description {
  color: #764ba2;
  font-weight: 600;
}

.accuracy-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 10px;
  margin: 15px 0;
}

.accuracy-label {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.accuracy-value {
  font-size: 2rem;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 10px;
}

.accuracy-value.excellent {
  background: #4caf50;
  color: white;
}

.accuracy-value.good {
  background: #ff9800;
  color: white;
}

.accuracy-value.needs-work {
  background: #f44336;
  color: white;
}

.feedback {
  margin-top: 15px;
}

.feedback p {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  padding: 12px;
  border-radius: 8px;
}

.feedback .excellent {
  background: #e8f5e9;
  color: #2e7d32;
}

.feedback .good {
  background: #fff3e0;
  color: #e65100;
}

.feedback .needs-work {
  background: #ffebee;
  color: #c62828;
}

.ai-analyzing {
  margin-top: 20px;
  padding: 15px;
  background: #f3e5f5;
  border-radius: 10px;
  text-align: center;
  animation: pulse 1.5s infinite;
}

.ai-analyzing p {
  color: #7b1fa2;
  margin: 0;
  font-weight: 500;
}

.ai-analysis {
  margin-top: 25px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.95) 0%, rgba(245, 87, 108, 0.95) 100%);
  border-radius: 18px;
  color: white;
  box-shadow: 0 8px 24px rgba(240, 147, 251, 0.35);
  animation: slideIn 0.4s ease-out;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-analysis h4 {
  margin: 0 0 15px 0;
  font-size: 1.2em;
  font-weight: 700;
  letter-spacing: -0.3px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-analysis p {
  margin: 0;
  line-height: 1.8;
  font-size: 1.05em;
  opacity: 0.98;
  font-weight: 500;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.error {
  margin-top: 20px;
  padding: 15px;
  background: #ffebee;
  color: #c62828;
  border-radius: 10px;
  text-align: center;
}

/* Settings Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  line-height: 1;
  padding: 0;
}

.modal-close-btn:hover {
  background: #f0f0f0;
  color: #333;
  transform: rotate(90deg);
}

.modal-content h2 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 28px;
}

.modal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  line-height: 1;
  padding: 0;
}

.modal-close-btn:hover {
  background: #f0f0f0;
  color: #333;
  transform: rotate(90deg);
}

.settings-section {
  margin: 25px 0;
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.settings-section:first-of-type h3 {
  color: #667eea;
}

.settings-section:nth-of-type(2) h3 {
  color: #333;
}

.settings-section:last-of-type h3 {
  color: #f44336;
}

.api-key-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
  line-height: 1.5;
}

.api-key-description a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.api-key-description a:hover {
  text-decoration: underline;
}

.api-key-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.api-key-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.api-key-input:focus {
  outline: none;
  border-color: #667eea;
}

.api-key-status {
  font-size: 0.9rem;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 10px;
}

.api-key-status.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.api-key-status.warning {
  background: #fff3e0;
  color: #e65100;
}

.btn-danger-outline {
  padding: 12px 20px;
  background: white;
  color: #f44336;
  border: 2px solid #f44336;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-danger-outline:hover:not(:disabled) {
  background: #f44336;
  color: white;
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff5f5;
  border: 2px solid #ffebee;
  border-radius: 8px;
  margin-bottom: 15px;
}

.danger-info {
  flex: 1;
  margin-right: 20px;
}

.danger-info h4 {
  margin: 0 0 8px 0;
  color: #f44336;
  font-size: 1rem;
}

.danger-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.btn-danger {
  padding: 14px 28px;
  background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.25);
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.35);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  letter-spacing: 0.3px;
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.btn-secondary {
  width: 100%;
  padding: 14px 28px;
  background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
  color: #2c3e50;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  letter-spacing: 0.3px;
  margin-top: 20px;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, #d0d0d0 0%, #a0a0a0 100%);
}

.confirm-modal {
  max-width: 450px;
}

.confirm-modal ul {
  text-align: left;
  margin: 20px 0;
  padding-left: 25px;
  color: #666;
}

.confirm-modal li {
  margin: 8px 0;
  line-height: 1.5;
}

.confirm-modal p {
  color: #666;
  line-height: 1.6;
  margin: 15px 0;
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

.modal-actions .btn-danger,
.modal-actions .btn-secondary {
  flex: 1;
}

.error {
  margin-top: 20px;
  padding: 15px;
  background: #ffebee;
  color: #c62828;
  border-radius: 10px;
  text-align: center;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes recording-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.5;
  }
}

.recording-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  margin: 20px 0;
  background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
  border: 2px solid #f48fb1;
  border-radius: 12px;
  animation: pulse 2s ease-in-out infinite;
}

.recording-pulse {
  width: 20px;
  height: 20px;
  background: #e91e63;
  border-radius: 50%;
  animation: recording-pulse 1.5s ease-in-out infinite;
}

.recording-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #c2185b;
  text-align: center;
}

.recording-interim {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  font-style: italic;
  padding: 10px;
  background: white;
  border-radius: 8px;
  max-width: 90%;
  word-wrap: break-word;
}

@media (max-width: 768px) {
  .practice-content {
    padding: 0;
    margin: 15px 0;
  }

  .practice-card {
    padding: 20px 15px;
    border-radius: 12px;
  }

  .header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .header h1 {
    font-size: 1.1rem;
  }

  .category-badge {
    font-size: 0.7rem;
    padding: 4px 10px;
  }

  .sentence-display {
    padding: 12px 0;
    margin-bottom: 15px;
    max-height: 350px;
  }

  .sentence {
    font-size: 0.95rem;
    line-height: 1.65;
  }

  .control-btn {
    padding: 12px 16px;
    font-size: 0.9rem;
    min-width: 150px;
  }

  .btn-text {
    font-size: 0.9rem;
  }

  .btn-icon {
    font-size: 1.1rem;
  }

  .btn-icon-svg {
    width: 16px;
    height: 16px;
  }

  .results {
    padding: 0;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .play-recording-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    width: 100%;
  }

  .results h3 {
    font-size: 0.95rem;
  }

  .user-text {
    font-size: 0.85rem;
    padding: 10px;
    max-height: 200px;
  }

  .scores-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .score-card {
    padding: 12px 0;
  }

  .score-label {
    font-size: 0.7rem;
  }

  .score-value {
    font-size: 2rem;
  }

  .score-description {
    font-size: 0.7rem;
  }

  .feedback p {
    font-size: 0.9rem;
  }

  .ai-analysis {
    padding: 15px 12px;
  }

  .ai-analysis h4 {
    font-size: 0.95rem;
  }

  .ai-analysis p {
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .modal-content {
    padding: 15px 12px;
    max-height: 92vh;
    font-size: 0.9rem;
  }

  .modal-content h2 {
    font-size: 1.2rem;
    margin-bottom: 15px;
  }

  .settings-section h3 {
    font-size: 0.95rem;
  }

  .api-key-description {
    font-size: 0.8rem;
  }

  .api-key-input {
    font-size: 0.85rem;
    padding: 10px;
  }

  .danger-action {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .danger-info h4 {
    font-size: 0.9rem;
  }

  .danger-info p {
    font-size: 0.8rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-danger, .btn-secondary {
    font-size: 0.85rem;
    padding: 10px 20px;
  }
}
</style>
