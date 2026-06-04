<template>
  <!--
    Tarjeta de Actividad (Curso o Evento)
    Muestra imagen prominente, información resumida con opción de ver detalle
  -->
  <Card 
    :hoverable="true"
    class="h-full flex flex-col overflow-hidden"
  >
    <!-- Imagen destacada -->
    <template #header>
      <div class="w-full h-40 -mx-4 -mt-4 mb-2 overflow-hidden bg-gray-200">
        <img 
          :src="activity.imagen" 
          :alt="activity.nombre"
          class="w-full h-full object-cover"
        />
      </div>
    </template>

    <!-- Contenido principal -->
    <div class="flex-1 space-y-3">
      <!-- Header con tipo y estado -->
      <div class="flex items-center justify-between gap-2">
        <!-- Badge de tipo -->
        <Badge 
          :variant="activity.tipo === 'CURSO' ? 'primary' : 'secondary'"
          size="sm"
        >
          {{ activity.tipo }}
        </Badge>

        <!-- Badge de estado -->
        <Badge 
          :variant="getEstadoBadgeVariant()"
          size="sm"
          :dot="true"
        >
          {{ getEstadoLabel() }}
        </Badge>
      </div>

      <!-- Título -->
      <h3 class="text-lg font-bold text-gray-800 line-clamp-2">
        {{ activity.nombre }}
      </h3>

      <!-- Información adicional -->
      <div class="space-y-2 text-sm">
        <!-- Carrera -->
        <div v-if="activity.carrera" class="flex items-center space-x-2 text-gray-600">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span class="line-clamp-1">{{ activity.carrera.nombre }}</span>
        </div>

        <!-- Modalidad -->
        <div class="flex items-center space-x-2 text-gray-600">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span>{{ getModalidadLabel() }}</span>
        </div>

        <!-- Carga horaria -->
        <div class="flex items-center space-x-2 text-gray-600">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ activity.carga_horaria }} horas</span>
          <span v-if="hasDurationInfo" class="text-xs text-gray-500">· Duración: {{ activity.duracion }} {{ formatDurationUnit(activity.unidad) }}</span>
        </div>

        <!-- Lugar (si está disponible) -->
        <div v-if="activity.lugar" class="flex items-center space-x-2 text-gray-600">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="line-clamp-1">{{ activity.lugar }}</span>
        </div>

        <!-- Fechas -->
        <div class="flex items-center space-x-2 text-gray-600">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDateRangeDisplay() }}</span>
        </div>

        <!-- Cupos -->
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 flex-shrink-0" :class="getCuposColor()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span :class="getCuposColor()">
            {{ activity.cupos_disponibles }} de {{ activity.cupo_maximo }} cupos
          </span>
        </div>
      </div>

      <!-- Precio -->
      <div class="pt-2 border-t border-gray-200">
        <div v-if="activity.es_gratuito">
          <Badge variant="success" class="w-full justify-center">
            ✓ GRATUITO
          </Badge>
        </div>
        <div v-else class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-gray-600">UMSA</div>
            <div class="font-bold text-purple-600">Bs. {{ activity.costo_umsa }}</div>
          </div>
          <div>
            <div class="text-gray-600">Externo</div>
            <div class="font-bold text-gray-800">Bs. {{ activity.costo_externo }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer con botones -->
    <template #footer>
      <Button
        variant="outline"
        size="sm"
        class="w-full"
        @click="$emit('view-detail', activity.id_actividad, activity.tipo)"
      >
        Ver detalle
      </Button>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import { formatDateRange } from '@/utils/dateFormatter'
import type { Actividad } from '@/types'

// ============================================
// PROPS
// ============================================

interface Props {
  activity: Actividad
}

const props = defineProps<Props>()

// ============================================
// EMITS
// ============================================

defineEmits<{
  'view-detail': [activityId: number, tipo: 'CURSO' | 'EVENTO']
}>()

// ============================================
// MÉTODOS
// ============================================

/**
 * Obtiene la variante del badge según el estado
 */
const getEstadoBadgeVariant = () => {
  switch (props.activity.estado) {
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

/**
 * Obtiene la etiqueta del estado
 */
const getEstadoLabel = () => {
  switch (props.activity.estado) {
    case 'ABIERTO':
      return 'Abierto'
    case 'LLENO':
      return 'Lleno'
    case 'FINALIZADO':
      return 'Finalizado'
    default:
      return props.activity.estado
  }
}

/**
 * Obtiene la etiqueta de la modalidad
 */
const getModalidadLabel = () => {
  switch (props.activity.modalidad) {
    case 'PRESENCIAL':
      return 'Presencial'
    case 'VIRTUAL':
      return 'Virtual'
    case 'MIXTO':
      return 'Mixto'
    default:
      return props.activity.modalidad
  }
}

/**
 * Formatea el rango de fechas
 */
const formatDateRangeDisplay = () => {
  return formatDateRange(props.activity.fecha_inicio, props.activity.fecha_fin)
}

const formatDurationUnit = (unidad?: string | null) => {
  switch (unidad) {
    case 'días':
      return 'días'
    case 'semanas':
      return 'semanas'
    case 'meses':
      return 'meses'
    default:
      return 'horas'
  }
}

const hasDurationInfo = computed(() => props.activity.duracion != null && Boolean(props.activity.unidad))

/**
 * Obtiene el color según los cupos disponibles
 */
const getCuposColor = () => {
  const porcentaje = (props.activity.cupos_disponibles / props.activity.cupo_maximo) * 100
  
  if (porcentaje === 0) return 'text-red-600'
  if (porcentaje < 20) return 'text-orange-600'
  if (porcentaje < 50) return 'text-yellow-600'
  return 'text-green-600'
}
</script>

<style scoped>
/* Limitar líneas de texto */
.line-clamp-2 {
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  line-clamp: 3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>