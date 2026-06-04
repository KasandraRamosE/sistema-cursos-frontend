<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Inscritos</h1>
        <p class="text-sm text-slate-500">
          Revisa cursos y eventos, filtra por carrera y abre una actividad para ver sus inscritos.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" @click="resetFilters">Limpiar filtros</Button>
        <Button :loading="loadingActivities" @click="loadAll">Actualizar</Button>
      </div>
    </div>

    <Card>
      <div class="grid gap-4 lg:grid-cols-4">
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Actividad, carrera, tipo o fecha"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model="selectedCarreraId"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todas</option>
            <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
              {{ carrera.nombre }}
            </option>
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
            <option value="ABIERTO">Abierta</option>
            <option value="LLENO">Llena</option>
            <option value="FINALIZADO">Finalizada</option>
          </select>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <Badge variant="primary" size="sm">{{ activitiesFiltered.length }} actividades</Badge>
        <Badge variant="secondary" size="sm">{{ cursosFiltrados }} cursos</Badge>
        <Badge variant="info" size="sm">{{ eventosFiltrados }} eventos</Badge>
        <Badge v-if="selectedActivity" variant="gray" size="sm">
          Seleccionada: {{ selectedActivity.nombre }}
        </Badge>
      </div>
    </Card>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
      <Card>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Actividades</h3>
            <p class="text-sm text-slate-500">Cursos y eventos con cupo, carrera, fecha y acceso a inscritos.</p>
          </div>
          <p class="text-xs text-slate-500">Haz clic en "Ver inscritos" para cargar el detalle.</p>
        </div>

        <div v-if="loadingActivities" class="py-10 text-center text-sm text-slate-500">
          Cargando actividades...
        </div>

        <div v-else-if="activitiesOrdered.length === 0" class="py-10 text-center text-sm text-slate-500">
          No hay actividades para mostrar con los filtros actuales.
        </div>

        <div v-else class="mt-4 overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Actividad</th>
                <th class="px-4 py-3">Carrera / Fecha</th>
                <th class="px-4 py-3">Cupo</th>
                <th class="px-4 py-3">Tipo / Estado</th>
                <th class="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="activity in activitiesOrdered"
                :key="activity.key"
                class="transition"
                :class="selectedActivity?.key === activity.key ? 'bg-emerald-50/70' : 'hover:bg-slate-50'"
              >
                <td class="px-4 py-3 align-top">
                  <div class="space-y-1">
                    <p class="font-semibold text-slate-900">{{ activity.nombre }}</p>
                    <p class="text-xs text-slate-500">
                      {{ activity.tipo === 'CURSO' ? `${activity.paralelos.length} paralelos` : 'Evento unico' }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-3 align-top text-slate-600">
                  <p>{{ activity.carreraNombre || 'Sin carrera' }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ formatDate(activity.fecha) }}</p>
                </td>
                <td class="px-4 py-3 align-top">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-4 text-xs text-slate-500">
                      <span>{{ formatCupo(activity.inscritos, activity.cupoMaximo) }}</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-emerald-500"
                        :style="{ width: `${getCupoPorcentaje(activity.inscritos, activity.cupoMaximo)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 align-top">
                  <div class="flex flex-col gap-2">
                    <Badge :variant="activity.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                      {{ activity.tipo }}
                    </Badge>
                    <Badge :variant="estadoActividadVariant(activity.estado)" size="sm">
                      {{ activity.estado }}
                    </Badge>
                  </div>
                </td>
                <td class="px-4 py-3 align-top text-right">
                  <Button variant="outline" size="sm" @click="selectActivity(activity)">
                    Ver inscritos
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card class="h-fit xl:sticky xl:top-6">
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Detalle de inscritos</h3>
            <p class="text-sm text-slate-500">Selecciona una actividad para cargar la lista.</p>
          </div>

          <div v-if="selectedActivity" class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div class="flex flex-wrap gap-2">
                    <Badge :variant="selectedActivity.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                      {{ selectedActivity.tipo }}
                    </Badge>
                    <Badge :variant="estadoActividadVariant(selectedActivity.estado)" size="sm">
                      {{ selectedActivity.estado }}
                    </Badge>
                  </div>
                  <p class="mt-2 text-base font-semibold text-slate-900">{{ selectedActivity.nombre }}</p>
                  <p class="text-sm text-slate-600">{{ selectedActivity.carreraNombre || 'Sin carrera' }}</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" :loading="printingReport" @click="printSelectedActivityReport">
                    Imprimir
                  </Button>
                  <Button variant="outline" size="sm" @click="clearSelectedActivity">Cerrar</Button>
                </div>
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-500">Fecha</p>
                  <p class="text-sm font-medium text-slate-900">{{ formatDate(selectedActivity.fecha) }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-500">Cupo</p>
                  <p class="text-sm font-medium text-slate-900">{{ formatCupo(selectedActivity.inscritos, selectedActivity.cupoMaximo) }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-500">Inscritos</p>
                  <p class="text-sm font-medium text-slate-900">{{ selectedActivity.inscritos }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-500">Disponibles</p>
                  <p class="text-sm font-medium text-slate-900">
                    {{ cupoRestante(selectedActivity.inscritos, selectedActivity.cupoMaximo) }}
                  </p>
                </div>
              </div>

              <div class="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all"
                  :style="{ width: `${getCupoPorcentaje(selectedActivity.inscritos, selectedActivity.cupoMaximo)}%` }"
                ></div>
              </div>
            </div>

            <div v-if="selectedActivity.tipo === 'CURSO' && selectedActivity.paralelos.length > 1" class="space-y-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Paralelo</label>
              <select
                v-model="selectedParallelCode"
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
                @change="loadSelectedActivityInscritos"
              >
                <option v-for="paralelo in selectedActivity.paralelos" :key="paralelo.codigo" :value="paralelo.codigo">
                  Paralelo {{ paralelo.codigo }} - {{ formatCupo(paralelo.inscritos, paralelo.cupoMaximo) }}
                </option>
              </select>
            </div>

            <div v-else-if="selectedActivity.tipo === 'CURSO'" class="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
              Paralelo seleccionado: {{ selectedParallelCode || '-' }}
            </div>

            <div v-if="loadingInscritos" class="py-10 text-center text-sm text-slate-500">
              Cargando inscritos...
            </div>

            <div v-else-if="selectedActivity.tipo === 'CURSO'">
              <div v-if="courseEnrolled.length === 0" class="py-10 text-center text-sm text-slate-500">
                No hay inscritos para este paralelo.
              </div>

              <div v-else class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-3">#</th>
                      <th class="px-4 py-3">Participante</th>
                      <th class="px-4 py-3">RU / Username</th>
                      <th class="px-4 py-3 text-center">Nota</th>
                      <th class="px-4 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(item, index) in courseEnrolled" :key="item.idEvaluacion" class="hover:bg-slate-50">
                      <td class="px-4 py-3 text-slate-500">{{ index + 1 }}</td>
                      <td class="px-4 py-3">
                        <p class="font-medium text-slate-900">{{ item.nombres }} {{ item.apellidos }}</p>
                        <p class="text-xs text-slate-500">{{ item.email || '-' }}</p>
                      </td>
                      <td class="px-4 py-3 text-slate-600">{{ item.username }}</td>
                      <td class="px-4 py-3 text-center">
                        <span v-if="item.notaFinal !== null" :class="getNotaColor(item.notaFinal, selectedCourseMinGrade)">
                          {{ item.notaFinal }}
                        </span>
                        <span v-else class="text-slate-400">-</span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <Badge :variant="estadoEvaluacionVariant(item.estado)" size="sm">
                          {{ item.estado || 'PENDIENTE' }}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-else>
              <div v-if="eventEnrolled.length === 0" class="py-10 text-center text-sm text-slate-500">
                No hay inscritos para este evento.
              </div>

              <div v-else class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-3">#</th>
                      <th class="px-4 py-3">Participante</th>
                      <th class="px-4 py-3">RU / Username</th>
                      <th class="px-4 py-3">Email</th>
                      <th class="px-4 py-3 text-center">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(item, index) in eventEnrolled" :key="item.idInscripcion" class="hover:bg-slate-50">
                      <td class="px-4 py-3 text-slate-500">{{ index + 1 }}</td>
                      <td class="px-4 py-3">
                        <p class="font-medium text-slate-900">{{ item.nombres }} {{ item.apellidos }}</p>
                      </td>
                      <td class="px-4 py-3 text-slate-600">{{ item.username }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ item.email }}</td>
                      <td class="px-4 py-3 text-center">
                        <Badge :variant="item.asistio ? 'success' : 'danger'" size="sm">
                          {{ item.asistio ? 'ASISTIO' : 'NO ASISTIO' }}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Selecciona una actividad de la lista para cargar los inscritos.
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import { useAlertStore } from '@/stores/alert.store'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, parseLocalDate } from '@/utils/dateFormatter'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface CursoParaleloDto {
  codigo?: string
  inscritos?: number
  cupoMaximo?: number
  cuposDisponibles?: number
  fechaInicio?: string
  fechaFin?: string
}

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombre: string
  nombreCarrera?: string
  descripcion?: string
  fechaInicio?: string
  estado?: string
  notaAprobacion?: number
  paralelos?: CursoParaleloDto[]
  duracion?: number | null
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombre: string
  nombreCarrera?: string
  descripcion?: string
  fechaInicio?: string
  fechaHora?: string
  inscritos?: number
  cupoMaximo?: number
  cuposDisponibles?: number
  estado?: string
}

