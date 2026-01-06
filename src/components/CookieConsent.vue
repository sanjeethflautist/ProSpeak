<template>
  <div v-if="!hasConsent" class="cookie-banner">
    <div class="cookie-content">
      <div class="cookie-icon">🍪</div>
      <div class="cookie-text">
        <h3>We use cookies</h3>
        <p>
          This app requires essential cookies to function properly. These cookies are necessary for 
          authentication and cannot be disabled. Learn more in our 
          <router-link to="/about" class="privacy-link">Privacy Policy</router-link>.
        </p>
        <ul class="cookie-list">
          <li>🔐 <strong>Authentication (Required):</strong> Supabase session cookies for login/signup</li>
          <li>⚙️ <strong>Preferences (Required):</strong> Save your settings and API key locally</li>
          <li>📊 <strong>No Tracking:</strong> We don't use analytics or advertising cookies</li>
        </ul>
        <p class="cookie-notice">
          ⚠️ <strong>Note:</strong> Declining essential cookies will prevent you from using the app's features (login, practice, etc.).
        </p>
      </div>
      <div class="cookie-actions">
        <button @click="acceptCookies" class="btn-accept">
          ✓ Accept Essential Cookies
        </button>
        <button @click="rejectCookies" class="btn-reject">
          ✗ Decline (app won't work)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const hasConsent = ref(true)

onMounted(() => {
  // Check if user has already given consent
  const consent = localStorage.getItem('cookie-consent')
  if (!consent) {
    hasConsent.value = false
  }
})

const acceptCookies = () => {
  localStorage.setItem('cookie-consent', 'accepted')
  localStorage.setItem('cookie-consent-date', new Date().toISOString())
  hasConsent.value = true
}

const rejectCookies = () => {
  if (confirm('⚠️ Without essential cookies, you cannot use this app (no login, practice, or data saving). Are you sure you want to decline?')) {
    localStorage.setItem('cookie-consent', 'declined')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    hasConsent.value = true
    // Redirect to about page with message
    window.location.href = '/#/about?cookies-declined=true'
  }
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.cookie-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.cookie-text {
  flex: 1;
}

.cookie-text h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.cookie-text p {
  margin: 0 0 1rem 0;
  color: #666;
  line-height: 1.6;
}

.privacy-link {
  color: #667eea;
  text-decoration: underline;
  font-weight: 600;
}

.privacy-link:hover {
  color: #764ba2;
}

.cookie-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.cookie-list li {
 

.cookie-notice {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #856404;
} padding: 0.4rem 0;
  color: #555;
  font-size: 0.95rem;
}

.cookie-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-accept,
.btn-reject {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 0.95rem;
}

.btn-accept {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-accept:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-reject {
  background: white;
  color: #666;
  border: 2px solid #ddd;
}

.btn-reject:hover {
  border-color: #999;
  color: #333;
}

@media (max-width: 968px) {
  .cookie-content {
    flex-direction: column;
    padding: 1.5rem;
  }

  .cookie-icon {
    font-size: 2rem;
  }

  .cookie-actions {
    flex-direction: row;
    width: 100%;
  }

  .btn-accept,
  .btn-reject {
    flex: 1;
  }
}

@media (max-width: 580px) {
  .cookie-content {
    padding: 1rem;
  }

  .cookie-text h3 {
    font-size: 1.1rem;
  }

  .cookie-text p {
    font-size: 0.9rem;
  }

  .cookie-list {
    font-size: 0.85rem;
  }

  .cookie-actions {
    flex-direction: column;
  }

  .btn-accept,
  .btn-reject {
    width: 100%;
  }
}
</style>
