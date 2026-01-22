<template>
  <div class="dashboard-container" @click="handleContainerClick">
    <Navbar :has-local-settings="true" @open-settings="goToSettings" />

    <div class="dashboard-content">
      <h1 class="page-title">Your Progress Dashboard</h1>

      <div v-if="loading" class="loading">Loading your progress...</div>

      <div v-else class="dashboard-grid">
        <!-- Stats Cards -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ progress?.total_sessions || 0 }}</div>
            <div class="stat-label">Total Sessions</div>
          </div>

          <!-- Completed Sentences removed -->

          <!-- Completeness Score removed -->

          <div class="stat-card">
            <div class="stat-icon">🤖</div>
            <div class="stat-value">{{ averageAIScore }}%</div>
            <div class="stat-label">AI Communication Score</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">{{ progress?.current_streak || 0 }}</div>
            <div class="stat-label">Current Streak</div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <div class="chart-card">
            <h3>AI Score Over Time</h3>
            <div class="chart-wrapper">
              <canvas ref="accuracyChartCanvas"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <h3>Practice Frequency</h3>
            <div class="chart-wrapper">
              <canvas ref="frequencyChartCanvas"></canvas>
            </div>
          </div>
        </div>
<!-- Achievements -->
        <div class="achievements-card">
          <h3>🏆 Achievements</h3>
          <div class="achievements-grid">
            <div class="achievement" :class="{ unlocked: progress?.total_sessions >= 1 }">
              <div class="achievement-icon">🎉</div>
              <div class="achievement-name">First Steps</div>
              <div class="achievement-desc">Complete 1 session</div>
            </div>
            <div class="achievement" :class="{ unlocked: progress?.current_streak >= 7 }">
              <div class="achievement-icon">🔥</div>
              <div class="achievement-name">Week Warrior</div>
              <div class="achievement-desc">7-day streak</div>
            </div>
            <div class="achievement" :class="{ unlocked: Number(averageAIScore) >= 90 }">
              <div class="achievement-icon">🎯</div>
              <div class="achievement-name">Communication Pro</div>
              <div class="achievement-desc">90% avg AI score</div>
            </div>
            <div class="achievement" :class="{ unlocked: progress?.total_sentences >= 50 }">
              <div class="achievement-icon">💪</div>
              <div class="achievement-name">Master Speaker</div>
              <div class="achievement-desc">50 sentences</div>
            </div>
          </div>
        </div>
        <!-- Recent Sessions -->
        <div class="recent-sessions">
          <h3>Recent Practice Sessions</h3>
          <div v-if="sessions.length === 0" class="empty-state">
            No practice sessions yet. Start practicing today!
          </div>
          <div v-else class="sessions-list">
            <div v-for="session in sessions" :key="session.id" class="session-item">
              <div class="session-header">
                <span class="session-date">{{ formatDate(session.created_at) }}</span>
                <div class="session-scores">
                  <span v-if="session.ai_score" class="score-badge ai-score">
                    🤖 {{ session.ai_score }}%
                  </span>
                </div>
              </div>
              <div class="session-meta">
                <span class="session-category">{{ formatCategory(session.daily_sentences?.category) }}</span>
                <span class="session-duration">⏱️ {{ session.duration_seconds }}s</span>
                <button @click="deleteSession(session.id)" class="delete-session-btn" title="Delete this session">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import Navbar from '../components/Navbar.vue'
import { useAuthStore } from '../stores/auth'
import { usePracticeStore } from '../stores/practice'
import { supabase } from '../lib/supabase'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const authStore = useAuthStore()
const practiceStore = usePracticeStore()

const loading = ref(true)
const progress = ref(null)
const sessions = ref([])
const accuracyChartCanvas = ref(null)
const frequencyChartCanvas = ref(null)

let accuracyChart = null
let frequencyChart = null

const handleContainerClick = () => {
  // Container click already handled by overlay
}

const handleEscKey = (e) => {
  if (e.key === 'Escape') {
    // Escape key handling for future modals
  }
}

const goToSettings = () => {
  router.push({ path: '/settings', query: { scrollTo: 'api-key' } })
}

