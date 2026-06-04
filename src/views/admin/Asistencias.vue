<template>
  <!--
    Vista de Gestión de Asistencias - Administrador
    Permite ver y editar asistencias de eventos, con control de certificados
  -->
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Asistencias</h1>
      <p class="text-gray-600">Ver y modificar asistencias de eventos facultativos</p>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.totalEventos }}</p>
          <p class="text-sm text-gray-600">Eventos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.totalInscritos }}</p>
          <p class="text-sm text-gray-600">Inscritos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.asistieron }}</p>
          <p class="text-sm text-gray-600">Asistieron</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ estadisticas.noAsistieron }}</p>
          <p class="text-sm text-gray-600">No asistieron</p>
        </div>
      </Card>
    </div>

    <!-- Selección de Evento -->
    <Card>
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Seleccionar Evento</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Busqueda de evento -->
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar evento</label>
            <input
              v-model="busquedaEvento"
              type="text"
              placeholder="Nombre del evento..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <!-- Carrera -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
            <select
              v-model="filtros.carrera"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las carreras</option>
              <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>

          <!-- Evento -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Evento</label>
            <select
              v-model="eventoSeleccionado"
              @change="cargarAsistencias"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="null">Seleccionar evento</option>
              <option v-for="evento in eventosFiltrados" :key="evento.id" :value="evento.id">
                {{ evento.nombre }} ({{ formatDate(evento.fechaInicio) }})
              </option>
            </select>
          </div>
        </div>

        <!-- Información del evento seleccionado -->
        <div v-if="eventoSeleccionado && infoEvento" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-blue-600">Evento</p>
              <p class="font-medium text-gray-800">{{ infoEvento.nombre }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Fecha</p>
              <p class="font-medium text-gray-800">{{ formatDate(infoEvento.fechaInicio) }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Inscritos</p>
              <p class="font-medium text-gray-800">{{ infoEvento.inscritos }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Asistencias Registradas</p>
              <p class="font-medium text-gray-800">{{ asistenciasRegistradas }} / {{ infoEvento.inscritos }}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Tabla de Asistencias -->
    <Card v-if="eventoSeleccionado">
      <div class="space-y-4">
        <!-- Encabezado de la tabla -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">
            Asistencias - {{ infoEvento?.nombre }}
          </h3>
        </div>

        <!-- Estado de carga -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-600">Cargando asistencias...</p>
        </div>

        <!-- Tabla -->
        <div v-else-if="asistencias.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Participante</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Asistencia</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Certificado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registrado Por</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(asistencia, index) in asistencias" :key="asistencia.idAsistencia" class="hover:bg-gray-50">
                <!-- Número -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ index + 1 }}
                </td>

                <!-- Participante -->
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-800">
                      {{ asistencia.participante.nombres }} {{ asistencia.participante.apellidos }}
                    </p>
                    <p class="text-xs text-gray-500">RU: {{ asistencia.participante.username }}</p>
                  </div>
                </td>

                <!-- Email -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ asistencia.participante.email }}
                </td>

                <!-- Asistencia -->
                <td class="px-4 py-3 text-center">
                  <Badge :variant="asistencia.asistio ? 'success' : 'danger'" size="sm">
                    {{ asistencia.asistio ? 'SÍ ASISTIÓ' : 'NO ASISTIÓ' }}
                  </Badge>
                </td>

                <!-- Certificado -->
                <td class="px-4 py-3 text-center">
                  <span class="text-xs text-gray-400">No disponible</span>
                </td>

                <!-- Registrado Por -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div v-if="asistencia.registradoPor">
                    <p class="text-sm">{{ asistencia.registradoPor.nombre }}</p>
                    <p class="text-xs text-gray-500">
                      {{ formatDatetime(asistencia.fechaRegistro) }}
                    </p>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Acciones -->
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <Button variant="ghost" size="sm" @click="editarAsistencia(asistencia)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" @click="verDetalle(asistencia)">
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

        <!-- Sin asistencias -->
        <div v-else class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p class="text-gray-600">No hay asistencias registradas para este evento</p>
        </div>
      </div>
    </Card>

    <!-- Mensaje inicial -->
    <Card v-else class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-600 mb-2">Selecciona un evento para ver las asistencias</p>
      <p class="text-sm text-gray-500">Usa los filtros de arriba para seleccionar una carrera y evento</p>
    </Card>

    <!-- Modal Editar Asistencia -->
    <Modal
      :modelValue="showEditModal"
      @close="closeEditModal"
      title="Editar Asistencia"
    >
      <form v-if="asistenciaSeleccionada" @submit.prevent="guardarAsistencia" class="space-y-4">
        <!-- Info del participante -->
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">Participante</p>
          <p class="font-semibold text-gray-800">
            {{ asistenciaSeleccionada.participante.nombres }} {{ asistenciaSeleccionada.participante.apellidos }}
          </p>
          <p class="text-xs text-gray-500">{{ asistenciaSeleccionada.participante.email }}</p>
        </div>

        <!-- Estado actual de asistencia -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800 mb-2">Estado Actual</p>
          <Badge :variant="asistenciaSeleccionada.asistio ? 'success' : 'danger'">
            {{ asistenciaSeleccionada.asistio ? 'SÍ ASISTIÓ' : 'NO ASISTIÓ' }}
          </Badge>
        </div>

        <!-- Nuevo estado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nuevo Estado de Asistencia <span class="text-red-600">*</span>
          </label>
          <div class="space-y-2">
            <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formAsistencia.asistio === true ? 'border-green-500 bg-green-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formAsistencia.asistio"
                :value="true"
                class="w-4 h-4 text-green-600"
              />
              <span class="ml-3 font-medium text-gray-800">SÍ ASISTIÓ</span>
            </label>
            <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formAsistencia.asistio === false ? 'border-red-500 bg-red-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formAsistencia.asistio"
                :value="false"
                class="w-4 h-4 text-red-600"
              />
              <span class="ml-3 font-medium text-gray-800">NO ASISTIÓ</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Observaciones (Opcional)
          </label>
          <textarea
            v-model="formAsistencia.observaciones"
            rows="2"
            placeholder="Notas adicionales sobre el cambio..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeEditModal">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </Button>
        </div>
      </form>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '@/utils/dateFormatter'

