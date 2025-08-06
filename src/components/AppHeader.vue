<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-800">{{ config.APP_TITLE }}</h1>
      <div class="flex items-center gap-4">
        <span v-if="authStore.user" class="text-sm text-gray-600">
          {{ authStore.user.email }}
        </span>
        <button @click="logout" class="btn-logout">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const config = __APP_CONFIG__
const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
}
</script>

<style scoped>
.btn-logout {
  @apply px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-sm font-medium;
}
</style>