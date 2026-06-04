<template>
  <!--
    Componente Modal reutilizable
    Modal responsive con overlay y animaciones
  -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeOnOverlay && close()"
      >
        <!-- Overlay oscuro -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Contenedor del modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <!-- Modal card -->
          <div
            :class="modalClasses"
            @click.stop
          >
            <!-- Header -->
            <div v-if="$slots.header || title" class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <slot name="header">
                <h3 class="text-xl font-semibold text-gray-800">
                  {{ title }}
                </h3>
              </slot>

              <!-- Botón cerrar -->
              <button
                v-if="showClose"
                @click="close"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div :class="bodyClasses">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

/**
 * Props del componente Modal
 */
interface ModalProps {
  /** Estado abierto/cerrado del modal (v-model) */
  modelValue: boolean
  /** Título del modal */
  title?: string
  /** Tamaño del modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Mostrar botón de cerrar */
  showClose?: boolean
  /** Cerrar al hacer click en el overlay */
  closeOnOverlay?: boolean
  /** Sin padding en el body */
  noPadding?: boolean
}

const props = withDefaults(defineProps<ModalProps>(), {
  title: '',
  size: 'md',
  showClose: true,
  closeOnOverlay: true,
  noPadding: false
})

/**
 * Emits del componente
 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

/**
 * Cierra el modal
 */
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

/**
 * Clases del modal según el tamaño
 */
const modalClasses = computed(() => {
  const base = 'relative bg-white rounded-lg shadow-2xl w-full transform transition-all'
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-7xl'
  }

  return `${base} ${sizes[props.size]}`
})

/**
 * Clases del body
 */
const bodyClasses = computed(() => {
  return props.noPadding ? '' : 'p-6'
})

/**
 * Bloquear scroll del body cuando el modal está abierto
 */
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Animaciones del modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>