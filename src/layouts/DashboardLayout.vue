<template>
  <!--
    Layout del Dashboard (Roles Administrativos)
    SOLO Sidebar + Contenido (SIN header público)
    El sidebar incluye: logo, navegación, perfil, logout
  -->
  <div class="min-h-screen bg-gray-50">
    <div class="flex">
      <!-- Sidebar con todo integrado -->
      <Sidebar :mobileOpen="isSidebarOpen" @close="closeSidebar" />

      <!-- Contenido principal -->
      <main class="flex-1 overflow-y-auto">
        <div class="sticky top-0 z-30 flex items-center gap-3 bg-white px-4 py-3 shadow md:hidden">
          <button
            type="button"
            class="rounded-lg border border-slate-200 p-2 text-slate-700"
            @click="toggleSidebar"
            aria-label="Abrir menu"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span class="text-sm font-semibold text-slate-800">Menu</span>
        </div>
        <div class="p-6 md:p-8">
          <!-- Vista hija (contenido del dashboard) -->
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/common/Sidebar.vue'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>