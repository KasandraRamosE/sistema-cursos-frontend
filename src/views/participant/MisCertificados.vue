<template>
  <!--
    Vista: Mis Certificados
    Lista de certificados obtenidos por el participante
  -->
  <div class="container mx-auto px-4 py-8">
    <!-- Encabezado -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Mis Certificados</h1>
      <p class="text-gray-600">Descarga y verifica tus certificados digitales</p>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <div class="text-center">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-800">{{ certificados.length }}</p>
          <p class="text-sm text-gray-600 mt-1">Certificados Totales</p>
        </div>
      </Card>

      <Card>
        <div class="text-center">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-800">{{ certificadosCursos }}</p>
          <p class="text-sm text-gray-600 mt-1">De Cursos</p>
        </div>
      </Card>

      <Card>
        <div class="text-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-800">{{ certificadosEventos }}</p>
          <p class="text-sm text-gray-600 mt-1">De Eventos</p>
        </div>
      </Card>
    </div>

    <!-- Grid de certificados -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      <p class="mt-4 text-gray-600">Cargando certificados...</p>
    </div>

    <div v-else-if="certificados.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        v-for="certificado in certificados" 
        :key="certificado.id"
        :hoverable="true"
        class="relative overflow-hidden"
      >
        <!-- Badge de tipo -->
        <div class="absolute top-4 right-4 z-10">
          <Badge :variant="certificado.tipo === 'APROBACION' ? 'success' : 'info'" size="sm">
            {{ certificado.tipo === 'APROBACION' ? 'Aprobación' : 'Participación' }}
          </Badge>
        </div>

        <!-- Contenido del certificado -->
        <div class="text-center space-y-4">
          <!-- Icono -->
          <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>

          <!-- Información -->
          <div>
            <h3 class="font-bold text-gray-800 mb-1 line-clamp-2">
              {{ certificado.nombre_actividad }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ certificado.carga_horaria }} horas académicas
            </p>
          </div>

          <!-- Nota (si es de aprobación) -->
          <div v-if="certificado.tipo === 'APROBACION' && certificado.nota" class="py-2 px-4 bg-green-50 rounded-lg">
            <p class="text-xs text-gray-600">Nota final</p>
            <p class="text-2xl font-bold text-green-600">{{ certificado.nota }}</p>
          </div>

          <!-- Fecha de emisión -->
          <p class="text-xs text-gray-500">
            Emitido el {{ formatDate(certificado.fecha_emision) }}
          </p>

          <!-- Código QR (placeholder) -->
          <div class="py-3 bg-gray-50 rounded-lg">
            <div class="w-24 h-24 bg-white border-2 border-gray-300 rounded mx-auto flex items-center justify-center">
              <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z"/>
              </svg>
            </div>
            <p class="text-xs text-gray-500 mt-2">Código de verificación</p>
          </div>

          <!-- Botones de acción -->
          <div class="flex gap-2">
            <Button 
              variant="primary" 
              size="sm" 
              class="flex-1"
              @click="descargarCertificado(certificado.id)"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              @click="verificarCertificado(certificado.codigo_verificacion)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Estado vacío -->
    <Card v-else>
      <div class="text-center py-12">
        <svg class="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">
          Aún no tienes certificados
        </h3>
        <p class="text-gray-600 mb-6">
          Completa cursos y eventos para obtener tus certificados digitales
        </p>
        <router-link to="/participante/inscripciones">
          <Button variant="primary">
            Ver mis inscripciones
          </Button>
        </router-link>
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
import { formatDate as formatDateUtil } from '@/utils/dateFormatter'

// ============================================
// ESTADO
// ============================================

interface CertificadoItem {
  id: number
  tipo: 'APROBACION' | 'PARTICIPACION'
  nombre_actividad: string
  carga_horaria: number
  nota: number | null
  fecha_emision: string
  codigo_verificacion: string
  actividad_tipo: 'CURSO' | 'EVENTO'
  version: number
  actividad_id: string
}

const certificados = ref<CertificadoItem[]>([])
const loading = ref(false)

// ============================================
// COMPUTED
// ============================================

const certificadosCursos = computed(() => 
  certificados.value.filter(c => c.actividad_tipo === 'CURSO').length
)

const certificadosEventos = computed(() => 
  certificados.value.filter(c => c.actividad_tipo === 'EVENTO').length
)

// ============================================
// MÉTODOS
// ============================================

const formatDate = (dateString: string): string => {
  return formatDateUtil(dateString, 'es-ES')
}

const descargarCertificado = (certificadoId: number) => {
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

const verificarCertificado = (codigo: string) => {
  window.open(`/verificar/${codigo}`, '_blank')
}

const getActividadId = (item: Record<string, unknown>): string => {
  return String(
    item.idActividad ??
    item.actividadId ??
    item.id_actividad ??
    item.actividad_id ??
    item.nombreActividad ??
    ''
  )
}

const getTimestamp = (dateString: string): number => {
  const timestamp = new Date(dateString).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const esCertificadoMasReciente = (actual: CertificadoItem, candidato: CertificadoItem): boolean => {
  if (candidato.version !== actual.version) {
    return candidato.version > actual.version
  }

  const fechaActual = getTimestamp(actual.fecha_emision)
  const fechaCandidato = getTimestamp(candidato.fecha_emision)

  if (fechaCandidato !== fechaActual) {
    return fechaCandidato > fechaActual
  }

  return candidato.id > actual.id
}

const obtenerUltimasVersiones = (items: CertificadoItem[]): CertificadoItem[] => {
  const certificadosPorActividad = new Map<string, CertificadoItem>()

  for (const item of items) {
    const key = `${item.actividad_tipo}:${item.tipo}:${item.actividad_id}`
    const actual = certificadosPorActividad.get(key)

    if (!actual || esCertificadoMasReciente(actual, item)) {
      certificadosPorActividad.set(key, item)
    }
  }

  return Array.from(certificadosPorActividad.values()).sort((a, b) => {
    const diferenciaFecha = getTimestamp(b.fecha_emision) - getTimestamp(a.fecha_emision)
    return diferenciaFecha !== 0 ? diferenciaFecha : b.id - a.id
  })
}

const cargarCertificados = async () => {
  loading.value = true
  try {
    const response = await api.get('/certificados/mis-certificados')
    const items = response as Array<Record<string, unknown>>

    const certificadosNormalizados: CertificadoItem[] = items
      .filter(item => String(item.estadoEmision ?? '') !== 'ANULADO')
      .map((item): CertificadoItem => {
        const tipoActividad = String(item.tipoActividad ?? 'EVENTO') as 'CURSO' | 'EVENTO'
        const tipoCertificado: CertificadoItem['tipo'] = tipoActividad === 'CURSO' ? 'APROBACION' : 'PARTICIPACION'
        const notaFinal = item.notaFinal !== undefined && item.notaFinal !== null
          ? Number(item.notaFinal)
          : null

        return {
          id: Number(item.idCertificado),
          tipo: tipoCertificado,
          nombre_actividad: String(item.nombreActividad ?? ''),
          carga_horaria: Number(item.cargaHoraria ?? 0),
          nota: notaFinal,
          fecha_emision: String(item.fechaEmision ?? ''),
          codigo_verificacion: String(item.codigoVerificacion ?? ''),
          actividad_tipo: tipoActividad,
          version: Number(item.version ?? 1),
          actividad_id: getActividadId(item)
        }
      })

    certificados.value = obtenerUltimasVersiones(certificadosNormalizados)
  } catch (error) {
    console.error('Error al cargar certificados:', error)
    certificados.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarCertificados()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
