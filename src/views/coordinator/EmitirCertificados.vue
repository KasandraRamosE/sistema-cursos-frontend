<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Emitir certificados</h1>
        <p class="text-sm text-slate-500">
          Revisa qué actividades ya fueron emitidas y cuáles están listas para emitir.
        </p>
      </div>
      <Button variant="outline" size="sm" @click="loadAll">Actualizar</Button>
    </div>

    <Card>
      <div class="grid gap-4 md:grid-cols-5">
        <div class="md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar por actividad o docente"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model="selectedCarreraId"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option :value="''">Todas</option>
            <option v-for="c in carreras" :key="c.idCarrera" :value="c.idCarrera">{{ c.nombre }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</label>
          <select
            v-model="tipoFiltro"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="CURSO">Curso</option>
            <option value="EVENTO">Evento</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
          <select
            v-model="estadoFiltro"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="LISTO">Listo para emitir</option>
            <option value="NO_EMITIDO">No emitido</option>
            <option value="EMITIDO">Emitido</option>
          </select>
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Actividades de certificados</h3>
          <p class="text-sm text-slate-500">Un solo listado con el estado real de emisión para cursos y eventos.</p>
        </div>
        <Badge variant="primary" size="sm">
          {{ filteredActivities.length }} resultados
        </Badge>
      </div>

      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
        Cargando actividades...
      </div>
      <div v-else-if="filteredActivities.length === 0" class="py-8 text-center text-sm text-slate-500">
        No hay actividades que coincidan con los filtros.
      </div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actividad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Plantilla</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Detalle</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="item in paginatedActivities" :key="item.key" class="hover:bg-slate-50">
              <td class="px-4 py-3">
                <p class="text-sm font-semibold text-slate-800">{{ item.nombre }}</p>
                <p class="text-xs text-slate-500">{{ item.carreraNombre || 'Sin carrera' }}</p>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">
                {{ formatActivityDate(item) }}
              </td>
              <td class="px-4 py-3">
                <Badge :variant="item.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ item.tipo }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="estadoBadge(item.estado)" size="sm">
                  {{ estadoLabel(item.estado) }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="estadoPlantillaBadge(item.estadoPlantilla)" size="sm">
                  {{ item.estadoPlantillaLabel }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">
                <div v-if="item.tipo === 'CURSO'">
                  <p>Docente: {{ item.nombreDocente || '-' }}</p>
                  <p>Aprobados: {{ item.cantidadAprobados ?? '-' }}</p>
                  <p>Solicitud: {{ item.fechaSolicitud ? formatDatetime(item.fechaSolicitud) : '-' }}</p>
                </div>
                <div v-else>
                  <p>Fecha evento: {{ item.fechaEvento ? formatDatetime(item.fechaEvento) : '-' }}</p>
                  <p>Plantilla: {{ item.templateVigente ? 'Aprobada' : 'Sin aprobar' }}</p>
                  <p>Emitidos: {{ item.certificadosEmitidos ?? 0 }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  v-if="item.canEmit"
                  size="sm"
                  :loading="processingKey === item.key"
                  @click="item.tipo === 'CURSO' ? emitirCurso(item) : emitirEvento(item)"
                >
                  Emitir
                </Button>
                <Button v-else-if="item.estado === 'EMITIDO'" variant="outline" size="sm" disabled>
                  Ya emitido
                </Button>
                <Button v-else variant="outline" size="sm" disabled>
                  No disponible
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-slate-500">
          Mostrando {{ pageStart }}-{{ pageEnd }} de {{ filteredActivities.length }} resultados
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model.number="pageSize"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
          >
            <option :value="5">5 por página</option>
            <option :value="10">10 por página</option>
            <option :value="20">20 por página</option>
            <option :value="50">50 por página</option>
          </select>
          <Button variant="outline" size="sm" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            Anterior
          </Button>
          <div class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
            Página {{ currentPage }} de {{ totalPages }}
          </div>
          <Button variant="outline" size="sm" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
            Siguiente
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import { api } from '@/utils/api'
import { formatDateTime as formatDateTimeUtil, parseLocalDate } from '@/utils/dateFormatter'
import { useAlertStore } from '@/stores/alert.store'
import { usePagination } from '@/composables/usePagination'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombre: string
  nombreCarrera?: string
  fechaInicio?: string
  fechaCreacion?: string
  paralelos?: Array<Record<string, unknown>>
  duracion?: number | null
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombre: string
  nombreCarrera?: string
  fechaHora?: string
  fechaCreacion?: string
}

interface PlantillaEstadoResumenDto {
  idCurso?: number | null
  idEvento?: number | null
  estado: 'PENDIENTE' | 'VIGENTE' | 'HISTORICA'
  version?: number | null
}

interface SolicitudDto {
  idSolicitud: number
  nombreActividad: string
  codigoParalelo: string | null
  nombreDocente: string | null
  cantidadAprobados: number
  estado: string
  fechaSolicitud: string
}

interface SolicitudView extends SolicitudDto {
  tipoActividad: 'CURSO' | 'EVENTO'
  idCurso?: number
  idEvento?: number
  carreraId?: number
  carreraNombre?: string
  canEmit: boolean
  templateVigente?: boolean
}

interface ActivityRow {
  key: string
  tipo: 'CURSO' | 'EVENTO'
  nombre: string
  carreraNombre: string
  fechaActividad: string | null
  estado: 'LISTO' | 'NO_EMITIDO' | 'EMITIDO'
  estadoPlantilla: 'APROBADA' | 'PENDIENTE' | 'SIN_PLANTILLA'
  estadoPlantillaLabel: string
  canEmit: boolean
  carreraId?: number
  idCurso?: number
  idEvento?: number
  idSolicitud?: number
  codigoParalelo?: string | null
  nombreDocente?: string | null
  cantidadAprobados?: number | null
  fechaSolicitud?: string | null
  fechaEvento?: string | null
  templateVigente?: boolean
  certificadosEmitidos?: number
}

const alertStore = useAlertStore()

const loading = ref(false)
const processingKey = ref<string | null>(null)

const carreras = ref<CarreraDto[]>([])
const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])
const solicitudes = ref<SolicitudDto[]>([])
const certificados = ref<Array<Record<string, unknown>>>([])

const searchTerm = ref('')
const tipoFiltro = ref('')
const estadoFiltro = ref('')
const selectedCarreraId = ref<number | ''>('')
const normalizeText = (s?: string) => String(s || '').toLowerCase().trim()

const getRowDate = (dateString?: string | null) => {
  if (!dateString) return 0
  try {
    return parseLocalDate(dateString).getTime()
  } catch {
    return 0
  }
}

const carrerasCoordinadorIds = computed(() => new Set(carreras.value.map(c => c.idCarrera)))

const formatActivityDate = (item: ActivityRow) => {
  if (!item.fechaActividad) return '-'
  return item.tipo === 'CURSO'
    ? formatDateTimeUtil(item.fechaActividad, 'es-BO').split(',')[0]
    : formatDateTimeUtil(item.fechaActividad, 'es-BO')
}

const solicitudesView = computed((): SolicitudView[] => {
  const cursosByName = new Map(cursos.value.map(c => [normalizeText(c.nombre), c]))
  const eventosByName = new Map(eventos.value.map(e => [normalizeText(e.nombre), e]))
  const carrerasById = new Map(carreras.value.map(c => [c.idCarrera, c]))

  return solicitudes.value.map(item => {
    const isCurso = Boolean(item.codigoParalelo)
    const curso = isCurso ? cursosByName.get(normalizeText(item.nombreActividad)) : undefined
    const evento = !isCurso ? eventosByName.get(normalizeText(item.nombreActividad)) : undefined

    const carreraId = isCurso ? curso?.idCarrera : evento?.idCarrera
    let carreraNombre = ''
    if (isCurso) {
      carreraNombre = curso?.nombreCarrera || (carrerasById.get(curso?.idCarrera || -1)?.nombre) || ''
    } else {
      carreraNombre = evento?.nombreCarrera || ''
    }

    return {
      ...item,
      tipoActividad: isCurso ? 'CURSO' : 'EVENTO',
      idCurso: curso?.idCurso,
      idEvento: evento?.idEvento,
      carreraId,
      carreraNombre,
      canEmit: Boolean(isCurso ? curso?.idCurso : evento?.idEvento),
      templateVigente: isCurso
        ? Boolean(curso?.idCurso && plantillaEstadosByActividad.value.get(`CURSO-${curso.idCurso}`)?.estado === 'VIGENTE')
        : Boolean(evento?.idEvento && plantillaEstadosByActividad.value.get(`EVENTO-${evento.idEvento}`)?.estado === 'VIGENTE')
    }
  })
})

const certificadosEmitidosMap = computed(() => {
  const map = new Map<string, number>()
  certificados.value.forEach((certificado) => {
    if (String(certificado.estadoEmision) !== 'GENERADO') return
    const key = `${String(certificado.tipoActividad || '')}-${String(certificado.nombreActividad || '')}`
    map.set(key, (map.get(key) || 0) + 1)
  })
  return map
})

const solicitudCursoMap = computed(() => {
  const map = new Map<string, SolicitudView>()
  solicitudesView.value
    .filter(item => item.tipoActividad === 'CURSO')
    .forEach((item) => {
      map.set(normalizeText(item.nombreActividad), item)
    })
  return map
})

const plantillaEstadosByActividad = computed(() => {
  const map = new Map<string, PlantillaEstadoResumenDto>()
  plantillasEstados.value.forEach(item => {
    if (item.idCurso != null) {
      map.set(`CURSO-${item.idCurso}`, item)
    } else if (item.idEvento != null) {
      map.set(`EVENTO-${item.idEvento}`, item)
    }
  })
  return map
})

const getTemplateState = (estado: PlantillaEstadoResumenDto['estado'] | null) => {
  if (!estado) {
    return { estadoPlantilla: 'SIN_PLANTILLA' as const, estadoPlantillaLabel: 'Sin plantilla' }
  }

  if (estado === 'PENDIENTE') {
    return { estadoPlantilla: 'PENDIENTE' as const, estadoPlantillaLabel: 'Pendiente' }
  }

  return { estadoPlantilla: 'APROBADA' as const, estadoPlantillaLabel: 'Aprobada' }
}

const activities = computed((): ActivityRow[] => {
  const cursosRows = cursos.value.map((curso) => {
    const solicitud = solicitudCursoMap.value.get(normalizeText(curso.nombre))
      ?? solicitudesView.value.find(item => item.tipoActividad === 'CURSO' && normalizeText(item.nombreActividad) === normalizeText(curso.nombre))
    const key = `CURSO-${curso.nombre}`
    const emittedCount = certificadosEmitidosMap.value.get(key) || 0
    const fechaActividad = curso.fechaInicio || curso.fechaCreacion || null
    const templateMeta = plantillaEstadosByActividad.value.get(`CURSO-${curso.idCurso}`) ?? null
    const templateState = getTemplateState(templateMeta?.estado ?? null)
    const estado: ActivityRow['estado'] = emittedCount > 0
      ? 'EMITIDO'
      : solicitud && templateMeta?.estado === 'VIGENTE'
        ? 'LISTO'
        : 'NO_EMITIDO'
    const carrerasById = new Map(carreras.value.map(c => [c.idCarrera, c]))
    const carreraNombre = curso.nombreCarrera || (carrerasById.get(curso.idCarrera)?.nombre) || 'Sin carrera'
    return {
      key,
      tipo: 'CURSO' as const,
      nombre: curso.nombre,
      carreraNombre,
      fechaActividad,
      carreraId: curso.idCarrera,
      estado,
      ...templateState,
      canEmit: estado === 'LISTO',
      idCurso: curso.idCurso,
      idEvento: undefined,
      idSolicitud: solicitud?.idSolicitud,
      codigoParalelo: solicitud?.codigoParalelo ?? null,
      nombreDocente: solicitud?.nombreDocente ?? null,
      cantidadAprobados: solicitud?.cantidadAprobados ?? null,
      fechaSolicitud: solicitud?.fechaSolicitud ?? null,
      fechaEvento: undefined,
      templateVigente: templateMeta?.estado === 'VIGENTE',
      certificadosEmitidos: emittedCount
    }
  })

  const eventosRows = eventos.value.map(evento => {
    const key = `EVENTO-${evento.nombre}`
    const emittedCount = certificadosEmitidosMap.value.get(key) || 0
    const fechaActividad = evento.fechaHora || evento.fechaCreacion || null
    const templateMeta = plantillaEstadosByActividad.value.get(`EVENTO-${evento.idEvento}`) ?? null
    const templateState = getTemplateState(templateMeta?.estado ?? null)
    const fechaPasada = evento.fechaHora ? parseLocalDate(evento.fechaHora) <= new Date() : false
    const estado: ActivityRow['estado'] = emittedCount > 0
      ? 'EMITIDO'
      : templateMeta?.estado === 'VIGENTE' && fechaPasada
        ? 'LISTO'
        : 'NO_EMITIDO'

    return {
      key,
      tipo: 'EVENTO' as const,
      nombre: evento.nombre,
      carreraNombre: evento.nombreCarrera || 'Sin carrera',
      fechaActividad,
      carreraId: evento.idCarrera,
      estado,
      ...templateState,
      canEmit: estado === 'LISTO',
      idCurso: undefined,
      idEvento: evento.idEvento,
      idSolicitud: undefined,
      codigoParalelo: undefined,
      nombreDocente: undefined,
      cantidadAprobados: undefined,
      fechaSolicitud: undefined,
      fechaEvento: evento.fechaHora,
      templateVigente: templateMeta?.estado === 'VIGENTE',
      certificadosEmitidos: emittedCount
    }
  })

  return [...cursosRows, ...eventosRows].sort((a, b) => getRowDate(b.fechaActividad) - getRowDate(a.fechaActividad))
})

const filteredActivities = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return activities.value.filter(item => {
    const carreraPermitida = item.carreraId !== undefined && carrerasCoordinadorIds.value.has(item.carreraId)
    const carreraSeleccionada = selectedCarreraId.value === '' || item.carreraId === selectedCarreraId.value
    const carreraOk = carreraPermitida && carreraSeleccionada

    const searchOk = !term
      || item.nombre.toLowerCase().includes(term)
      || (item.nombreDocente ?? '').toLowerCase().includes(term)
      || item.carreraNombre.toLowerCase().includes(term)
    const tipoOk = !tipoFiltro.value || item.tipo === tipoFiltro.value
    const estadoOk = !estadoFiltro.value || item.estado === estadoFiltro.value
    return carreraOk && searchOk && tipoOk && estadoOk
  })
})

