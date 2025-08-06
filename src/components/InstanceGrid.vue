<template>
  <div class="instance-grid">
    <div v-if="instances.length === 0" class="text-center py-10 text-gray-500">
      No instances found
    </div>
    
    <InstanceCard
      v-for="instance in instances"
      :key="instance.id"
      :instance="instance"
    />
  </div>
</template>

<script setup>
import InstanceCard from './InstanceCard.vue'

defineProps({
  instances: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.instance-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}
</style>