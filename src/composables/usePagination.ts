/**
 * Composable usePagination
 * 
 * Maneja la lógica de paginación de datos de forma reutilizable.
 * Proporciona estado reactivo y métodos para navegar entre páginas.
 * 
 * @example
 * const { paginatedData, currentPage, pageSize, totalPages, goToPage } = usePagination(usuarios, { pageSize: 20 })
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'


interface UsePaginationOptions {
  pageSize?: number
  initialPage?: number
}

export function usePagination<T>(
  data: Ref<T[]> | ComputedRef<T[]>,
  options: UsePaginationOptions = {}
) {
  // ============================================
  // ESTADO
  // ============================================

  const currentPage = ref(options.initialPage || 1)
  const pageSize = ref(options.pageSize || 10)

  // ============================================
  // COMPUTED
  // ============================================

  /**
   * Calcula el número total de páginas
   */
  const totalPages = computed(() => {
    return Math.ceil(data.value.length / pageSize.value)
  })

  /**
   * Calcula el número total de items
   */
  const totalItems = computed(() => {
    return data.value.length
  })

  /**
   * Calcula el índice de inicio para la página actual
   */
  const startIndex = computed(() => {
    return (currentPage.value - 1) * pageSize.value
  })

  /**
   * Calcula el índice de fin para la página actual
   */
  const endIndex = computed(() => {
    return Math.min(startIndex.value + pageSize.value, data.value.length)
  })

  /**
   * Retorna los datos paginados para la página actual
   */
  const paginatedData = computed(() => {
    return data.value.slice(startIndex.value, endIndex.value)
  })

  /**
   * Verifica si hay página anterior
   */
  const hasPreviousPage = computed(() => {
    return currentPage.value > 1
  })

  /**
   * Verifica si hay página siguiente
   */
  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value
  })

  // ============================================
  // MÉTODOS
  // ============================================

  /**
   * Navega a una página específica
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  /**
   * Navega a la página anterior
   */
  const goToPreviousPage = () => {
    if (hasPreviousPage.value) {
      currentPage.value--
    }
  }

  /**
   * Navega a la página siguiente
   */
  const goToNextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  /**
   * Navega a la primera página
   */
  const goToFirstPage = () => {
    currentPage.value = 1
  }

  /**
   * Navega a la última página
   */
  const goToLastPage = () => {
    currentPage.value = totalPages.value
  }

  /**
   * Cambia el tamaño de página
   */
  const setPageSize = (size: number) => {
    pageSize.value = size
    // Resetear a la primera página cuando cambia el tamaño
    currentPage.value = 1
  }

  /**
   * Resetea la paginación al estado inicial
   */
  const reset = () => {
    currentPage.value = options.initialPage || 1
    pageSize.value = options.pageSize || 10
  }

  // ============================================
  // WATCHERS
  // ============================================

  /**
   * Ajusta la página actual si los datos cambian y la página actual
   * queda fuera del rango válido
   */
  watch([data, pageSize], () => {
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    } else if (currentPage.value < 1 && totalPages.value > 0) {
      currentPage.value = 1
    }
  })

  // ============================================
  // RETURN
  // ============================================

  return {
    // Estado
    currentPage,
    pageSize,

    // Computed
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedData,
    hasPreviousPage,
    hasNextPage,

    // Métodos
    goToPage,
    goToPreviousPage,
    goToNextPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    reset
  }
}