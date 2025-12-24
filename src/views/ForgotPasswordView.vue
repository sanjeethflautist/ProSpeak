<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="logo">
        <h1><span class="logo-icon">PS</span> ProSpeakAI</h1>
        <p class="tagline">Reset Your Password</p>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <p class="instruction">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            :disabled="loading || emailSent"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading || emailSent">
          {{ loading ? 'Sending...' : emailSent ? 'Email Sent!' : 'Send Reset Link' }}
        </button>
      </form>

      <div class="footer-text">
        Remember your password?
        <router-link to="/login" class="link-btn">
          Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const emailSent = ref(false)

const handleSubmit = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await authStore.sendPasswordResetEmail(email.value)
    success.value = 'Password reset link sent! Check your email inbox.'
    emailSent.value = true
  } catch (err) {
    error.value = err.message || 'Failed to send reset email. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.forgot-password-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  padding: 50px 40px;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 450px;
}

.logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo h1 {
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.logo-icon {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  -webkit-text-fill-color: white;
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 0.9em;
}

.tagline {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.form {
  margin-bottom: 25px;
}

.instruction {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 25px;
  text-align: center;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  border: 1px solid #fcc;
}

.success-message {
  background: #efe;
  color: #3c3;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  border: 1px solid #cfc;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.footer-text {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 5px;
  text-decoration: none;
  transition: color 0.2s;
}

.link-btn:hover {
  color: #764ba2;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .forgot-password-card {
    padding: 30px 25px;
  }

  .logo h1 {
    font-size: 1.8rem;
  }

  .tagline {
    font-size: 0.9rem;
  }
}
</style>
