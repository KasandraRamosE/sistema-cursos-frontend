<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Panel del coordinador</h1>
        <p class="text-sm text-slate-500">Control de solicitudes y plantillas en tu carrera.</p>
      </div>
      <div class="flex items-center gap-2">
        <Badge v-if="pendingSolicitudes > 0" variant="warning" size="sm">
          {{ pendingSolicitudes }} pendientes
        </Badge>
        <Button variant="outline" size="sm" @click="loadAll">Actualizar</Button>
      </div>
    </div>

    <Card v-if="carreras.length > 1">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-800">Filtrar por carrera</p>
          <p class="text-xs text-slate-500">Puedes cambiar de carrera si tienes mas de una.</p>
        </div>
        <select
          v-model.number="selectedCarreraId"
          class="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
        >
          <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
            {{ carrera.nombre }}
          </option>
        </select>
      </div>
    </Card>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Solicitudes pendientes</p>
        <p class="text-2xl font-semibold text-slate-900">{{ pendingSolicitudes }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Plantillas pendientes</p>
        <p class="text-2xl font-semibold text-slate-900">{{ pendingPlantillas }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Cursos activos</p>
        <p class="text-2xl font-semibold text-emerald-600">{{ cursosActivos }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Eventos activos</p>
        <p class="text-2xl font-semibold text-emerald-600">{{ eventosActivos }}</p>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Bandeja de solicitudes</h3>
            <p class="text-sm text-slate-500">Aprueba solicitudes para emitir certificados.</p>
          </div>
          <Badge v-if="pendingSolicitudes > 0" variant="warning" size="sm">
            {{ pendingSolicitudes }} pendientes
          </Badge>
        </div>

        <div v-if="loadingSolicitudes" class="py-8 text-center text-sm text-slate-500">
          Cargando solicitudes...
        </div>
        <div v-else-if="solicitudesFiltradas.length === 0" class="py-8 text-center text-sm text-slate-500">
          No hay solicitudes pendientes.
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="solicitud in solicitudesFiltradas"
            :key="solicitud.idSolicitud"
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-500">
                  {{ solicitud.codigoParalelo ? 'Curso' : 'Evento' }}
                </p>
                <h4 class="text-base font-semibold text-slate-900">
                  {{ solicitud.nombreActividad }}
                </h4>
                <p v-if="solicitud.codigoParalelo" class="text-xs text-slate-500">
                  Paralelo {{ solicitud.codigoParalelo }}
                </p>
                <p class="text-xs text-slate-500">Docente: {{ solicitud.nombreDocente }}</p>
              </div>
              <Badge variant="warning" size="sm">PENDIENTE</Badge>
            </div>
            <div class="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Aprobados: {{ solicitud.cantidadAprobados }}</span>
              <Button size="sm" :loading="savingSolicitudId === solicitud.idSolicitud" @click="aprobarSolicitud(solicitud)">
                Aprobar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Plantillas pendientes</h3>
            <p class="text-sm text-slate-500">Revisa y aprueba el PDF antes de emitir certificados.</p>
          </div>
          <Badge v-if="pendingPlantillas > 0" variant="warning" size="sm">
            {{ pendingPlantillas }} pendientes
          </Badge>
        </div>

        <div v-if="loadingPlantillas" class="py-8 text-center text-sm text-slate-500">
          Cargando plantillas...
        </div>
        <div v-else-if="plantillasFiltradas.length === 0" class="py-8 text-center text-sm text-slate-500">
          No hay plantillas pendientes.
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="plantilla in plantillasFiltradas"
            :key="plantilla.idPlantilla"
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-500">
                  {{ plantilla.tipoActividad }}
                </p>
                <h4 class="text-base font-semibold text-slate-900">
                  {{ plantilla.nombreActividad }}
                </h4>
                <p class="text-xs text-slate-500">Version {{ plantilla.version }}</p>
              </div>
              <Badge variant="warning" size="sm">PENDIENTE</Badge>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Button variant="outline" size="sm" @click="verPlantilla(plantilla)">
                Ver PDF
              </Button>
              <Button size="sm" :loading="savingPlantillaId === plantilla.idPlantilla" @click="aprobarPlantilla(plantilla)">
                Aprobar
              </Button>
              <Button
                variant="danger"
                size="sm"
                :loading="savingPlantillaId === plantilla.idPlantilla"
                @click="openRejectModal(plantilla)"
              >
                Rechazar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <Modal :modelValue="showRejectModal" title="Rechazar plantilla" @close="closeRejectModal">
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Agrega observaciones para que el disenador ajuste la plantilla.
        </p>
        <textarea
          v-model="rejectObservaciones"
          rows="4"
          class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-rose-400"
          placeholder="Observaciones de rechazo"
        ></textarea>
        <p v-if="rejectError" class="text-xs text-rose-600">{{ rejectError }}</p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeRejectModal">Cancelar</Button>
          <Button variant="danger" :loading="savingPlantillaId === (rejectingPlantilla?.idPlantilla || 0)" @click="rechazarPlantilla">
            Rechazar
          </Button>
        </div>
      </div>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import Modal from '@/components/common/Modal.vue'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombre: string
  estado: string
  idDisenador?: number | null
  nombreDisenador?: string | null
  duracion?: number | null
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombre: string
  estado: string
}

interface SolicitudDto {
  idSolicitud: number
  nombreActividad: string
  codigoParalelo: string | null
  nombreDocente: string
  cantidadAprobados: number
  estado: string
  notas: string | null
}

interface PlantillaDto {
  idPlantilla: number
  idCurso: number | null
  idEvento: number | null
  nombreActividad: string
  tipoActividad: string
  version: number
  subidaPor: string
  fechaSubida: string
  estado: string
  ultimaObservacion: string | null
}

const alertStore = useAlertStore()
const carreras = ref<CarreraDto[]>([])
const selectedCarreraId = ref<number | null>(null)

const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])
const solicitudes = ref<SolicitudDto[]>([])
const plantillas = ref<PlantillaDto[]>([])

