<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Panel del docente</h1>
        <p class="text-sm text-slate-500">Resumen rapido de tus paralelos y estudiantes.</p>
      </div>
      <div class="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-800">
        <span class="h-2 w-2 rounded-full bg-amber-500"></span>
        Vista docente activa
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-wide text-slate-500">Cursos activos</p>
          <p class="text-2xl font-semibold text-slate-900">{{ stats.cursos }}</p>
        </div>
      </Card>
      <Card>
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-wide text-slate-500">Paralelos asignados</p>
          <p class="text-2xl font-semibold text-slate-900">{{ stats.paralelos }}</p>
        </div>
      </Card>
      <Card>
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-wide text-slate-500">Inscritos totales</p>
          <p class="text-2xl font-semibold text-slate-900">{{ stats.inscritos }}</p>
        </div>
      </Card>
    </div>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Tus paralelos</h3>
          <p class="text-sm text-slate-500">Acceso directo a calificaciones por paralelo.</p>
        </div>
        <Button variant="outline" size="sm" @click="loadCursos">Actualizar</Button>
      </div>

      <div v-if="loading" class="py-10 text-center text-sm text-slate-500">
        Cargando tus cursos...
      </div>

      <div v-else class="mt-6 space-y-4">
        <div v-if="paralelosDocente.length === 0" class="rounded-lg border border-dashed border-slate-200 p-6 text-center">
          <p class="text-sm text-slate-500">No hay paralelos asignados por ahora.</p>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <div
            v-for="paralelo in paralelosDocente"
            :key="`${paralelo.idCurso}-${paralelo.codigo}`"
            class="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-500">{{ paralelo.nombreCarrera }}</p>
                <h4 class="text-lg font-semibold text-slate-900">
                  {{ paralelo.nombreCurso }} · {{ paralelo.codigo }}
                </h4>
              </div>
              <Badge variant="info" size="sm">{{ paralelo.modalidad }}</Badge>
            </div>
            <div class="mt-3 space-y-1 text-sm text-slate-600">
              <p>{{ paralelo.horarioDescripcion || 'Horario por confirmar' }}</p>
              <p>Inscritos: {{ paralelo.inscritos }}</p>
            </div>
            <div class="mt-4 flex items-center gap-2">
              <Button size="sm" @click="goToCalificaciones(paralelo)">Ver calificaciones</Button>
              <a
                v-if="paralelo.link"
                :href="paralelo.link"
                target="_blank"
                rel="noreferrer"
                class="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Ir a clase
              </a>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/utils/api'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'

interface ParaleloDocente {
  idCurso: number
  codigo: string
  nombreCurso: string
  nombreCarrera: string
  modalidad: string
  horarioDescripcion: string
  inscritos: number
  link: string
}

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const paralelosDocente = ref<ParaleloDocente[]>([])

const stats = computed(() => {
  const cursos = new Set(paralelosDocente.value.map(paralelo => paralelo.idCurso)).size
  const paralelos = paralelosDocente.value.length
  const inscritos = paralelosDocente.value.reduce((total, paralelo) => total + (paralelo.inscritos || 0), 0)
  return { cursos, paralelos, inscritos }
})

const normalizeName = (value: string) => {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

const loadCursos = async () => {
  loading.value = true
  try {
    const docenteNombre = normalizeName(authStore.fullName || '')
    const cursos = await api.get('/cursos') as Array<Record<string, unknown>>

    const paralelos: ParaleloDocente[] = []

    cursos.forEach(curso => {
      const nombreCurso = String(curso.nombre ?? '')
      const nombreCarrera = String(curso.nombreCarrera ?? '')
      const idCurso = Number(curso.idCurso ?? 0)

      const paralelosCurso = Array.isArray(curso.paralelos)
        ? (curso.paralelos as Array<Record<string, unknown>>)
        : []

      paralelosCurso.forEach(paralelo => {
        const nombreDocente = normalizeName(String(paralelo.nombreDocente ?? ''))
        if (!docenteNombre || nombreDocente !== docenteNombre) return

        paralelos.push({
          idCurso,
          codigo: String(paralelo.codigo ?? ''),
          nombreCurso,
          nombreCarrera,
          modalidad: String(paralelo.modalidad ?? 'PRESENCIAL'),
          horarioDescripcion: String(paralelo.horarioDescripcion ?? ''),
          inscritos: Number(paralelo.inscritos ?? 0),
          link: String(paralelo.link ?? '')
        })
      })
    })

    paralelosDocente.value = paralelos
  } catch (error) {
    console.error('Error al cargar cursos del docente:', error)
  } finally {
    loading.value = false
  }
}

const goToCalificaciones = (paralelo: ParaleloDocente) => {
  router.push({
    name: 'teacher-grades',
    query: { curso: String(paralelo.idCurso), paralelo: paralelo.codigo }
  })
}

onMounted(() => {
  loadCursos()
})
</script>
