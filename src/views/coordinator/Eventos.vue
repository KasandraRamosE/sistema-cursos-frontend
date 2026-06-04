<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Eventos</h1>
        <p class="text-sm text-slate-500">Gestiona eventos y asigna auxiliares.</p>
      </div>
      <Button variant="outline" @click="openCreateEvento">Nuevo evento</Button>
    </div>

    <Card>
      <div class="mb-4 grid gap-3 md:grid-cols-3">
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Nombre del evento..."
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
          <select
            v-model="estadoFiltro"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="ABIERTO">Abierto</option>
            <option value="LLENO">Lleno</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div v-if="carreras.length > 1">
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model.number="selectedCarreraId"
            class="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="py-10 text-center text-sm text-slate-500">
        Cargando eventos...
      </div>
      <div v-else-if="eventosFiltrados.length === 0" class="py-10 text-center text-sm text-slate-500">
        No hay eventos para esta carrera.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Evento</th>
              <th class="px-4 py-3">Carrera</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="evento in eventosFiltrados" :key="evento.idEvento">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-900">{{ evento.nombre }}</p>
                <p class="text-xs text-slate-500">{{ evento.cargaHoraria }} horas · {{ evento.modalidad }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ evento.nombreCarrera }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatFecha(evento.fechaHora) }}</td>
              <td class="px-4 py-3">
                <Badge :variant="getEstadoMostrado(evento) === 'ABIERTO' ? 'success' : 'gray'" size="sm">
                  {{ getEstadoMostrado(evento) }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" @click="openAuxiliares(evento)">Auxiliares</Button>
                  <Button variant="ghost" size="sm" @click="openEditEvento(evento)">Editar</Button>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:text-rose-700" @click="confirmDeleteEvento(evento)">
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Modal
      :modelValue="showEventoModal"
      :title="editingEvento ? 'Editar evento' : 'Nuevo evento'"
      size="lg"
      @close="closeEventoModal"
    >
      <form class="space-y-4" @submit.prevent="saveEvento">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input
            v-model="formEvento.nombre"
            type="text"
            required
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
          <textarea
            v-model="formEvento.descripcion"
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          ></textarea>
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Imagen</label>
          <input
            ref="eventoImageInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleEventoImageChange"
          />
          <button
            type="button"
            class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="triggerEventoImagePicker"
          >
            Seleccionar imagen
          </button>
          <p class="mt-2 text-xs text-slate-500">Formatos: JPG, PNG o WebP. Maximo 5MB.</p>
          <div v-if="eventoImagePreview" class="mt-3">
            <img
              :src="eventoImagePreview"
              alt="Vista previa"
              class="h-32 w-full rounded-lg object-cover"
            />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Carrera</label>
            <select
              v-model.number="formEvento.idCarrera"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            >
              <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Fecha y hora</label>
            <input
              v-model="formEvento.fechaHora"
              type="datetime-local"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Lugar</label>
          <input
            v-model="formEvento.lugar"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Carga horaria</label>
            <input
              v-model.number="formEvento.cargaHoraria"
              type="number"
              min="1"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Modalidad</label>
            <select
              v-model="formEvento.modalidad"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            >
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Cupo maximo</label>
            <input
              v-model.number="formEvento.cupoMaximo"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Costo externo</label>
            <input
              v-model.number="formEvento.costoExterno"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Costo UMSA</label>
            <input
              v-model.number="formEvento.costoUmsa"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Link</label>
          <input
            v-model="formEvento.link"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Estado</label>
          <select
            v-model="formEvento.estado"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="ABIERTO">Abierto</option>
            <option value="LLENO">Lleno</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" type="button" @click="closeEventoModal">Cancelar</Button>
          <Button type="submit" :loading="saving">Guardar</Button>
        </div>
      </form>
    </Modal>

    <Modal
      :modelValue="showAuxiliaresModal"
      title="Asignar auxiliares"
      size="lg"
      @close="closeAuxiliaresModal"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Auxiliares asignados</label>
          <div class="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            <p v-if="loadingAuxiliaresAsignados" class="text-center text-xs text-slate-500">
              Cargando auxiliares asignados...
            </p>
            <p v-else-if="auxiliaresAsignados.length === 0" class="text-center text-xs text-slate-500">
              No hay auxiliares asignados.
            </p>
            <div
              v-else
              v-for="auxiliar in auxiliaresAsignados"
              :key="auxiliar.idUsuario"
              class="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <div>
                <span class="font-medium text-slate-900">
                  {{ auxiliar.nombres }} {{ auxiliar.apellidos }}
                </span>
                <span class="ml-2 text-xs text-slate-500">{{ auxiliar.username }}</span>
              </div>
              <button
                type="button"
                class="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                @click="removeAuxiliar(auxiliar)"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Buscar auxiliares</label>
          <input
            v-model="auxiliarSearch"
            type="text"
            placeholder="Buscar por nombre o username"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
          <div class="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            <button
              v-for="persona in auxiliaresFiltrados"
              :key="persona.idUsuario"
              type="button"
              class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition"
              :class="selectedAuxiliarIds.includes(persona.idUsuario)
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-transparent hover:bg-slate-50'"
              @click="selectAuxiliar(persona)"
            >
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  :checked="selectedAuxiliarIds.includes(persona.idUsuario)"
                  @change="toggleAuxiliarSelection(persona)"
                  @click.stop
                />
                <span>
                <span class="font-medium text-slate-900">{{ persona.nombres }} {{ persona.apellidos }}</span>
                <span class="ml-2 text-xs text-slate-500">{{ persona.username }}</span>
                </span>
              </div>
              <span class="text-xs text-slate-500">
                {{ persona.roles.includes('AUXILIAR') ? 'Auxiliar' : 'Participante' }}
              </span>
            </button>
            <p v-if="auxiliarSearch.trim() === ''" class="text-center text-xs text-slate-500">
              Escribe para buscar.
            </p>
            <p v-else-if="auxiliaresFiltrados.length === 0" class="text-center text-xs text-slate-500">
              No hay coincidencias.
            </p>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Si seleccionas a un participante, se le asignara el rol AUXILIAR.
          </p>
          <p v-if="selectedAuxiliarIds.length > 0" class="mt-1 text-xs font-medium text-emerald-700">
            {{ selectedAuxiliarIds.length }} auxiliar(es) seleccionados.
          </p>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeAuxiliaresModal">Cancelar</Button>
          <Button variant="outline" :loading="savingAuxiliar" @click="clearAuxiliarSelection">Limpiar</Button>
          <Button :loading="savingAuxiliar" @click="assignAuxiliar">Asignar seleccionados</Button>
        </div>
      </div>
    </Modal>

    <Modal
      :modelValue="showDeleteModal"
      title="Eliminar evento"
      size="md"
      @close="closeDeleteModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Esta accion eliminara el evento y sus inscripciones. Esta seguro de continuar?
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeDeleteModal">Cancelar</Button>
          <Button variant="danger" :loading="deleting" @click="deleteEvento">Eliminar</Button>
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
import { formatDateTime, parseLocalDate } from '@/utils/dateFormatter'
import { useAlertStore } from '@/stores/alert.store'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombreCarrera: string
  nombre: string
  descripcion: string
  imagen?: string | null
  lugar?: string | null
  cargaHoraria: number
  modalidad: string
  fechaHora: string
  cupoMaximo: number | null
  costoExterno: number
  costoUmsa: number
  estado: string
  link: string
}

