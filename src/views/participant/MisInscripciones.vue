<template>
  <!--
    Vista: Mis Inscripciones
    Lista de cursos y eventos en los que el participante está inscrito
  -->
  <div class="container mx-auto px-4 py-8">
    <!-- Encabezado -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Mis Inscripciones</h1>
      <p class="text-gray-600">Gestiona tus cursos y eventos inscritos</p>
    </div>

    <!-- Filtros rápidos -->
    <div class="flex flex-wrap gap-3 mb-6">
      <Button 
        :variant="filtroActivo === 'TODAS' ? 'primary' : 'outline'" 
        size="sm"
        @click="filtroActivo = 'TODAS'"
      >
        Todas ({{ inscripciones.length }})
      </Button>
      <Button 
        :variant="filtroActivo === 'ACTIVAS' ? 'primary' : 'outline'" 
        size="sm"
        @click="filtroActivo = 'ACTIVAS'"
      >
        Activas ({{ inscripcionesActivas.length }})
      </Button>
      <Button 
        :variant="filtroActivo === 'COMPLETADAS' ? 'primary' : 'outline'" 
        size="sm"
        @click="filtroActivo = 'COMPLETADAS'"
      >
        Completadas ({{ inscripcionesCompletadas.length }})
      </Button>
      <Button 
        :variant="filtroActivo === 'CURSOS' ? 'primary' : 'outline'" 
        size="sm"
        @click="filtroActivo = 'CURSOS'"
      >
        Cursos ({{ inscripcionesCursos.length }})
      </Button>
      <Button 
        :variant="filtroActivo === 'EVENTOS' ? 'primary' : 'outline'" 
        size="sm"
        @click="filtroActivo = 'EVENTOS'"
      >
        Eventos ({{ inscripcionesEventos.length }})
      </Button>
    </div>

    <!-- Lista de inscripciones -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Cargando inscripciones...</p>
    </div>

    <div v-else-if="inscripcionesFiltradas.length > 0" class="space-y-4">
      <Card 
        v-for="inscripcion in inscripcionesFiltradas" 
        :key="inscripcion.id"
        :hoverable="true"
      >
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Información principal -->
          <div class="flex-1 space-y-3">
            <!-- Header -->
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <Badge :variant="inscripcion.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ inscripcion.tipo }}
                </Badge>
                <Badge :variant="getEstadoBadge(inscripcion.estado)" size="sm">
                  {{ inscripcion.estado }}
                </Badge>
              </div>
              
              <!-- Nota (solo para cursos completados) -->
              <div v-if="inscripcion.tipo === 'CURSO' && inscripcion.nota !== null" class="text-right">
                <p class="text-sm text-gray-600">Nota final</p>
                <p class="text-2xl font-bold" :class="inscripcion.nota >= 51 ? 'text-green-600' : 'text-red-600'">
                  {{ inscripcion.nota }}
                </p>
              </div>
            </div>

            <!-- Título -->
            <h3 class="text-xl font-bold text-gray-800">
              {{ inscripcion.nombre }}
            </h3>

            <!-- Información detallada -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ formatDate(inscripcion.fecha_inicio) }} - {{ formatDate(inscripcion.fecha_fin) }}</span>
              </div>

              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ inscripcion.carga_horaria }} horas académicas</span>
              </div>

              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{{ inscripcion.modalidad }}</span>
              </div>

              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Bs. {{ inscripcion.monto_pagado }}</span>
              </div>
            </div>

          </div>

          <!-- Acciones -->
          <div class="flex md:flex-col gap-2 justify-center md:justify-start">
            <Button 
              v-if="inscripcion.certificado_disponible" 
              variant="success" 
              size="sm"
              @click="descargarCertificado(inscripcion.certificadoId)"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Certificado
            </Button>
            
            <Button variant="outline" size="sm" @click="verDetalles(inscripcion)">
              Ver detalles
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Estado vacío -->
    <Card v-else>
      <div class="text-center py-12">
        <svg class="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">
          No tienes inscripciones {{ filtroActivo.toLowerCase() }}
        </h3>
        <p class="text-gray-600 mb-6">
          Explora nuestro catálogo y encuentra cursos y eventos de tu interés
        </p>
        <router-link to="/participante">
          <Button variant="primary">
            Explorar actividades
          </Button>
        </router-link>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil } from '@/utils/dateFormatter'

// ============================================
// COMPOSABLES
// ============================================

// ============================================
// ESTADO
// ============================================

type FiltroTipo = 'TODAS' | 'ACTIVAS' | 'COMPLETADAS' | 'CURSOS' | 'EVENTOS'

interface InscripcionItem {
  id: number
  tipo: 'CURSO' | 'EVENTO'
  idCurso?: number | null
  idEvento?: number | null
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  carga_horaria: number
  modalidad: string
  monto_pagado: number
  estado: 'ACTIVO' | 'COMPLETADO' | 'CANCELADO' | 'PENDIENTE DE PAGO'
  nota: number | null
  certificado_disponible: boolean
  certificadoId?: number
}

const filtroActivo = ref<FiltroTipo>('TODAS')
const loading = ref(false)
const inscripciones = ref<InscripcionItem[]>([])
const router = useRouter()

// ============================================
// COMPUTED
// ============================================

const inscripcionesActivas = computed(() => 
  inscripciones.value.filter(i => i.estado === 'ACTIVO')
)

const inscripcionesCompletadas = computed(() => 
  inscripciones.value.filter(i => i.estado === 'COMPLETADO')
)

const inscripcionesCursos = computed(() => 
  inscripciones.value.filter(i => i.tipo === 'CURSO')
)

const inscripcionesEventos = computed(() => 
  inscripciones.value.filter(i => i.tipo === 'EVENTO')
)

