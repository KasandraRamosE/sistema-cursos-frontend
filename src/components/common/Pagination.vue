<template>
  <!--
    Componente de Paginación Reutilizable
    Maneja la navegación entre páginas de datos
  -->
  <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
    <!-- Información de resultados (móvil) -->
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        @click="goToPreviousPage"
        :disabled="currentPage === 1"
        :class="[
          'relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium',
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-50'
        ]"
      >
        Anterior
      </button>
      <button
        @click="goToNextPage"
        :disabled="currentPage === totalPages"
        :class="[
          'relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium',
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-50'
        ]"
      >
        Siguiente
      </button>
    </div>

    <!-- Información de resultados y navegación (desktop) -->
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <!-- Info de resultados -->
      <div>
        <p class="text-sm text-gray-700">
          Mostrando
          <span class="font-medium">{{ startItem }}</span>
          a
          <span class="font-medium">{{ endItem }}</span>
          de
          <span class="font-medium">{{ totalItems }}</span>
          resultados
        </p>
      </div>

      <!-- Navegación de páginas -->
      <div>
        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <!-- Botón Anterior -->
          <button
            @click="goToPreviousPage"
            :disabled="currentPage === 1"
            :class="[
              'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
              currentPage === 1 ? 'cursor-not-allowed' : 'hover:text-gray-500'
            ]"
          >
            <span class="sr-only">Anterior</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Números de página -->
          <template v-for="page in visiblePages" :key="page">
            <!-- Elipsis -->
            <span
              v-if="page === '...'"
              class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
            >
              ...
            </span>

            <!-- Número de página -->
            <button
              v-else
              @click="goToPage(page as number)"
              :class="[
                'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0',
                currentPage === page
                  ? 'z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600'
                  : 'text-gray-900 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
          </template>

          <!-- Botón Siguiente -->
          <button
            @click="goToNextPage"
            :disabled="currentPage === totalPages"
            :class="[
              'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
              currentPage === totalPages ? 'cursor-not-allowed' : 'hover:text-gray-500'
            ]"
          >
            <span class="sr-only">Siguiente</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>

    <!-- Selector de items por página (opcional) -->
    <div v-if="showPageSizeSelector" class="ml-4">
      <select
        :value="pageSize"
        @change="handlePageSizeChange"
        class="rounded-md border-gray-300 text-sm focus:border-purple-500 focus:ring-purple-500"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }} por página
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================
// PROPS
// ============================================

interface Props {
  currentPage: number
  totalItems: number
  pageSize?: number
  maxVisiblePages?: number
  showPageSizeSelector?: boolean
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  maxVisiblePages: 7,
  showPageSizeSelector: false,
  pageSizeOptions: () => [10, 25, 50, 100]
})

// ============================================
// EMITS
// ============================================

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
}>()

// ============================================
// COMPUTED
// ============================================

/**
 * Calcula el número total de páginas
 */
const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize)
})

/**
 * Calcula el índice del primer item en la página actual
 */
const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

/**
 * Calcula el índice del último item en la página actual
 */
const endItem = computed(() => {
  const end = props.currentPage * props.pageSize
  return end > props.totalItems ? props.totalItems : end
})

/**
 * Calcula qué páginas deben ser visibles en la paginación
 * Ejemplo: [1, 2, 3, '...', 10, 11, 12]
 */
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = props.currentPage
  const max = props.maxVisiblePages

  if (total <= max) {
    // Si hay pocas páginas, mostrar todas
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Siempre mostrar la primera página
    pages.push(1)

    // Calcular el rango de páginas alrededor de la actual
    const halfMax = Math.floor(max / 2)
    let start = Math.max(2, current - halfMax)
    let end = Math.min(total - 1, current + halfMax)

    // Ajustar si estamos cerca del inicio
    if (current <= halfMax) {
      end = max - 1
    }

    // Ajustar si estamos cerca del final
    if (current >= total - halfMax) {
      start = total - max + 2
    }

    // Agregar elipsis al inicio si es necesario
    if (start > 2) {
      pages.push('...')
    }

    // Agregar páginas del medio
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Agregar elipsis al final si es necesario
    if (end < total - 1) {
      pages.push('...')
    }

    // Siempre mostrar la última página
    pages.push(total)
  }

  return pages
})

// ============================================
// MÉTODOS
// ============================================

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}

const goToPreviousPage = () => {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

const goToNextPage = () => {
  if (props.currentPage < totalPages.value) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

const handlePageSizeChange = (event: Event) => {
  const newSize = parseInt((event.target as HTMLSelectElement).value)
  emit('update:pageSize', newSize)
  // Resetear a la primera página cuando cambia el tamaño
  emit('update:currentPage', 1)
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>