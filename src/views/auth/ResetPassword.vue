<template>
  <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <!-- Logo/Titulo -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-300/50 bg-white shadow-lg">
          <img :src="logoUrl" alt="Logo FHCE" class="w-full h-full object-cover" />
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-amber-600">FHCE Cursos</p>
          <h2 class="text-2xl font-bold text-slate-900">Recuperar Contraseña</h2>
          <p class="text-sm text-slate-500">Restablece tu contraseña en 3 pasos</p>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700 text-sm">{{ errorMessage }}</p>
      </div>

      <div v-if="successMessage" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-green-700 text-sm">{{ successMessage }}</p>
      </div>

      <!-- PASO 1: Solicitar código -->
      <div v-if="step === 1" class="space-y-4">
        <p class="text-gray-600 text-sm mb-4">
          Ingresa tu nombre de usuario para recibir un código por correo
        </p>

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            Nombre de usuario
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="tu usuario"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="loading"
          />
        </div>

        <button
          @click="handleSolicitarCodigo"
          :disabled="loading || !username.trim()"
          class="w-full bg-blue-400 hover:bg-blue-300 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Enviando...' : 'Enviar código' }}
        </button>

        <div class="text-center mt-4">
          <p class="text-gray-600 text-sm">
            ¿Ya tienes cuenta?
            <RouterLink to="/auth/login" class="text-blue-600 hover:text-blue-700 font-semibold">
              Inicia sesión
            </RouterLink>
          </p>
        </div>
      </div>

      <!-- PASO 2: Verificar código -->
      <div v-if="step === 2" class="space-y-4">
        <p class="text-gray-600 text-sm mb-4">
          Ingresa el código de 6 dígitos que recibiste en tu correo
        </p>

        <div>
          <label for="codigo" class="block text-sm font-medium text-gray-700 mb-2">
            Código de verificación
          </label>
          <input
            id="codigo"
            v-model="codigo"
            type="text"
            placeholder="000000"
            maxlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
            :disabled="loading"
          />
        </div>

        <button
          @click="handleVerificarCodigo"
          :disabled="loading || codigo.length !== 6"
          class="w-full bg-blue-400 hover:bg-blue-300 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Verificando...' : 'Verificar código' }}
        </button>

        <button
          @click="step = 1"
          :disabled="loading"
          class="w-full text-gray-700 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg transition"
        >
          Atrás
        </button>
      </div>

      <!-- PASO 3: Cambiar contraseña -->
      <div v-if="step === 3" class="space-y-4">
        <p class="text-gray-600 text-sm mb-4">
          Ingresa tu nueva contraseña
        </p>

        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Nueva contraseña
          </label>
          <input
            id="newPassword"
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 8 caracteres"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="loading"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Repite tu contraseña"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="loading"
          />
        </div>

        <label class="flex items-center gap-2 text-gray-700 text-sm cursor-pointer">
          <input
            v-model="showPassword"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300"
            :disabled="loading"
          />
          Mostrar contraseña
        </label>

        <button
          @click="handleCambiarPassword"
          :disabled="loading || !isPasswordValid"
          class="w-full bg-blue-400 hover:bg-blue-300 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Cambiando...' : 'Cambiar contraseña' }}
        </button>

        <button
          @click="step = 2"
          :disabled="loading"
          class="w-full text-gray-700 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg transition"
        >
          Atrás
        </button>
      </div>

      <!-- Success Screen -->
      <div v-if="isSuccess" class="text-center space-y-4">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            class="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <h2 class="text-2xl font-bold text-gray-800">¡Contraseña actualizada!</h2>
        <p class="text-gray-600">
          Tu contraseña ha sido cambiada exitosamente.
        </p>

        <RouterLink
          to="/auth/login"
          class="inline-block w-full bg-blue-400 hover:bg-blue-300 text-white font-semibold py-2 rounded-lg transition text-center"
        >
          Ir al login
        </RouterLink>
      </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { RouterLink } from 'vue-router'
import logo from '@/assets/images/logo.jpg'

const logoUrl: string = logo

const router = useRouter()
const authStore = useAuthStore()

// Estado
const step = ref(1) // 1: solicitar, 2: verificar, 3: cambiar contraseña
const username = ref('')
const codigo = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isSuccess = ref(false)

// Computed
const isPasswordValid = computed(() => {
  return (
    newPassword.value.length >= 8 &&
    confirmPassword.value.length >= 8 &&
    newPassword.value === confirmPassword.value
  )
})

// Handlers
const handleSolicitarCodigo = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!username.value.trim()) {
    errorMessage.value = 'Por favor ingresa tu nombre de usuario'
    return
  }

  loading.value = true
  try {
    const mensaje = await authStore.solicitarResetPassword(username.value.trim())
    successMessage.value = mensaje
    step.value = 2
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Error al solicitar el código'
  } finally {
    loading.value = false
  }
}

const handleVerificarCodigo = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (codigo.value.length !== 6) {
    errorMessage.value = 'Por favor ingresa un código válido de 6 dígitos'
    return
  }

  loading.value = true
  try {
    const mensaje = await authStore.verificarCodigoReset(username.value.trim(), codigo.value)
    successMessage.value = mensaje
    step.value = 3
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Error al verificar el código'
  } finally {
    loading.value = false
  }
}

const handleCambiarPassword = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!isPasswordValid.value) {
    errorMessage.value = 'Las contraseñas deben coincidir y tener mínimo 8 caracteres'
    return
  }

  loading.value = true
  try {
    const mensaje = await authStore.cambiarPassword(
      username.value.trim(),
      codigo.value,
      newPassword.value
    )
    successMessage.value = mensaje
    isSuccess.value = true

    // Redirigir a login después de 2 segundos
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Error al cambiar la contraseña'
  } finally {
    loading.value = false
  }
}
</script>
