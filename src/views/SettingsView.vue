<template>
  <div class="settings-container">
    <Navbar :has-local-settings="false" />
    
    <div class="settings-content">
      <h1 class="page-title">⚙️ Settings</h1>
      
      <div class="settings-section">
        <h2>👤 Profile</h2>
        <div class="profile-section">
          <div class="current-avatar-display">
            <img 
              :src="`/${currentProfile?.avatar_url || 'avatar1.svg'}`" 
              :alt="currentProfile?.username"
              class="current-avatar-image"
              @error="handleImageError"
            />
            <div class="current-username">{{ currentProfile?.username || 'Loading...' }}</div>
          </div>

          <div class="profile-field">
            <label for="username">Username</label>
            <div class="username-input-group">
              <input 
                v-model="usernameInput" 
                type="text" 
                id="username"
                placeholder="Enter new username"
                class="profile-input"
                maxlength="30"
              />
              <button @click="updateUsername" class="btn-primary" :disabled="savingProfile || !usernameInput.trim()">
                {{ savingProfile ? 'Saving...' : 'Update' }}
              </button>
            </div>
            <p class="field-hint">Choose a unique username (3-30 characters)</p>
          </div>

          <div class="profile-field">
            <label>Profile Picture</label>
            <div class="avatar-grid">
              <div 
                v-for="avatar in avatarOptions" 
                :key="avatar"
                @click="selectAvatar(avatar)"
                :class="['avatar-option', { 
                  selected: selectedAvatar === avatar || (!selectedAvatar && currentProfile?.avatar_url === avatar)
                }]"
              >
                <img 
                  :src="`/${avatar}`" 
                  :alt="avatar"
                  @error="handleImageError"
                />
              </div>
            </div>
            <button 
              v-if="selectedAvatar" 
              @click="updateAvatar" 
              class="btn-primary" 
              :disabled="savingProfile"
              style="margin-top: 1rem; width: 100%;"
            >
              {{ savingProfile ? 'Saving...' : 'Save Avatar' }}
            </button>
          </div>
        </div>
      </div>

      <div class="settings-section" ref="apiKeySection">
        <h2>🤖 Gemini API Key</h2>
        <p class="api-key-description">
          Add your own Gemini API key for AI-powered speech analysis. 
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key here</a>
        </p>
        
        <div class="billing-disclaimer">
          <strong>⚠️ Important:</strong> You are responsible for your own Gemini API subscription and any charges. 
          U'llai is NOT responsible for any bills. We only send your voice to Gemini using your key in a secured way.
          <br><br>
          <strong>💡 Suggestion:</strong> We suggest you to use free tier Gemini API.
        </div>
        
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
        <p v-if="hasApiKey" class="api-key-status success">✅ API key saved</p>
        <p v-else class="api-key-status warning">⚠️ No API key saved - using default (may have rate limits)</p>
      </div>
      
      <div class="settings-section">
        <h2>� Privacy & Leaderboard</h2>
        <div class="privacy-info">
          <p><strong>GDPR Compliance:</strong> Your data is yours. We process your information as follows:</p>
          <ul>
            <li>🎯 <strong>Practice Data:</strong> Session scores and progress are stored to track your improvement</li>
            <li>👤 <strong>Profile:</strong> Username and avatar are used for identification</li>
            <li>🏆 <strong>Leaderboard:</strong> If enabled, your username, avatar, and stats are visible to all users</li>
            <li>🔐 <strong>Security:</strong> All data encrypted at rest, API keys encrypted with AES-256</li>
            <li>🗑️ <strong>Right to Erasure:</strong> You can delete all your data at any time using "Delete Account"</li>
          </ul>
        </div>
        
        <div class="privacy-toggle">
          <div class="toggle-info">
            <h3>🏆 Appear in Leaderboard</h3>
            <p>Allow other users to see your username, avatar, and practice statistics in the public leaderboard.</p>
            <p class="privacy-note">⚠️ When disabled, you can still view the leaderboard but won't appear in rankings.</p>
          </div>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              v-model="showInLeaderboard"
              @change="updateLeaderboardVisibility"
              :disabled="updatingPrivacy"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>�👤 Account</h2>
        <button @click="handleLogout" class="btn-secondary" style="width: 100%;">🚪 Logout</button>
      </div>

      <div class="settings-section danger-zone">
        <h2>⚠️ Danger Zone</h2>
        
        <div class="danger-action">
          <div class="danger-info">
            <h3>🔄 Start Fresh</h3>
            <p>Delete all your practice data (sessions, scores, progress) but keep your account.</p>
          </div>
          <button @click="confirmReset = true" class="btn-danger">Reset Data</button>
        </div>

        <div class="danger-action">
          <div class="danger-info">
            <h3>🗑️ Delete Account</h3>
            <p>Permanently delete your account and all data. This cannot be undone.</p>
          </div>
          <button @click="confirmDelete = true" class="btn-danger">Delete Account</button>
        </div>
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const apiKeyInput = ref('')
const savingApiKey = ref(false)
const deletingApiKey = ref(false)
const hasApiKey = ref(false)
const confirmReset = ref(false)
const confirmDelete = ref(false)
const resetting = ref(false)
const deleting = ref(false)

