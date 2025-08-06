<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <main class="container mx-auto px-4 py-6">
      <div v-if="ec2Store.loading" class="text-center py-10">
        <div class="spinner mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading EC2 instances...</p>
      </div>

      <div v-else-if="ec2Store.error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-600 mb-4">{{ ec2Store.error }}</p>
        <button @click="retry" class="btn btn-primary">Retry</button>
      </div>

      <div v-else>
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold">EC2 Instances</h2>
          <div class="flex items-center gap-4">
            <button @click="refresh" class="btn btn-secondary">Refresh</button>
            <span class="text-sm text-gray-600">
              Last updated: {{ lastUpdatedTime }}
            </span>
          </div>
        </div>

        <InstanceGrid :instances="ec2Store.instances" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useEC2Store } from '@/stores/ec2'
import AppHeader from '@/components/AppHeader.vue'
import InstanceGrid from '@/components/InstanceGrid.vue'

const ec2Store = useEC2Store()
const config = __APP_CONFIG__

let refreshInterval = null

const lastUpdatedTime = computed(() => {
  if (!ec2Store.lastUpdated) return 'Never'
  return ec2Store.lastUpdated.toLocaleTimeString()
})

const refresh = () => {
  ec2Store.fetchInstances(true)
}

const retry = () => {
  ec2Store.fetchInstances(true)
}

onMounted(() => {
  // Initial load
  ec2Store.fetchInstances()
  
  // Set up auto-refresh
  refreshInterval = setInterval(() => {
    ec2Store.fetchInstances()
  }, config.CACHE_DURATION_MS)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.spinner {
  @apply w-10 h-10 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}
</style>