interface ActivityParallel {
  codigo: string
  inscritos: number
  cupoMaximo: number
  fechaInicio?: string
  fechaFin?: string
}

interface ActivityRow {
  key: string
  tipo: 'CURSO' | 'EVENTO'
  idActividad: number
  nombre: string
  descripcion?: string
  carreraId: number
  carreraNombre: string
  fecha: string
  inscritos: number
  cupoMaximo: number
  estado: string
  paralelos: ActivityParallel[]
  notaMinima?: number
}

interface CourseEnrolledItem {
  idEvaluacion: number
  idInscripcion: number
  nombres: string
  apellidos: string
  email: string
  username: string
  notaFinal: number | null
  estado: string | null
  fechaRegistro: string
}

interface EventEnrolledItem {
  idInscripcion: number
  nombres: string
  apellidos: string
  email: string
  username: string
  asistio: boolean
  fechaRegistro: string
}

const route = useRoute()
const alertStore = useAlertStore()

const loadingActivities = ref(false)
const carreras = ref<CarreraDto[]>([])
const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])

const searchTerm = ref('')
const selectedCarreraId = ref<number | ''>('')
const tipoFiltro = ref('')
const estadoFiltro = ref('')

const activities = ref<ActivityRow[]>([])
const selectedActivityKey = ref<string | null>(null)
const selectedParallelCode = ref('')
const loadingInscritos = ref(false)
const printingReport = ref(false)
const courseEnrolled = ref<CourseEnrolledItem[]>([])
const eventEnrolled = ref<EventEnrolledItem[]>([])

