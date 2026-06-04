<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Mis eventos</h1>
        <p class="text-sm text-slate-500">Eventos futuros y de hoy asignados a tu usuario.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {{ eventos.length }} evento(s)
        </span>
        <Button variant="outline" size="sm" @click="loadEventos">Actualizar</Button>
      </div>
    </div>

    <Card>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Buscar evento</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Nombre del evento"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
          Cargando eventos...
        </div>
        <div v-else-if="eventosFiltrados.length === 0" class="py-8 text-center text-sm text-slate-500">
          No tienes eventos asignados para las próximas fechas.
        </div>
        <div v-else class="space-y-4">
          <div class="grid gap-4 md:hidden">
            <article
              v-for="evento in eventosFiltrados"
              :key="evento.idEvento"
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-base font-semibold text-slate-900 leading-snug">{{ evento.nombre }}</h3>
                  <p class="mt-1 text-sm text-slate-500">{{ formatDate(evento.fechaHora) }}</p>
                </div>
                <span
                  class="shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="isEventoHoy(evento.fechaHora)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'"
                >
                  {{ isEventoHoy(evento.fechaHora) ? 'Hoy' : 'Pendiente' }}
                </span>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div class="rounded-xl bg-slate-50 px-3 py-2">
                  <p class="text-xs uppercase tracking-wide text-slate-400">Inscritos</p>
                  <p class="mt-1 font-semibold text-slate-800">{{ evento.inscritos }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 px-3 py-2">
                  <p class="text-xs uppercase tracking-wide text-slate-400">Estado</p>
                  <p class="mt-1 font-semibold text-slate-800">{{ isEventoHoy(evento.fechaHora) ? 'Listo para registrar' : 'Asignado' }}</p>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-2">
                <router-link :to="{ name: 'activity-detail', params: { id: evento.idEvento }, query: { tipo: 'EVENTO' } }">
                  <Button variant="outline" fullWidth>Ver evento</Button>
                </router-link>
                <router-link v-if="isEventoHoy(evento.fechaHora)" :to="`/auxiliar/asistencia?evento=${evento.idEvento}`">
                  <Button fullWidth>Ingresar asistencia</Button>
                </router-link>
              </div>
            </article>
          </div>

          <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Evento</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Inscritos</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Accion</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="evento in eventosFiltrados" :key="evento.idEvento" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <p class="text-sm font-medium text-slate-800">{{ evento.nombre }}</p>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ formatDate(evento.fechaHora) }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="isEventoHoy(evento.fechaHora)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'"
                  >
                    {{ isEventoHoy(evento.fechaHora) ? 'Disponible hoy' : 'Asignado' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ evento.inscritos }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <router-link :to="{ name: 'activity-detail', params: { id: evento.idEvento }, query: { tipo: 'EVENTO' } }">
                      <Button variant="outline" size="sm">Ver</Button>
                    </router-link>
                    <router-link v-if="isEventoHoy(evento.fechaHora)" :to="`/auxiliar/asistencia?evento=${evento.idEvento}`">
                      <Button size="sm">Ingresar</Button>
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import { api } from '@/utils/api'
import { formatDateTime as formatDateTimeUtil, parseLocalDate } from '@/utils/dateFormatter'

interface EventoDto {
  idEvento: number
  nombre: string
  fechaHora: string
  inscritos: number
}

const loading = ref(false)
const searchTerm = ref('')
const eventos = ref<EventoDto[]>([])

const eventosFiltrados = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return eventos.value

  return eventos.value.filter(evento => evento.nombre.toLowerCase().includes(term))
})

const isEventoHoy = (fechaHora: string) => {
  if (!fechaHora) return false

  const fechaEvento = parseLocalDate(fechaHora)
  const ahora = new Date()

  return fechaEvento.getFullYear() === ahora.getFullYear()
    && fechaEvento.getMonth() === ahora.getMonth()
    && fechaEvento.getDate() === ahora.getDate()
}

const loadEventos = async () => {
  loading.value = true
  try {
    const response = await api.get('/eventos/auxiliar') as EventoDto[]
    eventos.value = response
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return formatDateTimeUtil(date, 'es-BO')
}

onMounted(() => {
  loadEventos()
})
</script>