interface AuxiliarDto {
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: string[]
}

interface ParticipanteDto {
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: string[]
}

const alertStore = useAlertStore()
const carreras = ref<CarreraDto[]>([])
const selectedCarreraId = ref<number | null>(null)
const eventos = ref<EventoDto[]>([])
const auxiliares = ref<AuxiliarDto[]>([])
const auxiliaresAsignados = ref<AuxiliarDto[]>([])
const participantes = ref<ParticipanteDto[]>([])
const loading = ref(false)
const saving = ref(false)
const searchTerm = ref('')
const estadoFiltro = ref('')

const showEventoModal = ref(false)
const editingEvento = ref<EventoDto | null>(null)
const editingEstado = ref('')
const eventoImageInputRef = ref<HTMLInputElement | null>(null)
const eventoImageFile = ref<File | null>(null)
const eventoImagePreview = ref('')
const formEvento = ref({
  idCarrera: 0,
  nombre: '',
  descripcion: '',
  imagen: '',
  lugar: '',
  cargaHoraria: 1,
  modalidad: 'PRESENCIAL',
  fechaHora: '',
  cupoMaximo: null as number | null,
  costoExterno: 0,
  costoUmsa: 0,
  link: '',
  estado: 'ABIERTO'
})

const showAuxiliaresModal = ref(false)
const selectedEvento = ref<EventoDto | null>(null)
const auxiliarSearch = ref('')
const selectedAuxiliarIds = ref<number[]>([])
const savingAuxiliar = ref(false)
const loadingAuxiliaresAsignados = ref(false)
const loadingAuxiliaresData = ref(false)
const auxiliaresDataReady = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const eventoToDelete = ref<EventoDto | null>(null)

