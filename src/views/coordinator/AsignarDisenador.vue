<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Asignacion de diseñadores</h1>
        <p class="text-sm text-slate-500">Asigna un diseñador para certificados por actividad.</p>
      </div>
      <Button variant="outline" size="sm" @click="loadAll">Actualizar</Button>
    </div>

    <Card>
      <div class="grid gap-4 md:grid-cols-4">
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model.number="selectedCarreraId"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todas mis carreras</option>
            <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</label>
          <select
            v-model="tipoFiltro"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="CURSO">Curso</option>
            <option value="EVENTO">Evento</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
          <select
            v-model="estadoFiltro"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="ABIERTO">Abierto</option>
            <option value="LLENO">Lleno</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Nombre de curso o evento"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Actividades</h3>
          <p class="text-sm text-slate-500">Listado unificado de cursos y eventos para asignar diseñador.</p>
        </div>
        <Badge v-if="actividadesFiltradas.length > 0" variant="primary" size="sm">
          {{ actividadesFiltradas.length }} actividades
        </Badge>
      </div>

      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
        Cargando actividades...
      </div>
      <div v-else-if="actividadesFiltradas.length === 0" class="py-8 text-center text-sm text-slate-500">
        No hay actividades para mostrar.
      </div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Actividad</th>
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3">Diseñador</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="actividad in actividadesFiltradas" :key="actividad.key">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-900">{{ actividad.nombre }}</p>
                <p class="text-xs text-slate-500">{{ actividad.carreraNombre || 'Sin carrera' }}</p>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ actividad.tipo }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="estadoActividadBadge(actividad.estadoActividad)" size="sm">
                  {{ actividad.estadoActividad }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-slate-600">
                {{ actividad.nombreDisenador || 'Sin asignar' }}
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  @click="openDesignerModal(actividad.tipo, actividad.id, actividad.idCarrera, actividad.nombre, actividad.idDisenador, actividad.nombreDisenador)"
                >
                  {{ actividad.idDisenador ? 'Reasignar' : 'Asignar' }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Modal
      :modelValue="showDesignerModal"
      title="Asignar diseñador"
      size="lg"
      @close="closeDesignerModal"
    >
      <div v-if="assigningActivity" class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-slate-500">Actividad</p>
          <p class="text-sm font-semibold text-slate-900">{{ assigningActivity.nombre }}</p>
          <p class="text-xs text-slate-500">{{ assigningActivity.tipo }}</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Buscar diseñador</label>
          <input
            v-model="designerSearch"
            type="text"
            placeholder="Buscar por nombre o username"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
          <div class="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            <button
              v-for="persona in designersFiltrados"
              :key="persona.idUsuario"
              type="button"
              class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition"
              :class="selectedDesigner?.idUsuario === persona.idUsuario
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-transparent hover:bg-slate-50'"
              @click="selectDesigner(persona)"
            >
              <span>
                <span class="font-medium text-slate-900">{{ persona.nombres }} {{ persona.apellidos }}</span>
                <span class="ml-2 text-xs text-slate-500">{{ persona.username }}</span>
              </span>
              <span class="text-xs text-slate-500">
                {{ isDesigner(persona.roles) ? 'Diseñador' : 'Participante' }}
              </span>
            </button>
            <p v-if="designerSearch.trim() === ''" class="text-center text-xs text-slate-500">
              Escribe para buscar.
            </p>
            <p v-else-if="designersFiltrados.length === 0" class="text-center text-xs text-slate-500">
              No hay coincidencias.
            </p>
          </div>
          <p v-if="loadingDesigners || loadingParticipantes" class="mt-1 text-xs text-slate-500">
            Cargando personas...
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Si seleccionas a un participante, se le asignara el rol DISEÑADOR.
          </p>
          <p v-if="assigningActivity.nombreDisenador" class="mt-1 text-xs text-slate-500">
            Actual: {{ assigningActivity.nombreDisenador }}
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeDesignerModal">Cancelar</Button>
          <Button :loading="savingDesigner" @click="assignDesigner">Guardar</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import Modal from '@/components/common/Modal.vue'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'
import { useAuthStore } from '@/stores/auth.store'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombre: string
  estado?: string
  nombreCarrera?: string
  idDisenador?: number | null
  nombreDisenador?: string | null
  duracion?: number | null
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombre: string
  estado?: string
  nombreCarrera?: string
  idDisenador?: number | null
  nombreDisenador?: string | null
}

interface ActividadRow {
  key: string
  tipo: 'CURSO' | 'EVENTO'
  id: number
  idCarrera: number
  nombre: string
  carreraNombre?: string
  estadoActividad: string
  idDisenador?: number | null
  nombreDisenador?: string | null
}

interface PersonaDto {
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: string[]
}

interface AssigningActivity {
  tipo: 'CURSO' | 'EVENTO'
  id: number
  idCarrera: number
  nombre: string
  idDisenador: number | null
  nombreDisenador: string | null
}

const alertStore = useAlertStore()
const authStore = useAuthStore()

const carreras = ref<CarreraDto[]>([])
const selectedCarreraId = ref<number | ''>('')
const tipoFiltro = ref('')
const estadoFiltro = ref('')

const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])
const designers = ref<PersonaDto[]>([])
const participantes = ref<PersonaDto[]>([])