// Computed property to calculate average AI score from sessions
const averageAIScore = computed(() => {
  if (!sessions.value || sessions.value.length === 0) return 0
  const sessionsWithAI = sessions.value.filter(s => s.ai_score != null && s.ai_score > 0)
  if (sessionsWithAI.length === 0) return 0
  const sum = sessionsWithAI.reduce((acc, s) => acc + parseFloat(s.ai_score), 0)
  return (sum / sessionsWithAI.length).toFixed(0)
})

onMounted(async () => {
  window.addEventListener('keydown', handleEscKey)
  
  try {
    // Fetch data
    await loadDashboard()

    // Create charts after data is loaded
    setTimeout(() => {
      createAccuracyChart()
      createFrequencyChart()
    }, 100)
  } catch (error) {
    console.error('Error loading dashboard:', error)
    loading.value = false
  }
})

const createAccuracyChart = () => {
  if (!accuracyChartCanvas.value || !sessions.value.length) return

  const ctx = accuracyChartCanvas.value.getContext('2d')
  const data = sessions.value.slice().reverse().slice(0, 7)

  accuracyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(s => formatDateShort(s.created_at)),
      datasets: [
        {
          label: 'AI Score %',
          data: data.map(s => s.ai_score ? parseFloat(s.ai_score) : null),
          borderColor: '#764ba2',
          backgroundColor: 'rgba(118, 75, 162, 0.1)',
          tension: 0.4,
          fill: true,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  })
}