const getEstadoMostrado = (evento: EventoDto) => {
  if (evento.fechaHora && parseLocalDate(evento.fechaHora).getTime() < Date.now()) {
    return 'FINALIZADO'
  }
  return evento.estado
}

const eventosFiltrados = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return eventos.value.filter(evento => {
    if (selectedCarreraId.value && evento.idCarrera !== selectedCarreraId.value) return false
    if (estadoFiltro.value && getEstadoMostrado(evento) !== estadoFiltro.value) return false
    if (term && !evento.nombre.toLowerCase().includes(term)) return false
    return true
  })
})

const auxiliaresFiltrados = computed(() => {
  const term = auxiliarSearch.value.trim().toLowerCase()
  if (!term) return []

  const assignedIds = new Set(auxiliaresAsignados.value.map(auxiliar => auxiliar.idUsuario))

  const merged = new Map<number, ParticipanteDto>()
  auxiliares.value.forEach(auxiliar => merged.set(auxiliar.idUsuario, auxiliar))
  participantes.value.forEach(participante => {
    if (!merged.has(participante.idUsuario)) {
      merged.set(participante.idUsuario, participante)
    }
  })

  return Array.from(merged.values()).filter(persona => {
    if (assignedIds.has(persona.idUsuario)) return false
    const fullName = `${persona.nombres} ${persona.apellidos}`.toLowerCase()
    return fullName.includes(term) || persona.username.toLowerCase().includes(term)
  })
})

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as CarreraDto[]
  carreras.value = response
  selectedCarreraId.value = response[0]?.idCarrera ?? null
}

const loadEventos = async () => {
  loading.value = true
  try {
    const response = await api.get('/eventos/todos') as EventoDto[]
    eventos.value = response
  } finally {
    loading.value = false
  }
}

const loadAuxiliares = async () => {
  const response = await api.get('/usuarios/auxiliares') as AuxiliarDto[]
  auxiliares.value = response
}

const normalizeAuxiliares = (response: unknown): AuxiliarDto[] => {
  let items: Array<Record<string, unknown> | string> = []

  if (Array.isArray(response)) {
    items = response as Array<Record<string, unknown> | string>
  } else if (response && typeof response === 'object') {
    const container = response as Record<string, unknown>
    const list = container.auxiliares ?? container.data ?? container.items ?? container.result
    if (Array.isArray(list)) {
      items = list as Array<Record<string, unknown> | string>
    }
  }

  return items.map((item, index) => {
    if (typeof item === 'string') {
      return {
        idUsuario: -(index + 1),
        username: '',
        nombres: item,
        apellidos: '',
        roles: ['AUXILIAR']
      }
    }

    const usuario = item.usuario && typeof item.usuario === 'object'
      ? item.usuario as Record<string, unknown>
      : null
    const idUsuario = Number(
      item.idUsuario ?? item.idUsuarioAuxiliar ?? item.idAuxiliar ?? item.id_usuario ?? item.id ?? usuario?.idUsuario ?? usuario?.id_usuario ?? 0
    )
    if (!idUsuario) return null

    return {
      idUsuario,
      username: String(item.username ?? item.usernameAuxiliar ?? usuario?.username ?? ''),
      nombres: String(item.nombres ?? item.nombre ?? usuario?.nombres ?? ''),
      apellidos: String(item.apellidos ?? item.apellido ?? usuario?.apellidos ?? ''),
      roles: Array.isArray(item.roles) ? item.roles.map(role => String(role)) : ['AUXILIAR']
    }
  }).filter((item): item is AuxiliarDto => Boolean(item))
}

