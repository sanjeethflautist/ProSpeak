<template>
  <div class="support-container">
    <nav class="navbar">
      <div class="nav-content">
        <router-link to="/practice" class="logo-link">
          <h2><span class="logo-icon">PS</span> ProSpeak</h2>
        </router-link>
        <div class="nav-actions">
          <button @click="showMenu = !showMenu" class="menu-btn">☰ Menu</button>
          <div v-if="showMenu" class="dropdown-menu" @click="showMenu = false">
            <router-link to="/practice" class="menu-item">
              <Mic :size="18" />
              <span>Practice</span>
            </router-link>
            <router-link to="/dashboard" class="menu-item">
              <TrendingUp :size="18" />
              <span>Dashboard</span>
            </router-link>
            <router-link to="/support" class="menu-item">
              <Heart :size="18" />
              <span>Support</span>
            </router-link>
            <router-link to="/about" class="menu-item">
              <Info :size="18" />
              <span>About</span>
            </router-link>
            <router-link to="/contact" class="menu-item">
              <Mail :size="18" />
              <span>Contact</span>
            </router-link>
            <button @click="handleLogout" class="menu-item logout">
              <LogOut :size="18" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="support-content">
      <div class="support-card">
        <h1>💝 Support ProSpeak</h1>
        <p class="support-intro">
          Thank you for using ProSpeak! Your support helps maintain and improve this platform, 
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
            allowing ProSpeak to grow and serve more learners worldwide.
          </p>
          <p class="gratitude">
            With heartfelt gratitude,<br>
            <strong>- The ProSpeak Team</strong>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mic, TrendingUp, Heart, Info, Mail, LogOut, Coffee, Copy, Check } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showMenu = ref(false)
const copied = ref(false)

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

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.support-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40px;
}

.navbar {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  padding: 15px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.nav-content h2 {
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  -webkit-text-fill-color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9em;
}

.nav-actions {
  position: relative;
}

.menu-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.menu-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.dropdown-menu {
  position: absolute;
  top: 120%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 200px;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
}

.menu-item:hover {
  background: #f8f9fa;
  transform: translateX(4px);
}

.menu-item.logout {
  color: #dc3545;
  margin-top: 4px;
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.support-content {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
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
