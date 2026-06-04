<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div class="bg-blue-900 text-white text-center py-6 px-6">
          <p class="text-sm uppercase tracking-widest">Universidad Mayor de San Andres</p>
          <p class="text-sm uppercase tracking-widest">Facultad de Humanidades y Ciencias de la Educacion</p>
        </div>

        <div class="px-8 py-10 text-center">
          <div v-if="loading" class="py-10">
            <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
            <p class="mt-4 text-gray-600">Verificando certificado...</p>
          </div>

          <div v-else-if="error" class="py-10">
            <div class="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 class="mt-6 text-2xl font-semibold text-red-700">Verificacion fallida</h2>
            <p class="mt-2 text-gray-600">{{ error }}</p>
          </div>

          <div v-else>
            <div class="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="mt-6 text-2xl font-semibold text-green-700">Verificacion exitosa</h2>

            <div class="mt-4">
              <span class="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm">
                Emitido el: {{ formatDate(data?.fechaEmision) }}
              </span>
            </div>

            <div class="mt-8 text-blue-900">
              <p class="text-2xl font-bold uppercase">
                {{ data?.nombreTitular || '-' }}
              </p>
            </div>

            <div class="mt-8 text-left border border-gray-200 rounded-xl p-6 bg-gray-50">
              <p class="text-xs uppercase tracking-wide text-gray-500">Evento academico</p>
              <p class="text-lg font-semibold text-gray-800">{{ data?.nombreActividad || '-' }}</p>

              <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs uppercase tracking-wide text-gray-500">Carga horaria</p>
                  <p class="text-base font-semibold text-gray-800">{{ data?.cargaHoraria ?? '-' }} horas</p>
                </div>
              </div>
            </div>

            <p class="mt-8 text-xs text-gray-500">
              Los datos del certificado impreso deben coincidir con esta informacion. Toda alteracion parcial o total de datos se adecua a un hecho ilicito segun los Art. 198, 199 y 200 del Codigo Penal Boliviano.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil } from '@/utils/dateFormatter'

interface VerificacionDto {
  estado: string
  nombreTitular: string
  nombreActividad: string
  cargaHoraria: number
  fechaEmision: string
  version: number
  notaFinal?: string
  urlCertificadoReemplazo?: string
}

const route = useRoute()
const loading = ref(true)
const error = ref('')
const data = ref<VerificacionDto | null>(null)

const formatDate = (date?: string) => {
  if (!date) return '-'
  return formatDateUtil(date, 'es-BO')
}

const cargar = async () => {
  loading.value = true
  error.value = ''
  try {
    const codigo = String(route.params.codigo || '')
    const response = await api.get(`/certificados/verificar/${codigo}`)
    data.value = response as VerificacionDto
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo verificar el certificado.'
    error.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargar()
})
</script>
