<template>
  <!-- Contenedor centrado con ancho máximo -->
  <div class="w-full flex justify-center px-4 py-8">
    <div class="w-full max-w-md">

      <!-- Tarjeta principal -->
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

        <!-- Header -->
        <div class="px-8 pt-8 pb-6 text-center border-b border-slate-100">
          <div class="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-emerald-200 shadow-md mx-auto mb-4">
            <img :src="logo" alt="Logo FHCE" class="w-full h-full object-cover" />
          </div>
          <p class="text-xs uppercase tracking-widest text-emerald-600 font-medium mb-1">FHCE · Sistema de Eventos</p>
          <h1 class="text-2xl font-bold text-slate-800">Crear cuenta</h1>
          <p class="text-sm text-slate-500 mt-1">Completa los datos para registrarte</p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleRegister" class="px-8 py-6 space-y-4">

          <!-- Usuario + CI -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                Usuario <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.username"
                type="text"
                autocomplete="username"
                :disabled="isSubmitting"
                placeholder="usuario.acceso"
                class="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition disabled:opacity-50"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                CI <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.ci"
                type="text"
                autocomplete="off"
                :disabled="isSubmitting"
                placeholder="12345678"
                class="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Nombres + Apellidos -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                Nombres <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.nombres"
                type="text"
                autocomplete="given-name"
                :disabled="isSubmitting"
                placeholder="Tus nombres"
                class="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition disabled:opacity-50"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                Apellidos <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.apellidos"
                type="text"
                autocomplete="family-name"
                :disabled="isSubmitting"
                placeholder="Tus apellidos"
                class="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              Correo electrónico <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              :disabled="isSubmitting"
              placeholder="correo@ejemplo.com"
              class="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition disabled:opacity-50"
            />
          </div>

          <!-- Contraseña + Confirmar -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                Contraseña <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :disabled="isSubmitting"
                  placeholder="Mín. 8 caracteres"
                  class="w-full px-3 py-2.5 pr-9 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition disabled:opacity-50"
                />
                <button
                  type="button"
                  :disabled="isSubmitting"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <svg v-if="!showPassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.27-2.944-9.543-7a9.965 9.965 0 012.472-4.111m3.168-2.225A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.198 5.29M15 12a3 3 0 00-3-3"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18"/>
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                Confirmar <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :disabled="isSubmitting"
                  placeholder="Repite la contraseña"
                  class="w-full px-3 py-2.5 pr-9 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition disabled:opacity-50"
                />
                <button
                  type="button"
                  :disabled="isSubmitting"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <svg v-if="!showConfirmPassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.27-2.944-9.543-7a9.965 9.965 0 012.472-4.111m3.168-2.225A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.198 5.29M15 12a3 3 0 00-3-3"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Mensaje error / éxito -->
          <div v-if="errorMessage || message" class="pt-1">
            <p v-if="errorMessage" role="alert" class="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <svg class="h-3.5 w-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ errorMessage }}
            </p>
            <p v-if="message" role="status" class="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <svg class="h-3.5 w-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ message }}
            </p>
          </div>

          <!-- Botón -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white py-3 rounded-lg font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            <svg v-if="isSubmitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4"/>
              <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke-width="4"/>
            </svg>
            {{ isSubmitting ? 'Enviando código...' : 'Crear mi cuenta' }}
          </button>

          <!-- Link login -->
          <p class="text-center text-sm text-slate-500 pt-1">
            ¿Ya tienes una cuenta?
            <RouterLink to="/auth/login" class="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
              Inicia sesión
            </RouterLink>
          </p>

        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Evitar duplicado del icono de mostrar contrasena en Edge/IE */
:deep(input::-ms-reveal),
:deep(input::-ms-clear) {
  display: none;
}
</style>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import logo from '@/assets/images/logo.jpg'

const auth = useAuthStore()
const router = useRouter()

const message = ref('')
const errorMessage = ref('')

const form = reactive({
  username: '',
  ci: '',
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  confirmPassword: '',
  tipoParticipante: 'EXTERNO' as 'EXTERNO'
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)

const handleRegister = async () => {
  if (isSubmitting.value) return
  try {
    message.value = ''
    errorMessage.value = ''

    const trimmedUsername = form.username.trim()
    const trimmedNombres = form.nombres.trim()
    const trimmedApellidos = form.apellidos.trim()
    const trimmedEmail = form.email.trim()
    const trimmedPassword = form.password.trim()
    const trimmedConfirm = form.confirmPassword.trim()

    if (!trimmedUsername || !trimmedNombres || !trimmedApellidos || !trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      errorMessage.value = 'Completa todos los campos obligatorios'
      return
    }

    if (!form.ci.trim()) {
      errorMessage.value = 'El CI es obligatorio'
      return
    }

    if (!/^[\w.\-]+$/i.test(trimmedUsername)) {
      errorMessage.value = 'El usuario solo puede tener letras, numeros, puntos o guiones'
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errorMessage.value = 'El email no tiene un formato valido'
      return
    }

    if (trimmedPassword.length < 8) {
      errorMessage.value = 'La contraseña debe tener al menos 8 caracteres'
      return
    }

    if (trimmedPassword !== trimmedConfirm) {
      errorMessage.value = 'Las contraseñas no coinciden'
      return
    }

    isSubmitting.value = true
    const response = await auth.register({
      username: trimmedUsername,
      ci: form.ci.trim(),
      nombres: trimmedNombres,
      apellidos: trimmedApellidos,
      email: trimmedEmail,
      password: trimmedPassword,
      tipoParticipante: 'EXTERNO'
    })

    message.value = response
    router.push({
      name: 'verify-email',
      query: { username: trimmedUsername }
    })
  } catch (error) {
    errorMessage.value = (error as Error).message
  } finally {
    isSubmitting.value = false
  }
}
</script>
