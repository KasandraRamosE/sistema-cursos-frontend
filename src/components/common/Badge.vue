<template>
  <!--
    Componente Badge reutilizable
    Para mostrar estados, categorías, contadores, etc.
  -->
  <span :class="badgeClasses">
    <!-- Dot indicator (opcional) -->
    <span v-if="dot" class="w-2 h-2 rounded-full mr-1.5" :class="dotColor"></span>
    
    <!-- Contenido -->
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Props del componente Badge
 */
interface BadgeProps {
  /** Variante de color */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'
  /** Tamaño del badge */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar punto indicador */
  dot?: boolean
  /** Bordes redondeados completos (píldora) */
  pill?: boolean
  /** Sin fondo, solo texto con color */
  outline?: boolean
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'primary',
  size: 'md',
  dot: false,
  pill: false,
  outline: false
})

/**
 * Clases CSS del badge
 */
const badgeClasses = computed(() => {
  const classes = [
    'inline-flex items-center font-medium',
    props.pill ? 'rounded-full' : 'rounded',
  ]

  // Tamaños
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }
  classes.push(sizes[props.size])

  // Variantes de color
  if (props.outline) {
    // Versión outline (solo borde)
    const outlineVariants = {
      primary: 'border-2 border-purple-600 text-purple-700',
      secondary: 'border-2 border-blue-600 text-blue-700',
      success: 'border-2 border-green-600 text-green-700',
      danger: 'border-2 border-red-600 text-red-700',
      warning: 'border-2 border-yellow-600 text-yellow-700',
      info: 'border-2 border-blue-500 text-blue-600',
      gray: 'border-2 border-gray-400 text-gray-700'
    }
    classes.push(outlineVariants[props.variant])
  } else {
    // Versión con fondo
    const solidVariants = {
      primary: 'bg-purple-100 text-purple-800',
      secondary: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      danger: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-50 text-blue-700',
      gray: 'bg-gray-100 text-gray-800'
    }
    classes.push(solidVariants[props.variant])
  }

  return classes.join(' ')
})

/**
 * Color del dot indicator
 */
const dotColor = computed(() => {
  const colors = {
    primary: 'bg-purple-600',
    secondary: 'bg-blue-600',
    success: 'bg-green-600',
    danger: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-500',
    gray: 'bg-gray-600'
  }
  return colors[props.variant]
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>