const selectedActivity = computed(() => {
  return activities.value.find(activity => activity.key === selectedActivityKey.value) ?? null
})

const selectedCourseMinGrade = computed(() => selectedActivity.value?.notaMinima ?? 51)

const activitiesFiltered = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  const carreraId = selectedCarreraId.value
  const tipo = tipoFiltro.value
  const estado = estadoFiltro.value

  return activities.value.filter(activity => {
    const matchesCarrera = !carreraId || activity.carreraId === carreraId
    const matchesTipo = !tipo || activity.tipo === tipo
    const matchesEstado = !estado || activity.estado === estado
    const matchesSearch = !term
      || activity.nombre.toLowerCase().includes(term)
      || activity.carreraNombre.toLowerCase().includes(term)
      || activity.tipo.toLowerCase().includes(term)
      || activity.estado.toLowerCase().includes(term)
      || formatDate(activity.fecha).toLowerCase().includes(term)

    return matchesCarrera && matchesTipo && matchesEstado && matchesSearch
  })
})

const activitiesOrdered = computed(() => {
  return [...activitiesFiltered.value].sort((left, right) => {
    const leftTime = parseDateToTime(left.fecha)
    const rightTime = parseDateToTime(right.fecha)

    if (leftTime !== rightTime) {
      return rightTime - leftTime
    }

    if (left.tipo !== right.tipo) {
      return left.tipo === 'CURSO' ? -1 : 1
    }

    return left.nombre.localeCompare(right.nombre, 'es')
  })
})

const cursosFiltrados = computed(() => activitiesFiltered.value.filter(activity => activity.tipo === 'CURSO').length)
const eventosFiltrados = computed(() => activitiesFiltered.value.filter(activity => activity.tipo === 'EVENTO').length)

const formatDate = (value: string | undefined) => {
  if (!value) return '-'
  return formatDateUtil(value, 'es-BO')
}

const formatDateTime = (value: string) => {
  if (!value) return '-'
  return formatDateTimeUtil(value, 'es-BO')
}

