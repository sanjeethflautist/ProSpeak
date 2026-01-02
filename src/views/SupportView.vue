<template>
  <div class="support-container" @click="handleContainerClick">
    <Navbar :has-local-settings="false" />

    <div class="support-content">
      <h1 class="page-title">💝 Support U'llai</h1>
      
      <div class="support-card">
        <p class="support-intro">
          Thank you for using U'llai! Your support helps maintain and improve this platform, 
          ensuring it remains free and accessible for everyone learning to communicate better.
        </p>

        <div class="support-methods">
          <div class="support-method">
            <h2>☕ Buy Me a Coffee</h2>
            <p>Support via Buy Me a Coffee platform</p>
            <a 
              href="https://buymeacoffee.com/sanjeethnayak" 
              target="_blank" 
              rel="noopener noreferrer"
              class="support-btn coffee-btn"
            >
              <Coffee :size="20" />
              <span>buymeacoffee.com/sanjeethnayak</span>
            </a>
          </div>

          <div class="support-method">
            <h2>🇮🇳 UPI Payment (India)</h2>
            <p>Scan the QR code or use the UPI ID</p>
            <div class="upi-container">
              <div class="qr-code">
                <img :src="upiQrCode" alt="UPI QR Code" />
              </div>
              <div class="upi-details">
                <div class="upi-id">
                  <span class="upi-label">UPI ID:</span>
                  <code class="upi-value">sanjeeth.nayak@ybl</code>
                  <button @click="copyUPI" class="copy-btn" :title="copied ? 'Copied!' : 'Copy UPI ID'">
                    <Check v-if="copied" :size="16" />
                    <Copy v-else :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="thanks-message">
          <h3>🙏 Thank You!</h3>
          <p>
            Every contribution, no matter how small, makes a huge difference. 
            Your support helps cover hosting costs, API expenses, and development time, 
            allowing U'llai to grow and serve more learners worldwide.
          </p>
          <p class="gratitude">
            With heartfelt gratitude,<br>
            <strong>- The U'llai Team</strong>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Coffee, Copy, Check } from 'lucide-vue-next'
import Navbar from '../components/Navbar.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const copied = ref(false)

const handleContainerClick = () => {
  // No action needed
}

// Generate UPI QR code URL using UPI deep link
const upiQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=sanjeeth.nayak@ybl%26pn=Sanjeeth%20Nayak%26cu=INR`

const copyUPI = async () => {
  try {
    await navigator.clipboard.writeText('sanjeeth.nayak@ybl')
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.support-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40px;
}

.support-content {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.page-title {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 30px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.support-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.support-card h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2.2rem;
  font-weight: 800;
}

.support-intro {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 40px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.support-methods {
  display: grid;
  gap: 30px;
  margin-bottom: 40px;
}

.support-method {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 16px;
  border: 2px solid #e9ecef;
}

.support-method h2 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.4rem;
  font-weight: 700;
}

.support-method p {
  color: #666;
  margin-bottom: 20px;
}

.support-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
}

.support-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.coffee-btn {
  background: linear-gradient(135deg, #FFDD00 0%, #FBB034 100%);
  color: #333;
}

.upi-container {
  display: flex;
  gap: 30px;
  align-items: center;
  flex-wrap: wrap;
}

.qr-code {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.qr-code img {
  display: block;
  width: 200px;
  height: 200px;
  border-radius: 8px;
}

.upi-details {
  flex: 1;
  min-width: 250px;
}

.upi-id {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.upi-label {
  font-weight: 600;
  color: #666;
}

.upi-value {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  color: #667eea;
  font-weight: 700;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 6px;
}

.copy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.copy-btn:hover {
  transform: scale(1.05);
}

.thanks-message {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  border: 2px solid #667eea30;
}

.thanks-message h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.6rem;
  font-weight: 700;
}

.thanks-message p {
  color: #666;
  line-height: 1.8;
  font-size: 1.05rem;
  margin-bottom: 15px;
}

.gratitude {
  margin-top: 20px;
  font-style: italic;
  color: #667eea;
  font-size: 1.1rem;
}

.gratitude strong {
  color: #764ba2;
}

@media (max-width: 768px) {
  .logo-image {
    height: 26px;
  }

  .nav-content h2 {
    font-size: 1.1rem;
  }

  .support-card {
    padding: 20px 15px;
  }

  .support-card h1 {
    font-size: 1.6rem;
  }

  .support-intro {
    font-size: 1rem;
  }

  .support-method {
    padding: 20px 15px;
  }

  .support-method h2 {
    font-size: 1.2rem;
  }

  .support-btn {
    width: 100%;
    justify-content: center;
    font-size: 0.85rem;
    padding: 12px 16px;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .support-btn span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .upi-container {
    flex-direction: column;
    align-items: center;
  }

  .qr-code img {
    width: 180px;
    height: 180px;
  }

  .upi-id {
    flex-wrap: wrap;
    justify-content: center;
  }

  .upi-value {
    font-size: 0.95rem;
    word-break: break-all;
  }

  .thanks-message {
    padding: 20px 15px;
  }

  .thanks-message h3 {
    font-size: 1.3rem;
  }

  .thanks-message p {
    font-size: 0.95rem;
  }
}
</style>