// Profile management
const currentProfile = ref(null)
const usernameInput = ref('')
const selectedAvatar = ref(null)
const savingProfile = ref(false)
const apiKeySection = ref(null)
const showInLeaderboard = ref(true)
const updatingPrivacy = ref(false)

const avatarOptions = [
  'avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg',
  'avatar5.svg', 'avatar6.svg', 'avatar7.svg', 'avatar8.svg',
  'avatar9.svg', 'avatar10.svg', 'avatar11.svg', 'avatar12.svg'
]

const handleEscKey = (e) => {
  if (e.key === 'Escape') {
    if (confirmDelete.value) {
      confirmDelete.value = false
    } else if (confirmReset.value) {
      confirmReset.value = false
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleEscKey)
  hasApiKey.value = await authStore.hasGeminiApiKey()
  await loadUserProfile()
  
  // Check if we should scroll to API key section
  if (route.query.scrollTo === 'api-key') {
    await nextTick()
    scrollToApiKey()
  }
})

const scrollToApiKey = () => {
  if (apiKeySection.value) {
    apiKeySection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Add a slight delay and highlight effect
    setTimeout(() => {
      apiKeySection.value.style.animation = 'highlight 1.5s ease'
    }, 500)
  }
}

// Watch for route changes in case user navigates to settings with query param
watch(() => route.query.scrollTo, (newValue) => {
  if (newValue === 'api-key') {
    nextTick(() => {
      scrollToApiKey()
    })
  }
})

const loadUserProfile = async () => {
  try {
    if (!authStore.user) return

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authStore.user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
      return
    }

    currentProfile.value = data
    showInLeaderboard.value = data.show_in_leaderboard ?? true
  } catch (error) {
    console.error('Load profile error:', error)
  }
}

const updateLeaderboardVisibility = async () => {
  try {
    updatingPrivacy.value = true

    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        show_in_leaderboard: showInLeaderboard.value,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authStore.user.id)

    if (error) throw error

    alert(showInLeaderboard.value 
      ? '✅ You will now appear in the leaderboard' 
      : '✅ You are now hidden from the leaderboard')
  } catch (error) {
    console.error('Update leaderboard visibility error:', error)
    alert('❌ Failed to update privacy settings: ' + error.message)
    // Revert the toggle
    showInLeaderboard.value = !showInLeaderboard.value
  } finally {
    updatingPrivacy.value = false
  }
}

const updateUsername = async () => {
  const newUsername = usernameInput.value.trim()
  
  if (!newUsername) {
    alert('Please enter a username')
    return
  }

  if (newUsername.length < 3 || newUsername.length > 30) {
    alert('Username must be between 3 and 30 characters')
    return
  }

  try {
    savingProfile.value = true

    const { error } = await supabase
      .from('user_profiles')
      .update({ username: newUsername, updated_at: new Date().toISOString() })
      .eq('user_id', authStore.user.id)

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        alert('❌ This username is already taken. Please choose another.')
      } else {
        throw error
      }
      return
    }

    currentProfile.value.username = newUsername
    usernameInput.value = ''
    alert('✅ Username updated successfully!')
  } catch (error) {
    console.error('Update username error:', error)
    alert('❌ Failed to update username: ' + error.message)
  } finally {
    savingProfile.value = false
  }
}

const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
}

const updateAvatar = async () => {
  if (!selectedAvatar.value) return

  try {
    savingProfile.value = true

    const { error } = await supabase
      .from('user_profiles')
      .update({ avatar_url: selectedAvatar.value, updated_at: new Date().toISOString() })
      .eq('user_id', authStore.user.id)

    if (error) throw error

    currentProfile.value.avatar_url = selectedAvatar.value
    selectedAvatar.value = null
    alert('✅ Avatar updated successfully!')
  } catch (error) {
    console.error('Update avatar error:', error)
    alert('❌ Failed to update avatar: ' + error.message)
  } finally {
    savingProfile.value = false
  }
}

const handleImageError = (e) => {
  e.target.src = '/avatar1.svg'
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})

const saveApiKey = async () => {
  if (!apiKeyInput.value.trim()) {
    alert('Please enter an API key')
    return
  }

  try {
    savingApiKey.value = true
    await authStore.saveGeminiApiKey(apiKeyInput.value.trim())
    hasApiKey.value = true
    alert('✅ API key saved successfully!')
    apiKeyInput.value = ''
  } catch (error) {
    console.error('Save API key error:', error)
    alert('❌ Failed to save API key: ' + error.message)
  } finally {
    savingApiKey.value = false
  }
}