// ============================================
// TIPOS
// ============================================

interface Participante {
  nombres: string
  apellidos: string
  email: string
  username: string
}

interface Certificado {
  id: number
  estado: 'GENERADO' | 'ANULADO' | 'REEMITIDO'
}

interface RegistradoPor {
  nombre: string
  rol?: string
}

interface Asistencia {
  idAsistencia: number
  idInscripcion: number
  participante: Participante
  asistio: boolean
  certificado: Certificado | null
  registradoPor: RegistradoPor | null
  fechaRegistro: string
  observaciones: string | null
}

interface Evento {
  id: number
  nombre: string
  fechaInicio: string
  inscritos: number
  idCarrera?: number | null
}

interface Carrera {
  id: number
  nombre: string
}

// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const saving = ref(false)

const carreras = ref<Carrera[]>([])
const eventosDisponibles = ref<Evento[]>([])
const asistencias = ref<Asistencia[]>([])

const estadisticas = ref({
  totalEventos: 0,
  totalInscritos: 0,
  asistieron: 0,
  noAsistieron: 0
})

const filtros = ref({
  carrera: ''
})

const busquedaEvento = ref('')

const eventoSeleccionado = ref<number | null>(null)
const infoEvento = ref<Evento | null>(null)

const showEditModal = ref(false)
const asistenciaSeleccionada = ref<Asistencia | null>(null)

const formAsistencia = ref({
  asistio: null as boolean | null,
  observaciones: ''
})

// ============================================
// COMPUTED
// ============================================

const asistenciasRegistradas = computed(() => {
  return asistencias.value.filter(a => a.asistio).length
})
const eventosFiltrados = computed(() => {
  const term = busquedaEvento.value.trim().toLowerCase()
  const idCarrera = filtros.value.carrera ? Number(filtros.value.carrera) : null

  return eventosDisponibles.value.filter(evento => {
    const carreraOk = !idCarrera || evento.idCarrera === idCarrera
    const searchOk = !term || evento.nombre.toLowerCase().includes(term)
    return carreraOk && searchOk
  })
})

// ============================================
// MÉTODOS - CARGA DE DATOS
// ============================================