const loadingCursos = ref(false)
const loadingEventos = ref(false)
const loadingDesigners = ref(false)
const loadingParticipantes = ref(false)
const savingDesigner = ref(false)

const searchTerm = ref('')
const designerSearch = ref('')

const showDesignerModal = ref(false)
const assigningActivity = ref<AssigningActivity | null>(null)
const selectedDesigner = ref<PersonaDto | null>(null)

const actividades = computed((): ActividadRow[] => {
  const cursosRows = cursos.value.map((curso) => ({
    key: `CURSO-${curso.idCurso}`,
    tipo: 'CURSO' as const,
    id: curso.idCurso,
    idCarrera: curso.idCarrera,
    nombre: curso.nombre,
    carreraNombre: curso.nombreCarrera,
    estadoActividad: curso.estado || '-',
    idDisenador: curso.idDisenador ?? null,
    nombreDisenador: curso.nombreDisenador ?? null
  }))

  const eventosRows = eventos.value.map((evento) => ({
    key: `EVENTO-${evento.idEvento}`,
    tipo: 'EVENTO' as const,
    id: evento.idEvento,
    idCarrera: evento.idCarrera,
    nombre: evento.nombre,
    carreraNombre: evento.nombreCarrera,
    estadoActividad: evento.estado || '-',
    idDisenador: evento.idDisenador ?? null,
    nombreDisenador: evento.nombreDisenador ?? null
  }))

  return [...cursosRows, ...eventosRows]
})

const actividadesFiltradas = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  const carrerasPermitidas = new Set(carreras.value.map(carrera => carrera.idCarrera))

  return actividades.value.filter((actividad) => {
    const carreraPermitida = carrerasPermitidas.size === 0 ? false : carrerasPermitidas.has(actividad.idCarrera)
    const carreraOk = !selectedCarreraId.value || actividad.idCarrera === selectedCarreraId.value
    const tipoOk = !tipoFiltro.value || actividad.tipo === tipoFiltro.value
    const estadoOk = !estadoFiltro.value || actividad.estadoActividad === estadoFiltro.value
    const searchOk = !term || actividad.nombre.toLowerCase().includes(term)
    return carreraPermitida && carreraOk && tipoOk && estadoOk && searchOk
  })
})

const designersFiltrados = computed(() => {
  const term = designerSearch.value.trim().toLowerCase()
  if (!term) return []

  const merged = new Map<number, PersonaDto>()
  designers.value.forEach(disenador => merged.set(disenador.idUsuario, disenador))
  participantes.value.forEach(participante => {
    if (!merged.has(participante.idUsuario)) {
      merged.set(participante.idUsuario, participante)
    }
  })

  return Array.from(merged.values()).filter(persona => {
    const fullName = `${persona.nombres} ${persona.apellidos}`.toLowerCase()
    return fullName.includes(term) || persona.username.toLowerCase().includes(term)
  })
})

