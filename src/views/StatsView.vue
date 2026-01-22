<template>
  <div class="stats-container" @click="handleContainerClick">
    <Navbar :has-local-settings="false" />

    <div class="stats-content">
      <h1 class="page-title">App Statistics</h1>

      <div v-if="loading" class="loading">Loading statistics...</div>

      <div v-else class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ stats.activeUsers }}</div>
          <div class="stat-label">Active Users</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">{{ stats.retentionRate }}%</div>
          <div class="stat-label">User Retention</div>
          <div class="stat-sublabel">Average daily practice rate</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{{ stats.totalSessions }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
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
const loading = ref(true)

const stats = ref({
  activeUsers: 0,
  retentionRate: 0,
  totalSessions: 0,
  completedSessions: 0
})

const handleContainerClick = () => {
  // No action needed
}

const fetchStats = async () => {
  try {
    loading.value = true

    // Get stats from the app_stats table
    const { data, error } = await supabase
      .from('app_stats')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) throw error

    if (data) {
      stats.value = {
        activeUsers: data.active_users || 0,
        retentionRate: data.retention_rate || 0,
        totalSessions: data.total_sessions || 0,
        completedSessions: data.completed_sessions || 0
      }
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.stats-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.page-title {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.loading {
  text-align: center;
  color: white;
  font-size: 1.2rem;
  padding: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 3.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.2rem;
  color: #666;
  font-weight: 500;
}

.stat-sublabel {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.5rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .logo-image {
    height: 26px;
  }

  .nav-content h2 {
    font-size: 1.1rem;
  }

  .stats-content {
    padding: 2rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stat-card {
    padding: 2rem 1.5rem;
  }

  .stat-value {
    font-size: 3rem;
  }
}
</style>
