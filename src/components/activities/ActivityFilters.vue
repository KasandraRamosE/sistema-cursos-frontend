<template>
  <!--
    Componente de Filtros para Actividades
    Permite filtrar por tipo, modalidad, carrera, búsqueda, etc.
  -->
  <Card>
    <div class="space-y-4">
      <!-- Título -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">Filtros</h3>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Limpiar filtros
        </button>
      </div>

      <!-- Búsqueda por texto -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Buscar
        </label>
        <div class="relative">
          <input
            v-model="localFilters.busqueda"
            type="text"
            placeholder="Buscar por nombre o descripción..."
            class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            @input="debouncedEmit"
            @focus="showSuggestions = true"
            @blur="showSuggestions = false"
          />
          <svg 
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <div
            v-if="showSuggestions && matchingSuggestions.length > 0"
            class="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            <button
              v-for="option in matchingSuggestions"
              :key="option"
              type="button"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
              @mousedown.prevent="selectSuggestion(option)"
            >
              {{ option }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tipo de actividad -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Tipo de actividad
        </label>
        <div class="space-y-2">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              :value="undefined"
              v-model="localFilters.tipo"
              @change="emitFilters"
              class="w-4 h-4 text-purple-600 focus:ring-purple-500"
            />
            <span class="text-sm text-gray-700">Todos</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              value="CURSO"
              v-model="localFilters.tipo"
              @change="emitFilters"
              class="w-4 h-4 text-purple-600 focus:ring-purple-500"
            />
            <span class="text-sm text-gray-700">Solo Cursos</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              value="EVENTO"
              v-model="localFilters.tipo"
              @change="emitFilters"
              class="w-4 h-4 text-purple-600 focus:ring-purple-500"
            />
            <span class="text-sm text-gray-700">Solo Eventos</span>
          </label>
        </div>
      </div>

      <!-- Modalidad -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Modalidad
        </label>
        <select
          v-model="localFilters.modalidad"
          @change="emitFilters"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option :value="undefined">Todas las modalidades</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="VIRTUAL">Virtual</option>
          <option value="MIXTO">Mixto</option>
        </select>
      </div>

      <!-- Carrera -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Carrera
        </label>
        <select
          v-model="localFilters.carrera_id"
          @change="emitFilters"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option :value="undefined">Todas las carreras</option>
          <option 
            v-for="career in careers" 
            :key="career.id_carrera" 
            :value="career.id_carrera"
            class="py-2"
          >
            {{ career.nombre }}
          </option>
        </select>
      </div>

      <!-- Opciones adicionales -->
      <div class="space-y-2 pt-2 border-t border-gray-200">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="localFilters.solo_gratuitos"
            @change="emitFilters"
            class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span class="text-sm text-gray-700">Solo gratuitos</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="localFilters.solo_disponibles"
            @change="emitFilters"
            class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span class="text-sm text-gray-700">Solo con cupos disponibles</span>
        </label>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Card from '@/components/common/Card.vue'
import type { FiltrosActividad, Carrera, TipoActividad, Modalidad } from '@/types'

// ============================================
// PROPS
// ============================================

interface Props {
  careers: Carrera[]
  activityNames?: string[]
  modelValue: FiltrosActividad
}

const props = defineProps<Props>()

// ============================================
// EMITS
// ============================================

const emit = defineEmits<{
  'update:modelValue': [filters: FiltrosActividad]
}>()

// ============================================
// ESTADO LOCAL
// ============================================

/**
 * Copia local de los filtros para v-model
 */
const localFilters = ref<FiltrosActividad>({ ...props.modelValue })
const showSuggestions = ref(false)

// Timer para debounce en búsqueda
let searchTimeout: number | null = null

// ============================================
// COMPUTED
// ============================================

/**
 * Verifica si hay filtros activos
 */
const hasActiveFilters = computed(() => {
  return (
    localFilters.value.tipo !== undefined ||
    localFilters.value.modalidad !== undefined ||
    localFilters.value.carrera_id !== undefined ||
    (localFilters.value.busqueda && localFilters.value.busqueda.length > 0) ||
    localFilters.value.solo_gratuitos === true ||
    localFilters.value.solo_disponibles === true
  )
})

const matchingSuggestions = computed(() => {
  const query = (localFilters.value.busqueda || '').trim().toLowerCase()
  if (!query || !props.activityNames || props.activityNames.length === 0) return []

  const unique = Array.from(new Set(props.activityNames))
  return unique
    .filter(name => name.toLowerCase().includes(query))
    .slice(0, 6)
})

// ============================================
// MÉTODOS
// ============================================

/**
 * Emite los filtros actualizados
 */
const emitFilters = () => {
  emit('update:modelValue', { ...localFilters.value })
}

/**
 * Emite con debounce (para búsqueda por texto)
 */
const debouncedEmit = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  showSuggestions.value = true
  searchTimeout = window.setTimeout(() => {
    emitFilters()
  }, 500) // Espera 500ms después de que el usuario deje de escribir
}

const selectSuggestion = (value: string) => {
  localFilters.value.busqueda = value
  showSuggestions.value = false
  emitFilters()
}

/**
 * Limpia todos los filtros
 */
const clearFilters = () => {
  localFilters.value = {
    tipo: undefined,
    modalidad: undefined,
    carrera_id: undefined,
    busqueda: '',
    solo_gratuitos: false,
    solo_disponibles: false
  }
  emitFilters()
}

// ============================================
// WATCHERS
// ============================================

/**
 * Sincroniza los filtros externos con los locales
 */
watch(() => props.modelValue, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
</script>

<style scoped>
/* Evitar que el contenido del select se desborde */
select {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Opciones del select */
option {
  padding: 8px;
  white-space: normal;
  word-wrap: break-word;
}
</style>