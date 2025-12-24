<template>
  <div class="about-container">
    <nav class="navbar">
      <div class="nav-content">
        <h2><span class="logo-icon">PS</span> ProSpeakAI</h2>
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

    <div class="about-content">
      <div class="about-card">
        <h1>About ProSpeakAI</h1>
        
        <section class="section">
          <h2>🎯 Our Mission</h2>
          <p>
            ProSpeakAI is an educational platform designed to help you improve your communication and pronunciation skills 
            through daily practice sessions. Our goal is to make speech practice accessible, engaging, and effective for everyone.
          </p>
        </section>

        <section class="section">
          <h2>🚀 How It Works</h2>
          <ul>
            <li><strong>Daily Practice:</strong> Get a new sentence to practice every day</li>
            <li><strong>Voice Recording:</strong> Record yourself speaking the sentence</li>
            <li><strong>Instant Feedback:</strong> Receive immediate accuracy scores</li>
            <li><strong>AI Coaching:</strong> Get personalized feedback from AI (with your own API key)</li>
            <li><strong>Track Progress:</strong> Monitor your improvement over time</li>
          </ul>
        </section>

        <section class="section">
          <h2>🔒 Privacy & Data Protection</h2>
          
          <div class="privacy-card">
            <h3>GDPR Compliance Notice</h3>
            <p>
              <strong>Educational Purpose:</strong> This application is provided for educational purposes only to help users 
              improve their communication skills.
            </p>
            
            <h4>Data We Store:</h4>
            <ul>
              <li><strong>Account Information:</strong> Your email address and authentication details (managed securely by Supabase)</li>
              <li><strong>Practice Data:</strong> Your practice session transcripts (text only) and scores - <em>no voice recordings are stored</em></li>
              <li><strong>Progress Metrics:</strong> Your performance statistics and improvement trends</li>
              <li><strong>API Keys (Optional):</strong> If provided, your Gemini API key is encrypted and stored securely</li>
            </ul>

            <h4>How We Use Your Data:</h4>
            <ul>
              <li>✅ To provide you with personalized practice sessions and feedback</li>
              <li>✅ To track and display your progress over time</li>
              <li>✅ To improve your learning experience within the application</li>
              <li>❌ <strong>NOT</strong> shared with any third parties</li>
              <li>❌ <strong>NOT</strong> used for marketing purposes</li>
              <li>❌ <strong>NOT</strong> sold or transferred to anyone</li>
            </ul>

            <h4>Your Rights:</h4>
            <p>You have complete control over your data:</p>
            <ul>
              <li><strong>Access:</strong> View all your practice data in the dashboard</li>
              <li><strong>Deletion:</strong> Delete all your practice data anytime (Settings → Reset Data)</li>
              <li><strong>Account Closure:</strong> Delete your entire account (Settings → Delete Account)</li>
            </ul>

            <h4>Security Measures:</h4>
            <ul>
              <li>🔐 All data is encrypted in transit and at rest</li>
              <li>🔐 API keys are encrypted using AES-256 encryption</li>
              <li>🔐 Row-level security ensures you can only access your own data</li>
              <li>🔐 Secure authentication through Supabase Auth</li>
            </ul>

            <h4>No Personal Information Misuse:</h4>
            <p>
              <strong>We guarantee:</strong> Your personal information and practice data (transcripts and scores) are stored 
              solely for your educational benefit within this application. <strong>Voice recordings are processed in real-time 
              and never stored.</strong> We do not analyze, share, or use your data for any purpose other than providing you 
              with the speech practice and feedback features.
            </p>
          </div>
        </section>

        <section class="section">
          <h2>🤖 AI Integration</h2>
          <p>
            ProSpeakAI uses Google's Gemini AI to provide intelligent feedback on your speech. To use this feature, 
            you can add your own Gemini API key in Settings. Your API key is:
          </p>
          <ul>
            <li>Encrypted before storage using AES-256 encryption</li>
            <li>Only decrypted server-side when analyzing your speech</li>
            <li>Never exposed to the client or transmitted in plain text</li>
            <li>Can be deleted at any time from Settings</li>
          </ul>
        </section>

        <section class="section">
          <h2>📧 Contact</h2>
          <p>
            If you have questions about your data, privacy concerns, or want to exercise your data rights, 
            please contact us through the application settings or your account email.
          </p>
        </section>

        <section class="section disclaimer">
          <h2>⚠️ Disclaimer</h2>
          <p>
            This is an educational tool. By using ProSpeakAI, you acknowledge that:
          </p>
          <ul>
            <li>The application is provided "as is" for learning purposes</li>
            <li>AI feedback is generated automatically and may not always be perfect</li>
            <li>You are responsible for your own API key costs if you choose to use Gemini AI</li>
            <li>We recommend backing up important data as this is an educational project</li>
          </ul>
        </section>

        <div class="version-info">
          <p>Version 1.0.0 | Built with ❤️ for better communication</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Mic, TrendingUp, LogOut, Info } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const showMenu = ref(false)

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  color: #333;
}

.nav-actions {
  position: relative;
}

.menu-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
  z-index: 100;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  width: 100%;
  border: none;
  background: none;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1rem;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.logout {
  color: #e74c3c;
  border-top: 1px solid #eee;
}

.menu-item.logout:hover {
  background: #fee;
}

.about-content {
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
}

.about-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.about-card h1 {
  color: #667eea;
  margin-bottom: 30px;
  font-size: 2.5rem;
  text-align: center;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section h3 {
  color: #667eea;
  font-size: 1.4rem;
  margin-top: 20px;
  margin-bottom: 10px;
}

.section h4 {
  color: #555;
  font-size: 1.2rem;
  margin-top: 20px;
  margin-bottom: 10px;
}

.section p {
  color: #666;
  line-height: 1.8;
  margin-bottom: 15px;
  font-size: 1.05rem;
}

.section ul {
  color: #666;
  line-height: 1.8;
  margin-left: 20px;
  margin-bottom: 15px;
}

.section li {
  margin-bottom: 10px;
  font-size: 1.05rem;
}

.section li strong {
  color: #333;
}

.privacy-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
  border-left: 4px solid #667eea;
  padding: 25px;
  border-radius: 12px;
  margin-top: 20px;
}

.privacy-card h3 {
  color: #667eea;
  margin-top: 0;
  font-size: 1.5rem;
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
  margin-right: 8px;
}

.privacy-card h4 {
  color: #764ba2;
  margin-top: 25px;
}

.privacy-card p {
  margin: 15px 0;
}

.privacy-card ul {
  margin-top: 10px;
}

.disclaimer {
  background: #fff3cd;
  border-left: 4px solid #ff9a00;
  padding: 20px;
  border-radius: 12px;
}

.disclaimer h2 {
  color: #ff9a00;
}

.disclaimer ul {
  margin-top: 15px;
}

.version-info {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .about-card {
    padding: 25px;
  }

  .about-card h1 {
    font-size: 2rem;
  }

  .section h2 {
    font-size: 1.5rem;
  }

  .section p, .section li {
    font-size: 1rem;
  }
}
</style>
