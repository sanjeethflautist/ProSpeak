<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo">
        <h1><span class="logo-icon">PS</span> ProSpeak</h1>
        <p class="tagline">Master IT Business Communication</p>
      </div>

      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          Login
        </button>
        <button 
          :class="{ active: activeTab === 'signup' }"
          @click="activeTab = 'signup'"
        >
          Sign Up
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            minlength="6"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Processing...' : (activeTab === 'login' ? 'Login' : 'Sign Up') }}
        </button>
      </form>

      <div class="footer-text">
        {{ activeTab === 'login' ? "Don't have an account?" : "Already have an account?" }}
        <button class="link-btn" @click="toggleTab">
          {{ activeTab === 'login' ? 'Sign Up' : 'Login' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const toggleTab = () => {
  activeTab.value = activeTab.value === 'login' ? 'signup' : 'login'
  error.value = ''
  success.value = ''
}

const handleSubmit = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    if (activeTab.value === 'login') {
      await authStore.signIn(email.value, password.value)
      router.push('/practice')
    } else {
      await authStore.signUp(email.value, password.value)
      success.value = 'Account created! Please check your email to confirm.'
      setTimeout(() => {
        activeTab.value = 'login'
        success.value = ''
      }, 3000)
    }
  } catch (err) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo h1 {
  font-size: 2.5rem;
  margin: 0;
  color: #667eea;
  font-weight: 700;
}

.tagline {
  color: #666;
  margin-top: 8px;
  font-size: 0.95rem;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
}

.tabs button {
  flex: 1;
  padding: 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s;
}

.tabs button.active {
  background: #667eea;
  color: white;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.submit-btn {
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #5568d3;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  font-size: 0.9rem;
}

.success-message {
  padding: 12px;
  background: #efe;
  color: #3c3;
  border-radius: 8px;
  font-size: 0.9rem;
}

.footer-text {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 0.95rem;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0 4px;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
