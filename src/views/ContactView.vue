<template>
  <div class="contact-container" @click="handleContainerClick">
    <Navbar :has-local-settings="false" />

    <div class="contact-content">
      <h1 class="page-title">📬 Contact Us</h1>
      
      <div class="contact-card">
        <p class="subtitle">Have a bug report, suggestion, or feedback? We'd love to hear from you!</p>

        <form @submit.prevent="submitFeedback" class="feedback-form">
          <div class="form-group">
            <label for="type">Feedback Type *</label>
            <select v-model="form.type" id="type" required>
              <option value="">Select type...</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="suggestion">💡 Suggestion</option>
              <option value="feature">✨ Feature Request</option>
              <option value="other">💬 Other Feedback</option>
            </select>
          </div>

          <div class="form-group">
            <label for="subject">Subject *</label>
            <input 
              v-model="form.subject" 
              type="text" 
              id="subject" 
              placeholder="Brief description of your feedback"
              required
              maxlength="200"
            />
          </div>

          <div class="form-group">
            <label for="message">Message *</label>
            <textarea 
              v-model="form.message" 
              id="message" 
              rows="6"
              placeholder="Please provide details..."
              required
              maxlength="2000"
            ></textarea>
            <small>{{ form.message.length }}/2000 characters</small>
          </div>

          <div class="form-group">
            <label for="email">Email (optional)</label>
            <input 
              v-model="form.email" 
              type="email" 
              id="email" 
              placeholder="your@email.com (if you want a response)"
            />
            <small>We'll use your account email if left blank</small>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="success" class="success-message">
            ✅ Thank you! Your feedback has been submitted successfully.
          </div>

          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? 'Sending...' : '📤 Submit Feedback' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

const handleContainerClick = () => {
  // No action needed
}

const form = ref({
  type: '',
  subject: '',
  message: '',
  email: ''
})

const submitting = ref(false)
const error = ref('')
const success = ref(false)

const submitFeedback = async () => {
  error.value = ''
  success.value = false
  
  try {
    submitting.value = true
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id,
        type: form.value.type,
        subject: form.value.subject,
        message: form.value.message,
        email: form.value.email || user?.email
      })
    
    if (insertError) throw insertError
    
    success.value = true
    
    // Reset form
    form.value = {
      type: '',
      subject: '',
      message: '',
      email: ''
    }
    
    // Scroll to top to see success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (err) {
    console.error('Feedback submission error:', err)
    error.value = 'Failed to submit feedback. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.contact-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.contact-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-title {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 30px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 900;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 800;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-content h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.logo-link:hover h2 {
  opacity: 0.8;
  transition: opacity 0.2s;
}

.logo-image {
  height: 35px;
  width: auto;
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
}

.logo-icon {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.85em;
}

.nav-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  position: relative;
}

.menu-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
}

.menu-btn:hover {
  background: #5568d3;
}

.dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 14px 20px;
  text-align: left;
  border: none;
  background: none;
  color: #2c3e50;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  gap: 12px;
  font-family: inherit;
}

.menu-item svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.menu-item:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  padding-left: 24px;
  color: #667eea;
}

.menu-item.logout {
  color: #e53935;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 4px;
}

.menu-item.logout:hover {
  background: linear-gradient(90deg, rgba(229, 57, 53, 0.08) 0%, rgba(244, 67, 54, 0.08) 100%);
  color: #c62828;
}

.contact-content {
  max-width: 700px;
  margin: 40px auto;
  padding: 0 20px;
}

.page-title {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 30px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.contact-card {
  background: white;
  border-radius: 24px;
  padding: 50px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.15);
}

.contact-card h1 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 2.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 40px;
  line-height: 1.6;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-group small {
  color: #999;
  font-size: 0.85rem;
}

.error-message {
  padding: 14px;
  background: #ffebee;
  color: #c62828;
  border-radius: 10px;
  font-weight: 500;
}

.success-message {
  padding: 14px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 10px;
  font-weight: 500;
}

.submit-btn {
  padding: 16px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .nav-content {
    padding: 0 12px;
  }

  .nav-content h2 {
    font-size: 1.1rem;
  }

  .logo-image {
    height: 26px;
  }

  .contact-content {
    padding: 0 12px;
    margin: 20px auto;
  }

  .contact-card {
    padding: 20px;
    border-radius: 16px;
  }

  .contact-card h1 {
    font-size: 1.6rem;
  }

  .subtitle {
    font-size: 0.95rem;
    margin-bottom: 25px;
  }

  .feedback-form {
    gap: 18px;
  }

  .form-group label {
    font-size: 0.85rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 10px;
    font-size: 0.9rem;
  }

  .form-group textarea {
    min-height: 100px;
  }

  .submit-btn {
    padding: 12px 24px;
    font-size: 0.95rem;
  }
}
</style>
