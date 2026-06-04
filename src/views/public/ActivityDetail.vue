<template>
  <div class="min-h-screen bg-gray-50">
    <section class="container mx-auto px-4 py-8">
      <div v-if="loading" class="text-center text-gray-500">Cargando detalle...</div>
      <div v-else-if="errorMessage" class="text-center text-red-600">{{ errorMessage }}</div>
      <div v-else-if="actividad" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <Badge :variant="actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ actividad.tipo }}
                </Badge>
                <Badge :variant="actividad.estado === 'ABIERTO' ? 'success' : 'warning'" size="sm">
                  {{ actividad.estado }}
                </Badge>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">{{ actividad.nombre }}</h1>
              <p class="text-sm text-gray-600 whitespace-pre-line">{{ actividad.descripcion || 'Sin descripcion.' }}</p>
            </div>
          </Card>

          <Card v-if="actividad.tipo === 'EVENTO'">
            <div class="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
              <div>
                <p class="text-xs uppercase text-gray-400">Modalidad</p>
                <p class="font-semibold">{{ actividad.modalidad }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-400">Fecha y hora</p>
                <p class="font-semibold">{{ formatEventDateTime(actividad.fecha_inicio) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-400">Carga horaria</p>
                <p class="font-semibold">{{ actividad.carga_horaria }} horas</p>
              </div>
              <div v-if="hasDurationInfo">
                <p class="text-xs uppercase text-gray-400">Duracion</p>
                <p class="font-semibold">{{ actividad.duracion }} {{ formatDurationUnit(actividad.unidad) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-400">Tipo</p>
                <p class="font-semibold">{{ actividad.tipo }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-400">Cupos libres</p>
                <p class="font-semibold">{{ actividad.cupos_disponibles }} / {{ actividad.cupo_maximo }}</p>
              </div>
              <div v-if="actividad.lugar">
                <p class="text-xs uppercase text-gray-400">Lugar</p>
                <p class="font-semibold">{{ actividad.lugar }}</p>
              </div>
              <div v-if="actividad.link">
                <p class="text-xs uppercase text-gray-400">Enlace</p>
                <a
                  :href="actividad.link"
                  target="_blank"
                  rel="noreferrer"
                  class="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Abrir enlace
                </a>
              </div>
            </div>
          </Card>

          
          <Card v-if="actividad.tipo === 'CURSO'">
            <div class="space-y-3">
              <h2 class="text-lg font-semibold text-gray-800">Paralelos disponibles</h2>
              <p class="text-sm text-gray-600">Selecciona el paralelo para tu inscripcion.</p>
              <div v-if="paralelos.length === 0" class="text-sm text-gray-500">No hay paralelos registrados.</div>
              <div v-else class="space-y-3">
                <label
                  v-for="paralelo in paralelos"
                  :key="paralelo.codigo"
                  class="flex items-start gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-gray-300"
                >
                  <input
                    type="radio"
                    name="paralelo"
                    class="mt-1"
                    :value="paralelo.codigo"
                    v-model="selectedParalelo"
                  />
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-semibold text-gray-800">Paralelo {{ paralelo.codigo }}</span>
                      <span class="text-xs text-gray-500">{{ paralelo.modalidad }}</span>
                    </div>
                    <p class="text-xs text-gray-500">
                      Docente: {{ paralelo.nombreDocente || 'Sin asignar' }}
                      <span v-if="paralelo.tituloDocente">· {{ paralelo.tituloDocente }}</span>
                    </p>
                    <p class="text-xs text-gray-500">Cupos libres: {{ paralelo.cuposDisponibles ?? paralelo.cupoMaximo }} / {{ paralelo.cupoMaximo }}</p>
                    <p v-if="paralelo.horarioDescripcion" class="text-xs text-gray-500">Horario: {{ paralelo.horarioDescripcion }}</p>
                    <p v-if="paralelo.lugar" class="text-xs text-gray-500">Lugar: {{ paralelo.lugar }}</p>
                    <p v-if="paralelo.link" class="text-xs text-emerald-700">Clase virtual disponible</p>
                    <a
                      v-if="paralelo.link"
                      :href="paralelo.link"
                      target="_blank"
                      rel="noreferrer"
                      class="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Abrir enlace
                    </a>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          <Card v-if="step === 'pago'">
            <div class="space-y-3">
              <h2 class="text-lg font-semibold text-gray-800">Pago en otra ventana</h2>
              <p class="text-sm text-gray-600">
                Se abrio la ventana de pago simulado. Si no se abrio, usa el boton para intentarlo.
              </p>
              <Button variant="primary" @click="abrirVentanaPago">
                Abrir ventana de pago
              </Button>
            </div>
          </Card>
        </div>

        <div class="space-y-6">
          <Card v-if="actividad.tipo === 'CURSO'">
            <div class="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
              <div>
                <p class="text-xs uppercase text-gray-400">Modalidad</p>
                <p class="font-semibold">{{ actividad.modalidad }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-400">Fecha inicio</p>
                <p class="font-semibold">{{ formatDateOnly(actividad.fecha_inicio) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-400">Carga horaria</p>
                <p class="font-semibold">{{ actividad.carga_horaria }} horas</p>
              </div>
              <div v-if="hasDurationInfo">
                <p class="text-xs uppercase text-gray-400">Duracion</p>
                <p class="font-semibold">{{ actividad.duracion }} {{ formatDurationUnit(actividad.unidad) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-400">Cupos libres</p>
                <p class="font-semibold">{{ actividad.cupos_disponibles }} / {{ actividad.cupo_maximo }}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div class="space-y-3">
              <h2 class="text-lg font-semibold text-gray-800">Resumen</h2>
              <div
                class="rounded-lg border px-3 py-2"
                :class="isExterno ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'"
              >
                <p class="text-xs uppercase" :class="isExterno ? 'text-emerald-600' : 'text-slate-500'">Precio externo</p>
                <p :class="isExterno ? 'text-xl font-bold text-emerald-700' : 'text-lg font-semibold text-slate-700'">
                  Bs. {{ actividad.costo_externo }}
                </p>
              </div>
              <div
                class="rounded-lg border px-3 py-2"
                :class="isInterno ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'"
              >
                <p class="text-xs uppercase" :class="isInterno ? 'text-emerald-600' : 'text-slate-500'">Precio UMSA</p>
                <p :class="isInterno ? 'text-xl font-bold text-emerald-700' : 'text-lg font-semibold text-slate-700'">
                  Bs. {{ actividad.costo_umsa }}
                </p>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Estado</span>
                <span class="font-semibold">{{ actividad.estado }}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div class="space-y-3">
              <h2 class="text-lg font-semibold text-gray-800">Inscripcion</h2>
              <p class="text-sm text-gray-600">Continua para confirmar tu inscripcion.</p>
              <Button
                :loading="isSubmitting"
                :disabled="actividad.estado !== 'ABIERTO' || inscripcionConfirmada"
                variant="primary"
                class="w-full"
                @click="continuarInscripcion"
              >
                {{ actividad.estado !== 'ABIERTO' ? 'Sin cupos' : botonInscripcionLabel }}
              </Button>
              <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, formatDateRange as formatDateRangeUtil } from '@/utils/dateFormatter'
import { useAuthStore } from '@/stores/auth.store'

interface ParaleloItem {
  codigo: string
  modalidad: string
  cupoMaximo: number
  cuposDisponibles: number | null
  nombreDocente: string | null
  tituloDocente: string | null
  horarioDescripcion: string | null
  lugar?: string | null
  link?: string | null
}

interface ActividadDetalle {
  id: number
  tipo: 'CURSO' | 'EVENTO'
  nombre: string
  descripcion: string
  carga_horaria: number
  duracion?: number | null
  unidad?: 'días' | 'semanas' | 'meses' | null
  modalidad: string
  fecha_inicio: string
  fecha_fin: string
  cupo_maximo: number
  cupos_disponibles: number
  costo_externo: number
  costo_umsa: number
  estado: string
  lugar?: string | null
  link?: string | null
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const actividad = ref<ActividadDetalle | null>(null)
const paralelos = ref<ParaleloItem[]>([])
const selectedParalelo = ref<string>('')
const loading = ref(true)
const errorMessage = ref('')
const formError = ref('')
const isSubmitting = ref(false)
const isPaying = ref(false)
const step = ref<'detalle' | 'pago'>('detalle')
const inscripcionId = ref<number | null>(null)
const inscripcionConfirmada = ref(false)
const inscripcionPendiente = ref(false)

const costoPago = computed(() => actividad.value?.costo_externo ?? 0)
const isInterno = computed(() => authStore.user?.tipoParticipante === 'UMSA')
const isExterno = computed(() => !authStore.user?.tipoParticipante || authStore.user?.tipoParticipante === 'EXTERNO')

const botonInscripcionLabel = computed(() => {
  if (inscripcionConfirmada.value) return 'Ya inscrito'
  if (inscripcionPendiente.value) return costoPago.value > 0 ? 'Continuar con el pago' : 'Inscripcion pendiente'
  if (actividad.value?.tipo === 'CURSO' && paralelos.value.length > 0 && !selectedParalelo.value) {
    return 'Selecciona un paralelo'
  }
  return costoPago.value > 0 ? 'Ir a pago' : 'Confirmar inscripcion'
})

const formatDateRange = (inicio: string, fin: string) => {
  if (!inicio) return '-'
  return formatDateRangeUtil(inicio, fin, 'es-BO')
}

const formatDateOnly = (inicio: string) => {
  if (!inicio) return '-'
  return formatDateUtil(inicio, 'es-BO')
}

const formatEventDateTime = (datetime: string) => {
  if (!datetime) return '-'
  return formatDateTimeUtil(datetime, 'es-BO')
}

const formatDurationUnit = (unidad?: string | null) => {
  switch (unidad) {
    case 'días':
      return 'días'
    case 'semanas':
      return 'semanas'
    case 'meses':
      return 'meses'
    default:
      return 'horas'
  }
}

const hasDurationInfo = computed(() => {
  return actividad.value?.duracion != null && Boolean(actividad.value?.unidad)
})

const cargarDetalle = async () => {
  loading.value = true
  errorMessage.value = ''

  const id = Number(route.params.id)
  const tipoQuery = String(route.query.tipo || '').toUpperCase()

  try {
    if (tipoQuery === 'EVENTO') {
      const response = await api.get(`/eventos/${id}`) as Record<string, unknown>
      mapEvento(response)
    } else if (tipoQuery === 'CURSO') {
      const response = await api.get(`/cursos/${id}`) as Record<string, unknown>
      mapCurso(response)
    } else {
      const curso = await api.get(`/cursos/${id}`) as Record<string, unknown>
      mapCurso(curso)
    }
  } catch (error) {
    errorMessage.value = 'No se pudo cargar el detalle de la actividad.'
  } finally {
    loading.value = false
  }
}

const mapCurso = (curso: Record<string, unknown>) => {
  const paralelosList = Array.isArray(curso.paralelos) ? curso.paralelos as Array<Record<string, unknown>> : []
  const cupoMaximo = paralelosList.reduce((sum, p) => sum + Number(p.cupoMaximo ?? 0), 0)
  const inscritos = paralelosList.reduce((sum, p) => sum + Number(p.inscritos ?? 0), 0)

  actividad.value = {
    id: Number(curso.idCurso),
    tipo: 'CURSO',
    nombre: String(curso.nombre ?? ''),
    descripcion: String(curso.descripcion ?? ''),
    carga_horaria: Number(curso.cargaHoraria ?? 0),
    duracion: curso.duracion !== undefined && curso.duracion !== null ? Number(curso.duracion) : null,
    unidad: curso.unidad ? String(curso.unidad) as 'días' | 'semanas' | 'meses' : null,
    modalidad: String(curso.modalidad ?? 'PRESENCIAL'),
    fecha_inicio: String(curso.fechaInicio ?? ''),
    fecha_fin: String(curso.fechaInicio ?? ''),
    cupo_maximo: cupoMaximo,
    cupos_disponibles: Math.max(0, cupoMaximo - inscritos),
    costo_externo: Number(curso.costoExterno ?? 0),
    costo_umsa: Number(curso.costoUmsa ?? 0),
    estado: String(curso.estado ?? 'ABIERTO'),
    lugar: paralelosList.length > 0 ? String(paralelosList[0].lugar ?? '') || null : null,
    link: paralelosList.length > 0 ? String(paralelosList[0].link ?? '') || null : null
  }

  paralelos.value = paralelosList.map((paralelo) => ({
    codigo: String(paralelo.codigo ?? ''),
    modalidad: String(paralelo.modalidad ?? ''),
    cupoMaximo: Number(paralelo.cupoMaximo ?? 0),
    cuposDisponibles: paralelo.cuposDisponibles !== undefined && paralelo.cuposDisponibles !== null
      ? Number(paralelo.cuposDisponibles)
      : null,
    nombreDocente: paralelo.nombreDocente ? String(paralelo.nombreDocente) : null,
    tituloDocente: paralelo.tituloDocente ? String(paralelo.tituloDocente) : null,
    horarioDescripcion: paralelo.horarioDescripcion ? String(paralelo.horarioDescripcion) : null,
    lugar: paralelo.lugar ? String(paralelo.lugar) : null,
    link: paralelo.link ? String(paralelo.link) : null
  }))

  if (paralelos.value.length === 1) {
    selectedParalelo.value = paralelos.value[0].codigo
  }

  verificarInscripcion()
}

const mapEvento = (evento: Record<string, unknown>) => {
  actividad.value = {
    id: Number(evento.idEvento),
    tipo: 'EVENTO',
    nombre: String(evento.nombre ?? ''),
    descripcion: String(evento.descripcion ?? ''),
    carga_horaria: Number(evento.cargaHoraria ?? 0),
    duracion: evento.duracion !== undefined && evento.duracion !== null ? Number(evento.duracion) : null,
    unidad: evento.unidad ? String(evento.unidad) as 'días' | 'semanas' | 'meses' : null,
    modalidad: String(evento.modalidad ?? 'PRESENCIAL'),
    fecha_inicio: String(evento.fechaHora ?? ''),
    fecha_fin: String(evento.fechaHora ?? ''),
    cupo_maximo: Number(evento.cupoMaximo ?? 0),
    cupos_disponibles: Number(evento.cuposDisponibles ?? 0),
    costo_externo: Number(evento.costoExterno ?? 0),
    costo_umsa: Number(evento.costoUmsa ?? 0),
    estado: String(evento.estado ?? 'ABIERTO'),
    lugar: String(evento.lugar ?? '') || null,
    link: String(evento.link ?? evento.url ?? '') || null
  }
  paralelos.value = []

  verificarInscripcion()
}

const asegurarParticipante = () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return false
  }

  if (authStore.currentRole !== 'PARTICIPANTE') {
    const success = authStore.changeRole('PARTICIPANTE')
    if (!success) {
      formError.value = 'No se pudo cambiar al rol participante.'
      return false
    }
  }

  return true
}

const crearInscripcion = async () => {
  if (!actividad.value) return null

  const payload: Record<string, unknown> = actividad.value.tipo === 'CURSO'
    ? { idCurso: actividad.value.id, codigoParalelo: selectedParalelo.value }
    : { idEvento: actividad.value.id }

  const response = await api.post('/inscripciones', payload) as Record<string, unknown>
  return Number(response.idInscripcion ?? 0)
}

const abrirVentanaPago = () => {
  if (!inscripcionId.value || !actividad.value) return
  // Iniciar el pago en backend para crear un registro PENDIENTE
  api.post('/inscripciones/pago', { idInscripcion: inscripcionId.value }).catch(() => {
    // Si falla, no bloqueamos la apertura del popup — el usuario puede reintentar.
  })
  const url = router.resolve({
    name: 'payment-simulacion',
    params: { idInscripcion: inscripcionId.value },
    query: { monto: costoPago.value, actividad: actividad.value.nombre }
  }).href

  const popup = window.open(url, '_blank', 'width=520,height=720')
  if (!popup) {
    router.push(url)
  }
}

const sincronizarInscripcion = (match: Record<string, unknown>) => {
  inscripcionId.value = Number(match.idInscripcion ?? inscripcionId.value)

  const estado = String(match.estado ?? '').toUpperCase()
  const estadoPago = String(match.estadoPago ?? '').toUpperCase()

  if (estado === 'CONFIRMADA' || estadoPago === 'APROBADO') {
    inscripcionConfirmada.value = true
    inscripcionPendiente.value = false
    step.value = 'detalle'
    return
  }

  if (estado === 'PENDIENTE') {
    inscripcionConfirmada.value = false
    inscripcionPendiente.value = true
    if (costoPago.value > 0) {
      step.value = 'pago'
    }
    return
  }

  inscripcionConfirmada.value = false
  inscripcionPendiente.value = false
}

const verificarInscripcion = async () => {
  if (!authStore.isAuthenticated) return
  if (authStore.currentRole !== 'PARTICIPANTE') return
  if (!actividad.value) return

  try {
    const response = await api.get('/inscripciones/mis-inscripciones') as Array<Record<string, unknown>>
    const match = response.find((item) => {
      const idCurso = Number(item.idCurso ?? 0)
      const idEvento = Number(item.idEvento ?? 0)
      const estado = String(item.estado ?? '').toUpperCase()
      if (estado === 'CANCELADA') return false
      if (actividad.value?.tipo === 'CURSO') {
        return idCurso === actividad.value?.id
      }
      return idEvento === actividad.value?.id
    })

    if (match) {
      sincronizarInscripcion(match)
    }
  } catch {
    // Silencioso: no bloquea el detalle si falla la verificacion.
  }
}

const continuarInscripcion = async () => {
  if (!actividad.value) return
  formError.value = ''

  if (inscripcionConfirmada.value) return

  if (actividad.value.tipo === 'CURSO' && paralelos.value.length > 0 && !selectedParalelo.value) {
    formError.value = 'Selecciona un paralelo antes de continuar.'
    return
  }

  if (!asegurarParticipante()) return

  if (inscripcionPendiente.value && inscripcionId.value && costoPago.value > 0) {
    step.value = 'pago'
    abrirVentanaPago()
    return
  }

  isSubmitting.value = true
  try {
    const nuevaInscripcionId = await crearInscripcion()
    if (!nuevaInscripcionId) {
      throw new Error('No se pudo crear la inscripcion')
    }
    inscripcionId.value = nuevaInscripcionId

    if (costoPago.value > 0) {
      step.value = 'pago'
      abrirVentanaPago()
      return
    }

    inscripcionConfirmada.value = true
    inscripcionPendiente.value = false
    router.push('/participante/inscripciones')
  } catch (error) {
    formError.value = (error as Error).message || 'No se pudo completar la inscripcion.'
  } finally {
    isSubmitting.value = false
  }
}

const handlePaymentMessage = (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return

  const data = event.data as {
    type?: string
    idInscripcion?: number
    estadoPago?: string
  } | null

  if (!data || data.type !== 'payment:confirmed') return
  if (!inscripcionId.value || Number(data.idInscripcion ?? 0) !== inscripcionId.value) return

  sincronizarInscripcion({
    idInscripcion: inscripcionId.value,
    estado: 'CONFIRMADA',
    estadoPago: data.estadoPago ?? 'APROBADO'
  })
}

const handleFocus = () => {
  verificarInscripcion()
}

onMounted(() => {
  cargarDetalle()
  window.addEventListener('message', handlePaymentMessage)
  window.addEventListener('focus', handleFocus)
})

onUnmounted(() => {
  window.removeEventListener('message', handlePaymentMessage)
  window.removeEventListener('focus', handleFocus)
})
</script>