const inscripcionesFiltradas = computed(() => {
  switch (filtroActivo.value) {
    case 'ACTIVAS':
      return inscripcionesActivas.value
    case 'COMPLETADAS':
      return inscripcionesCompletadas.value
    case 'CURSOS':
      return inscripcionesCursos.value
    case 'EVENTOS':
      return inscripcionesEventos.value
    default:
      return inscripciones.value
  }
})

// ============================================
// MÉTODOS
// ============================================


const formatDate = (dateString: string): string => {
  return formatDateUtil(dateString, 'es-ES')
}

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'ACTIVO':
      return 'info'
    case 'COMPLETADO':
      return 'success'
    case 'PENDIENTE DE PAGO':
      return 'warning'
    case 'CANCELADO':
      return 'danger'
    default:
      return 'gray'
  }
}

const descargarCertificado = (certificadoId?: number) => {
  if (!certificadoId) return

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const token = localStorage.getItem('token')

  fetch(`${baseUrl}/certificados/${certificadoId}/descargar`, {
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
      console.error('Error al descargar certificado:', error)
    })
}

const verDetalles = (inscripcion: InscripcionItem) => {
  const id = inscripcion.tipo === 'CURSO' ? inscripcion.idCurso : inscripcion.idEvento
  if (!id) return

  router.push({
    name: 'activity-detail',
    params: { id: String(id) },
    query: { tipo: inscripcion.tipo }
  })
}

const cargarInscripciones = async () => {
  loading.value = true
  try {
    const [inscripcionesResponse, certificadosResponse] = await Promise.all([
      api.get('/inscripciones/mis-inscripciones'),
      api.get('/certificados/mis-certificados')
    ])

    const certificados = certificadosResponse as Array<Record<string, unknown>>
    const certificadosPorInscripcion = new Map<number, Record<string, unknown>>()

    certificados.forEach(cert => {
      const idInscripcion = Number(cert.idInscripcion ?? 0)
      if (!idInscripcion) return
      const estadoEmision = String(cert.estadoEmision ?? '')
      if (estadoEmision === 'ANULADO') return
      certificadosPorInscripcion.set(idInscripcion, cert)
    })

    const inscripcionesApi = inscripcionesResponse as Array<Record<string, unknown>>

    const detalles = await Promise.all(inscripcionesApi.map(async item => {
      const tipo = String(item.tipoActividad ?? '') as 'CURSO' | 'EVENTO'
      const idCurso = item.idCurso !== undefined ? Number(item.idCurso) : null
      const idEvento = item.idEvento !== undefined ? Number(item.idEvento) : null

      if (tipo === 'CURSO' && idCurso) {
        const curso = await api.get(`/cursos/${idCurso}`) as Record<string, unknown>
        return { item, detalle: curso }
      }
      if (tipo === 'EVENTO' && idEvento) {
        const evento = await api.get(`/eventos/${idEvento}`) as Record<string, unknown>
        return { item, detalle: evento }
      }
      return { item, detalle: null }
    }))

    inscripciones.value = detalles.map(({ item, detalle }) => {
      const tipo = String(item.tipoActividad ?? '') as 'CURSO' | 'EVENTO'
      const idCurso = item.idCurso !== undefined ? Number(item.idCurso) : null
      const idEvento = item.idEvento !== undefined ? Number(item.idEvento) : null
      const certificado = certificadosPorInscripcion.get(Number(item.idInscripcion ?? 0))
      const certificadoId = certificado ? Number(certificado.idCertificado ?? 0) : undefined
      const notaFinal = certificado?.notaFinal !== undefined && certificado?.notaFinal !== null
        ? Number(certificado.notaFinal)
        : null
      const estadoInscripcion = String(item.estado ?? 'PENDIENTE').toUpperCase()
      const estadoPago = String(item.estadoPago ?? '').toUpperCase()

      let fechaInicio = ''
      let fechaFin = ''
      let cargaHoraria = 0
      let modalidad = ''

      if (tipo === 'CURSO' && detalle) {
        fechaInicio = String(detalle.fechaInicio ?? '')
        fechaFin = String(detalle.fechaInicio ?? '')
        cargaHoraria = Number(detalle.cargaHoraria ?? 0)

        const codigoParalelo = String(item.codigoParalelo ?? '')
        const paralelos = Array.isArray(detalle.paralelos)
          ? (detalle.paralelos as Array<Record<string, unknown>>)
          : []

        const paralelo = paralelos.find(p => String(p.codigo ?? '') === codigoParalelo)
        modalidad = paralelo ? String(paralelo.modalidad ?? '') : ''
      }

      if (tipo === 'EVENTO' && detalle) {
        const fechaHora = String(detalle.fechaHora ?? '')
        fechaInicio = fechaHora
        fechaFin = fechaHora
        cargaHoraria = Number(detalle.cargaHoraria ?? 0)
        modalidad = String(detalle.modalidad ?? '')
      }

      const estado = certificadoId
        ? 'COMPLETADO'
        : (estadoInscripcion === 'CANCELADA'
          ? 'CANCELADO'
          : (estadoInscripcion === 'CONFIRMADA' || estadoPago === 'APROBADO'
            ? 'ACTIVO'
            : 'PENDIENTE DE PAGO'))

      return {
        id: Number(item.idInscripcion),
        tipo,
        idCurso,
        idEvento,
        nombre: String(item.nombreActividad ?? ''),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        carga_horaria: cargaHoraria,
        modalidad: modalidad || '-',
        monto_pagado: Number(item.saldo ?? 0),
        estado,
        nota: notaFinal,
        certificado_disponible: Boolean(certificadoId),
        certificadoId
      }
    })
  } catch (error) {
    console.error('Error al cargar inscripciones:', error)
    inscripciones.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarInscripciones()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>