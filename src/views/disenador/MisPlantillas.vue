<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Mis plantillas</h1>
      <p class="text-sm text-slate-500">Historial de plantillas enviadas y su estado.</p>
    </div>

    <Card>
      <div class="flex items-center justify-between">
        <div class="flex-1 pr-4">
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input v-model="query" type="text" placeholder="Buscar por curso o evento" class="w-full rounded-lg border border-slate-200 px-3 py-2.5" />
        </div>

        <div class="w-48">
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
          <select v-model="estadoFiltro" class="w-full rounded-lg border border-slate-200 px-3 py-2.5">
            <option value="">Todos</option>
            <option value="SIN_PLANTILLA">Sin plantilla</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </div>

        <div class="ml-4">
          <Button variant="outline" size="sm" @click="cargarPlantillas">Actualizar</Button>
        </div>
      </div>

      <div v-if="cargando" class="py-8 text-center text-sm text-slate-500">Cargando plantillas...</div>
      <div v-else-if="filteredPlantillas.length === 0" class="py-8 text-center text-sm text-slate-500">No se encontraron plantillas.</div>

      <div v-else class="overflow-x-auto mt-4">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actividad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Version</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Observacion</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="p in filteredPlantillas" :key="p.idPlantilla" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-sm text-slate-700">{{ p.nombreActividad }}</td>
              <td class="px-4 py-3">
                <Badge :variant="p.tipoActividad === 'CURSO' ? 'primary' : 'secondary'" size="sm">{{ p.tipoActividad }}</Badge>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">v{{ p.version }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ p.estado }}</td>
              <td class="px-4 py-3 text-xs text-slate-500">{{ p.ultimaObservacion || '-' }}</td>
              <td class="px-4 py-3 text-right">
                <Button variant="outline" size="sm" @click="verPlantilla(p)">Ver PDF</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'

interface PlantillaDto {
  idPlantilla: number
  idCurso: number | null
  idEvento: number | null
  nombreActividad: string
  tipoActividad: 'CURSO' | 'EVENTO'
  version: number
  estado: string
  ultimaObservacion: string | null
  fechaSubida?: string
}

const alertStore = useAlertStore()
const plantillas = ref<PlantillaDto[]>([])
const cargando = ref(false)
const query = ref('')
const estadoFiltro = ref('')

const cargarPlantillas = async () => {
  cargando.value = true
  try {
    const data = await api.get('/plantillas/mis-plantillas') as PlantillaDto[]
    plantillas.value = data
  } catch (e) {
    alertStore.push({ type: 'error', message: (e as Error).message || 'No se pudo cargar plantillas.' })
    plantillas.value = []
  } finally {
    cargando.value = false
  }
}

const filteredPlantillas = computed(() => {
  const term = query.value.trim().toLowerCase()
  return plantillas.value.filter(p => {
    const matchesQuery = !term || p.nombreActividad.toLowerCase().includes(term)
    const matchesEstado = !estadoFiltro.value || p.estado === estadoFiltro.value
    return matchesQuery && matchesEstado
  })
})

const verPlantilla = async (plantilla: PlantillaDto) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
    const token = localStorage.getItem('token')
    const response = await fetch(`${baseUrl}/plantillas/${plantilla.idPlantilla}/descargar`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    if (!response.ok) throw new Error('No se pudo descargar la plantilla')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
  } catch (e) {
    alertStore.push({ type: 'error', message: (e as Error).message || 'Error al descargar.' })
  }
}

onMounted(() => void cargarPlantillas())
</script>