const loadCarreras = async () => {
  const endpoint = authStore.hasRole('ADMINISTRADOR')
    ? '/carreras/todas'
    : '/coordinador/carreras'

  const response = await api.get(endpoint) as CarreraDto[]
  carreras.value = response
}

const loadCursos = async () => {
  loadingCursos.value = true
  try {
    const response = await api.get('/cursos/todos') as CursoDto[]
    cursos.value = response
  } finally {
    loadingCursos.value = false
  }
}

const loadEventos = async () => {
  loadingEventos.value = true
  try {
    const response = await api.get('/eventos/todos') as EventoDto[]
    eventos.value = response
  } finally {
    loadingEventos.value = false
  }
}

const loadDesigners = async () => {
  loadingDesigners.value = true
  try {
    const response = await api.get('/usuarios/disenadores') as PersonaDto[]
    designers.value = response
  } finally {
    loadingDesigners.value = false
  }
}

const loadParticipantes = async () => {
  loadingParticipantes.value = true
  try {
    const response = await api.get('/usuarios/participantes') as PersonaDto[]
    participantes.value = response
  } finally {
    loadingParticipantes.value = false
  }
}

const loadAll = async () => {
  await Promise.all([
    loadCarreras(),
    loadCursos(),
    loadEventos(),
    loadDesigners(),
    loadParticipantes()
  ])
}

const loading = computed(() => {
  return loadingCursos.value || loadingEventos.value
})

const openDesignerModal = (
  tipo: AssigningActivity['tipo'],
  id: number,
  idCarrera: number,
  nombre: string,
  idDisenador?: number | null,
  nombreDisenador?: string | null
) => {
  assigningActivity.value = {
    tipo,
    id,
    idCarrera,
    nombre,
    idDisenador: idDisenador ?? null,
    nombreDisenador: nombreDisenador ?? null
  }
  designerSearch.value = ''
  selectedDesigner.value = null
  showDesignerModal.value = true
}

const closeDesignerModal = () => {
  showDesignerModal.value = false
  assigningActivity.value = null
  selectedDesigner.value = null
  designerSearch.value = ''
}

const selectDesigner = (persona: PersonaDto) => {
  selectedDesigner.value = persona
}

const assignDesigner = async () => {
  if (!assigningActivity.value || !selectedDesigner.value) return

  const carrerasPermitidas = new Set(carreras.value.map(carrera => carrera.idCarrera))
  if (!carrerasPermitidas.has(assigningActivity.value.idCarrera)) {
    alertStore.push({
      type: 'error',
      message: 'No puedes asignar diseñadores a actividades fuera de tus carreras.'
    })
    return
  }

  savingDesigner.value = true
  try {
    const selectedId = Number(selectedDesigner.value.idUsuario)

    if (!isDesigner(selectedDesigner.value.roles)) {
      await api.post(`/usuarios/${selectedId}/roles`, {
        nombreRol: 'DISENADOR'
      })
      await Promise.all([loadDesigners(), loadParticipantes()])
    }

    if (assigningActivity.value.tipo === 'CURSO') {
      const response = await api.patch(`/cursos/${assigningActivity.value.id}/disenador`, {
        idDisenador: selectedId
      }) as CursoDto

      cursos.value = cursos.value.map(item =>
        item.idCurso === response.idCurso ? response : item)
    } else {
      const response = await api.patch(`/eventos/${assigningActivity.value.id}/disenador`, {
        idDisenador: selectedId
      }) as EventoDto

      eventos.value = eventos.value.map(item =>
        item.idEvento === response.idEvento ? response : item)
    }

    alertStore.push({
      type: 'success',
      message: 'Diseñador asignado correctamente.'
    })
    closeDesignerModal()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo asignar el diseñador.'
    })
  } finally {
    savingDesigner.value = false
  }
}

const isDesigner = (roles: string[]) => {
  return roles.some(role => role === 'DISENADOR' || role === 'DISEÑADOR')
}

const estadoActividadBadge = (estado: string) => {
  switch (estado) {
    case 'ABIERTO':
      return 'success'
    case 'LLENO':
      return 'warning'
    case 'FINALIZADO':
      return 'gray'
    default:
      return 'gray'
  }
}

onMounted(() => {
  loadAll()
})
</script>
