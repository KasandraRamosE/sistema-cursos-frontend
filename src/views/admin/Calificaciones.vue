<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Calificaciones</h1>
      <p class="text-gray-600">Ver y editar calificaciones de todos los paralelos</p>
    </div>

    <!-- Estadísticas Generales -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.totalParalelos }}</p>
          <p class="text-sm text-gray-600">Paralelos en el Sistema</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.totalCalificaciones }}</p>
          <p class="text-sm text-gray-600">Calificaciones Registradas</p>
        </div>
      </Card>
    </div>

    <!-- Estadísticas del Paralelo Seleccionado -->
    <div v-if="paraleloSeleccionado && infoParalelo" class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.inscritosCurso }}</p>
          <p class="text-sm text-gray-600">Inscritos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.aprobadosCurso }}</p>
          <p class="text-sm text-gray-600">Aprobados</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ estadisticas.reprobadosCurso }}</p>
          <p class="text-sm text-gray-600">Reprobados</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-600">{{ estadisticas.pendientesCurso }}</p>
          <p class="text-sm text-gray-600">Sin Calificar</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-600">{{ estadisticas.confirmadasCurso }}</p>
          <p class="text-sm text-gray-600">Confirmadas</p>
        </div>
      </Card>
    </div>

    <!-- Selección de Paralelo -->
    <Card>
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Seleccionar Paralelo</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Carrera -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
            <select
              v-model="filtros.carrera"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las carreras</option>
              <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>

          <!-- Paralelo -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Paralelo <span class="text-red-600">*</span>
            </label>
            <select
              v-model="paraleloSeleccionado"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="null">Seleccionar paralelo...</option>
              <option 
                v-for="paralelo in paralelosDisponibles" 
                :key="paralelo.idParalelo" 
                :value="paralelo.idParalelo"
              >
                {{ paralelo.actividadNombre }} - Paralelo {{ paralelo.codigo }} 
                ({{ paralelo.carreraNombre }}) - {{ paralelo.inscritos }} inscritos
              </option>
            </select>
          </div>
        </div>

        <!-- Información del paralelo seleccionado -->
        <div v-if="paraleloSeleccionado && infoParalelo" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-blue-600">Curso</p>
              <p class="font-medium text-gray-800">{{ infoParalelo.actividadNombre }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Paralelo</p>
              <p class="font-medium text-gray-800">{{ infoParalelo.codigo }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Carrera</p>
              <p class="font-medium text-gray-800">{{ infoParalelo.carreraNombre }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Nota Mínima</p>
              <p class="font-medium text-gray-800">{{ infoParalelo.notaMinima }} / 100</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Tabla de Calificaciones -->
    <Card v-if="paraleloSeleccionado">
      <div class="space-y-4">
        <!-- Encabezado -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">
            Calificaciones - {{ infoParalelo?.actividadNombre }}
          </h3>
          <Badge 
            v-if="todasConfirmadas" 
            variant="success"
            size="lg"
          >
            ✓ Calificaciones Confirmadas
          </Badge>
          <Badge 
            v-else 
            variant="warning"
            size="lg"
          >
            ⏳ Pendiente de Confirmación
          </Badge>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-600">Cargando calificaciones...</p>
        </div>

        <!-- Tabla -->
        <div v-else-if="calificaciones.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estudiante</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">RU/Username</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Nota Final</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(calificacion, index) in calificaciones" :key="calificacion.idCalificacion" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-600">{{ index + 1 }}</td>
                
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-800">
                      {{ calificacion.estudiante.nombres }} {{ calificacion.estudiante.apellidos }}
                    </p>
                    <p class="text-xs text-gray-500">{{ calificacion.estudiante.email }}</p>
                  </div>
                </td>

                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ calificacion.estudiante.username }}
                </td>

                <td class="px-4 py-3 text-center">
                  <span
                    v-if="calificacion.notaFinal !== null"
                    class="text-lg font-bold"
                    :class="getNotaColor(calificacion.notaFinal, infoParalelo?.notaMinima || 51)"
                  >
                    {{ calificacion.notaFinal }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">-</span>
                </td>

                <td class="px-4 py-3 text-center">
                  <Badge
                    v-if="calificacion.estado"
                    :variant="calificacion.estado === 'APROBADO' ? 'success' : 'danger'"
                  >
                    {{ calificacion.estado }}
                  </Badge>
                  <span v-else class="text-gray-400 text-sm">Pendiente</span>
                </td>

                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <Button variant="ghost" size="sm" @click="editarCalificacion(calificacion)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" @click="verDetalle(calificacion)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sin calificaciones -->
        <div v-else class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-600">No hay calificaciones registradas para este paralelo</p>
        </div>
      </div>
    </Card>

    <!-- Mensaje inicial -->
    <Card v-else class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      <p class="text-gray-600 mb-2">Selecciona un paralelo para ver las calificaciones</p>
      <p class="text-sm text-gray-500">Usa los filtros de arriba para seleccionar una carrera y paralelo</p>
    </Card>

    <!-- Modal Editar -->
    <Modal
      :modelValue="showEditModal"
      @close="closeEditModal"
      title="Corrección de Calificación (Admin)"
      size="lg"
    >
      <form v-if="calificacionSeleccionada" @submit.prevent="guardarCalificacion" class="space-y-4">
        <!-- Info estudiante -->
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">Estudiante</p>
          <p class="font-semibold text-gray-800">
            {{ calificacionSeleccionada.estudiante.nombres }} {{ calificacionSeleccionada.estudiante.apellidos }}
          </p>
          <p class="text-xs text-gray-500">{{ calificacionSeleccionada.estudiante.email }}</p>
        </div>

        <!-- Info: Corrección Administrativa -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <svg class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="text-sm font-semibold text-blue-800">ℹ️ Corrección Administrativa</p>
              <p class="text-sm text-blue-700 mt-1">
                Esta acción queda registrada en el historial de auditoría.
              </p>
            </div>
          </div>
        </div>

        <!-- Estado actual -->
        <div class="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <p class="text-sm text-gray-700 mb-2">Estado Actual</p>
          <div class="flex items-center justify-between">
            <p class="text-2xl font-bold" :class="getNotaColor(calificacionSeleccionada.notaFinal, infoParalelo?.notaMinima || 51)">
              {{ calificacionSeleccionada.notaFinal !== null ? calificacionSeleccionada.notaFinal : 'Sin nota' }}
            </p>
            <Badge v-if="calificacionSeleccionada.estado" :variant="calificacionSeleccionada.estado === 'APROBADO' ? 'success' : 'danger'">
              {{ calificacionSeleccionada.estado }}
            </Badge>
          </div>
        </div>

        <!-- Nueva nota -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nueva Nota Final <span class="text-red-600">*</span>
          </label>
          <input
            v-model.number="formCalificacion.notaFinal"
            type="number"
            required
            min="0"
            max="100"
            step="0.01"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Nota mínima: {{ infoParalelo?.notaMinima }} / 100
          </p>
        </div>

        <!-- Vista previa -->
        <div v-if="formCalificacion.notaFinal !== null" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-sm text-green-800 mb-2">Nuevo Estado</p>
          <div class="flex items-center justify-between">
            <p class="text-2xl font-bold" :class="getNotaColor(formCalificacion.notaFinal, infoParalelo?.notaMinima || 51)">
              {{ formCalificacion.notaFinal }}
            </p>
            <Badge :variant="formCalificacion.notaFinal >= (infoParalelo?.notaMinima || 51) ? 'success' : 'danger'">
              {{ formCalificacion.notaFinal >= (infoParalelo?.notaMinima || 51) ? 'APROBADO' : 'REPROBADO' }}
            </Badge>
          </div>
        </div>

        <!-- Advertencias -->
        <div v-if="cambiaEstadoCalificacion" :class="[
          'border rounded-lg p-4',
          certificadoAccion === 'ANULAR' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
        ]">
          <p class="text-sm font-semibold" :class="certificadoAccion === 'ANULAR' ? 'text-red-800' : 'text-yellow-800'">
            {{ certificadoAccion === 'ANULAR'
              ? '⚠️ Se anulará el certificado si existe'
              : '✅ Se generará el certificado si el lote ya fue emitido; si no, quedará pendiente' }}
          </p>
        </div>

        <!-- Motivo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Motivo de Corrección 
            <span class="text-red-600">*</span>
          </label>
          <textarea
            v-model="formCalificacion.motivo"
            rows="3"
            required
            placeholder="Explica el motivo de la corrección..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            @input="errorMotivo = ''"
          ></textarea>
          <p v-if="errorMotivo" class="text-xs text-red-600 mt-1">{{ errorMotivo }}</p>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeEditModal">Cancelar</Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Corrección' }}
          </Button>
        </div>
      </form>
    </Modal>

    <!-- Modal Detalle -->
    <Modal :modelValue="showDetalleModal" @close="closeDetalleModal" title="Detalle de Calificación">
      <div v-if="calificacionSeleccionada" class="space-y-4">
        <!-- Estudiante -->
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="font-medium text-gray-800">
            {{ calificacionSeleccionada.estudiante.nombres }} {{ calificacionSeleccionada.estudiante.apellidos }}
          </p>
          <p class="text-sm text-gray-600">{{ calificacionSeleccionada.estudiante.email }}</p>
        </div>

        <!-- Calificación -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-3">
          <div class="flex justify-between">
            <span class="text-sm">Nota:</span>
            <span class="text-2xl font-bold" :class="getNotaColor(calificacionSeleccionada.notaFinal, infoParalelo?.notaMinima || 51)">
              {{ calificacionSeleccionada.notaFinal ?? '-' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm">Estado:</span>
            <Badge v-if="calificacionSeleccionada.estado" :variant="calificacionSeleccionada.estado === 'APROBADO' ? 'success' : 'danger'">
              {{ calificacionSeleccionada.estado }}
            </Badge>
          </div>
        </div>

        <Button variant="outline" @click="closeDetalleModal" class="w-full">Cerrar</Button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import { api } from '@/utils/api'

// ============================================
// TIPOS
// ============================================

interface Estudiante {
  idUsuario: number
  nombres: string
  apellidos: string
  email: string
  username: string
  tipoUsuario?: 'INTERNO' | 'EXTERNO' | null
}

interface DetalleCalificacion {
  idDetalle?: number
  nombre: string
  puntaje: number
  ponderacion: number
}

interface Calificacion {
  idCalificacion: number
  idInscripcion: number
  estudiante: Estudiante
  notaFinal: number | null
  estado: 'APROBADO' | 'REPROBADO' | null
  confirmadaPorDocente: boolean
  fechaConfirmacion: string | null
  idDocenteConfirma: number | null
  nombreDocenteConfirma?: string
  certificadoId?: number
  detalles: DetalleCalificacion[]
  fechaRegistro: string
}

interface Paralelo {
  idParalelo: string
  codigo: string
  idCurso: number
  actividadNombre: string
  idCarrera: number
  carreraNombre: string
  inscritos: number
  notaMinima: number
}

interface Carrera {
  idCarrera: number
  nombre: string
}

// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const saving = ref(false)

const carreras = ref<Carrera[]>([])
const cursos = ref<Array<Record<string, unknown>>>([])
const paralelosDisponibles = ref<Paralelo[]>([])
const calificaciones = ref<Calificacion[]>([])

const estadisticas = ref({
  totalParalelos: 0,
  totalCalificaciones: 0,
  inscritosCurso: 0,
  aprobadosCurso: 0,
  reprobadosCurso: 0,
  pendientesCurso: 0,
  confirmadasCurso: 0
})

const filtros = ref({
  carrera: ''
})

const paraleloSeleccionado = ref<string | null>(null)
const infoParalelo = ref<Paralelo | null>(null)

const showEditModal = ref(false)
const showDetalleModal = ref(false)
const calificacionSeleccionada = ref<Calificacion | null>(null)

const formCalificacion = ref({
  notaFinal: null as number | null,
  motivo: ''
})

const errorMotivo = ref('')

// ============================================
// COMPUTED
// ============================================

const todasConfirmadas = computed(() => {
  return calificaciones.value.length > 0 && 
         calificaciones.value.every(c => c.confirmadaPorDocente)
})

const cambiaEstadoCalificacion = computed(() => {
  if (!calificacionSeleccionada.value || formCalificacion.value.notaFinal === null) {
    return false
  }

  const notaMinima = infoParalelo.value?.notaMinima || 51
  const notaActual = calificacionSeleccionada.value.notaFinal || 0
  const notaNueva = formCalificacion.value.notaFinal

  const estadoActual = notaActual >= notaMinima ? 'APROBADO' : 'REPROBADO'
  const estadoNuevo = notaNueva >= notaMinima ? 'APROBADO' : 'REPROBADO'

  return estadoActual !== estadoNuevo
})

const certificadoAccion = computed(() => {
  if (!cambiaEstadoCalificacion.value || !calificacionSeleccionada.value) {
    return 'NINGUNA'
  }

  const notaMinima = infoParalelo.value?.notaMinima || 51
  const notaActual = calificacionSeleccionada.value.notaFinal || 0
  const notaNueva = formCalificacion.value.notaFinal || 0

  const estabaAprobado = notaActual >= notaMinima
  const estaraAprobado = notaNueva >= notaMinima

  if (!estabaAprobado && estaraAprobado) {
    return 'EMITIR'
  }

  if (estabaAprobado && !estaraAprobado) {
    return 'ANULAR'
  }

  return 'NINGUNA'
})

// ============================================
// MÉTODOS
// ============================================

const cargarCarreras = async () => {
  try {
    const [carrerasResponse, cursosResponse] = await Promise.all([
      api.get('/carreras/todas'),
      api.get('/cursos/todos')
    ])

    carreras.value = (carrerasResponse as Array<Record<string, unknown>>).map(carrera => ({
      idCarrera: Number(carrera.idCarrera ?? carrera.id ?? 0),
      nombre: String(carrera.nombre ?? '')
    }))
    cursos.value = cursosResponse as Array<Record<string, unknown>>
    await cargarParalelos()
    await cargarEstadisticasGenerales()
  } catch (error) {
    console.error('Error:', error)
  }
}

const cargarEstadisticasGenerales = async () => {
  try {
    estadisticas.value.totalParalelos = paralelosDisponibles.value.length
    estadisticas.value.totalCalificaciones = calificaciones.value.length
  } catch (error) {
    console.error('Error:', error)
  }
}

const cargarParalelos = async () => {
  try {
    const todosParalelos: Paralelo[] = []

    cursos.value.forEach(curso => {
      const idCurso = Number(curso.idCurso ?? 0)
      const nombreCurso = String(curso.nombre ?? '')
      const idCarrera = Number(curso.idCarrera ?? 0)
      const nombreCarrera = String(curso.nombreCarrera ?? '')
      const notaMinima = Number(curso.notaAprobacion ?? 51)

      const paralelos = Array.isArray(curso.paralelos)
        ? (curso.paralelos as Array<Record<string, unknown>>)
        : []

      paralelos.forEach(paralelo => {
        const codigo = String(paralelo.codigo ?? '')
        const inscritos = Number(paralelo.inscritos ?? 0)

        todosParalelos.push({
          idParalelo: `${idCurso}-${codigo}`,
          codigo,
          idCurso,
          actividadNombre: nombreCurso,
          idCarrera,
          carreraNombre: nombreCarrera,
          inscritos,
          notaMinima
        })
      })
    })

    const filtrados = filtros.value.carrera
      ? todosParalelos.filter(p => p.idCarrera === Number(filtros.value.carrera))
      : todosParalelos

    paralelosDisponibles.value = filtrados
    paraleloSeleccionado.value = null
    calificaciones.value = []
    infoParalelo.value = null
  } catch (error) {
    console.error('Error:', error)
  }
}

const cargarCalificaciones = async () => {
  if (!paraleloSeleccionado.value) return

  loading.value = true
  try {
    infoParalelo.value = paralelosDisponibles.value.find(
      p => p.idParalelo === paraleloSeleccionado.value
    ) || null

    if (!infoParalelo.value) return

    const [idCursoStr, codigo] = infoParalelo.value.idParalelo.split('-')
    const idCurso = Number(idCursoStr)

    const response = await api.get(`/evaluaciones/paralelo/${idCurso}/${codigo}`)
    const evaluaciones = response as Array<Record<string, unknown>>

    calificaciones.value = evaluaciones.map(item => {
      const nombreParticipante = String(item.nombreParticipante ?? '')
      const nombreParts = nombreParticipante.split(' ')
      const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante
      const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : ''
      const notaFinal = item.notaFinal !== undefined && item.notaFinal !== null
        ? Number(item.notaFinal)
        : null

      return {
        idCalificacion: Number(item.idEvaluacion),
        idInscripcion: Number(item.idInscripcion),
        estudiante: {
          idUsuario: 0,
          nombres,
          apellidos,
          email: '-',
          username: String(item.username ?? ''),
          tipoUsuario: null
        },
        notaFinal,
        estado: item.estado ? String(item.estado) as Calificacion['estado'] : null,
        confirmadaPorDocente: Boolean(item.estado),
        fechaConfirmacion: null,
        idDocenteConfirma: null,
        nombreDocenteConfirma: undefined,
        certificadoId: undefined,
        detalles: [],
        fechaRegistro: String(item.fechaRegistro ?? '')
      }
    })

    calcularEstadisticasCurso()
    await cargarEstadisticasGenerales()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const calcularEstadisticasCurso = () => {
  estadisticas.value.inscritosCurso = calificaciones.value.length
  estadisticas.value.aprobadosCurso = calificaciones.value.filter(c => c.estado === 'APROBADO').length
  estadisticas.value.reprobadosCurso = calificaciones.value.filter(c => c.estado === 'REPROBADO').length
  estadisticas.value.pendientesCurso = calificaciones.value.filter(c => c.notaFinal === null).length
  estadisticas.value.confirmadasCurso = calificaciones.value.filter(c => c.confirmadaPorDocente).length
}

const editarCalificacion = (calificacion: Calificacion) => {
  calificacionSeleccionada.value = calificacion
  formCalificacion.value.notaFinal = calificacion.notaFinal
  formCalificacion.value.motivo = ''
  errorMotivo.value = ''
  showEditModal.value = true
}

const guardarCalificacion = async () => {
  if (!calificacionSeleccionada.value) return

  if (!formCalificacion.value.motivo.trim()) {
    errorMotivo.value = 'El motivo es obligatorio.'
    return
  }

  saving.value = true
  try {
    await api.patch(`/evaluaciones/${calificacionSeleccionada.value.idCalificacion}/nota`, {
      notaNueva: formCalificacion.value.notaFinal,
      motivo: formCalificacion.value.motivo
    })

    const notaMinima = infoParalelo.value?.notaMinima || 51
    calificacionSeleccionada.value.notaFinal = formCalificacion.value.notaFinal
    
    if (formCalificacion.value.notaFinal !== null) {
      calificacionSeleccionada.value.estado = 
        formCalificacion.value.notaFinal >= notaMinima ? 'APROBADO' : 'REPROBADO'
    }

    calcularEstadisticasCurso()
    closeEditModal()
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    saving.value = false
  }
}

const verDetalle = (calificacion: Calificacion) => {
  calificacionSeleccionada.value = calificacion
  showDetalleModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  calificacionSeleccionada.value = null
  formCalificacion.value = { notaFinal: null, motivo: '' }
  errorMotivo.value = ''
}

const closeDetalleModal = () => {
  showDetalleModal.value = false
  calificacionSeleccionada.value = null
}

const getNotaColor = (nota: number | null, notaMinima: number) => {
  if (nota === null) return 'text-gray-400'
  return nota >= notaMinima ? 'text-green-600' : 'text-red-600'
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  cargarCarreras()
})

watch(() => filtros.value.carrera, () => {
  cargarParalelos()
})

watch(paraleloSeleccionado, (newVal) => {
  if (newVal) {
    cargarCalificaciones()
  }
})
</script>