const {
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  paginatedData: paginatedActivities,
  goToPage,
  goToFirstPage
} = usePagination(filteredActivities, { pageSize: 10 })

const pageStart = computed(() => (totalItems.value === 0 ? 0 : startIndex.value + 1))
const pageEnd = computed(() => endIndex.value)

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as CarreraDto[]
  carreras.value = response
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
  const response = await api.get('/evaluaciones/solicitudes/todas') as SolicitudDto[]
  solicitudes.value = response
}

const plantillasEstados = ref<PlantillaEstadoResumenDto[]>([])

const loadPlantillasEstados = async () => {
  const response = await api.get('/plantillas/estados-por-actividad') as PlantillaEstadoResumenDto[]
  plantillasEstados.value = response
}

const loadCertificados = async () => {
  const response = await api.get('/certificados/admin') as Array<Record<string, unknown>>
  certificados.value = response
}

const loadAll = async () => {
  loading.value = true
  try {
    goToFirstPage()
    await Promise.all([loadCarreras(), loadCursos(), loadEventos(), loadSolicitudes(), loadCertificados(), loadPlantillasEstados()])
  } finally {
    loading.value = false
  }
}

const ensurePlantillaVigente = async (payload: { idCurso?: number; idEvento?: number }) => {
  if (payload.idCurso) {
    const historial = await api.get(`/plantillas/historial?idCurso=${payload.idCurso}`) as Array<Record<string, unknown>>
    const vigente = historial.some(item => String(item.estado) === 'VIGENTE')
    if (!vigente) {
      throw new Error('No hay plantilla aprobada para este curso.')
    }
    return
  }

  if (payload.idEvento) {
    const historial = await api.get(`/plantillas/historial?idEvento=${payload.idEvento}`) as Array<Record<string, unknown>>
    const vigente = historial.some(item => String(item.estado) === 'VIGENTE')
    if (!vigente) {
      throw new Error('No hay plantilla aprobada para este evento.')
    }
    return
  }

  throw new Error('No se encontro la actividad para emitir.')
}

