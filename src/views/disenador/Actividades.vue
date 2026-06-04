<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Actividades</h1>
      <p class="text-sm text-slate-500">Consulta cursos y eventos disponibles.</p>
    </div>

    <Card>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-full px-4 py-2 text-sm font-medium"
          :class="tabActiva === 'CURSO' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'"
          @click="tabActiva = 'CURSO'"
        >
          Cursos
        </button>
        <button
          class="rounded-full px-4 py-2 text-sm font-medium"
          :class="tabActiva === 'EVENTO' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'"
          @click="tabActiva = 'EVENTO'"
        >
          Eventos
        </button>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">Buscar</label>
        <input
          v-model="busqueda"
          type="text"
          placeholder="Nombre de la actividad"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
        />
      </div>
    </Card>

    <Card>
      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
        Cargando actividades...
      </div>
      <div v-else-if="actividadesFiltradas.length === 0" class="py-8 text-center text-sm text-slate-500">
        No hay actividades disponibles.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nombre</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Carrera</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="actividad in actividadesFiltradas" :key="actividad.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-sm text-slate-700">{{ actividad.nombre }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ formatDate(actividad.fecha) }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ actividad.carrera }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/common/Card.vue'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil } from '@/utils/dateFormatter'
import { useAuthStore } from '@/stores/auth.store'

interface ActividadItem {
  id: number
  nombre: string
  fecha: string
  carrera: string
  idDisenador?: number | null
}

const tabActiva = ref<'CURSO' | 'EVENTO'>('CURSO')
const busqueda = ref('')
const loading = ref(false)

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.idUsuario ?? null)

const cursos = ref<ActividadItem[]>([])
const eventos = ref<ActividadItem[]>([])

const actividadesFiltradas = computed(() => {
  const term = busqueda.value.trim().toLowerCase()
  const base = tabActiva.value === 'CURSO' ? cursos.value : eventos.value
  const assigned = currentUserId.value
    ? base.filter(item => item.idDisenador === currentUserId.value)
    : []
  if (!term) return assigned
  return assigned.filter(item => item.nombre.toLowerCase().includes(term))
})

const cargarActividades = async () => {
  loading.value = true
  try {
    const [cursosResponse, eventosResponse] = await Promise.all([
      api.get('/cursos/disenador'),
      api.get('/eventos/disenador')
    ])

    cursos.value = (cursosResponse as Array<Record<string, unknown>>).map(curso => ({
      id: Number(curso.idCurso),
      nombre: String(curso.nombre ?? ''),
      fecha: String(curso.fechaInicio ?? ''),
      carrera: String(curso.nombreCarrera ?? ''),
      idDisenador: curso.idDisenador ? Number(curso.idDisenador) : null
    }))

    eventos.value = (eventosResponse as Array<Record<string, unknown>>).map(evento => ({
      id: Number(evento.idEvento),
      nombre: String(evento.nombre ?? ''),
      fecha: String(evento.fechaHora ?? ''),
      carrera: String(evento.nombreCarrera ?? ''),
      idDisenador: evento.idDisenador ? Number(evento.idDisenador) : null
    }))
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return formatDateUtil(date, 'es-BO')
}

onMounted(() => {
  cargarActividades()
})
</script>