const loadAuxiliaresAsignados = async () => {
  if (!selectedEvento.value) return

  loadingAuxiliaresAsignados.value = true
  try {
    const response = await api.get(`/eventos/${selectedEvento.value.idEvento}/auxiliares`)
    auxiliaresAsignados.value = normalizeAuxiliares(response)
  } catch (error) {
    console.error('Error al cargar auxiliares asignados:', error)
    auxiliaresAsignados.value = []
  } finally {
    loadingAuxiliaresAsignados.value = false
  }
}

const loadParticipantes = async () => {
  const response = await api.get('/usuarios/participantes') as ParticipanteDto[]
  participantes.value = response
}

const ensureAuxiliaresData = async () => {
  if (auxiliaresDataReady.value || loadingAuxiliaresData.value) return

  loadingAuxiliaresData.value = true
  try {
    await Promise.all([loadAuxiliares(), loadParticipantes()])
    auxiliaresDataReady.value = true
  } finally {
    loadingAuxiliaresData.value = false
  }
}

const loadAll = async () => {
  await Promise.all([loadCarreras(), loadEventos()])
}

const openCreateEvento = () => {
  editingEvento.value = null
  editingEstado.value = ''
  formEvento.value = {
    idCarrera: selectedCarreraId.value || carreras.value[0]?.idCarrera || 0,
    nombre: '',
    descripcion: '',
    imagen: '',
    lugar: '',
    cargaHoraria: 1,
    modalidad: 'PRESENCIAL',
    fechaHora: '',
    cupoMaximo: null,
    costoExterno: 0,
    costoUmsa: 0,
    link: '',
    estado: 'ABIERTO'
  }
  clearEventoImagePreview()
  eventoImageFile.value = null
  showEventoModal.value = true
}

const openEditEvento = (evento: EventoDto) => {
  editingEvento.value = evento
  editingEstado.value = evento.estado
  formEvento.value = {
    idCarrera: evento.idCarrera,
    nombre: evento.nombre,
    descripcion: evento.descripcion || '',
    imagen: evento.imagen || '',
    lugar: evento.lugar || '',
    cargaHoraria: evento.cargaHoraria,
    modalidad: evento.modalidad,
    fechaHora: evento.fechaHora ? evento.fechaHora.slice(0, 16) : '',
    cupoMaximo: evento.cupoMaximo ?? null,
    costoExterno: Number(evento.costoExterno || 0),
    costoUmsa: Number(evento.costoUmsa || 0),
    link: evento.link || '',
    estado: evento.estado
  }
  eventoImageFile.value = null
  if (evento.imagen) {
    eventoImagePreview.value = evento.imagen
  } else {
    clearEventoImagePreview()
  }
  showEventoModal.value = true
}

const closeEventoModal = () => {
  showEventoModal.value = false
  editingEvento.value = null
  editingEstado.value = ''
  clearEventoImagePreview()
  eventoImageFile.value = null
}

const saveEvento = async () => {
  saving.value = true
  try {
    if (!formEvento.value.imagen && !eventoImageFile.value) {
      alertStore.push({ type: 'warning', message: 'Debes subir una imagen para el evento.' })
      saving.value = false
      return
    }

    const imagenUrl = await uploadEventoImagen()
    formEvento.value.imagen = imagenUrl

    const payload = {
      idCarrera: formEvento.value.idCarrera,
      nombre: formEvento.value.nombre,
      descripcion: formEvento.value.descripcion,
      imagen: imagenUrl,
      lugar: formEvento.value.lugar || null,
      cargaHoraria: formEvento.value.cargaHoraria,
      modalidad: formEvento.value.modalidad,
      fechaHora: formEvento.value.fechaHora,
      cupoMaximo: formEvento.value.cupoMaximo,
      costoExterno: formEvento.value.costoExterno,
      costoUmsa: formEvento.value.costoUmsa,
      link: formEvento.value.link
    }

    if (editingEvento.value) {
      await api.put(`/eventos/${editingEvento.value.idEvento}`, payload)
      if (formEvento.value.estado !== editingEstado.value) {
        await api.patch(`/eventos/${editingEvento.value.idEvento}/estado?estado=${encodeURIComponent(formEvento.value.estado)}`)
      }
      alertStore.push({ type: 'success', message: 'Evento actualizado.' })
    } else {
      await api.post('/eventos', payload)
      alertStore.push({ type: 'success', message: 'Evento creado.' })
    }

    closeEventoModal()
    await loadEventos()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo guardar el evento.' })
  } finally {
    saving.value = false
  }
}

