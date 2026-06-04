<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Mis cursos</h1>
      <p class="text-sm text-slate-500">Gestiona tus paralelos y accede a recursos rapidamente.</p>
    </div>

    <Card>
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Paralelos asignados</h3>
          <p class="text-sm text-slate-500">Solo se muestran los cursos donde eres docente.</p>
        </div>
        <Button variant="outline" size="sm" @click="loadCursos">Actualizar</Button>
      </div>

      <div v-if="loading" class="py-10 text-center text-sm text-slate-500">
        Cargando cursos...
      </div>

      <div v-else class="mt-6 space-y-5">
        <div v-if="paralelosDocente.length === 0" class="rounded-lg border border-dashed border-slate-200 p-6 text-center">
          <p class="text-sm text-slate-500">No tienes paralelos asignados aun.</p>
        </div>

        <div v-else class="grid gap-4 lg:grid-cols-2">
          <div
            v-for="paralelo in paralelosDocente"
            :key="`${paralelo.idCurso}-${paralelo.codigo}`"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
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
              <p v-if="paralelo.link" class="text-emerald-700">Clase virtual disponible</p>
            </div>

            <div class="mt-4 flex items-center gap-2">
              <Button size="sm" @click="goToCalificaciones(paralelo)">Gestionar calificaciones</Button>
              <a
                v-if="paralelo.link"
                :href="paralelo.link"
                target="_blank"
                rel="noreferrer"
                class="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Abrir enlace
              </a>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
