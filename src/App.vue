<template>
  <router-view />
  <CookieConsent />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import CookieConsent from './components/CookieConsent.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initialize()
})
</script>

<style>
/* Global styles are in style.css */
</style>