const parseDateToTime = (value: string) => {
  const time = parseLocalDate(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

const formatCupo = (inscritos: number, cupoMaximo: number) => {
  const cupo = cupoMaximo > 0 ? cupoMaximo : '-'
  return `${inscritos}/${cupo}`
}

const cupoRestante = (inscritos: number, cupoMaximo: number) => {
  if (!cupoMaximo || cupoMaximo <= 0) return 0
  return Math.max(0, cupoMaximo - inscritos)
}

const getCupoPorcentaje = (inscritos: number, cupoMaximo: number) => {
  if (!cupoMaximo || cupoMaximo <= 0) return 0
  return Math.min(100, (inscritos / cupoMaximo) * 100)
}

const estadoActividadVariant = (estado: string) => {
  if (estado === 'ABIERTO') return 'success'
  if (estado === 'LLENO') return 'warning'
  if (estado === 'FINALIZADO') return 'gray'
  return 'info'
}

const estadoEvaluacionVariant = (estado: string | null) => {
  if (estado === 'APROBADO') return 'success'
  if (estado === 'REPROBADO') return 'danger'
  return 'warning'
}

const getNotaColor = (nota: number | null, notaMinima: number) => {
  if (nota === null) return 'text-slate-400'
  return nota >= notaMinima ? 'text-emerald-600' : 'text-rose-600'
}

const splitNombreCompleto = (nombreCompleto: string) => {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)

  if (partes.length <= 1) {
    return {
      nombres: nombreCompleto || '-',
      apellidos: ''
    }
  }

  return {
    nombres: partes.slice(0, -1).join(' '),
    apellidos: partes.slice(-1).join(' ')
  }
}

const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

// Helper to pick first available key from possible alternatives
const pick = (obj: Record<string, any> = {}, ...keys: string[]) => {
  for (const k of keys) {
    if (obj === null || obj === undefined) continue
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k]
  }
  return undefined
}

const buildActivities = () => {
  const cursosNormalizados = cursos.value.map(course => {
    const paralelos = Array.isArray(course.paralelos) ? course.paralelos : []

    const normalizedParallels = paralelos.map((paralelo, index) => {
      const inscritos = Number(paralelo.inscritos ?? 0)
      const cupoMaximo = paralelo.cupoMaximo !== undefined && paralelo.cupoMaximo !== null
        ? Number(paralelo.cupoMaximo)
        : inscritos + Number(paralelo.cuposDisponibles ?? 0)

      return {
        codigo: String(paralelo.codigo ?? `P${index + 1}`),
        inscritos,
        cupoMaximo,
        fechaInicio: paralelo.fechaInicio ? String(paralelo.fechaInicio) : undefined,
        fechaFin: paralelo.fechaFin ? String(paralelo.fechaFin) : undefined
      }
    })

    const inscritos = normalizedParallels.reduce((sum, paralelo) => sum + paralelo.inscritos, 0)
    const cupoMaximo = normalizedParallels.reduce((sum, paralelo) => {
      if (paralelo.cupoMaximo > 0) return sum + paralelo.cupoMaximo
      return sum + paralelo.inscritos
    }, 0)

    const fecha = course.fechaInicio || normalizedParallels[0]?.fechaInicio || ''

    return {
      key: `curso-${course.idCurso}`,
      tipo: 'CURSO' as const,
      idActividad: Number(course.idCurso),
      nombre: String(course.nombre ?? ''),
      descripcion: course.descripcion ? String(course.descripcion) : '',
      carreraId: Number(course.idCarrera ?? 0),
      carreraNombre: String(course.nombreCarrera ?? ''),
      fecha,
      inscritos,
      cupoMaximo,
      estado: String(course.estado ?? 'ABIERTO'),
      paralelos: normalizedParallels,
      notaMinima: course.notaAprobacion !== undefined ? Number(course.notaAprobacion) : 51
    } satisfies ActivityRow
  })

  const eventosNormalizados = eventos.value.map(evento => {
    const inscritos = Number(evento.inscritos ?? 0)
    const cupoMaximo = evento.cupoMaximo !== undefined && evento.cupoMaximo !== null
      ? Number(evento.cupoMaximo)
      : inscritos + Number(evento.cuposDisponibles ?? 0)

    return {
      key: `evento-${evento.idEvento}`,
      tipo: 'EVENTO' as const,
      idActividad: Number(evento.idEvento),
      nombre: String(evento.nombre ?? ''),
      descripcion: evento.descripcion ? String(evento.descripcion) : '',
      carreraId: Number(evento.idCarrera ?? 0),
      carreraNombre: String(evento.nombreCarrera ?? ''),
      fecha: String(evento.fechaInicio ?? evento.fechaHora ?? ''),
      inscritos,
      cupoMaximo,
      estado: String(evento.estado ?? 'ABIERTO'),
      paralelos: [],
      notaMinima: undefined
    } satisfies ActivityRow
  })

  activities.value = [...cursosNormalizados, ...eventosNormalizados]
}

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as Array<Record<string, unknown>>
  carreras.value = response.map(carrera => ({
    idCarrera: Number(carrera.idCarrera ?? carrera.id ?? 0),
    nombre: String(carrera.nombre ?? '')
  }))
}

