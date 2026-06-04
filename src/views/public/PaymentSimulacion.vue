<template>
  <div class="min-h-screen bg-slate-50">
    <section class="container mx-auto px-4 py-10">
      <div class="mx-auto max-w-lg space-y-6">
        <Card>
          <div class="space-y-3">
            <h1 class="text-2xl font-bold text-slate-900">Pago simulado</h1>
            <p class="text-sm text-slate-600">
              Verifica el pago para completar la inscripcion.
            </p>
            <div class="rounded-lg border border-slate-200 bg-white p-4">
              <p class="text-xs uppercase text-slate-400">Monto a pagar</p>
              <p class="text-3xl font-bold text-emerald-700">Bs. {{ monto }}</p>
              <p v-if="actividad" class="mt-2 text-sm text-slate-500">{{ actividad }}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div class="space-y-3">
            <p class="text-sm text-slate-600">
              Esta pantalla simula la pasarela de pago. Al verificar, se registrara el pago en el backend y se notificara a la ventana anterior.
            </p>
            <Button :loading="loading" class="w-full" @click="verificarPago">
              Verificar pago
            </Button>
            <p v-if="errorMessage" class="text-sm text-rose-600">{{ errorMessage }}</p>
            <p v-if="successMessage" class="text-sm text-emerald-600">{{ successMessage }}</p>
          </div>
        </Card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import { api } from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const idInscripcion = computed(() => Number(route.params.idInscripcion))
const monto = computed(() => Number(route.query.monto ?? 0))
const actividad = computed(() => {
  const nombre = route.query.actividad
  return typeof nombre === 'string' ? nombre : ''
})

const verificarPago = async () => {
  if (!idInscripcion.value) {
    errorMessage.value = 'No se encontro la inscripcion.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await api.post('/inscripciones/pago/confirmar', { idInscripcion: idInscripcion.value }) as Record<string, unknown>
    const estadoPago = String(response.estado ?? 'APROBADO').toUpperCase()
    successMessage.value = 'Pago verificado. Redirigiendo...'
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({
          type: 'payment:confirmed',
          idInscripcion: idInscripcion.value,
          estadoPago
        }, window.location.origin)
      }
      router.push('/participante/inscripciones')
      if (window.opener) {
        window.close()
      }
    }, 1200)
  } catch (error) {
    errorMessage.value = (error as Error).message || 'No se pudo verificar el pago.'
  } finally {
    loading.value = false
  }
}
</script>
