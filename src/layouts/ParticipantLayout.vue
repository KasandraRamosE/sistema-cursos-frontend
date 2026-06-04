<template>
  <!--
    Layout para Participante
    Solo Header + Contenido (SIN sidebar)
    El participante navega desde el header
  -->
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header con navegación -->
    <AppHeader />
    
    <!-- Contenido principal -->
    <main class="flex-1">
      <!-- ✅ CAMBIO: Agregado :key para forzar re-render -->
      <router-view :key="$route.fullPath" />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6 mt-12">
      <div class="container mx-auto px-4 text-center">
        <p class="text-sm">
          © {{ new Date().getFullYear() }} FHCE - Universidad Mayor de San Andrés
        </p>
        <p class="text-xs text-gray-400 mt-2">
          Sistema de Gestión de Cursos Complementarios y Eventos Facultativos
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>