const loadingSolicitudes = ref(false)
const loadingPlantillas = ref(false)
const savingSolicitudId = ref<number | null>(null)
const savingPlantillaId = ref<number | null>(null)

const showRejectModal = ref(false)
const rejectingPlantilla = ref<PlantillaDto | null>(null)
const rejectObservaciones = ref('')
const rejectError = ref('')

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const cursosActivos = computed(() => {
  return cursosFiltrados.value.filter(curso => curso.estado === 'ABIERTO').length
})

const eventosActivos = computed(() => {
  return eventosFiltrados.value.filter(evento => evento.estado === 'ABIERTO').length
})

const pendingSolicitudes = computed(() => solicitudesFiltradas.value.length)
const pendingPlantillas = computed(() => plantillasFiltradas.value.length)

const cursosFiltrados = computed(() => {
  if (!selectedCarreraId.value) return cursos.value
  return cursos.value.filter(curso => curso.idCarrera === selectedCarreraId.value)
})

const eventosFiltrados = computed(() => {
  if (!selectedCarreraId.value) return eventos.value
  return eventos.value.filter(evento => evento.idCarrera === selectedCarreraId.value)
})

const solicitudesFiltradas = computed(() => {
  const carreraId = selectedCarreraId.value
  if (!carreraId) return solicitudes.value

  const cursosMap = new Map(cursos.value.map(curso => [curso.nombre, curso.idCarrera]))
  const eventosMap = new Map(eventos.value.map(evento => [evento.nombre, evento.idCarrera]))

  return solicitudes.value.filter(solicitud => {
    if (solicitud.codigoParalelo) {
      return cursosMap.get(solicitud.nombreActividad) === carreraId
    }
    return eventosMap.get(solicitud.nombreActividad) === carreraId
  })
})

const plantillasFiltradas = computed(() => {
  if (!selectedCarreraId.value) return plantillas.value

  const cursosMap = new Map(cursos.value.map(curso => [curso.idCurso, curso.idCarrera]))
  const eventosMap = new Map(eventos.value.map(evento => [evento.idEvento, evento.idCarrera]))

  return plantillas.value.filter(plantilla => {
    if (plantilla.idCurso) {
      return cursosMap.get(plantilla.idCurso) === selectedCarreraId.value
    }
    if (plantilla.idEvento) {
      return eventosMap.get(plantilla.idEvento) === selectedCarreraId.value
    }
    return false
  })
})

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as CarreraDto[]
  carreras.value = response
  selectedCarreraId.value = response[0]?.idCarrera ?? null
}