const createFrequencyChart = () => {
  if (!frequencyChartCanvas.value || !sessions.value.length) return

  const ctx = frequencyChartCanvas.value.getContext('2d')
  
  // Group sessions by date
  const dateMap = {}
  sessions.value.forEach(session => {
    const date = session.created_at.split('T')[0]
    dateMap[date] = (dateMap[date] || 0) + 1
  })

  const dates = Object.keys(dateMap).sort().slice(-7)
  const counts = dates.map(date => dateMap[date])

  frequencyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates.map(d => formatDateShort(d)),
      datasets: [{
        label: 'Sessions',
        data: counts,
        backgroundColor: '#764ba2',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateShort = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getAccuracyClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  return 'needs-work'
}

const formatCategory = (category) => {
  if (!category) return ''
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const loadDashboard = async () => {
  loading.value = true
  try {
    progress.value = await practiceStore.fetchUserProgress()
    sessions.value = await practiceStore.fetchRecentSessions(10)
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

const deleteSession = async (sessionId) => {
  if (!confirm('Delete this session? This will affect your overall statistics.')) {
    return
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to delete sessions.')
      return
    }

    const { error } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) throw error

    // Recalculate stats
    await practiceStore.updateUserProgress()

    // Show success message
    alert('Session deleted successfully!')

    // Reload dashboard data
    await loadDashboard()
    
    // Recreate charts with updated data
    if (accuracyChart) {
      accuracyChart.destroy()
    }
    if (frequencyChart) {
      frequencyChart.destroy()
    }
    createAccuracyChart()
    createFrequencyChart()
  } catch (error) {
    console.error('Error deleting session:', error)
    alert('Failed to delete session. Please try again.')
  }
}


</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f3f4f6;
  background-image: 
    radial-gradient(at 0% 0%, rgba(102, 126, 234, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(118, 75, 162, 0.15) 0px, transparent 50%);
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
}

.page-title {
  color: #111827;
  font-size: 2.5rem;
  margin-bottom: 40px;
  text-align: left;
  font-weight: 800;
  letter-spacing: -0.025em;
  text-shadow: none;
}

.loading {
  text-align: center;
  color: #6b7280;
  font-size: 1.2rem;
  padding: 60px;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.stat-card:hover::before {
  transform: scaleX(1);
  opacity: 1;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 16px;
  background: #f3f4f6;
  padding: 12px;
  border-radius: 12px;
  display: inline-flex;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
  background: none;
  -webkit-text-fill-color: initial;
}

.stat-label {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.12);
}

.chart-card h3 {
  margin-top: 0;
  color: #111827;
  margin-bottom: 24px;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}

.recent-sessions {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.recent-sessions h3 {
  margin-top: 0;
  color: #111827;
  margin-bottom: 24px;
  font-size: 1.25rem;
  font-weight: 700;
}

.session-item {
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.session-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.session-date {
  font-size: 0.9rem;
  color: #666;
}

.session-scores {
  display: flex;
  gap: 8px;
}

.score-badge {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-badge.completeness.excellent {
  display: none;
}

.score-badge.completeness.good {
  display: none;
}

.score-badge.completeness.needs-work {
  display: none;
}

.score-badge.ai-score {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.session-meta {
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  margin-top: 16px;
}

.session-category {
  background: #f3f4f6;
  color: #4b5563;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.session-duration {
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  font-variant-numeric: tabular-nums;
}

.session-status {
  /* Removed or deprecated */
  display: none;
}

.delete-session-btn {
  margin-left: auto;
  background: white;
  border: 1px solid #fee2e2;
  color: #ef4444;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.delete-session-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.achievements-card {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.achievements-card h3 {
  margin-top: 0;
  color: #111827;
  margin-bottom: 24px;
  font-size: 1.25rem;
  font-weight: 700;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
}

.achievement {
  padding: 24px;
  text-align: center;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  opacity: 0.6;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.achievement::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.4s;
}

.achievement.unlocked {
  opacity: 1;
  border-color: transparent;
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
}

.achievement.unlocked::before {
  opacity: 1;
}

.achievement.unlocked * {
  position: relative;
  z-index: 1;
  color: white;
}

.achievement-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.achievement-name {
  font-weight: 700;
  margin-bottom: 5px;
}

.achievement-desc {
  font-size: 0.85rem;
  opacity: 0.9;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 25px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #333;
}

.modal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  line-height: 1;
  padding: 0;
}

.modal-close-btn:hover {
  background: #f0f0f0;
  color: #333;
  transform: rotate(90deg);
}

.settings-section {
  margin: 25px 0;
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.settings-section:first-of-type h3 {
  color: #667eea;
}

.settings-section:nth-of-type(2) h3 {
  color: #333;
}

.settings-section:last-of-type h3 {
  color: #f44336;
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
}

.api-key-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.api-key-input:focus {
  outline: none;
  border-color: #667eea;
}

.api-key-status {
  font-size: 0.9rem;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 10px;
}

.api-key-status.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.api-key-status.warning {
  background: #fff3e0;
  color: #e65100;
}

.btn-danger-outline {
  padding: 12px 20px;
  background: white;
  color: #f44336;
  border: 2px solid #f44336;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-danger-outline:hover:not(:disabled) {
  background: #f44336;
  color: white;
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff5f5;
  border: 2px solid #ffebee;
  border-radius: 8px;
  margin-bottom: 15px;
}

.danger-info h4 {
  color: #333;
  margin-bottom: 5px;
  font-size: 1rem;
}

.danger-info p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.btn-danger {
  background: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
  transform: translateY(-2px);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #757575;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 15px;
  width: 100%;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #616161;
}

.confirm-modal {
  max-width: 450px;
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

.confirm-modal ul {
  text-align: left;
  margin: 15px 0;
  padding-left: 25px;
  color: #666;
}

.confirm-modal strong {
  color: #f44336;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.modal-actions button {
  flex: 1;
  margin: 0;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 12px;
  }

  .dashboard-content h1 {
    font-size: 1.4rem;
    margin-bottom: 20px;
  }

  .stats-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  .charts-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .chart-card {
    padding: 12px;
  }

  .chart-card h3 {
    font-size: 0.95rem;
    margin-bottom: 12px;
  }

  .modal-content {
    padding: 15px;
    max-height: 92vh;
    font-size: 0.9rem;
  }

  .modal-content h2 {
    font-size: 1.2rem;
    margin-bottom: 15px;
  }

  .settings-section h3 {
    font-size: 0.95rem;
  }

  .api-key-description {
    font-size: 0.8rem;
  }

  .api-key-input {
    font-size: 0.85rem;
    padding: 10px;
  }

  .danger-action {
    flex-direction: column;
    gap: 10px;
    text-align: center;
    padding: 12px;
  }

  .danger-info h4 {
    font-size: 0.9rem;
  }

  .danger-info p {
    font-size: 0.8rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-danger, .btn-secondary {
    font-size: 0.85rem;
    padding: 10px 20px;
  }
}
</style>