const loadCursos = async () => {
  const response = await api.get('/cursos/todos') as Array<Record<string, unknown>>
  cursos.value = response.map(curso => ({
    idCurso: Number(curso.idCurso ?? 0),
    idCarrera: Number(curso.idCarrera ?? 0),
    nombre: String(curso.nombre ?? ''),
    nombreCarrera: String(curso.nombreCarrera ?? ''),
    descripcion: curso.descripcion ? String(curso.descripcion) : '',
    fechaInicio: curso.fechaInicio ? String(curso.fechaInicio) : '',
    estado: String(curso.estado ?? 'ABIERTO'),
    notaAprobacion: curso.notaAprobacion !== undefined ? Number(curso.notaAprobacion) : undefined,
    paralelos: Array.isArray(curso.paralelos)
      ? (curso.paralelos as CursoParaleloDto[])
      : []
  }))
}

const loadEventos = async () => {
  const response = await api.get('/eventos/todos') as Array<Record<string, unknown>>
  eventos.value = response.map(evento => ({
    idEvento: Number(evento.idEvento ?? 0),
    idCarrera: Number(evento.idCarrera ?? 0),
    nombre: String(evento.nombre ?? ''),
    nombreCarrera: String(evento.nombreCarrera ?? ''),
    descripcion: evento.descripcion ? String(evento.descripcion) : '',
    fechaInicio: evento.fechaInicio ? String(evento.fechaInicio) : '',
    fechaHora: evento.fechaHora ? String(evento.fechaHora) : '',
    inscritos: evento.inscritos !== undefined ? Number(evento.inscritos) : 0,
    cupoMaximo: evento.cupoMaximo !== undefined ? Number(evento.cupoMaximo) : 0,
    cuposDisponibles: evento.cuposDisponibles !== undefined ? Number(evento.cuposDisponibles) : 0,
    estado: String(evento.estado ?? 'ABIERTO')
  }))
}

const clearSelectedActivity = () => {
  selectedActivityKey.value = null
  selectedParallelCode.value = ''
  courseEnrolled.value = []
  eventEnrolled.value = []
}

const buildApiUrl = (path: string) => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const baseUrl = configuredBase.startsWith('http')
    ? configuredBase
    : `http://localhost:8080${configuredBase.startsWith('/') ? '' : '/'}${configuredBase}`
  if (path.startsWith('http')) return path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

const isPdfResponse = (arrayBuffer: ArrayBuffer) => {
  const signature = new TextDecoder().decode(arrayBuffer.slice(0, 5))
  return signature === '%PDF-'
}

