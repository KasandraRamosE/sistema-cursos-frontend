<template>
        <!-- 
    Vista de Login
    Permite login con diferentes roles (MOCK para desarrollo)
  -->
  <div class="relative">
    <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-300/30 via-transparent to-emerald-300/30 blur-2xl"></div>
    <div class="relative bg-white/95 border border-white/60 rounded-3xl shadow-2xl p-8 backdrop-blur">
      <!-- Logo/Titulo -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-300/50 bg-white shadow-lg">
          <img :src="logo" alt="Logo FHCE" class="w-full h-full object-cover" />
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-amber-600">FHCE Cursos</p>
          <h2 class="text-2xl font-bold text-slate-900">Iniciar Sesion</h2>
          <p class="text-sm text-slate-500">Accede a tu espacio de cursos</p>
        </div>
      </div>
      <div class="mb-4">
        <p class="text-sm text-slate-500">Si eres usuario UMSA, puedes acceder con tus credenciales UMSA.</p>
      </div>

      <!-- Formulario -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Usuario (o RU)</label>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="Tu usuario o RU"
            :disabled="isSubmitting"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
          
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Contrasena</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Tu contrasena"
              :disabled="isSubmitting"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition pr-10"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              :disabled="isSubmitting"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              :aria-label="showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'"
            >
              <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.27-2.944-9.543-7a9.965 9.965 0 012.472-4.111m3.168-2.225A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.198 5.29M15 12a3 3 0 00-3-3" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-blue-400 hover:bg-blue-300 text-white py-2.5 rounded-xl font-semibold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg v-if="isSubmitting" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4" />
            <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke-width="4" />
          </svg>
          {{ isSubmitting ? 'Ingresando...' : 'Entrar' }}
        </button>

        <p v-if="errorMessage" class="text-sm text-red-600" role="status">
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-between text-sm pt-2">
          <router-link
            to="/auth/reset-password"
            class="text-slate-600 hover:text-slate-900 font-medium"
          >
            ¿Olvidaste tu contraseña?
          </router-link>
          <router-link
            to="/auth/registro"
            class="text-amber-700 hover:text-amber-800"
          >
            Crear cuenta
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import type { Rol } from '@/types'
import logo from '@/assets/images/logo.jpg'

// ============================================
// ESTADO
// ============================================

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)

// ============================================
// MÉTODOS
// ============================================

/**
 * Maneja el login con credenciales
 */
const handleLogin = async () => {
  if (isSubmitting.value) return
  errorMessage.value = ''
  const trimmedUsername = username.value.trim()
  const trimmedPassword = password.value.trim()
  if (!trimmedUsername || !trimmedPassword) {
    errorMessage.value = 'Por favor ingrese usuario y contraseña'
    return
  }

  isSubmitting.value = true
  const success = await auth.login(trimmedUsername, trimmedPassword)
  
  if (success) {
    errorMessage.value = ''
    redirectToDashboard()
  } else {
    const error = auth.loginError.toLowerCase()
    if (error.includes('verif') || error.includes('codigo') || error.includes('email')) {
      router.push({ name: 'verify-email', query: { username: username.value } })
      return
    }
    errorMessage.value = auth.loginError || 'Credenciales incorrectas'
  }
  isSubmitting.value = false
}

/**
 * Redirige al dashboard según el rol
 */
const redirectToDashboard = () => {
  const currentRole = auth.currentRole
  
  const routes: Record<Rol, string> = {
    'ADMINISTRADOR': '/admin',
    'COORDINADOR': '/coordinador',
    'DOCENTE': '/docente',
    'PARTICIPANTE': '/participante',
    'AUXILIAR': '/auxiliar',
    'DISENADOR': '/disenador'
  }

  if (currentRole === 'AUXILIAR') {
    router.push(auth.hasRole('PARTICIPANTE')
      ? { name: 'participant-home' }
      : { name: 'auxiliary-events' })
    return
  }
  
  const route = currentRole ? routes[currentRole] : '/'
  router.push(route)
}
</script>

<style scoped>
/* Evitar duplicado del icono de mostrar contrasena en Edge/IE */
:deep(input::-ms-reveal),
:deep(input::-ms-clear) {
  display: none;
}
</style>