const deleteApiKey = async () => {
  if (!confirm('Are you sure you want to delete your API key?')) {
    return
  }

  try {
    deletingApiKey.value = true
    await authStore.deleteGeminiApiKey()
    hasApiKey.value = false
    apiKeyInput.value = ''
    alert('✅ API key deleted successfully!')
  } catch (error) {
    console.error('Delete API key error:', error)
    alert('❌ Failed to delete API key: ' + error.message)
  } finally {
    deletingApiKey.value = false
  }
}

const handleLogout = async () => {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    alert('Failed to logout')
  }
}

const resetUserData = async () => {
  try {
    resetting.value = true
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Not authenticated')
    }

    // Delete all user's practice sessions
    const { error: sessionsError } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('user_id', user.id)

    if (sessionsError) throw sessionsError

    // Delete all user's progress data
    const { error: progressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', user.id)

    if (progressError) throw progressError

    alert('✅ Your data has been reset successfully!')
    confirmReset.value = false
    
    // Redirect to practice page
    router.push('/practice')
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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Not authenticated')
    }

    // Delete user account (cascading deletes will handle related data)
    const { error } = await supabase.rpc('delete_user')

    if (error) throw error

    await authStore.signOut()
    alert('✅ Your account has been deleted')
    router.push('/login')
  } catch (error) {
    console.error('Delete account error:', error)
    alert('❌ Failed to delete account: ' + error.message)
  } finally {
    deleting.value = false
    confirmDelete.value = false
  }
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40px;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-title {
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.settings-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.settings-section h2 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.settings-section h3 {
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

/* Profile Section */
.profile-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.current-avatar-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.current-avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.current-username {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-field label {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.username-input-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.profile-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.profile-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.field-hint {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.avatar-option {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-option:hover {
  transform: scale(1.1);
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.avatar-option.selected {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
  transform: scale(1.05);
}

.avatar-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Privacy Section */
.privacy-info {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.privacy-info p {
  margin: 0 0 0.75rem 0;
  color: #333;
  line-height: 1.6;
}

.privacy-info ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #555;
}

.privacy-info li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.privacy-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.toggle-info {
  flex: 1;
}

.toggle-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.toggle-info p {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.privacy-note {
  font-size: 0.85rem;
  color: #856404;
  background: #fff3cd;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  margin-top: 0.75rem;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 60px;
  height: 34px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #667eea;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* API Key Section */
.api-key-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.api-key-description a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.api-key-description a:hover {
  text-decoration: underline;
}

.settings-section h3 {
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 8px;
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

.billing-disclaimer {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 12px 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #856404;
  line-height: 1.5;
}

.billing-disclaimer strong {
  color: #856404;
  font-weight: 700;
}

.api-key-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.api-key-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.api-key-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.api-key-status {
  margin: 10px 0 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.api-key-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.api-key-status.warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.danger-zone h2 {
  color: #f44336;
  border-bottom-color: #ffcdd2;
}

.danger-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  margin-bottom: 16px;
  background-color: #fff5f5;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  gap: 20px;
}

.danger-action:last-of-type {
  margin-bottom: 0;
}

.danger-info h3 {
  color: #333;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.danger-info p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-danger,
.btn-danger-outline {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(244, 67, 54, 0.4);
}

.btn-danger-outline {
  background-color: white;
  color: #f44336;
  border: 2px solid #f44336;
}

.btn-danger-outline:hover:not(:disabled) {
  background-color: #f44336;
  color: white;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.confirm-modal h2 {
  color: #f44336;
  margin-bottom: 20px;
}

.confirm-modal ul {
  margin: 16px 0;
  padding-left: 24px;
  color: #666;
}

.confirm-modal li {
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions button {
  flex: 1;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .settings-content {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 2rem;
    margin-bottom: 24px;
  }

  .settings-section {
    padding: 20px;
  }

  .settings-section h2 {
    font-size: 1.3rem;
  }

  .api-key-input-group {
    flex-direction: column;
  }

  .api-key-input,
  .username-input-group {
    width: 100%;
    flex-direction: column;
  }

  .avatar-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.75rem;
  }

  .avatar-option {
    width: 60px;
    height: 60px;
  }

  .danger-action {
    flex-direction: column;
    text-align: center;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .btn-danger-outline {
    width: 100%;
  }

  .modal-content {
    padding: 24px;
  }

  .modal-actions {
    flex-direction: column;
  }
}

@keyframes highlight {
  0% {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 0 30px rgba(102, 126, 234, 0.6), 0 10px 40px rgba(0, 0, 0, 0.2);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    transform: scale(1);
  }
}
</style>