const printSelectedActivityReport = async () => {
  if (!selectedActivity.value) {
    alertStore.push({ type: 'warning', message: 'Selecciona una actividad para imprimir.' })
    return
  }

  printingReport.value = true
  try {
    const params = new URLSearchParams({
      tipo: selectedActivity.value.tipo,
      idActividad: String(selectedActivity.value.idActividad)
    })

    const token = localStorage.getItem('token')
    const response = await fetch(buildApiUrl(`/reportes/actividad/inscritos/pdf?${params.toString()}`), {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })

    if (!response.ok) {
      let message = 'No se pudo generar el reporte.'
      try {
        const data = await response.json()
        if (data?.message) message = String(data.message)
      } catch {
        message = response.statusText || message
      }
      throw new Error(message)
    }

    const contentType = response.headers.get('content-type') || ''
    const arrayBuffer = await response.arrayBuffer()

    if (!contentType.toLowerCase().includes('application/pdf') || !isPdfResponse(arrayBuffer)) {
      const preview = new TextDecoder().decode(arrayBuffer.slice(0, 300)).trim()
      throw new Error(
        `La respuesta no es un PDF válido. ${contentType ? `Content-Type: ${contentType}.` : ''} `
        + `${preview ? `Respuesta: ${preview}` : 'Verifica tu sesión o la configuración del endpoint.'}`
      )
    }

    const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' })
    if (pdfBlob.size === 0) throw new Error('El PDF generado está vacío.')
    const blobUrl = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(blobUrl, '_blank')

    if (!printWindow) {
      const downloadLink = document.createElement('a')
      downloadLink.href = blobUrl
      downloadLink.download = `reporte-inscritos-${selectedActivity.value.tipo.toLowerCase()}-${selectedActivity.value.idActividad}.pdf`
      downloadLink.click()
      alertStore.push({ type: 'warning', message: 'El navegador bloqueo la ventana de impresion. Se descargo el PDF.' })
      return
    }

    printWindow.addEventListener('load', () => {
      printWindow.focus()
      printWindow.print()
    }, { once: true })

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo imprimir el reporte.'
    })
  } finally {
    printingReport.value = false
  }
}

const loadSelectedActivityInscritos = async () => {
  if (!selectedActivity.value) return

  loadingInscritos.value = true
  try {
    courseEnrolled.value = []
    eventEnrolled.value = []

    if (selectedActivity.value.tipo === 'CURSO') {
      const paralelo = selectedActivity.value.paralelos.find(item => item.codigo === selectedParallelCode.value)
        ?? selectedActivity.value.paralelos[0]

      if (!paralelo) return

      selectedParallelCode.value = paralelo.codigo

      // Try to fetch inscripciones (which include participant info) and evaluaciones, then merge.
      try {
        const [inscripcionesResp, evaluacionesResp] = await Promise.all([
          api.get(`/inscripciones/curso/${selectedActivity.value.idActividad}`),
          api.get(`/evaluaciones/paralelo/${selectedActivity.value.idActividad}/${paralelo.codigo}`)
        ])

        const inscripciones = (inscripcionesResp as Array<Record<string, any>>)
        const evaluaciones = (evaluacionesResp as Array<Record<string, any>>)

        console.debug('inscripciones/curso response', { activity: selectedActivity.value, paralelo, inscripciones })
        console.debug('evaluaciones/paralelo response', { activity: selectedActivity.value, paralelo, evaluaciones })

        const evalMap = new Map<number, Record<string, any>>()
        evaluaciones.forEach(ev => {
          const idIns = Number(pick(ev, 'idInscripcion', 'id_inscripcion', 'idInscripcion') ?? 0)
          if (idIns) evalMap.set(idIns, ev)
        })

        courseEnrolled.value = inscripciones
          .filter(item => String(pick(item, 'codigoParalelo', 'codigo_paralelo', 'codigo') ?? '') === String(paralelo.codigo))
          .filter(item => String(pick(item, 'estado', 'estado_inscripcion') ?? 'CONFIRMADA') === 'CONFIRMADA')
          .map(item => {
            const usuario = item.usuario ?? null
            const rawNombre = String(pick(item, 'nombreParticipante', 'nombre_participante', 'nombre') ?? (usuario ? (usuario.nombres || `${usuario.nombres || ''} ${usuario.apellidos || ''}`) : ''))
            const { nombres, apellidos } = splitNombreCompleto(rawNombre)
            const idInscripcion = Number(pick(item, 'idInscripcion', 'id_inscripcion') ?? 0)
            const ev = evalMap.get(idInscripcion)

            return {
              idEvaluacion: Number(pick(ev, 'idEvaluacion', 'id_evaluacion') ?? 0),
              idInscripcion,
              nombres,
              apellidos,
              email: String(pick(item, 'emailParticipante', 'email_participante', 'email') ?? (usuario ? (usuario.email ?? '') : '')),
              username: String(pick(item, 'usernameParticipante', 'username_participante', 'username') ?? (usuario ? (usuario.username ?? '') : '')),
              notaFinal: ((): number | null => {
                const v = ev ? pick(ev, 'notaFinal', 'nota_final', 'nota') : undefined
                return v !== undefined && v !== null ? Number(v) : null
              })(),
              estado: ((): string | null => {
                const v = ev ? pick(ev, 'estado', 'estadoEvaluacion', 'estado_evaluacion') : pick(item, 'estado', 'estado_inscripcion')
                return v ? String(v) : null
              })(),
              fechaRegistro: String(pick(item, 'fechaInscripcion', 'fecha_inscripcion', 'fechaRegistro', 'fecha_registro') ?? '')
            }
          })

        return
      } catch (error) {
        // Fall back to previous behavior if secondary endpoint not available
        const response = await api.get(`/evaluaciones/paralelo/${selectedActivity.value.idActividad}/${paralelo.codigo}`)
        const items = response as Array<Record<string, unknown>>
        console.debug('evaluaciones/paralelo response (fallback)', { activity: selectedActivity.value, paralelo, items })

        courseEnrolled.value = items.map(item => {
          const nombreParticipante = String(pick(item, 'nombreParticipante', 'nombre_participante', 'nombre') ?? '')
          const { nombres, apellidos } = splitNombreCompleto(nombreParticipante)

          return {
            idEvaluacion: Number(pick(item, 'idEvaluacion', 'id_evaluacion', 'idEvaluacion') ?? 0),
            idInscripcion: Number(pick(item, 'idInscripcion', 'id_inscripcion', 'idInscripcion') ?? 0),
            nombres,
            apellidos,
            email: String(pick(item, 'email', 'correo', 'email_participante') ?? ''),
            username: String(pick(item, 'username', 'userName', 'ru', 'username_participante') ?? ''),
            notaFinal: ((): number | null => {
              const v = pick(item, 'notaFinal', 'nota_final', 'nota')
              return v !== undefined && v !== null ? Number(v) : null
            })(),
            estado: ((): string | null => {
              const v = pick(item, 'estado', 'estadoEvaluacion', 'estado_evaluacion')
              return v ? String(v) : null
            })(),
            fechaRegistro: String(pick(item, 'fechaRegistro', 'fecha_registro', 'createdAt') ?? '')
          }
        })
        return
      }
    }

    const response = await api.get(`/asistencias/evento/${selectedActivity.value.idActividad}/detalle`)
    const items = response as Array<Record<string, unknown>>
    console.debug('asistencias/evento response', { activity: selectedActivity.value, items })

    eventEnrolled.value = items.map(item => {
      const nombreParticipante = String(pick(item, 'nombreParticipante', 'nombre_participante', 'nombre') ?? '')
      const { nombres, apellidos } = splitNombreCompleto(nombreParticipante)

      return {
        idInscripcion: Number(pick(item, 'idInscripcion', 'id_inscripcion') ?? 0),
        nombres,
        apellidos,
        email: String(pick(item, 'email', 'correo', 'email_participante') ?? ''),
        username: String(pick(item, 'username', 'userName', 'ru', 'username_participante') ?? ''),
        asistio: Boolean(pick(item, 'asistio', 'asistio_flag', 'present')),
        fechaRegistro: String(pick(item, 'fechaRegistro', 'fecha_registro', 'createdAt') ?? '')
      }
    })
  } finally {
    loadingInscritos.value = false
  }
}

