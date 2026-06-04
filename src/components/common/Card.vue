<template>
  <!--
    Componente Card reutilizable
    Tarjeta con diferentes estilos y slots flexibles
  -->
  <div :class="cardClasses">
    <!-- Header (opcional) -->
    <div v-if="$slots.header || title" class="px-6 py-4 border-b border-gray-200">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-800">
          {{ title }}
        </h3>
      </slot>
    </div>

    <!-- Contenido principal -->
    <div :class="bodyClasses">
      <slot></slot>
    </div>

    <!-- Footer (opcional) -->
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Props del componente Card
 */
interface CardProps {
  /** Título de la tarjeta (si no se usa slot header) */
  title?: string
  /** Variante de la tarjeta */
  variant?: 'default' | 'bordered' | 'elevated' | 'flat'
  /** Sin padding en el body */
  noPadding?: boolean
  /** Tarjeta clickeable */
  hoverable?: boolean
  /** Ancho completo */
  fullWidth?: boolean
}

const props = withDefaults(defineProps<CardProps>(), {
  title: '',
  variant: 'default',
  noPadding: false,
  hoverable: false,
  fullWidth: false
})

/**
 * Clases CSS para la tarjeta
 */
const cardClasses = computed(() => {
  const classes = [
    'bg-white rounded-lg overflow-hidden',
    props.fullWidth ? 'w-full' : ''
  ]

  // Variantes
  const variants = {
    default: 'shadow-md',
    bordered: 'border-2 border-gray-200',
    elevated: 'shadow-xl',
    flat: 'shadow-none'
  }
  classes.push(variants[props.variant])

  // Efecto hover
  if (props.hoverable) {
    classes.push('transition-all duration-200 hover:shadow-2xl hover:scale-105 cursor-pointer')
  }

  return classes.join(' ')
})

/**
 * Clases CSS para el body
 */
const bodyClasses = computed(() => {
  return props.noPadding ? '' : 'p-6'
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>