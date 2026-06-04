<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Calificaciones</h1>
      <p class="text-sm text-slate-500">Registra notas y confirma el paralelo cuando este completo.</p>
    </div>

    <Card>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Curso</label>
          <select
            v-model.number="selectedCursoId"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option :value="null">Selecciona un curso</option>
            <option v-for="curso in cursosDocente" :key="curso.idCurso" :value="curso.idCurso">
              {{ curso.nombre }} ({{ curso.nombreCarrera }})
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Paralelo</label>
          <select
            v-model="selectedParaleloCodigo"
            :disabled="!selectedCursoId"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100"
          >
            <option :value="''">Selecciona un paralelo</option>
            <option
              v-for="paralelo in paralelosDelCurso"
              :key="paralelo.codigo"
              :value="paralelo.codigo"
            >
              {{ paralelo.codigo }} · {{ paralelo.modalidad }} · {{ paralelo.inscritos }} inscritos
            </option>
          </select>
        </div>
      </div>
    </Card>

    <div v-if="cursoSeleccionado" class="grid gap-4 md:grid-cols-4">
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Inscritos</p>
        <p class="text-2xl font-semibold text-slate-900">{{ stats.inscritos }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Aprobados</p>
        <p class="text-2xl font-semibold text-emerald-600">{{ stats.aprobados }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Reprobados</p>
        <p class="text-2xl font-semibold text-rose-600">{{ stats.reprobados }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Sin nota</p>
        <p class="text-2xl font-semibold text-amber-600">{{ stats.pendientes }}</p>
      </Card>
    </div>

    <Card v-if="selectedCursoId && selectedParaleloCodigo">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Listado de estudiantes</h3>
          <p class="text-sm text-slate-500">Nota minima: {{ cursoSeleccionado?.notaAprobacion ?? 51 }} / 100</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="cambiosPendientes.length === 0 || (paraleloConfirmado && !esAdmin)"
            @click="guardarNotas"
          >
            Guardar cambios
          </Button>
          <Button
            size="sm"
            :disabled="!puedeConfirmar"
            @click="showConfirmModal = true"
          >
            Confirmar notas
          </Button>
        </div>
      </div>

      <div v-if="loading" class="py-10 text-center text-sm text-slate-500">
        Cargando estudiantes...
      </div>

      <div v-else-if="estudiantes.length === 0" class="py-10 text-center text-sm text-slate-500">
        No hay estudiantes confirmados en este paralelo.
      </div>

      <div v-else class="mt-6 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Estudiante</th>
              <th class="px-4 py-3">Usuario</th>
              <th class="px-4 py-3 text-center">Nota</th>
              <th class="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="estudiante in estudiantes" :key="estudiante.idInscripcion">
              <td class="px-4 py-3">
                <p class="font-medium text-slate-900">{{ estudiante.nombre }}</p>
                <p class="text-xs text-slate-500">{{ estudiante.email }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ estudiante.username }}</td>
              <td class="px-4 py-3 text-center">
                <input
                  v-model.number="estudiante.notaEditada"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  :disabled="paraleloConfirmado && !esAdmin"
                  class="w-24 rounded-lg border border-slate-200 px-2 py-1 text-center focus:border-transparent focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100"
                />
              </td>
              <td class="px-4 py-3 text-center">
                <Badge :variant="getEstadoVariant(estudiante)">
                  {{ getEstadoLabel(estudiante) }}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="cambiosPendientes.length > 0" class="mt-4 text-xs text-amber-700">
        Tienes {{ cambiosPendientes.length }} notas pendientes de guardar.
      </p>
      <p v-if="paraleloConfirmado && !esAdmin" class="mt-2 text-xs text-rose-600">
        Las notas de este paralelo han sido confirmadas y están bloqueadas. Solo el administrador puede modificarlas.
      </p>
      <p v-if="confirmacionExitosa" class="mt-2 text-xs text-emerald-600">
        Paralelo confirmado. Se envio la solicitud de emision.
      </p>
    </Card>

    <Modal
      :modelValue="showConfirmModal"
      title="Confirmar notas"
      @close="closeConfirmModal"
      size="lg"
    >
      <div class="space-y-4">
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Al confirmar, las notas quedan bloqueadas y se genera la solicitud de emision.
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Observaciones (opcional)</label>
          <textarea
            v-model="notasConfirmacion"
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            placeholder="Notas para coordinacion..."
          ></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeConfirmModal">Cancelar</Button>
          <Button :loading="confirmando" @click="confirmarNotas">Confirmar</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/utils/api'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import Modal from '@/components/common/Modal.vue'

interface CursoDocente {
  idCurso: number
  nombre: string
  nombreCarrera: string
  notaAprobacion: number
  paralelos: ParaleloDocente[]
}

interface ParaleloDocente {
  codigo: string
  modalidad: string
  inscritos: number
  horarioDescripcion: string
}

interface EstudianteNota {
  idInscripcion: number
  nombre: string
  email: string
  username: string
  notaFinal: number | null
  notaEditada: number | null
}

const authStore = useAuthStore()
const route = useRoute()

const cursosDocente = ref<CursoDocente[]>([])
const selectedCursoId = ref<number | null>(null)
const selectedParaleloCodigo = ref('')
const estudiantes = ref<EstudianteNota[]>([])
const loading = ref(false)
const saving = ref(false)
const paraleloConfirmado = ref(false)

const showConfirmModal = ref(false)
const confirmando = ref(false)
const notasConfirmacion = ref('')
const confirmacionExitosa = ref(false)

const normalizeName = (value: string) => {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

const cursoSeleccionado = computed(() => {
  return cursosDocente.value.find(curso => curso.idCurso === selectedCursoId.value) || null
})

const paralelosDelCurso = computed(() => {
  return cursoSeleccionado.value?.paralelos || []
})

const stats = computed(() => {
  const inscritos = estudiantes.value.length
  const aprobados = estudiantes.value.filter(est => {
    const nota = est.notaEditada ?? est.notaFinal
    return nota !== null && nota >= (cursoSeleccionado.value?.notaAprobacion ?? 51)
  }).length
  const reprobados = estudiantes.value.filter(est => {
    const nota = est.notaEditada ?? est.notaFinal
    return nota !== null && nota < (cursoSeleccionado.value?.notaAprobacion ?? 51)
  }).length
  const pendientes = estudiantes.value.filter(est => (est.notaEditada ?? est.notaFinal) === null).length
  return { inscritos, aprobados, reprobados, pendientes }
})

const cambiosPendientes = computed(() => {
  return estudiantes.value.filter(est => est.notaEditada !== est.notaFinal)
})

const puedeConfirmar = computed(() => {
  if (!selectedCursoId.value || !selectedParaleloCodigo.value) return false
  if (stats.value.pendientes > 0) return false
  if (cambiosPendientes.value.length > 0) return false
  if (paraleloConfirmado.value) return false
  return true
})

const esAdmin = computed(() => {
  try {
    return authStore.hasRole('ADMINISTRADOR')
  } catch (e) {
    return false
  }
})

const loadCursos = async () => {
  try {
    const docenteNombre = normalizeName(authStore.fullName || '')
    if (!docenteNombre) {
      cursosDocente.value = []
      return
    }
    const cursos = await api.get('/cursos') as Array<Record<string, unknown>>

    const cursosFiltrados: CursoDocente[] = []

    cursos.forEach(curso => {
      const paralelosCurso = Array.isArray(curso.paralelos)
        ? (curso.paralelos as Array<Record<string, unknown>>)
        : []

      const paralelosDocente = paralelosCurso
        .filter(paralelo => normalizeName(String(paralelo.nombreDocente ?? '')) === docenteNombre)
        .map(paralelo => ({
          codigo: String(paralelo.codigo ?? ''),
          modalidad: String(paralelo.modalidad ?? 'PRESENCIAL'),
          inscritos: Number(paralelo.inscritos ?? 0),
          horarioDescripcion: String(paralelo.horarioDescripcion ?? '')
        }))

      if (paralelosDocente.length === 0) return

      cursosFiltrados.push({
        idCurso: Number(curso.idCurso ?? 0),
        nombre: String(curso.nombre ?? ''),
        nombreCarrera: String(curso.nombreCarrera ?? ''),
        notaAprobacion: Number(curso.notaAprobacion ?? 51),
        paralelos: paralelosDocente
      })
    })

    cursosDocente.value = cursosFiltrados
  } catch (error) {
    console.error('Error al cargar cursos:', error)
  }
}

const loadEstudiantes = async () => {
  if (!selectedCursoId.value || !selectedParaleloCodigo.value) return

  loading.value = true
  confirmacionExitosa.value = false
  // Reiniciar bandera de confirmado al recargar paralelo
  paraleloConfirmado.value = false
  try {
    // Consultar estado de confirmacion del paralelo (nuevo endpoint)
    try {
      const estadoResp = await api.get(`/evaluaciones/paralelo/${selectedCursoId.value}/${selectedParaleloCodigo.value}/estado`)
      const confirmado = (estadoResp && (estadoResp as any).confirmado) || (estadoResp && (estadoResp as any).confirmado === false ? false : null)
      if (typeof confirmado === 'boolean') {
        paraleloConfirmado.value = confirmado
      }
    } catch (errEstado) {
      // Silencioso: si el endpoint no existe o falla, se mantiene la lógica existente
      console.warn('No se pudo obtener estado de paralelo:', errEstado)
    }

    const [inscripcionesResponse, evaluacionesResponse] = await Promise.all([
      api.get(`/inscripciones/curso/${selectedCursoId.value}`),
      api.get(`/evaluaciones/paralelo/${selectedCursoId.value}/${selectedParaleloCodigo.value}`)
    ])

    const inscripciones = inscripcionesResponse as Array<Record<string, unknown>>
    const evaluaciones = evaluacionesResponse as Array<Record<string, unknown>>

    // Algunos endpoints pueden devolver metadatos sobre el paralelo (ej: confirmado)
    const maybeMeta = (!Array.isArray(inscripcionesResponse) && inscripcionesResponse && typeof inscripcionesResponse === 'object')
      ? inscripcionesResponse
      : ((!Array.isArray(evaluacionesResponse) && evaluacionesResponse && typeof evaluacionesResponse === 'object')
        ? evaluacionesResponse
        : null)

    if (maybeMeta) {
      const confirmadoFlag = (maybeMeta as any).confirmado ?? (maybeMeta as any).paraleloConfirmado ?? (maybeMeta as any).confirmadoParalelo
      if (typeof confirmadoFlag === 'boolean') {
        paraleloConfirmado.value = confirmadoFlag
      }
    }

    const evaluacionesMap = new Map<number, number | null>()
    evaluaciones.forEach(item => {
      const idInscripcion = Number(item.idInscripcion)
      const notaFinal = item.notaFinal !== undefined && item.notaFinal !== null
        ? Number(item.notaFinal)
        : null
      if (idInscripcion) {
        evaluacionesMap.set(idInscripcion, notaFinal ?? null)
      }
    })

    estudiantes.value = inscripciones
      .filter(item => String(item.codigoParalelo ?? '') === selectedParaleloCodigo.value)
      .filter(item => String(item.estado ?? '') === 'CONFIRMADA')
      .map(item => {
        const idInscripcion = Number(item.idInscripcion)
        const notaFinal = evaluacionesMap.has(idInscripcion)
          ? evaluacionesMap.get(idInscripcion) ?? null
          : null

        return {
          idInscripcion,
          nombre: String(item.nombreParticipante ?? ''),
          email: String(item.emailParticipante ?? '-'),
          username: String(item.usernameParticipante ?? ''),
          notaFinal,
          notaEditada: notaFinal
        }
      })
  } catch (error) {
    console.error('Error al cargar estudiantes:', error)
  } finally {
    loading.value = false
  }
}

const guardarNotas = async () => {
  if (cambiosPendientes.value.length === 0) return
  if (paraleloConfirmado.value && !esAdmin.value) {
    // Evitar guardar si el paralelo ya fue confirmado y el usuario no es admin
    console.warn('Intento de guardar notas en paralelo confirmado por usuario no administrador')
    return
  }

  saving.value = true
  try {
    const payload = cambiosPendientes.value
      .filter(est => est.notaEditada !== null)
      .map(est => ({
        idInscripcion: est.idInscripcion,
        notaFinal: est.notaEditada
      }))

    if (payload.length === 0) {
      saving.value = false
      return
    }

    await api.post('/evaluaciones/lote', payload)

    estudiantes.value = estudiantes.value.map(est => {
      if (est.notaEditada === est.notaFinal) return est
      return { ...est, notaFinal: est.notaEditada }
    })
  } catch (error) {
    console.error('Error al guardar notas:', error)
  } finally {
    saving.value = false
  }
}

const confirmarNotas = async () => {
  if (!selectedCursoId.value || !selectedParaleloCodigo.value) return

  confirmando.value = true
  try {
    await api.post(`/evaluaciones/confirmar/${selectedCursoId.value}`, {
      codigoParalelo: selectedParaleloCodigo.value,
      notas: notasConfirmacion.value || null
    })

    confirmacionExitosa.value = true
    showConfirmModal.value = false
    notasConfirmacion.value = ''
      // Marcar el paralelo como confirmado para evitar ediciones posteriores
      paraleloConfirmado.value = true
  } catch (error) {
    console.error('Error al confirmar notas:', error)
  } finally {
    confirmando.value = false
  }
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  notasConfirmacion.value = ''
}

const getEstadoVariant = (estudiante: EstudianteNota) => {
  const nota = estudiante.notaEditada ?? estudiante.notaFinal
  if (nota === null) return 'warning'
  return nota >= (cursoSeleccionado.value?.notaAprobacion ?? 51) ? 'success' : 'danger'
}

const getEstadoLabel = (estudiante: EstudianteNota) => {
  const nota = estudiante.notaEditada ?? estudiante.notaFinal
  if (nota === null) return 'Pendiente'
  return nota >= (cursoSeleccionado.value?.notaAprobacion ?? 51) ? 'Aprobado' : 'Reprobado'
}

onMounted(async () => {
  await loadCursos()

  const cursoQuery = Number(route.query.curso)
  const paraleloQuery = String(route.query.paralelo ?? '')

  if (cursoQuery) {
    selectedCursoId.value = cursoQuery
  }
  if (paraleloQuery) {
    selectedParaleloCodigo.value = paraleloQuery
  }
})

watch([selectedCursoId, selectedParaleloCodigo], () => {
  if (selectedCursoId.value && selectedParaleloCodigo.value) {
    loadEstudiantes()
  }
})
</script>
