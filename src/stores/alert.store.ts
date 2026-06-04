import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AlertMessage } from '@/types'

type ToastMessage = AlertMessage & { id: string }

const DEFAULT_DURATION_MS = 4000

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<ToastMessage[]>([])

  const push = (message: AlertMessage) => {
    const id = createId()
    const duration = message.duration ?? DEFAULT_DURATION_MS

    alerts.value = [...alerts.value, { ...message, id }]

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }

    return id
  }

  const remove = (id: string) => {
    alerts.value = alerts.value.filter((alert) => alert.id !== id)
  }

  const clear = () => {
    alerts.value = []
  }

  return {
    alerts,
    push,
    remove,
    clear
  }
})
