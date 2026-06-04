<template>
  <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
    <!-- Logo/Titulo -->
    <div class="flex items-center gap-4 mb-6">
      <div class="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-300/50 bg-white shadow-lg">
        <img :src="logoUrl" alt="Logo FHCE" class="w-full h-full object-cover" />
      </div>
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-amber-600">FHCE Cursos</p>
        <h2 class="text-2xl font-bold text-slate-900">Verificar Email</h2>
        <p class="text-sm text-slate-500">Confirma tu correo electrónico</p>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-700 text-sm">{{ errorMessage }}</p>
    </div>

    <div v-if="message" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-green-700 text-sm">{{ message }}</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleVerify">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="Ingresa tu usuario"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          disabled
          readonly
        />
      </div>

      <div>
        <label for="codigo" class="block text-sm font-medium text-gray-700 mb-2">Código de verificación</label>
        <input
          id="codigo"
          v-model="form.codigo"
          type="text"
          maxlength="6"
          placeholder="000000"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
          :disabled="loading"
        />
      </div>

      <button
        type="submit"
        :disabled="loading || !form.username.trim() || form.codigo.length !== 6"
        class="w-full bg-blue-400 hover:bg-blue-300 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Verificando...' : 'Verificar email' }}
      </button>

      <div class="flex items-center justify-between text-sm pt-2">
        <button
          type="button"
          @click="handleResend"
          :disabled="loading"
          class="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Reenviando...' : 'Reenviar código' }}
        </button>
        
        <router-link
          to="/auth/login"
          class="text-blue-600 hover:text-blue-700 font-medium"
        >
          Ir al login
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import logo from '@/assets/images/logo.jpg'

const logoUrl: string = logo
const auth = useAuthStore()
const route = useRoute()

const message = ref('')
const errorMessage = ref('')
const loading = ref(false)

const form = reactive({
  username: '',
  codigo: ''
})

onMounted(() => {
  const username = route.query.username
  if (typeof username === 'string') {
    form.username = username
  }
})

const handleVerify = async () => {
  try {
    message.value = ''
    errorMessage.value = ''
    loading.value = true
    const response = await auth.verifyEmail({
      username: form.username,
      codigo: form.codigo
    })
    message.value = response
  } catch (error) {
    errorMessage.value = (error as Error).message
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  try {
    message.value = ''
    errorMessage.value = ''
    loading.value = true
    const response = await auth.resendCode(form.username)
    message.value = response
  } catch (error) {
    errorMessage.value = (error as Error).message
  } finally {
    loading.value = false
  }
}
</script>