const emitirCurso = async (item: ActivityRow) => {
  if (!item || !item.canEmit || item.tipo !== 'CURSO') {
    alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' })
    return
  }

  processingKey.value = item.key
  try {
    await ensurePlantillaVigente({ idCurso: item.idCurso, idEvento: item.idEvento })

    await api.post('/certificados/lote', {
      idCurso: item.idCurso,
      codigoParalelo: item.codigoParalelo
    })

    if (item.idSolicitud) {
      await api.patch(`/evaluaciones/solicitudes/${item.idSolicitud}?estado=COMPLETADO`)
    }

    alertStore.push({
      type: 'success',
      message: 'Emision completada. Los certificados se generaron en lote.'
    })

    await loadAll()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo emitir el lote.'
    })
  } finally {
    processingKey.value = null
  }
}

const emitirEvento = async (item: ActivityRow) => {
  if (!item || !item.canEmit || item.tipo !== 'EVENTO' || !item.idEvento) {
    alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' })
    return
  }

  processingKey.value = item.key
  try {
    const solicitud = await api.post(`/evaluaciones/solicitudes/evento/${item.idEvento}`, {
      notas: 'Generada desde el panel de emisión'
    }) as { idSolicitud: number }

    await api.patch(`/evaluaciones/solicitudes/${solicitud.idSolicitud}?estado=COMPLETADO`)

    alertStore.push({
      type: 'success',
      message: `Certificados de ${item.nombre} emitidos correctamente.`
    })

    await loadAll()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo emitir el evento.'
    })
  } finally {
    processingKey.value = null
  }
}

const estadoLabel = (estado: ActivityRow['estado']) => {
  switch (estado) {
    case 'LISTO':
      return 'Listo para emitir'
    case 'EMITIDO':
      return 'Emitido'
    case 'NO_EMITIDO':
      return 'No emitido'
    default:
      return estado
  }
}

const estadoPlantillaBadge = (estado: ActivityRow['estadoPlantilla']) => {
  switch (estado) {
    case 'APROBADA':
      return 'success'
    case 'PENDIENTE':
      return 'warning'
    case 'SIN_PLANTILLA':
    default:
      return 'gray'
  }
}

watch([searchTerm, tipoFiltro, estadoFiltro, selectedCarreraId], () => {
  goToFirstPage()
})

const estadoBadge = (estado: ActivityRow['estado']) => {
  switch (estado) {
    case 'LISTO':
      return 'warning'
    case 'EMITIDO':
      return 'success'
    case 'NO_EMITIDO':
      return 'gray'
    default:
      return 'gray'
  }
}

const formatDatetime = (datetime: string) => {
  if (!datetime) return '-'
  return formatDateTimeUtil(datetime, 'es-BO')
}

onMounted(() => {
  loadAll()
})
</script>
