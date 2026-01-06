<template>
  <div class="leaderboard-container">
    <Navbar />
    
    <div class="leaderboard-content">
      <div class="leaderboard-header">
        <h1 class="page-title">🏆 Leaderboard</h1>
        <p class="subtitle">Top speakers ranked by practice performance</p>
      </div>

      <div class="filter-section">
        <div class="filter-tabs">
          <button 
            v-for="option in filterOptions" 
            :key="option.value"
            @click="selectedFilter = option.value"
            :class="['filter-tab', { active: selectedFilter === option.value }]"
          >
            {{ option.icon }} {{ option.label }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading leaderboard...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchLeaderboard" class="btn-primary">Try Again</button>
      </div>

      <div v-else-if="leaderboardData.length === 0" class="empty-state">
        <p>No users on the leaderboard yet. Be the first!</p>
      </div>

      <div v-else class="leaderboard-list">
        <div 
          v-for="(user, index) in leaderboardData" 
          :key="user.user_id"
          :class="['leaderboard-item', { 'current-user': user.user_id === authStore.user?.id }]"
        >
          <div class="rank-badge">
            <span v-if="index === 0" class="rank-icon">🥇</span>
            <span v-else-if="index === 1" class="rank-icon">🥈</span>
            <span v-else-if="index === 2" class="rank-icon">🥉</span>
            <span v-else class="rank-number">#{{ index + 1 }}</span>
          </div>

          <div class="user-avatar">
            <img 
              :src="`/${user.avatar_url || 'avatar1.svg'}`" 
              :alt="user.username"
              @error="handleImageError"
            />
          </div>

          <div class="user-info">
            <div class="username">
              {{ user.username }}
              <span v-if="user.user_id === authStore.user?.id" class="you-badge">You</span>
            </div>
            <div class="user-stats-mini">
              <span>{{ user.total_sessions || 0 }} sessions</span>
              <span>•</span>
              <span>{{ user.total_sentences || 0 }} sentences</span>
            </div>
          </div>

          <div class="user-score">
            <div class="score-value">
              <template v-if="selectedFilter === 'accuracy'">
                {{ (user.average_accuracy || 0).toFixed(1) }}%
              </template>
              <template v-else-if="selectedFilter === 'streak'">
                {{ user.current_streak || 0 }}
                <span class="score-icon">🔥</span>
              </template>
              <template v-else-if="selectedFilter === 'total'">
                {{ user.total_sentences || 0 }}
              </template>
            </div>
            <div class="score-label">
              <template v-if="selectedFilter === 'accuracy'">Accuracy</template>
              <template v-else-if="selectedFilter === 'streak'">Day Streak</template>
              <template v-else-if="selectedFilter === 'total'">Sentences</template>
            </div>
          </div>
        </div>
      </div>

      <!-- Your Rank Section (if not in top 10) -->
      <div v-if="!loading && currentUserRank && currentUserRank > 10" class="your-rank-section">
        <h3>Your Rank</h3>
        <div class="leaderboard-item current-user">
          <div class="rank-badge">
            <span class="rank-number">#{{ currentUserRank }}</span>
          </div>

          <div class="user-avatar">
            <img 
              :src="`/${currentUserProfile?.avatar_url || 'avatar1.svg'}`" 
              :alt="currentUserProfile?.username"
              @error="handleImageError"
            />
          </div>

          <div class="user-info">
            <div class="username">
              {{ currentUserProfile?.username }}
              <span class="you-badge">You</span>
            </div>
            <div class="user-stats-mini">
              <span>{{ currentUserStats?.total_sessions || 0 }} sessions</span>
              <span>•</span>
              <span>{{ currentUserStats?.total_sentences || 0 }} sentences</span>
            </div>
          </div>

          <div class="user-score">
            <div class="score-value">
              <template v-if="selectedFilter === 'accuracy'">
                {{ (currentUserStats?.average_accuracy || 0).toFixed(1) }}%
              </template>
              <template v-else-if="selectedFilter === 'streak'">
                {{ currentUserStats?.current_streak || 0 }}
                <span class="score-icon">🔥</span>
              </template>
              <template v-else-if="selectedFilter === 'total'">
                {{ currentUserStats?.total_sentences || 0 }}
              </template>
            </div>
            <div class="score-label">
              <template v-if="selectedFilter === 'accuracy'">Accuracy</template>
              <template v-else-if="selectedFilter === 'streak'">Day Streak</template>
              <template v-else-if="selectedFilter === 'total'">Sentences</template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import Navbar from '../components/Navbar.vue'

const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)
const leaderboardData = ref([])
const currentUserProfile = ref(null)
const currentUserStats = ref(null)
const currentUserRank = ref(null)
const selectedFilter = ref('total') // 'accuracy', 'streak', 'total'

