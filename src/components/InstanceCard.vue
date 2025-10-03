<template>
  <div class="instance-card">
    <h3 class="instance-name">{{ instance.name }}</h3>
    
    <div class="instance-details">
      <p><strong>ID:</strong> {{ instance.id }}</p>
      <p v-if="instance.launchTime"><strong>Start Time:</strong> {{ formatDateTime(instance.launchTime) }}</p>
      <p><strong>Frontend URL:</strong> <a class="text-blue-500" :href="instance.frontendUrl" target="_blank">{{ instance.frontendUrl }}</a></p>
      <p><strong>Backend URL:</strong> <a class="text-blue-500" :href="instance.backendUrl" target="_blank">{{ instance.backendUrl }}</a></p>
    </div>
    
    <div class="mt-4 flex items-center justify-between">
      <span class="instance-status" :class="`status-${instance.state}`">
        {{ instance.state.toUpperCase() }}
      </span>
      
      <div class="flex items-center gap-2">
        <button
          v-if="instance.state === 'stopped'"
          @click="showDialog = true"
          :disabled="starting"
          class="btn btn-primary"
        >
          {{ starting ? 'Starting...' : 'Start Instance' }}
        </button>

        <button
          v-if="instance.state === 'running'"
          @click="confirmStop"
          :disabled="stopping"
          class="btn btn-secondary"
        >
          {{ stopping ? 'Stopping...' : 'Stop Instance' }}
        </button>
      </div>
    </div>

    <!-- Wait Time Selection Dialog -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-content">
        <h3 class="dialog-title">Select Runtime Duration</h3>
        
        <div class="dialog-body">
          <label for="waitTime" class="dialog-label">
            How long should the instance run?
          </label>
          <select 
            id="waitTime" 
            v-model="selectedWaitTime" 
            class="dialog-select"
          >
            <option value="7200">2 hours</option>
            <option value="14400">4 hours</option>
            <option value="28800">8 hours</option>
            <option value="43200">12 hours</option>
          </select>
        </div>
        
        <div class="dialog-actions">
          <button 
            @click="closeDialog" 
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="confirmStart" 
            :disabled="!selectedWaitTime"
            class="btn btn-primary"
          >
            Start Instance
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEC2Store } from '@/stores/ec2'

const props = defineProps({
  instance: {
    type: Object,
    required: true
  }
})

const ec2Store = useEC2Store()
const starting = ref(false)
const stopping = ref(false)
const showDialog = ref(false)
const selectedWaitTime = ref('14400') // Default to 4 hours

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A'
  const date = new Date(dateTime)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const closeDialog = () => {
  showDialog.value = false
  selectedWaitTime.value = '14400' // Reset to default
}

const confirmStart = async () => {
  showDialog.value = false
  starting.value = true
  
  try {
    await ec2Store.startInstance(props.instance.stepFunctionArn, parseInt(selectedWaitTime.value))
    // Show success message
    alert(`Instance start request sent successfully. It will run for ${selectedWaitTime.value / 3600} hours.`)
  } catch (error) {
    alert('Failed to start instance: ' + error.message)
  } finally {
    starting.value = false
    selectedWaitTime.value = '14400' // Reset to default
  }
}

const confirmStop = async () => {
  if (!confirm('Are you sure you want to stop this instance?')) return
  stopping.value = true

  try {
    await ec2Store.stopInstance(props.instance.id)
    alert('Instance stop request sent successfully.')
  } catch (error) {
    alert('Failed to stop instance: ' + error.message)
  } finally {
    stopping.value = false
  }
}
</script>

<style scoped>
.instance-card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200;
}

.instance-name {
  @apply text-lg font-semibold mb-3 text-gray-800;
}

.instance-details {
  @apply space-y-1 text-sm text-gray-600;
}

.instance-details strong {
  @apply text-gray-700;
}

.instance-status {
  @apply inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase;
}

.status-running {
  @apply bg-green-100 text-green-800;
}

.status-stopped {
  @apply bg-red-100 text-red-800;
}

.status-pending,
.status-stopping {
  @apply bg-yellow-100 text-yellow-800;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors duration-200 text-sm;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

/* Dialog Styles */
.dialog-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.dialog-content {
  @apply bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4;
}

.dialog-title {
  @apply text-xl font-semibold mb-4 text-gray-800;
}

.dialog-body {
  @apply mb-6;
}

.dialog-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.dialog-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.dialog-actions {
  @apply flex justify-end space-x-3;
}
</style>
