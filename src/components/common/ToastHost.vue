<template>
  <div class="fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2">
    <transition-group name="toast" tag="div" class="flex flex-col gap-2">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
        :class="typeClass(alert.type)"
      >
        <span class="leading-5">
          {{ alert.message }}
        </span>
        <button
          class="rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-80 hover:opacity-100"
          type="button"
          @click="remove(alert.id)"
        >
          Close
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useAlertStore } from '@/stores/alert.store'
import type { AlertMessage } from '@/types'

const alertStore = useAlertStore()
const alerts = alertStore.alerts
const { remove } = alertStore

const typeClass = (type: AlertMessage['type']) => {
  switch (type) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'error':
      return 'border-red-200 bg-red-50 text-red-900'
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-900'
    default:
      return 'border-blue-200 bg-blue-50 text-blue-900'
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
