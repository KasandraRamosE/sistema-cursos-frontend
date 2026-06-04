<template>
  <!--
    Componente Button reutilizable
    Diferentes variantes, tamaños y estados
  -->
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Spinner de carga -->
    <span v-if="loading" class="mr-2">
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>

    <!-- Icono izquierdo (opcional) -->
    <span v-if="iconLeft && !loading" class="mr-2">
      <slot name="icon-left"></slot>
    </span>

    <!-- Texto del botón -->
    <span>
      <slot></slot>
    </span>

    <!-- Icono derecho (opcional) -->
    <span v-if="iconRight && !loading" class="ml-2">
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Props del componente Button
 */
interface ButtonProps {
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost'
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg'
  /** Tipo del botón HTML */
  type?: 'button' | 'submit' | 'reset'
  /** Estado deshabilitado */
  disabled?: boolean
  /** Estado de carga */
  loading?: boolean
  /** Ancho completo */
  fullWidth?: boolean
  /** Tiene icono a la izquierda */
  iconLeft?: boolean
  /** Tiene icono a la derecha */
  iconRight?: boolean
}

// Definir props con valores por defecto
const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
  iconLeft: false,
  iconRight: false
})

/**
 * Emits del componente
 */
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

/**
 * Maneja el click del botón
 */
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

/**
 * Clases CSS computadas según las props
 */
const buttonClasses = computed(() => {
  const classes = [
    // Clases base
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    
    // Ancho completo
    props.fullWidth ? 'w-full' : '',
    
    // Estado deshabilitado o cargando
    (props.disabled || props.loading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
  ]

  // Tamaños
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  classes.push(sizeClasses[props.size])

  // Variantes
  const variantClasses = {
    primary: [
      'bg-slate-900',
      'text-white',
      'hover:bg-slate-800',
      'focus:ring-slate-600'
    ],
    secondary: [
      'bg-gray-600 text-white',
      'hover:bg-gray-700',
      'focus:ring-gray-500'
    ],
    success: [
      'bg-green-600 text-white',
      'hover:bg-green-700',
      'focus:ring-green-500'
    ],
    danger: [
      'bg-red-600 text-white',
      'hover:bg-red-700',
      'focus:ring-red-500'
    ],
    warning: [
      'bg-yellow-500 text-white',
      'hover:bg-yellow-600',
      'focus:ring-yellow-500'
    ],
    outline: [
      'border-2 border-purple-600 text-purple-600',
      'hover:bg-purple-50',
      'focus:ring-purple-500'
    ],
    ghost: [
      'text-gray-700',
      'hover:bg-gray-100',
      'focus:ring-gray-400'
    ]
  }
  classes.push(...variantClasses[props.variant])

  return classes.join(' ')
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>