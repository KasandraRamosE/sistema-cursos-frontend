<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Registrar asistencia</h1>
      <p class="text-sm text-slate-500">Marca asistencia para participantes inscritos.</p>
    </div>

    <Card>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Buscar evento</label>
          <input
            v-model="busquedaEvento"
            type="text"
            placeholder="Nombre del evento"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Evento</label>
          <select
            v-model="eventoSeleccionado"
            @change="cargarAsistencias"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option :value="null">Seleccionar evento</option>
            <option v-for="evento in eventosFiltrados" :key="evento.id" :value="evento.id">
              {{ evento.nombre }} ({{ formatDate(evento.fechaInicio) }})
            </option>
          </select>
        </div>

        <div v-if="eventoSeleccionado && infoEvento" class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p class="text-xs text-emerald-600">Evento</p>
              <p class="font-medium text-slate-800">{{ infoEvento.nombre }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Fecha</p>
              <p class="font-medium text-slate-800">{{ formatDate(infoEvento.fechaInicio) }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Inscritos</p>
              <p class="font-medium text-slate-800">{{ infoEvento.inscritos }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Asistieron</p>
              <p class="font-medium text-slate-800">{{ asistenciasRegistradas }}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <Card v-if="eventoSeleccionado">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">Asistencias</h3>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Buscar participante</label>
          <input
            v-model="busquedaParticipante"
            type="text"
            placeholder="Nombre o RU"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
          Cargando asistencias...
        </div>

        <div v-else-if="asistenciasFiltradas.length === 0" class="py-8 text-center text-sm text-slate-500">
          No hay inscritos para este evento.
        </div>

        <div v-else>
          <div class="overflow-x-auto">
            <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Participante</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Accion</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
                <tr v-for="(asistencia, index) in asistenciasFiltradas" :key="asistencia.idInscripcion" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm text-slate-600">{{ index + 1 }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-slate-800">
                      {{ asistencia.participante.nombres }} {{ asistencia.participante.apellidos }}
                    </p>
                    <p class="text-xs text-slate-500">RU: {{ asistencia.participante.username }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      :loading="savingId === asistencia.idInscripcion"
                      :disabled="asistencia.asistio"
                      @click="registrarAsistencia(asistencia)"
                    >
                      Registrar
                    </Button>
                    <Button
                      v-if="puedeAnular(asistencia)"
                      variant="ghost"
                      size="sm"
                      class="text-rose-600 hover:text-rose-700"
                      :loading="savingId === asistencia.idInscripcion"
                      @click="anularAsistencia(asistencia)"
                    >
                      Anular
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil, parseLocalDate } from '@/utils/dateFormatter'
import { useAlertStore } from '@/stores/alert.store'

interface Evento {
  id: number
  nombre: string
  fechaInicio: string
  inscritos: number
}

interface AsistenciaItem {
  idInscripcion: number
  participante: {
    nombres: string
    apellidos: string
    email: string
    username: string
  }
  asistio: boolean
  fechaRegistro?: string
}

const alertStore = useAlertStore()
const route = useRoute()
const loading = ref(false)
const savingId = ref<number | null>(null)

const eventosDisponibles = ref<Evento[]>([])
const asistencias = ref<AsistenciaItem[]>([])
const busquedaEvento = ref('')
const busquedaParticipante = ref('')
const eventoSeleccionado = ref<number | null>(null)
const infoEvento = ref<Evento | null>(null)

const eventosFiltrados = computed(() => {
  const term = busquedaEvento.value.trim().toLowerCase()
  if (!term) return eventosDisponibles.value

  return eventosDisponibles.value.filter(evento => evento.nombre.toLowerCase().includes(term))
})

const asistenciasRegistradas = computed(() => {
  return asistencias.value.filter(a => a.asistio).length
})

const asistenciasFiltradas = computed(() => {
  const term = busquedaParticipante.value.trim().toLowerCase()
  if (!term) return asistencias.value

  return asistencias.value.filter(asistencia => {
    const values = [
      asistencia.participante.nombres,
      asistencia.participante.apellidos,
      asistencia.participante.username
    ]
    return values.some(value => value.toLowerCase().includes(term))
  })
})

const normalizarEventos = (response: unknown): Evento[] => {
  if (!Array.isArray(response)) return []

  return response.map(evento => ({
    id: Number(evento.idEvento ?? evento.id ?? evento.id_evento ?? 0),
    nombre: String(evento.nombre ?? evento.titulo ?? ''),
    fechaInicio: String(evento.fechaHora ?? evento.fechaInicio ?? evento.fecha_inicio ?? ''),
    inscritos: Number(evento.inscritos ?? evento.totalInscritos ?? 0)
  })).filter(evento => evento.id)
}

const cargarEventos = async () => {
  const response = await api.get('/eventos/auxiliar')
  eventosDisponibles.value = normalizarEventos(response)

  if (eventosDisponibles.value.length === 0) {
    eventoSeleccionado.value = null
    infoEvento.value = null
    asistencias.value = []
    return
  }

  const fromQuery = Number(route.query.evento)
  if (fromQuery && eventosDisponibles.value.some(e => e.id === fromQuery)) {
    eventoSeleccionado.value = fromQuery
    await cargarAsistencias()
  }
}

const cargarAsistencias = async () => {
  if (!eventoSeleccionado.value) return

  loading.value = true
  try {
    infoEvento.value = eventosDisponibles.value.find(e => e.id === eventoSeleccionado.value) || null

    const response = await api.get(`/asistencias/evento/${eventoSeleccionado.value}/detalle`)
    const items = response as Array<Record<string, unknown>>

    asistencias.value = items.map(item => ({
      idInscripcion: Number(item.idInscripcion),
      participante: {
        nombres: String(item.nombreParticipante ?? ''),
        apellidos: '',
        email: String(item.email ?? ''),
        username: String(item.username ?? '')
      },
      asistio: Boolean(item.asistio),
      fechaRegistro: item.fechaRegistro ? String(item.fechaRegistro) : undefined
    }))
  } finally {
    loading.value = false
  }
}

const registrarAsistencia = async (item: AsistenciaItem) => {
  if (item.asistio) return

  savingId.value = item.idInscripcion
  try {
    const response = await api.post('/asistencias', { idInscripcion: item.idInscripcion }) as Record<string, unknown>
    item.asistio = true
    item.fechaRegistro = response.fechaRegistro ? String(response.fechaRegistro) : new Date().toISOString()
    alertStore.push({ type: 'success', message: 'Asistencia registrada.' })
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo registrar.' })
  } finally {
    savingId.value = null
  }
}

const puedeAnular = (item: AsistenciaItem) => {
  if (!item.asistio || !item.fechaRegistro) return false
  const fecha = parseLocalDate(item.fechaRegistro)
  if (Number.isNaN(fecha.getTime())) return false
  const diffMs = Date.now() - fecha.getTime()
  return diffMs <= 60 * 60 * 1000
}

const anularAsistencia = async (item: AsistenciaItem) => {
  if (!item.asistio) return

  savingId.value = item.idInscripcion
  try {
    await api.delete(`/asistencias/${item.idInscripcion}`)
    item.asistio = false
    item.fechaRegistro = undefined
    alertStore.push({ type: 'success', message: 'Asistencia anulada.' })
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo anular.' })
  } finally {
    savingId.value = null
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return formatDateUtil(date, 'es-BO')
}

onMounted(() => {
  cargarEventos()
})
</script>
