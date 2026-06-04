<template>
  <!--
    Dashboard del Participante
    Resumen general de inscripciones, certificados y actividad reciente
  -->
  <div class="space-y-8">
    <!-- Encabezado de bienvenida -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg p-8 text-white">
      <h1 class="text-3xl font-bold mb-2">
        ¡Bienvenido, {{ authStore.user?.nombres }}!
      </h1>
      <p class="text-purple-100">
        Aquí puedes ver un resumen de tus actividades académicas
      </p>
    </div>

    <!-- Tarjetas de estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Inscripciones activas -->
      <Card>
        <div class="text-center">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-800">{{ stats.inscripcionesActivas }}</p>
          <p class="text-sm text-gray-600 mt-1">Inscripciones Activas</p>
        </div>
      </Card>

      <!-- Cursos completados -->
      <Card>
        <div class="text-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-800">{{ stats.cursosCompletados }}</p>
          <p class="text-sm text-gray-600 mt-1">Cursos Completados</p>
        </div>
      </Card>

      <!-- Certificados obtenidos -->
      <Card>
        <div class="text-center">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-800">{{ stats.certificadosObtenidos }}</p>
          <p class="text-sm text-gray-600 mt-1">Certificados</p>
        </div>
      </Card>

      <!-- Horas acumuladas -->
      <Card>
        <div class="text-center">
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-800">{{ stats.horasAcumuladas }}</p>
          <p class="text-sm text-gray-600 mt-1">Horas Académicas</p>
        </div>
      </Card>
    </div>

    <!-- Mis inscripciones activas -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-800">Mis Inscripciones Activas</h2>
        <router-link to="/participante/inscripciones">
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </router-link>
      </div>

      <div v-if="inscripcionesActivas.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          v-for="inscripcion in inscripcionesActivas" 
          :key="inscripcion.id"
          :hoverable="true"
        >
          <div class="space-y-3">
            <!-- Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <Badge :variant="inscripcion.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ inscripcion.tipo }}
                </Badge>
                <h3 class="text-lg font-semibold text-gray-800 mt-2">
                  {{ inscripcion.nombre }}
                </h3>
              </div>
            </div>

            <!-- Información -->
            <div class="space-y-2 text-sm text-gray-600">
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
            </div>

            <!-- Progreso (solo para cursos) -->
            <div v-if="inscripcion.tipo === 'CURSO'" class="pt-3 border-t border-gray-200">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-600">Progreso</span>
                <span class="font-semibold text-gray-800">{{ inscripcion.progreso }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all"
                  :style="{ width: `${inscripcion.progreso}%` }"
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Estado vacío -->
      <Card v-else>
        <div class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-600 mb-4">No tienes inscripciones activas</p>
          <router-link to="/participante">
            <Button variant="primary">
              Explorar cursos y eventos
            </Button>
          </router-link>
        </div>
      </Card>
    </div>

    <!-- Certificados recientes -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-800">Certificados Recientes</h2>
        <router-link to="/participante/certificados">
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </router-link>
      </div>

      <div v-if="certificadosRecientes.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          v-for="certificado in certificadosRecientes" 
          :key="certificado.id"
          :hoverable="true"
        >
          <div class="text-center space-y-3">
            <div class="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-800 text-sm line-clamp-2">
              {{ certificado.nombre }}
            </h3>
            <p class="text-xs text-gray-500">
              Emitido el {{ formatDate(certificado.fecha_emision) }}
            </p>
            <Button variant="outline" size="sm" class="w-full">
              Descargar
            </Button>
          </div>
        </Card>
      </div>

      <!-- Estado vacío -->
      <Card v-else>
        <div class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p class="text-gray-600">Aún no tienes certificados</p>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import { formatDate as formatDateUtil } from '@/utils/dateFormatter'

// ============================================
// COMPOSABLES
// ============================================

const authStore = useAuthStore()

// ============================================
// ESTADO
// ============================================

/** Estadísticas del participante */
const stats = ref({
  inscripcionesActivas: 3,
  cursosCompletados: 5,
  certificadosObtenidos: 5,
  horasAcumuladas: 186
})

/** Inscripciones activas (MOCK) */
const inscripcionesActivas = ref([
  {
    id: 1,
    tipo: 'CURSO',
    nombre: 'Metodología de la Investigación Cualitativa',
    fecha_inicio: '2025-02-20',
    fecha_fin: '2025-03-20',
    carga_horaria: 32,
    progreso: 65
  },
  {
    id: 2,
    tipo: 'CURSO',
    nombre: 'Filosofía Contemporánea',
    fecha_inicio: '2025-02-15',
    fecha_fin: '2025-04-10',
    carga_horaria: 48,
    progreso: 40
  },
  {
    id: 3,
    tipo: 'EVENTO',
    nombre: 'Congreso Internacional de Psicología',
    fecha_inicio: '2025-04-15',
    fecha_fin: '2025-04-17',
    carga_horaria: 24,
    progreso: 0
  }
])

/** Certificados recientes (MOCK) */
const certificadosRecientes = ref([
  {
    id: 1,
    nombre: 'Introducción a la Psicología Clínica',
    fecha_emision: '2025-01-20'
  },
  {
    id: 2,
    nombre: 'Taller de Escritura Creativa',
    fecha_emision: '2025-01-15'
  },
  {
    id: 3,
    nombre: 'Seminario de Innovación Educativa',
    fecha_emision: '2025-01-10'
  }
])

// ============================================
// MÉTODOS
// ============================================

/**
 * Formatea una fecha
 */
const formatDate = (dateString: string): string => {
  return formatDateUtil(dateString, 'es-ES')
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  console.log('✅ Dashboard de participante cargado')
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