<template>
  <div>
    <!-- Menu Overlay -->
    <div v-if="showMenu" class="menu-overlay" @click="showMenu = false"></div>
    
    <nav class="navbar">
      <div class="nav-content">
        <router-link :to="authStore.isAuthenticated ? '/practice' : '/login'" class="logo-link">
          <h2><img src="/ullai-logo.png" alt="U'llai" class="logo-image" /> U'llai</h2>
        </router-link>
        <div class="nav-actions">
          <!-- User Profile Display -->
          <router-link 
            v-if="authStore.isAuthenticated && userProfile" 
            to="/settings"
            class="user-profile"
          >
            <img 
              :src="`/${userProfile.avatar_url || 'avatar1.svg'}`" 
              :alt="userProfile.username"
              class="user-avatar"
              @error="handleImageError"
            />
            <span class="username">{{ userProfile.username }}</span>
          </router-link>
          <button @click.stop="showMenu = !showMenu" class="menu-btn">☰</button>
          <div v-if="showMenu" class="dropdown-menu" @click.stop>
            <!-- Authenticated menu -->
            <template v-if="authStore.isAuthenticated">
              <router-link to="/practice" class="menu-item" @click="showMenu = false">
                <Mic :size="18" />
                <span>Practice</span>
              </router-link>
              <router-link to="/dashboard" class="menu-item" @click="showMenu = false">
                <TrendingUp :size="18" />
                <span>Dashboard</span>
              </router-link>
              <router-link to="/leaderboard" class="menu-item" @click="showMenu = false">
                <Trophy :size="18" />
                <span>Leaderboard</span>
              </router-link>
              <button @click="handleSettingsClick" class="menu-item">
                <Settings :size="18" />
                <span>Settings</span>
              </button>
              <router-link to="/about" class="menu-item" @click="showMenu = false">
                <Info :size="18" />
                <span>About</span>
              </router-link>
              <router-link to="/support" class="menu-item" @click="showMenu = false">
                <Heart :size="18" />
                <span>Support</span>
              </router-link>
              <router-link to="/stats" class="menu-item" @click="showMenu = false">
                <BarChart :size="18" />
                <span>App Stats</span>
              </router-link>
              <router-link to="/contact" class="menu-item" @click="showMenu = false">
                <Mail :size="18" />
                <span>Contact</span>
              </router-link>
              <button @click="handleLogout" class="menu-item logout">
                <LogOut :size="18" />
                <span>Logout</span>
              </button>
            </template>
            
            <!-- Non-authenticated menu -->
            <template v-else>
              <router-link to="/about" class="menu-item" @click="showMenu = false">
                <Info :size="18" />
                <span>About</span>
              </router-link>
              <router-link to="/support" class="menu-item" @click="showMenu = false">
                <Heart :size="18" />
                <span>Support</span>
              </router-link>
              <router-link to="/stats" class="menu-item" @click="showMenu = false">
                <BarChart :size="18" />
                <span>App Stats</span>
              </router-link>
              <router-link to="/login" class="menu-item" @click="showMenu = false">
                <LogOut :size="18" style="transform: rotate(180deg);" />
                <span>Login</span>
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Mic, TrendingUp, Settings, LogOut, Info, Mail, Heart, BarChart, Trophy } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const props = defineProps({
  hasLocalSettings: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-settings'])

const router = useRouter()
const authStore = useAuthStore()
const showMenu = ref(false)
const userProfile = ref(null)

const fetchUserProfile = async () => {
  if (!authStore.user) {
    userProfile.value = null
    return
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username, avatar_url')
      .eq('user_id', authStore.user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return
    }

    userProfile.value = data
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
  }
}

const handleImageError = (e) => {
  e.target.src = '/avatar1.svg'
}

const handleEscKey = (e) => {
  if (e.key === 'Escape' && showMenu.value) {
    showMenu.value = false
  }
}

const handleSettingsClick = () => {
  showMenu.value = false
  router.push('/settings')
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('keydown', handleEscKey)
  fetchUserProfile()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})

// Watch for authentication changes
watch(() => authStore.user, () => {
  fetchUserProfile()
})
</script>

<style scoped>
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

.nav-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  transition: all 0.3s ease;
  text-decoration: none;
  cursor: pointer;
}

.user-profile:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #667eea;
  object-fit: cover;
}

.username {
  font-weight: 600;
  color: #667eea;
  font-size: 0.95rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.menu-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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
  gap: 12px;
  padding: 14px 20px;
  color: #333;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.95rem;
}

.menu-item svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  flex-shrink: 0;
}

.menu-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  padding-left: 24px;
}

.menu-item.logout {
  border-top: 1px solid #eee;
  color: #e74c3c;
}

.menu-item.logout:hover {
  background: rgba(231, 76, 60, 0.1);
}

@media (max-width: 768px) {
  .logo-image {
    height: 26px;
  }

  .nav-content h2 {
    font-size: 1.1rem;
  }

  .nav-content {
    padding: 0 12px;
  }

  .user-profile {
    gap: 6px;
    padding: 4px 8px;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
  }

  .username {
    font-size: 0.85rem;
    max-width: 80px;
  }

  .menu-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .dropdown-menu {
    min-width: 180px;
  }

  .menu-item {
    padding: 12px 16px;
    font-size: 0.9rem;
  }

  .menu-item:hover {
    padding-left: 20px;
  }
}

@media (max-width: 480px) {
  .username {
    display: none;
  }

  .user-profile {
    padding: 4px;
  }
}
</style>