const cargarCarreras = async () => {
  try {
    const response = await api.get('/carreras/todas')
    carreras.value = (response as Array<Record<string, unknown>>).map(carrera => ({
      id: Number(carrera.idCarrera ?? carrera.id ?? 0),
      nombre: String(carrera.nombre ?? '')
    }))
  } catch (error) {
    console.error('Error al cargar carreras:', error)
  }
}

const cargarEventos = async () => {
  try {
    const response = await api.get('/eventos/todos')

    eventosDisponibles.value = (response as Array<Record<string, unknown>>).map(evento => ({
      id: Number(evento.idEvento),
      nombre: String(evento.nombre ?? ''),
      fechaInicio: String(evento.fechaHora ?? ''),
      inscritos: Number(evento.inscritos ?? 0),
      idCarrera: evento.idCarrera !== undefined ? Number(evento.idCarrera) : null
    }))

    eventoSeleccionado.value = null
    asistencias.value = []
    infoEvento.value = null
  } catch (error) {
    console.error('Error al cargar eventos:', error)
  }
}

const cargarAsistencias = async () => {
  if (!eventoSeleccionado.value) return

  loading.value = true
  try {
    infoEvento.value = eventosDisponibles.value.find(e => e.id === eventoSeleccionado.value) || null

    const response = await api.get(`/asistencias/evento/${eventoSeleccionado.value}/detalle`)
    const items = response as Array<Record<string, unknown>>

    asistencias.value = items.map(item => {
      const nombreParticipante = String(item.nombreParticipante ?? '')
      const nombreParts = nombreParticipante.split(' ')
      const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante
      const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : ''

      return {
        idAsistencia: Number(item.idAsistencia),
        idInscripcion: Number(item.idInscripcion),
        participante: {
          nombres,
          apellidos,
          email: String(item.email ?? '-'),
          username: String(item.username ?? '-')
        },
        asistio: Boolean(item.asistio),
        certificado: null,
        registradoPor: item.registradoPor
          ? { nombre: String(item.registradoPor), rol: '' }
          : null,
        fechaRegistro: String(item.fechaRegistro ?? ''),
        observaciones: null
      }
    })

    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar asistencias:', error)
  } finally {
    loading.value = false
  }
}

const calcularEstadisticas = () => {
  estadisticas.value = {
    totalEventos: eventosDisponibles.value.length,
    totalInscritos: asistencias.value.length,
    asistieron: asistencias.value.filter(a => a.asistio).length,
    noAsistieron: asistencias.value.filter(a => !a.asistio).length
  }
}

// ============================================
// MÉTODOS - CRUD
// ============================================

const editarAsistencia = (asistencia: Asistencia) => {
  asistenciaSeleccionada.value = asistencia
  formAsistencia.value = {
    asistio: asistencia.asistio,
    observaciones: asistencia.observaciones || ''
  }
  showEditModal.value = true
}

const guardarAsistencia = async () => {
  if (!asistenciaSeleccionada.value) return

  saving.value = true
  try {
    if (formAsistencia.value.asistio) {
      await api.post('/asistencias', {
        idInscripcion: asistenciaSeleccionada.value.idInscripcion
      })
    } else {
      await api.delete(`/asistencias/${asistenciaSeleccionada.value.idInscripcion}`)
    }

    await cargarAsistencias()
    calcularEstadisticas()
    closeEditModal()
  } catch (error) {
    console.error('Error al guardar asistencia:', error)
  } finally {
    saving.value = false
  }
}

// ============================================
// MÉTODOS - MODALES
// ============================================

const verDetalle = (asistencia: Asistencia) => {
  asistenciaSeleccionada.value = asistencia
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  asistenciaSeleccionada.value = null
  formAsistencia.value = {
    asistio: null,
    observaciones: ''
  }
}

// ============================================
// MÉTODOS - UTILIDADES
// ============================================

const formatDate = (date: string) => {
  if (!date) return '-'
  return formatDateUtil(date, 'es-BO')
}

const formatDatetime = (datetime: string) => {
  if (!datetime) return '-'
  return formatDateTimeUtil(datetime, 'es-BO')
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  cargarCarreras()
  cargarEventos()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>