const selectActivity = async (activity: ActivityRow) => {
  selectedActivityKey.value = activity.key
  selectedParallelCode.value = activity.tipo === 'CURSO'
    ? activity.paralelos[0]?.codigo ?? ''
    : ''
  await loadSelectedActivityInscritos()
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedCarreraId.value = ''
  tipoFiltro.value = ''
  estadoFiltro.value = ''
  clearSelectedActivity()
}

const applyRouteSelection = async () => {
  const tipo = normalizeQueryValue(route.query.tipo)
  const idActividad = Number(normalizeQueryValue(route.query.idActividad))

  if (!tipo || !idActividad || activities.value.length === 0) return

  const activity = activities.value.find(item => item.tipo === tipo && item.idActividad === idActividad)
  if (!activity) return

  if (tipoFiltro.value !== tipo) {
    tipoFiltro.value = tipo
  }

  await selectActivity(activity)
}

const loadAll = async () => {
  loadingActivities.value = true
  try {
    await Promise.all([loadCarreras(), loadCursos(), loadEventos()])
    buildActivities()
    await applyRouteSelection()
  } finally {
    loadingActivities.value = false
  }
}

watch([() => route.query.tipo, () => route.query.idActividad], () => {
  void applyRouteSelection()
})

onMounted(() => {
  void loadAll()
})
</script>