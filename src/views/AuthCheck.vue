<template>
  <div class="auth-check">
    <div class="auth-content">
      <h1 class="text-2xl font-bold mb-6">{{ config.APP_TITLE }}</h1>
      <div class="spinner"></div>
      <p class="mt-4 text-gray-600">Checking authentication...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const config = __APP_CONFIG__
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  await authStore.checkAuth()
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.auth-check {
  @apply fixed inset-0 bg-gray-50 flex items-center justify-center;
}

.auth-content {
  @apply text-center p-10 bg-white rounded-lg shadow-lg max-w-md w-full;
}

.spinner {
  @apply w-10 h-10 mx-auto border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin;
}
</style>