const clearEventoImagePreview = () => {
  if (eventoImagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(eventoImagePreview.value)
  }
  eventoImagePreview.value = ''
}

const handleEventoImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files && input.files.length > 0 ? input.files[0] : null
  if (!file) {
    eventoImageFile.value = null
    clearEventoImagePreview()
    return
  }

  eventoImageFile.value = file
  clearEventoImagePreview()
  eventoImagePreview.value = URL.createObjectURL(file)
}

const triggerEventoImagePicker = () => {
  eventoImageInputRef.value?.click()
}

const uploadEventoImagen = async () => {
  if (!eventoImageFile.value) return formEvento.value.imagen || ''

  const formData = new FormData()
  formData.append('archivo', eventoImageFile.value)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const token = localStorage.getItem('token')

  const response = await fetch(`${baseUrl}/archivos/imagenes`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = data?.message || response.statusText || 'No se pudo subir la imagen.'
    throw new Error(message)
  }

  const data = await response.json().catch(() => null)
  return String(data?.url ?? '')
}

const openAuxiliares = async (evento: EventoDto) => {
  try {
    await ensureAuxiliaresData()

    selectedEvento.value = evento
    auxiliarSearch.value = ''
    selectedAuxiliarIds.value = []
    await loadAuxiliaresAsignados()
    showAuxiliaresModal.value = true
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo cargar la lista de auxiliares.'
    })
  }
}

const confirmDeleteEvento = (evento: EventoDto) => {
  eventoToDelete.value = evento
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  eventoToDelete.value = null
}

const closeAuxiliaresModal = () => {
  showAuxiliaresModal.value = false
  selectedEvento.value = null
  selectedAuxiliarIds.value = []
  auxiliarSearch.value = ''
  auxiliaresAsignados.value = []
}

const selectAuxiliar = (persona: ParticipanteDto) => {
  toggleAuxiliarSelection(persona)
}

const toggleAuxiliarSelection = (persona: ParticipanteDto) => {
  if (selectedAuxiliarIds.value.includes(persona.idUsuario)) {
    selectedAuxiliarIds.value = selectedAuxiliarIds.value.filter(id => id !== persona.idUsuario)
  } else {
    selectedAuxiliarIds.value = [...selectedAuxiliarIds.value, persona.idUsuario]
  }
}

const clearAuxiliarSelection = () => {
  selectedAuxiliarIds.value = []
}

const removeAuxiliar = async (auxiliar: AuxiliarDto) => {
  if (!selectedEvento.value) return

  savingAuxiliar.value = true
  try {
    await api.delete(`/eventos/${selectedEvento.value.idEvento}/auxiliares/${auxiliar.idUsuario}`)
    alertStore.push({ type: 'success', message: 'Auxiliar removido del evento.' })
    // remove from local list immediately
    auxiliaresAsignados.value = auxiliaresAsignados.value.filter(a => a.idUsuario !== auxiliar.idUsuario)
    await loadAuxiliaresAsignados()
  } catch (error) {
    const err = error as any
    if (err?.status === 404) {
      // already removed; sync list
      auxiliaresAsignados.value = auxiliaresAsignados.value.filter(a => a.idUsuario !== auxiliar.idUsuario)
      alertStore.push({ type: 'warning', message: 'El auxiliar ya no estaba asignado.' })
      await loadAuxiliaresAsignados()
    } else {
      alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo quitar el auxiliar.' })
    }
  } finally {
    savingAuxiliar.value = false
  }
}

