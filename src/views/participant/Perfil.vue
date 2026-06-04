<template>
  <!--
    Vista: Mi Perfil
    Permite al usuario ver y editar su información personal
  -->
  <div class="container mx-auto px-4 py-8">
    <!-- Encabezado -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Mi Perfil</h1>
      <p class="text-gray-600">Gestiona tu información personal</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna izquierda: Avatar y estadísticas -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Card de perfil -->
        <Card>
          <div class="text-center space-y-4">
            <!-- Avatar -->
            <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <!-- Nombre -->
            <div>
              <h2 class="text-xl font-bold text-gray-800">
                {{ authStore.fullName }}
              </h2>
              <p class="text-sm text-gray-600">{{ perfil?.email || '-' }}</p>
              <Badge
                :variant="esExterno ? 'secondary' : 'primary'"
                size="sm"
                class="mt-2"
              >
                {{ esExterno ? 'Usuario Externo' : 'Usuario UMSA' }}
              </Badge>
            </div>
          </div>
        </Card>

        <!-- Estadísticas rápidas -->
        <Card>
          <div class="space-y-4">
            <h3 class="font-semibold text-gray-800 mb-3">Estadísticas</h3>
            
            <div class="flex items-center justify-between py-2 border-b border-gray-200">
              <span class="text-sm text-gray-600">Inscripciones</span>
              <span class="font-semibold text-gray-800">{{ stats.inscripciones }}</span>
            </div>
            
            <div class="flex items-center justify-between py-2 border-b border-gray-200">
              <span class="text-sm text-gray-600">Certificados</span>
              <span class="font-semibold text-gray-800">{{ stats.certificados }}</span>
            </div>
            
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-600">Horas totales</span>
              <span class="font-semibold text-gray-800">{{ stats.horasTotales }}</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- Columna derecha: Formulario de datos -->
      <div class="lg:col-span-2">
        <Card>
          <form @submit.prevent="guardarCambios" class="space-y-6">
            <!-- Información Personal -->
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Nombres -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombres <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.nombres"
                    type="text"
                    required
                    :disabled="!modoEdicion"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <!-- Apellidos -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.apellidos"
                    type="text"
                    required
                    :disabled="!modoEdicion"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    required
                    disabled
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <!-- CI -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Carnet de Identidad <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.ci"
                    type="text"
                    required
                    :disabled="!modoEdicion"
                    placeholder="Ej: 1234567 LP"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                
              </div>
            </div>

            <!-- Cambiar Contraseña -->
            <div v-if="esExterno" class="border-t border-gray-200 pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800">Contraseña</h3>
                <Button 
                  v-if="!modoEdicion"
                  variant="outline" 
                  size="sm"
                  @click="mostrarCambioPassword = !mostrarCambioPassword"
                  type="button"
                >
                  {{ mostrarCambioPassword ? 'Cancelar' : 'Cambiar contraseña' }}
                </Button>
              </div>

              <div v-if="mostrarCambioPassword || modoEdicion" class="space-y-4">
                <!-- Contraseña actual -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordData.actual"
                      :type="mostrarPasswordActual ? 'text' : 'password'"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                      @click="mostrarPasswordActual = !mostrarPasswordActual"
                      aria-label="Mostrar u ocultar contrasena actual"
                    >
                      <svg v-if="!mostrarPasswordActual" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.132-3.368" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.223 6.223A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.057" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Nueva contraseña -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordData.nueva"
                      :type="mostrarPasswordNueva ? 'text' : 'password'"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                      @click="mostrarPasswordNueva = !mostrarPasswordNueva"
                      aria-label="Mostrar u ocultar nueva contrasena"
                    >
                      <svg v-if="!mostrarPasswordNueva" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.132-3.368" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.223 6.223A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.057" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Confirmar contraseña -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordData.confirmar"
                      :type="mostrarPasswordConfirmar ? 'text' : 'password'"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                      @click="mostrarPasswordConfirmar = !mostrarPasswordConfirmar"
                      aria-label="Mostrar u ocultar confirmar contrasena"
                    >
                      <svg v-if="!mostrarPasswordConfirmar" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.132-3.368" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.223 6.223A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.057" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                v-if="!modoEdicion && esExterno"
                variant="primary"
                type="button"
                @click="activarEdicion"
              >
                Editar Perfil
              </Button>
              <p v-else-if="!modoEdicion" class="text-sm text-gray-500">
                Solo usuarios externos pueden editar su perfil.
              </p>

              <template v-else>
                <Button
                  variant="outline"
                  type="button"
                  @click="cancelarEdicion"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  :disabled="guardando"
                >
                  {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
                </Button>
              </template>
            </div>
            <p
              v-if="feedbackMessage"
              class="pt-2 text-sm"
              :class="feedbackType === 'error' ? 'text-red-600' : 'text-emerald-600'"
            >
              {{ feedbackMessage }}
            </p>
          </form>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import { api } from '@/utils/api'

// ============================================
// COMPOSABLES
// ============================================

const authStore = useAuthStore()

// ============================================
// ESTADO
// ============================================

const modoEdicion = ref(false)
const guardando = ref(false)
const mostrarCambioPassword = ref(false)
const mostrarPasswordActual = ref(false)
const mostrarPasswordNueva = ref(false)
const mostrarPasswordConfirmar = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')

interface PerfilResponse {
  idUsuario: number
  username: string
  ci: string
  nombres: string
  apellidos: string
  email: string
  tipoUsuario: 'INTERNO' | 'EXTERNO'
  tipoParticipante?: 'UMSA' | 'EXTERNO' | null
}

interface InscripcionResponse {
  idInscripcion: number
}

interface CertificadoResponse {
  estadoEmision?: string | null
  cargaHoraria?: number | null
}

// Datos del formulario
const formData = reactive({
  ci: '',
  nombres: '',
  apellidos: '',
  email: ''
})

const perfil = ref<PerfilResponse | null>(null)
const stats = reactive({
  inscripciones: 0,
  certificados: 0,
  horasTotales: 0
})

// Backup de datos originales
let datosOriginales: any = {}

// Datos de cambio de contraseña
const passwordData = reactive({
  actual: '',
  nueva: '',
  confirmar: ''
})

// ============================================
// MÉTODOS
// ============================================

const esExterno = computed(() => {
  if (perfil.value?.tipoUsuario) {
    return perfil.value.tipoUsuario === 'EXTERNO'
  }
  return authStore.user?.tipoParticipante === 'EXTERNO'
})

const cargarEstadisticas = async () => {
  try {
    const [inscripcionesResponse, certificadosResponse] = await Promise.all([
      api.get('/inscripciones/mis-inscripciones'),
      api.get('/certificados/mis-certificados')
    ])

    const inscripciones = inscripcionesResponse as InscripcionResponse[]
    const certificados = (certificadosResponse as CertificadoResponse[])
      .filter(cert => String(cert.estadoEmision ?? '') !== 'ANULADO')

    stats.inscripciones = inscripciones.length
    stats.certificados = certificados.length
    stats.horasTotales = certificados.reduce((sum, cert) => {
      const horas = cert.cargaHoraria !== undefined && cert.cargaHoraria !== null
        ? Number(cert.cargaHoraria)
        : 0
      return sum + horas
    }, 0)
  } catch (error) {
    console.error('Error al cargar estadisticas:', error)
    stats.inscripciones = 0
    stats.certificados = 0
    stats.horasTotales = 0
  }
}

/**
 * Carga los datos del usuario
 */
const cargarDatos = async () => {
  if (!authStore.user) return

  try {
    const response = await api.get('/usuarios/me') as PerfilResponse
    perfil.value = response
    formData.ci = response.ci ?? ''
    formData.nombres = response.nombres
    formData.apellidos = response.apellidos
    formData.email = response.email

    if (authStore.user) {
      authStore.updateUser({
        ...authStore.user,
        nombres: response.nombres,
        apellidos: response.apellidos
      })
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error)
    formData.ci = ''
    formData.nombres = authStore.user.nombres
    formData.apellidos = authStore.user.apellidos
    formData.email = ''
  }

  // Guardar copia de datos originales
  datosOriginales = { ...formData }
}

/**
 * Activa el modo edición
 */
const activarEdicion = () => {
  if (!esExterno.value) {
    feedbackMessage.value = 'Solo usuarios externos pueden editar su perfil.'
    feedbackType.value = 'error'
    return
  }
  modoEdicion.value = true
  feedbackMessage.value = ''
}

/**
 * Cancela la edición y restaura datos originales
 */
const cancelarEdicion = () => {
  Object.assign(formData, datosOriginales)
  modoEdicion.value = false
  mostrarCambioPassword.value = false
  mostrarPasswordActual.value = false
  mostrarPasswordNueva.value = false
  mostrarPasswordConfirmar.value = false
  feedbackMessage.value = ''
  
  // Limpiar campos de contraseña
  passwordData.actual = ''
  passwordData.nueva = ''
  passwordData.confirmar = ''
}

/**
 * Guarda los cambios del perfil
 */
const guardarCambios = async () => {
  if (!esExterno.value) {
    feedbackMessage.value = 'Solo usuarios externos pueden editar su perfil.'
    feedbackType.value = 'error'
    return
  }

  // Validar contraseñas si se está cambiando
  if (mostrarCambioPassword.value || (passwordData.nueva && passwordData.confirmar)) {
    if (!passwordData.actual) {
      feedbackMessage.value = 'Debes ingresar tu contrasena actual.'
      feedbackType.value = 'error'
      return
    }
    
    if (passwordData.nueva !== passwordData.confirmar) {
      feedbackMessage.value = 'Las contrasenas no coinciden.'
      feedbackType.value = 'error'
      return
    }
    
    if (passwordData.nueva.length < 6) {
      feedbackMessage.value = 'La contrasena debe tener al menos 6 caracteres.'
      feedbackType.value = 'error'
      return
    }
  }
  
  guardando.value = true
  
  try {
    if (mostrarCambioPassword.value || (passwordData.nueva && passwordData.confirmar)) {
      await api.post('/usuarios/me/password', {
        passwordActual: passwordData.actual,
        passwordNueva: passwordData.nueva
      })
    }

    const response = await api.put('/usuarios/me', {
      ci: formData.ci,
      nombres: formData.nombres,
      apellidos: formData.apellidos
    }) as PerfilResponse
    perfil.value = response
    
    // Actualizar datos en el store
    if (authStore.user) {
      authStore.updateUser({
        ...authStore.user,
        ci: formData.ci,
        nombres: formData.nombres,
        apellidos: formData.apellidos
      })
    }
    
    // Actualizar datos originales
    datosOriginales = { ...formData }
    
    modoEdicion.value = false
    mostrarCambioPassword.value = false
    mostrarPasswordActual.value = false
    mostrarPasswordNueva.value = false
    mostrarPasswordConfirmar.value = false
    
    // Limpiar campos de contraseña
    passwordData.actual = ''
    passwordData.nueva = ''
    passwordData.confirmar = ''
    
    feedbackMessage.value = 'Perfil actualizado correctamente.'
    feedbackType.value = 'success'
  } catch (error) {
    console.error('Error al guardar:', error)
    feedbackMessage.value = (error as Error).message || 'Error al guardar los cambios.'
    feedbackType.value = 'error'
  } finally {
    guardando.value = false
  }
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  cargarDatos()
  cargarEstadisticas()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
:deep(input::-ms-reveal),
:deep(input::-ms-clear) {
  display: none;
}
</style>