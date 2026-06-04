import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/tailwind.css'
import { useAuthStore } from '@/stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializar autenticación
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')