const loadCursos = async () => {
  const response = await api.get('/cursos/todos') as CursoDto[]
  cursos.value = response
}

const loadEventos = async () => {
  const response = await api.get('/eventos/todos') as EventoDto[]
  eventos.value = response
}

const loadSolicitudes = async () => {
  loadingSolicitudes.value = true
  try {
    const response = await api.get('/evaluaciones/solicitudes') as SolicitudDto[]
    solicitudes.value = response.filter(solicitud => solicitud.estado === 'PENDIENTE')
  } finally {
    loadingSolicitudes.value = false
  }
}

const loadPlantillas = async () => {
  loadingPlantillas.value = true
  try {
    const response = await api.get('/plantillas/pendientes') as PlantillaDto[]
    plantillas.value = response.filter(plantilla => plantilla.estado === 'PENDIENTE')
  } finally {
    loadingPlantillas.value = false
  }
}

const loadAll = async () => {
  await Promise.all([loadCarreras(), loadCursos(), loadEventos(), loadSolicitudes(), loadPlantillas()])
}

const aprobarSolicitud = async (solicitud: SolicitudDto) => {
  savingSolicitudId.value = solicitud.idSolicitud
  try {
    await api.patch(`/evaluaciones/solicitudes/${solicitud.idSolicitud}?estado=COMPLETADO`)
    solicitudes.value = solicitudes.value.filter(item => item.idSolicitud !== solicitud.idSolicitud)
    alertStore.push({
      type: 'success',
      message: 'Solicitud aprobada y lista para emitir certificados.'
    })
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo aprobar la solicitud.'
    })
  } finally {
    savingSolicitudId.value = null
  }
}

const verPlantilla = async (plantilla: PlantillaDto) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${baseUrl}/plantillas/${plantilla.idPlantilla}/descargar`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })

    if (!response.ok) {
      throw new Error('No se pudo descargar la plantilla')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo abrir la plantilla.'
    })
  }
}

const aprobarPlantilla = async (plantilla: PlantillaDto) => {
  savingPlantillaId.value = plantilla.idPlantilla
  try {
    await api.patch(`/plantillas/${plantilla.idPlantilla}/revisar`, {
      estado: 'APROBADA',
      observaciones: ''
    })
    plantillas.value = plantillas.value.filter(item => item.idPlantilla !== plantilla.idPlantilla)
    alertStore.push({
      type: 'success',
      message: 'Plantilla aprobada.'
    })
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo aprobar la plantilla.'
    })
  } finally {
    savingPlantillaId.value = null
  }
}

const openRejectModal = (plantilla: PlantillaDto) => {
  rejectingPlantilla.value = plantilla
  rejectObservaciones.value = ''
  rejectError.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  rejectingPlantilla.value = null
  rejectObservaciones.value = ''
  rejectError.value = ''
}

const rechazarPlantilla = async () => {
  if (!rejectingPlantilla.value) return
  if (!rejectObservaciones.value.trim()) {
    rejectError.value = 'Las observaciones son obligatorias.'
    return
  }

  const plantilla = rejectingPlantilla.value
  savingPlantillaId.value = plantilla.idPlantilla
  try {
    await api.patch(`/plantillas/${plantilla.idPlantilla}/revisar`, {
      estado: 'RECHAZADA',
      observaciones: rejectObservaciones.value.trim()
    })
    plantillas.value = plantillas.value.filter(item => item.idPlantilla !== plantilla.idPlantilla)
    alertStore.push({
      type: 'warning',
      message: 'Plantilla rechazada. Se envio observaciones.'
    })
    closeRejectModal()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo rechazar la plantilla.'
    })
  } finally {
    savingPlantillaId.value = null
  }
}

watch(selectedCarreraId, () => {
  // re-render computed lists
})

onMounted(() => {
  loadAll()
})
</script>