const filterOptions = [
  { value: 'total', label: 'Total Sentences', icon: '📊' },
  { value: 'accuracy', label: 'Accuracy', icon: '🎯' },
  { value: 'streak', label: 'Current Streak', icon: '🔥' }
]

const fetchLeaderboard = async () => {
  loading.value = true
  error.value = null

  try {
    // Determine order by based on selected filter
    let orderBy = 'total_sentences'
    if (selectedFilter.value === 'accuracy') {
      orderBy = 'average_accuracy'
    } else if (selectedFilter.value === 'streak') {
      orderBy = 'current_streak'
    }

    // Fetch all user profiles first
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, username, avatar_url')
      .limit(100)

    if (profilesError) {
      if (profilesError.message?.includes('relation "public.user_profiles" does not exist') || 
          profilesError.code === '42P01') {
        error.value = 'User profiles table not found. Please apply the database migration first.'
        console.error('Migration needed: user_profiles table does not exist')
        return
      }
      throw profilesError
    }

    if (!profilesData || profilesData.length === 0) {
      leaderboardData.value = []
      return
    }

    // Get user IDs
    const userIds = profilesData.map(p => p.user_id)

    // Fetch progress for these users
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .in('user_id', userIds)

    if (progressError) {
      throw progressError
    }

    // Create a map of progress by user_id for quick lookup
    const progressMap = {}
    progressData?.forEach(progress => {
      progressMap[progress.user_id] = progress
    })

    // Combine profile and progress data
    leaderboardData.value = profilesData
      .map(profile => {
        const progress = progressMap[profile.user_id]
        return {
          user_id: profile.user_id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          total_sessions: progress?.total_sessions || 0,
          total_sentences: progress?.total_sentences || 0,
          average_accuracy: progress?.average_accuracy || 0,
          current_streak: progress?.current_streak || 0,
          longest_streak: progress?.longest_streak || 0
        }
      })
      // Sort by selected filter
      .sort((a, b) => {
        const aValue = a[orderBy] || 0
        const bValue = b[orderBy] || 0
        return bValue - aValue
      })
      // Take top 50
      .slice(0, 50)

    // Fetch current user's profile and stats
    if (authStore.user) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authStore.user.id)
        .single()

      currentUserProfile.value = profileData

      const { data: statsData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', authStore.user.id)
        .single()

      currentUserStats.value = statsData

      // Calculate user's rank
      const userIndex = leaderboardData.value.findIndex(u => u.user_id === authStore.user.id)
      if (userIndex >= 0) {
        currentUserRank.value = userIndex + 1
      } else if (statsData) {
        // User not in top 50, calculate their actual rank
        const { count } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact', head: true })
          .gt(orderBy, statsData[orderBy] || 0)

        currentUserRank.value = (count || 0) + 1
      }
    }
  } catch (err) {
    console.error('Error fetching leaderboard:', err)
    
    // Provide more detailed error message
    if (err.code === '42P01') {
      error.value = 'Database tables not found. Please apply the user_profiles migration.'
    } else if (err.message) {
      error.value = `Error: ${err.message}`
      console.error('Full error details:', err)
    } else {
      error.value = 'Failed to load leaderboard. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const handleImageError = (e) => {
  e.target.src = '/avatar1.svg'
}

onMounted(() => {
  fetchLeaderboard()
})

watch(selectedFilter, () => {
  fetchLeaderboard()
})
</script>

<style scoped>
.leaderboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 2rem;
}

.leaderboard-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.leaderboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
  justify-content: center;
}

.filter-tab {
  flex: 1;
  min-width: 140px;
  padding: 0.75rem 1rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.filter-tab.active {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.leaderboard-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.leaderboard-item.current-user {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  border: 2px solid #fdcb6e;
  font-weight: 600;
}

.rank-badge {
  min-width: 50px;
  text-align: center;
}

.rank-icon {
  font-size: 2rem;
}

.rank-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #667eea;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.username {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3436;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.you-badge {
  background: #667eea;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.user-stats-mini {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #636e72;
}

.user-score {
  text-align: center;
  min-width: 100px;
}

.score-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.score-icon {
  font-size: 1.2rem;
}

.score-label {
  font-size: 0.85rem;
  color: #636e72;
  margin-top: 0.25rem;
}

.your-rank-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid rgba(255, 255, 255, 0.3);
}

.your-rank-section h3 {
  color: white;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.btn-primary {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .leaderboard-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .rank-badge {
    min-width: 40px;
  }

  .rank-icon {
    font-size: 1.5rem;
  }

  .rank-number {
    font-size: 1.2rem;
  }

  .user-avatar {
    width: 50px;
    height: 50px;
  }

  .username {
    font-size: 1rem;
  }

  .user-stats-mini {
    font-size: 0.8rem;
  }

  .score-value {
    font-size: 1.2rem;
  }

  .filter-tab {
    font-size: 0.9rem;
    padding: 0.6rem 0.8rem;
  }
}
</style>
