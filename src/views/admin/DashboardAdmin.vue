<template>
  <!--
    Dashboard del Administrador
    Vista general con KPIs y accesos rápidos a todas las secciones
  -->
  <div class="space-y-8">
    <!-- Encabezado -->
    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
      <p class="text-gray-600">Gestión completa del sistema</p>
    </div>

    <!-- KPIs - Tarjetas de estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Usuarios -->
      <Card :hoverable="true" @click="router.push('/admin/usuarios')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Total Usuarios</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.totalUsuarios }}</p>
            <p class="text-xs text-gray-500 mt-1">
              <span class="text-blue-600">{{ stats.usuariosInternos }}</span> UMSA · 
              <span class="text-purple-600">{{ stats.usuariosExternos }}</span> Externos
            </p>
          </div>
          <div class="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </Card>

      <!-- Total Actividades -->
      <Card :hoverable="true" @click="router.push('/admin/actividades')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Actividades</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.totalActividades }}</p>
            <p class="text-xs text-gray-500 mt-1">
              <span class="text-purple-600">{{ stats.cursosActivos }}</span> Cursos · 
              <span class="text-green-600">{{ stats.eventosActivos }}</span> Eventos
            </p>
          </div>
          <div class="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </Card>

      <!-- Total Inscripciones -->
      <Card :hoverable="true" @click="router.push('/admin/inscripciones')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Inscripciones</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.totalInscripciones }}</p>
            <p class="text-xs text-gray-500 mt-1">
              <span class="text-green-600">{{ stats.inscripcionesActivas }}</span> Activas
            </p>
          </div>
          <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </Card>

      <!-- Certificados Pendientes -->
      <Card :hoverable="true" @click="router.push('/admin/certificados')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Certificados</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.totalCertificados }}</p>
            <p class="text-xs text-gray-500 mt-1">
              <span class="text-orange-600">{{ stats.certificadosPendientes }}</span> Pendientes
            </p>
          </div>
          <div class="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>
      </Card>
    </div>

    <!-- Accesos Rápidos -->
    <div>
      <h2 class="text-xl font-bold text-gray-800 mb-4">Accesos Rápidos</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Gestión de Usuarios -->
        <Card :hoverable="true" @click="router.push('/admin/usuarios')">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">Gestión de Usuarios</h3>
              <p class="text-sm text-gray-600">Administrar usuarios y roles</p>
            </div>
          </div>
        </Card>

        <!-- Gestión de Actividades -->
        <Card :hoverable="true" @click="router.push('/admin/actividades')">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">Cursos y Eventos</h3>
              <p class="text-sm text-gray-600">Gestionar actividades académicas</p>
            </div>
          </div>
        </Card>

        <!-- Gestión de Inscripciones -->
        <Card :hoverable="true" @click="router.push('/admin/inscripciones')">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">Inscripciones</h3>
              <p class="text-sm text-gray-600">Ver y modificar inscripciones</p>
            </div>
          </div>
        </Card>

        <!-- Gestión de Calificaciones -->
        <Card :hoverable="true" @click="router.push('/admin/calificaciones')">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">Calificaciones</h3>
              <p class="text-sm text-gray-600">Gestionar notas de cursos</p>
            </div>
          </div>
        </Card>

        <!-- Gestión de Certificados -->
        <Card :hoverable="true" @click="router.push('/admin/certificados')">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">Certificados</h3>
              <p class="text-sm text-gray-600">Emitir y gestionar certificados</p>
            </div>
          </div>
        </Card>

        <!-- Gestión de Carreras -->
        <Card :hoverable="true" @click="router.push('/admin/carreras')">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">Carreras</h3>
              <p class="text-sm text-gray-600">Administrar carreras</p>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Actividades Recientes -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800">Actividades Recientes</h2>
        <router-link to="/admin/actividades">
          <Button variant="outline" size="sm">Ver todas</Button>
        </router-link>
      </div>
      
      <Card>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actividad</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Carrera</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Inscritos</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="actividad in actividadesPaginadas" :key="actividad.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-800">{{ actividad.nombre }}</td>
                <td class="px-4 py-3 text-sm">
                  <Badge :variant="actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                    {{ actividad.tipo }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ actividad.carrera }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ actividad.inscritos }}/{{ actividad.cupo }}</td>
                <td class="px-4 py-3 text-sm">
                  <Badge :variant="getEstadoBadge(actividad.estado)" size="sm">
                    {{ actividad.estado }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm">
                  <Button variant="ghost" size="sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
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

        <!-- Sin resultados -->
        <div v-else class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-gray-600">No se encontraron usuarios con los filtros aplicados</p>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'
// ============================================
// COMPOSABLES
// ============================================

const router = useRouter()

// ============================================
// ESTADO
// ============================================

interface DashboardStats {
  totalUsuarios: number
  usuariosInternos: number
  usuariosExternos: number
  totalActividades: number
  cursosActivos: number
  eventosActivos: number
  totalInscripciones: number
  inscripcionesActivas: number
  totalCertificados: number
  certificadosPendientes: number
}

interface DashboardActividad {
  id: string
  nombre: string
  tipo: 'CURSO' | 'EVENTO'
  carrera: string
  inscritos: number
  cupo: number | null
  estado: string
}

interface DashboardResponse {
  stats: DashboardStats
  actividadesRecientes: DashboardActividad[]
}

const alertStore = useAlertStore()

// Estadísticas generales
const stats = ref<DashboardStats>({
  totalUsuarios: 0,
  usuariosInternos: 0,
  usuariosExternos: 0,
  totalActividades: 0,
  cursosActivos: 0,
  eventosActivos: 0,
  totalInscripciones: 0,
  inscripcionesActivas: 0,
  totalCertificados: 0,
  certificadosPendientes: 0
})

// Actividades recientes
const actividadesRecientes = ref<DashboardActividad[]>([])

const {
  paginatedData: actividadesPaginadas,  // Solo 10 usuarios a la vez
  currentPage,
  pageSize,
  totalItems,
  goToPage,
  setPageSize
} = usePagination(actividadesRecientes, {
  pageSize: 10,
  initialPage: 1
})

// ============================================
// MÉTODOS
// ============================================

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'ABIERTO':
      return 'success'
    case 'LLENO':
      return 'warning'
    case 'FINALIZADO':
      return 'gray'
    default:
      return 'info'
  }
}

const cargarDashboard = async () => {
  try {
    const response = await api.get('/dashboard/admin') as DashboardResponse
    stats.value = response.stats
    actividadesRecientes.value = response.actividadesRecientes
  } catch (error) {
    console.error('Error al cargar dashboard:', error)
    alertStore.push({ type: 'error', message: 'No se pudo cargar el dashboard.' })
  }
}

onMounted(() => {
  cargarDashboard()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>