const assignAuxiliar = async () => {
  if (!selectedEvento.value || selectedAuxiliarIds.value.length === 0) return

  savingAuxiliar.value = true
  try {
    const eventoId = selectedEvento.value.idEvento
    const selectedPersonas = [...selectedAuxiliarIds.value]
    const personasParaAsignar: AuxiliarDto[] = selectedPersonas
      .map((idAuxiliar) => {
        const auxiliarExistente = auxiliares.value.find((auxiliar) => auxiliar.idUsuario === idAuxiliar)
        if (auxiliarExistente) return auxiliarExistente

        const participante = participantes.value.find((persona) => persona.idUsuario === idAuxiliar)
        if (!participante) return null

        return {
          idUsuario: participante.idUsuario,
          username: participante.username,
          nombres: participante.nombres,
          apellidos: participante.apellidos,
          roles: participante.roles.includes('AUXILIAR') ? participante.roles : [...participante.roles, 'AUXILIAR']
        }
      })
      .filter((persona): persona is AuxiliarDto => persona !== null)

    const participantesNuevos = participantes.value.filter(
      (persona) => selectedPersonas.includes(persona.idUsuario) && !persona.roles.includes('AUXILIAR')
    )

    if (participantesNuevos.length > 0) {
      await Promise.all(participantesNuevos.map((persona) =>
        api.post(`/usuarios/${persona.idUsuario}/roles`, {
          nombreRol: 'AUXILIAR'
        })
      ))
      await Promise.all([loadAuxiliares(), loadParticipantes()])
    }

    // Filter out ids that are already assigned locally to avoid sending duplicates
    const toAssign = selectedPersonas.filter(id =>
      !auxiliaresAsignados.value.some(a => a.idUsuario === id)
    )

    // Send requests per-id and collect results so we can show which failed
    const results = await Promise.all(toAssign.map(async (idAuxiliar) => {
      try {
        await api.post(`/eventos/${eventoId}/auxiliares`, { idAuxiliar })
        return { id: idAuxiliar, ok: true }
      } catch (err) {
        return { id: idAuxiliar, ok: false, status: (err as any).status, message: (err as Error).message }
      }
    }))

    const succeededIds = results.filter(r => r.ok).map(r => r.id)
    const failed = results.filter(r => !r.ok)

    // Optimistic update: add successfully assigned personas to the local list
    const currentAssigned = new Map<number, AuxiliarDto>()
    auxiliaresAsignados.value.forEach((auxiliar) => {
      currentAssigned.set(auxiliar.idUsuario, auxiliar)
    })
    personasParaAsignar.forEach((persona) => {
      if (succeededIds.includes(persona.idUsuario)) {
        currentAssigned.set(persona.idUsuario, persona)
      }
    })
    auxiliaresAsignados.value = Array.from(currentAssigned.values())

    // Feedback: show success or partial failure
    if (failed.length === 0) {
      alertStore.push({ type: 'success', message: 'Auxiliar(es) asignado(s).' })
    } else if (succeededIds.length > 0) {
      alertStore.push({ type: 'warning', message: `${succeededIds.length} asignados, ${failed.length} fallaron.` })
    } else {
      alertStore.push({ type: 'error', message: 'No se pudo asignar ninguno de los auxiliares seleccionados.' })
    }

    // Clear selections and refresh assigned list to be safe
    selectedAuxiliarIds.value = []
    auxiliarSearch.value = ''
    await loadAuxiliaresAsignados()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo asignar el auxiliar.' })
  } finally {
    savingAuxiliar.value = false
  }
}

const deleteEvento = async () => {
  if (!eventoToDelete.value) return

  deleting.value = true
  try {
    await api.delete(`/eventos/${eventoToDelete.value.idEvento}`)
    alertStore.push({ type: 'success', message: 'Evento eliminado.' })
    closeDeleteModal()
    await loadEventos()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo eliminar el evento.' })
  } finally {
    deleting.value = false
  }
}

const formatFecha = (value: string) => {
  if (!value) return '-'
  return formatDateTime(value)
}

onMounted(async () => {
  try {
    await loadAll()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo cargar la pantalla de eventos.'
    })
  }
})
</script>
