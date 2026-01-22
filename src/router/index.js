import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import MaintenanceView from '../views/MaintenanceView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import PracticeView from '../views/PracticeView.vue'
import DashboardView from '../views/DashboardView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'
import LeaderboardView from '../views/LeaderboardView.vue'
import SupportView from '../views/SupportView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import { MAINTENANCE_MODE } from '../config.js'

const routes = [
  {
    path: '/',
    redirect: MAINTENANCE_MODE ? '/maintenance' : '/login'
  },
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: MaintenanceView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { requiresAuth: false }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { requiresAuth: false }
  },
  {
    path: '/practice',
    name: 'Practice',
    component: PracticeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView,
    meta: { requiresAuth: false }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/support',
    name: 'Support',
    component: SupportView,
    meta: { requiresAuth: false }
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
    meta: { requiresAuth: false }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: ContactView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  // Maintenance mode check
  if (MAINTENANCE_MODE) {
    if (to.path !== '/maintenance') {
      next('/maintenance')
      return
    }
  } else if (to.path === '/maintenance') {
    // If not in maintenance mode, redirect away from maintenance page
    next('/')
    return
  }

  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/practice')
  } else {
    next()
  }
})

export default router
