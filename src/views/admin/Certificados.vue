<template>
  <!--
    Vista de Gestión de Certificados - Administrador
    Permite ver solicitudes pendientes, emitir, anular y reemitir certificados
  -->
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Certificados</h1>
      <p class="text-gray-600">Solicitudes, emisión y control de certificados</p>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.certificadosEmitidos }}</p>
          <p class="text-sm text-gray-600">Emitidos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ estadisticas.certificadosAnulados }}</p>
          <p class="text-sm text-gray-600">Anulados</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.certificadosReemitidos }}</p>
          <p class="text-sm text-gray-600">Reemitidos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.totalCertificados }}</p>
          <p class="text-sm text-gray-600">Total</p>
        </div>
      </Card>
    </div>
    <Card>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">Certificados emitidos</h3>
        </div>

        <!-- Filtros -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              v-model="filtrosCertificados.busqueda"
              type="text"
              placeholder="Nombre de usuario o actividad..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              v-model="filtrosCertificados.estado"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="GENERADO">Generados</option>
              <option value="ANULADO">Anulados</option>
              <option value="REEMITIDO">Reemitidos</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              v-model="filtrosCertificados.tipo"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="APROBACION">Aprobación</option>
              <option value="PARTICIPACION">Participación</option>
            </select>
          </div>
          <div class="flex items-end">
            <Button variant="outline" class="w-full" @click="limpiarFiltrosCertificados">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar
            </Button>
          </div>
        </div>

        <!-- Tabla de certificados -->
        <div v-if="certificadosPaginados.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actividad</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Versión</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emisión</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="certificado in certificadosPaginados" :key="certificado.idCertificado" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-mono text-gray-600">
                  #{{ certificado.idCertificado }}
                </td>
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-800">
                      {{ certificado.usuario.nombres }} {{ certificado.usuario.apellidos }}
                    </p>
                    <p class="text-xs text-gray-500">{{ certificado.usuario.email }}</p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ certificado.actividad.nombre }}</p>
                    <p class="text-xs text-gray-500">{{ certificado.actividad.cargaHoraria }} horas</p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <Badge :variant="certificado.tipo === 'APROBACION' ? 'success' : 'info'" size="sm">
                    {{ certificado.tipo }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-center text-sm">
                  <span v-if="certificado.version > 1" class="text-blue-600 font-medium">
                    v{{ certificado.version }}
                  </span>
                  <span v-else class="text-gray-500">v1</span>
                </td>
                <td class="px-4 py-3">
                  <Badge :variant="getEstadoCertificadoBadge(certificado.estadoEmision)">
                    {{ certificado.estadoEmision }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-xs text-gray-600">
                  {{ formatDate(certificado.fechaEmision) }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" @click="verCertificado(certificado)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                    <Button
                      v-if="certificado.estadoEmision === 'GENERADO'"
                      variant="ghost"
                      size="sm"
                      class="text-red-600 hover:text-red-800"
                      @click="anularCertificado(certificado)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </Button>
                    <Button
                      v-if="certificado.estadoEmision === 'ANULADO'"
                      variant="ghost"
                      size="sm"
                      class="text-blue-600 hover:text-blue-800"
                      @click="reemitirCertificado(certificado)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-if="totalItems > 0"
          :current-page="currentPage"
          :total-items="totalItems"
          :page-size="pageSize"
          :show-page-size-selector="true"
          @update:current-page="goToPage"
          @update:page-size="setPageSize"
        />
        <!-- Sin certificados -->
        <div v-else class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p class="text-gray-600">No se encontraron certificados</p>
        </div>
      </div>
    </Card>

    <!-- Modal Anular Certificado -->
    <Modal
      :modelValue="showAnularModal"
      @close="closeAnularModal"
      title="Anular Certificado"
    >
      <div v-if="certificadoSeleccionado" class="space-y-4">
        <!-- Info del certificado -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800 mb-2">
            <strong>Atención:</strong> Esta acción anulará el certificado.
          </p>
          <div class="space-y-2 text-sm">
            <p><strong>Usuario:</strong> {{ certificadoSeleccionado.usuario.nombres }} {{ certificadoSeleccionado.usuario.apellidos }}</p>
            <p><strong>Actividad:</strong> {{ certificadoSeleccionado.actividad.nombre }}</p>
          </div>
        </div>

        <!-- Motivo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Motivo de Anulación <span class="text-red-600">*</span>
          </label>
          <textarea
            v-model="motivoAnulacion"
            rows="3"
            required
            placeholder="Describe el motivo de la anulación..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" @click="closeAnularModal">
            Cancelar
          </Button>
          <Button
            variant="danger"
            @click="confirmarAnulacion"
            :disabled="!motivoAnulacion.trim() || procesando"
          >
            {{ procesando ? 'Anulando...' : 'Anular Certificado' }}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil } from '@/utils/dateFormatter'
// ============================================
// TIPOS
// ============================================

interface Actividad {
  nombre: string
  tipo: 'CURSO' | 'EVENTO'
  carrera: string
  cargaHoraria: number
}

interface Certificado {
  idCertificado: number
  usuario: {
    nombres: string
    apellidos: string
    email: string
  }
  actividad: Actividad
  tipo: 'APROBACION' | 'PARTICIPACION'
  version: number
  estadoEmision: 'GENERADO' | 'ANULADO' | 'REEMITIDO'
  fechaEmision: string
}

// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const procesando = ref(false)

const certificados = ref<Certificado[]>([])

const estadisticas = ref({
  certificadosEmitidos: 0,
  certificadosAnulados: 0,
  certificadosReemitidos: 0,
  totalCertificados: 0
})

const filtrosCertificados = ref({
  busqueda: '',
  estado: '',
  tipo: ''
})

// Modales
const showAnularModal = ref(false)
const certificadoSeleccionado = ref<Certificado | null>(null)

// Anulación
const motivoAnulacion = ref('')

// ============================================
// COMPUTED
// ============================================

const certificadosFiltrados = computed(() => {
  const certificadosOrdenados = [...certificados.value].sort((a, b) => {
    const fechaA = new Date(a.fechaEmision).getTime()
    const fechaB = new Date(b.fechaEmision).getTime()

    if (Number.isNaN(fechaA) && Number.isNaN(fechaB)) return b.idCertificado - a.idCertificado
    if (Number.isNaN(fechaA)) return 1
    if (Number.isNaN(fechaB)) return -1

    const diferencia = fechaB - fechaA
    return diferencia !== 0 ? diferencia : b.idCertificado - a.idCertificado
  })

  let resultado = [...certificadosOrdenados]

  if (filtrosCertificados.value.busqueda) {
    const busqueda = filtrosCertificados.value.busqueda.toLowerCase()
    resultado = resultado.filter(c =>
      c.usuario.nombres.toLowerCase().includes(busqueda) ||
      c.usuario.apellidos.toLowerCase().includes(busqueda) ||
      c.actividad.nombre.toLowerCase().includes(busqueda)
    )
  }

  if (filtrosCertificados.value.estado) {
    resultado = resultado.filter(c => c.estadoEmision === filtrosCertificados.value.estado)
  }

  if (filtrosCertificados.value.tipo) {
    resultado = resultado.filter(c => c.tipo === filtrosCertificados.value.tipo)
  }

  return resultado
})
const {
  paginatedData: certificadosPaginados,  // Solo 10 usuarios a la vez
  currentPage,
  pageSize,
  totalItems,
  goToPage,
  setPageSize
} = usePagination(certificadosFiltrados, {
  pageSize: 10,
  initialPage: 1
})
// ============================================
// MÉTODOS - CARGA DE DATOS
// ============================================

const cargarDatos = async () => {
  loading.value = true
  try {
    await cargarCertificados()
    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const cargarCertificados = async () => {
  const response = await api.get('/certificados/admin')
  const items = response as Array<Record<string, unknown>>

  certificados.value = items.map(item => {
    const nombreParticipante = String(item.nombreParticipante ?? '')
    const nombreParts = nombreParticipante.split(' ')
    const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante
    const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : ''

    const tipoActividad = String(item.tipoActividad ?? 'EVENTO') as 'CURSO' | 'EVENTO'

    return {
      idCertificado: Number(item.idCertificado),
      usuario: {
        nombres,
        apellidos,
        email: '-'
      },
      actividad: {
        nombre: String(item.nombreActividad ?? ''),
        tipo: tipoActividad,
        carrera: '-',
        cargaHoraria: Number(item.cargaHoraria ?? 0)
      },
      tipo: tipoActividad === 'CURSO' ? 'APROBACION' : 'PARTICIPACION',
      version: Number(item.version ?? 1),
      estadoEmision: String(item.estadoEmision ?? 'GENERADO') as Certificado['estadoEmision'],
      fechaEmision: String(item.fechaEmision ?? '')
    }
  })
}

const calcularEstadisticas = () => {
  estadisticas.value = {
    certificadosEmitidos: certificados.value.filter(c => c.estadoEmision === 'GENERADO').length,
    certificadosAnulados: certificados.value.filter(c => c.estadoEmision === 'ANULADO').length,
    certificadosReemitidos: certificados.value.filter(c => c.estadoEmision === 'REEMITIDO').length,
    totalCertificados: certificados.value.length
  }
}

// ============================================
// MÉTODOS - CERTIFICADOS
// ============================================

const verCertificado = (certificado: Certificado) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const token = localStorage.getItem('token')

  fetch(`${baseUrl}/certificados/${certificado.idCertificado}/descargar`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
    .then(async response => {
      if (!response.ok) {
        const message = response.statusText || 'No se pudo descargar el certificado.'
        throw new Error(message)
      }
      return response.blob()
    })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    })
    .catch(error => {
      console.error('Error al ver certificado:', error)
    })
}

const anularCertificado = (certificado: Certificado) => {
  certificadoSeleccionado.value = certificado
  motivoAnulacion.value = ''
  showAnularModal.value = true
}

const confirmarAnulacion = async () => {
  if (!certificadoSeleccionado.value || !motivoAnulacion.value.trim()) return

  procesando.value = true
  try {
    await api.patch(`/certificados/${certificadoSeleccionado.value.idCertificado}/anular`, {
      motivo: motivoAnulacion.value,
      reemitir: false
    })
    closeAnularModal()
    await cargarDatos()
  } catch (error) {
    console.error('Error al anular certificado:', error)
  } finally {
    procesando.value = false
  }
}

const reemitirCertificado = async (certificado: Certificado) => {
  if (confirm('¿Reemitir este certificado con una nueva versión?')) {
    try {
      await api.patch(`/certificados/${certificado.idCertificado}/anular`, {
        motivo: 'Reemision solicitada por administrador',
        reemitir: true
      })
      await cargarDatos()
    } catch (error) {
      console.error('Error al reemitir certificado:', error)
    }
  }
}

// ============================================
// MÉTODOS - MODALES
// ============================================

const closeAnularModal = () => {
  showAnularModal.value = false
  certificadoSeleccionado.value = null
  motivoAnulacion.value = ''
}

// ============================================
// MÉTODOS - UTILIDADES
// ============================================

const limpiarFiltrosCertificados = () => {
  filtrosCertificados.value = {
    busqueda: '',
    estado: '',
    tipo: ''
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return formatDateUtil(date, 'es-BO')
}

const getEstadoCertificadoBadge = (estado: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'GENERADO': 'success',
    'ANULADO': 'danger',
    'REEMITIDO': 'info'
  }
  return variants[estado] || 'gray'
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>