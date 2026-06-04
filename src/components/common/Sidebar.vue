<template>
  <div>
    <!-- =====================================================
         OVERLAY: Solo en mobile cuando el drawer está abierto
         ===================================================== -->
    <div
      v-if="isMobileDrawerOpen"
      class="fixed inset-0 z-30 bg-black/40 md:hidden"
      @click="closeMobileDrawer"
    />

    <!-- =====================================================
         SIDEBAR — Desktop
         - collapsed: barra delgada de solo íconos (w-16)
         - expanded: barra completa (w-64)
         ===================================================== -->
    <aside
      class="hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 sticky top-0"
      :class="isCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Header del sidebar -->
      <div
        class="border-b border-gray-200 flex-shrink-0 flex items-center"
        :class="isCollapsed ? 'justify-center p-3' : 'justify-between p-4'"
      >
        <!-- Logo -->
        <router-link
          to="/"
          class="flex items-center hover:opacity-80 transition"
          :class="isCollapsed ? 'justify-center' : 'space-x-3'"
        >
          <div class="w-9 h-9 rounded-lg overflow-hidden bg-white ring-1 ring-purple-200 flex items-center justify-center flex-shrink-0">
            <img :src="logo" alt="Logo FHCE" class="w-full h-full object-cover" />
          </div>
          <div v-if="!isCollapsed">
            <h2 class="text-sm font-bold text-gray-800 leading-tight">FHCE</h2>
            <p class="text-xs text-gray-500">{{ getRoleName() }}</p>
          </div>
        </router-link>

        <!-- Botón colapsar (solo en expanded) -->
        <button
          v-if="!isCollapsed"
          @click="toggleCollapse"
          class="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="Contraer menú"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <!-- Botón expandir (solo en collapsed, centrado) -->
      <button
        v-if="isCollapsed"
        @click="toggleCollapse"
        class="mx-auto mt-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        title="Expandir menú"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Navegación con scroll interno -->
      <nav class="flex-1 py-3 overflow-y-auto sidebar-scroll" :class="isCollapsed ? 'px-1' : 'px-3'">
        <template v-for="item in navigationItems" :key="item.name">
          <!-- En modo collapsed: ícono + label corto -->
          <router-link
            v-if="isCollapsed"
            :to="item.path"
            :title="item.label"
            class="flex flex-col items-center justify-center w-12 h-14 mx-auto mb-1 rounded-lg transition-all relative gap-0.5"
            :class="isActive(item.path)
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="text-[9px] font-medium leading-tight text-center max-w-full px-0.5 truncate">
              {{ item.shortLabel || item.label.split(' ')[0] }}
            </span>
            <!-- Badge en modo colapsado -->
            <span
              v-if="item.badge"
              class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium"
            >
              {{ item.badge }}
            </span>
          </router-link>

          <!-- En modo expanded: ícono + texto + badge -->
          <router-link
            v-else
            :to="item.path"
            class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1"
            :class="isActive(item.path)
              ? 'bg-purple-100 text-purple-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="flex-1 text-sm">{{ item.label }}</span>
            <span
              v-if="item.badge"
              class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium"
            >
              {{ item.badge }}
            </span>
          </router-link>
        </template>
      </nav>

      <!-- Footer del sidebar -->
      <div class="border-t border-gray-200 flex-shrink-0" :class="isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2'">

        <!-- Selector de rol — solo en expanded -->
        <div v-if="canChangeRole && !isCollapsed" class="relative" ref="roleMenuRef">
          <button
            @click="toggleRoleMenu"
            class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span class="text-gray-700 font-medium text-xs">Cambiar rol</span>
            </div>
            <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown roles -->
          <div
            v-if="showRoleMenu"
            class="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
          >
            <p class="px-3 pb-1 text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Roles disponibles
            </p>
            <button
              v-for="role in authStore.availableRoles"
              :key="role"
              @click="handleChangeRole(role)"
              class="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm flex items-center justify-between"
              :class="authStore.currentRole === role ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'"
            >
              <span>{{ getRoleNameForOption(role) }}</span>
              <svg
                v-if="authStore.currentRole === role"
                class="w-4 h-4 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Selector de rol en collapsed: solo ícono con título -->
        <button
          v-if="canChangeRole && isCollapsed"
          @click="toggleCollapse"
          class="flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-gray-400 hover:bg-gray-100 hover:text-purple-600 transition-colors"
          title="Expandir para cambiar rol"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        <!-- Info del usuario -->
        <div
          v-if="!isCollapsed"
          class="px-3 py-2 bg-gray-50 rounded-lg"
        >
          <p class="text-xs font-semibold text-gray-800 truncate">{{ authStore.fullName }}</p>
          <p class="text-xs text-gray-500 truncate">{{ getRoleName() }}</p>
        </div>

        <!-- Avatar en collapsed -->
        <div
          v-if="isCollapsed"
          class="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-purple-100 text-purple-700 font-semibold text-sm"
          :title="authStore.fullName"
        >
          {{ userInitials }}
        </div>

        <!-- Cerrar sesión -->
        <button
          @click="handleLogout"
          :title="isCollapsed ? 'Cerrar sesión' : undefined"
          class="w-full flex items-center rounded-lg transition-colors text-sm font-medium text-red-600 hover:bg-red-50"
          :class="isCollapsed ? 'justify-center p-2' : 'space-x-2 px-3 py-2'"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span v-if="!isCollapsed">Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- =====================================================
         SIDEBAR DRAWER — Mobile (panel lateral deslizable)
         Solo visible cuando isMobileDrawerOpen = true
         ===================================================== -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl flex flex-col h-screen transform transition-transform duration-300 md:hidden"
      :class="isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Header drawer mobile -->
      <div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <router-link to="/" class="flex items-center space-x-3 hover:opacity-80 transition" @click="closeMobileDrawer">
          <div class="w-9 h-9 rounded-lg overflow-hidden bg-white ring-1 ring-purple-200 flex items-center justify-center">
            <img :src="logo" alt="Logo FHCE" class="w-full h-full object-cover" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-gray-800">FHCE</h2>
            <p class="text-xs text-gray-500">{{ getRoleName() }}</p>
          </div>
        </router-link>

        <!-- Botón cerrar drawer -->
        <button
          @click="closeMobileDrawer"
          class="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Nav drawer mobile — igual que desktop expanded -->
      <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto sidebar-scroll">
        <template v-for="item in navigationItems" :key="item.name">
          <router-link
            :to="item.path"
            class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all"
            :class="isActive(item.path)
              ? 'bg-purple-100 text-purple-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'"
            @click="closeMobileDrawer"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="flex-1 text-sm">{{ item.label }}</span>
            <span
              v-if="item.badge"
              class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium"
            >
              {{ item.badge }}
            </span>
          </router-link>
        </template>
      </nav>

      <!-- Footer drawer mobile -->
      <div class="border-t border-gray-200 p-3 space-y-2 flex-shrink-0">
        <!-- Selector de rol -->
        <div v-if="canChangeRole" class="relative" ref="roleMenuMobileRef">
          <button
            @click="toggleRoleMenu"
            class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span class="text-gray-700 font-medium text-xs">Cambiar rol</span>
            </div>
            <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            v-if="showRoleMenu"
            class="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
          >
            <p class="px-3 pb-1 text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Roles disponibles
            </p>
            <button
              v-for="role in authStore.availableRoles"
              :key="role"
              @click="handleChangeRole(role)"
              class="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm flex items-center justify-between"
              :class="authStore.currentRole === role ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'"
            >
              <span>{{ getRoleNameForOption(role) }}</span>
              <svg v-if="authStore.currentRole === role" class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div class="px-3 py-2 bg-gray-50 rounded-lg">
          <p class="text-xs font-semibold text-gray-800 truncate">{{ authStore.fullName }}</p>
          <p class="text-xs text-gray-500 truncate">{{ getRoleName() }}</p>
        </div>

        <button
          @click="handleLogout"
          class="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- =====================================================
         BARRA INFERIOR — Mobile
         Siempre visible en mobile. Muestra los primeros 4 ítems
         + botón de menú para ver el resto en el drawer.
         ===================================================== -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-safe">
      <template v-for="item in mobileBottomItems" :key="item.name">
        <router-link
          :to="item.path"
          class="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors relative"
          :class="isActive(item.path) ? 'text-purple-700' : 'text-gray-500'"
        >
          <component :is="item.icon" class="w-6 h-6 flex-shrink-0" />
          <span class="text-xs mt-0.5 truncate w-full text-center leading-tight">{{ item.shortLabel || item.label }}</span>
          <span
            v-if="item.badge"
            class="absolute top-1 right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium"
          >
            {{ item.badge }}
          </span>
        </router-link>
      </template>

      <!-- Botón "Más" para abrir el drawer si hay más ítems -->
      <button
        v-if="navigationItems.length > 4"
        @click="openMobileDrawer"
        class="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors"
        :class="isMobileDrawerOpen ? 'text-purple-700' : 'text-gray-500'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span class="text-xs mt-0.5">Más</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Rol } from '@/types'
import logo from '@/assets/images/logo.jpg'

// =====================================================
// PROPS & EMITS
// =====================================================
// Ya no necesitamos prop "open" desde el padre porque
// el sidebar maneja su propio estado internamente.
// Si necesitas acceso externo, puedes exponer métodos con defineExpose.

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const props = defineProps<{
  mobileOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// =====================================================
// ESTADO INTERNO
// =====================================================

/** Controla si el sidebar desktop está colapsado */
const isCollapsed = ref(false)

/** Controla si el drawer mobile está abierto */
const isMobileDrawerOpen = ref(false)

/** Controla el menú desplegable de roles */
const showRoleMenu = ref(false)

/** Referencias para click-outside */
const roleMenuRef = ref<HTMLElement | null>(null)
const roleMenuMobileRef = ref<HTMLElement | null>(null)

// =====================================================
// PERSISTENCIA DEL ESTADO COLAPSADO
// =====================================================
const COLLAPSED_KEY = 'sidebar_collapsed'

onMounted(() => {
  // Restaurar estado colapsado desde localStorage
  const saved = localStorage.getItem(COLLAPSED_KEY)
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }

  document.addEventListener('click', handleClickOutside)
})

watch(
  () => props.mobileOpen,
  (value) => {
    if (typeof value === 'boolean') {
      isMobileDrawerOpen.value = value
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// =====================================================
// ÍCONOS (componentes inline para evitar dependencias)
// =====================================================

const IconDashboard = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>` }
const IconUsers = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>` }
const IconBook = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>` }
const IconCalendar = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` }
const IconClipboard = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>` }
const IconAward = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>` }
const IconInbox = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>` }
const IconPhoto = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` }
const IconCheckCircle = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` }
const IconChart = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3v18m4-13v13m4-9v9M5 13v8" /></svg>` }

// =====================================================
// COMPUTED
// =====================================================

const canChangeRole = computed(() => authStore.availableRoles.length > 1)

/** Iniciales del usuario para el avatar colapsado */
const userInitials = computed(() => {
  const name = authStore.fullName || ''
  return name
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
})

interface NavItem {
  name: string
  label: string
  shortLabel?: string  // Etiqueta corta para la barra mobile
  path: string
  icon: any
  badge?: number | string
}

/** Ítems de navegación según el rol actual */
const navigationItems = computed((): NavItem[] => {
  const role = authStore.currentRole

  switch (role) {
    case 'ADMINISTRADOR':
      return [
        { name: 'dashboard',     label: 'Dashboard',      shortLabel: 'Inicio',      path: '/admin',                icon: IconDashboard   },
        { name: 'users',         label: 'Usuarios',       shortLabel: 'Usuarios',    path: '/admin/usuarios',       icon: IconUsers       },
        { name: 'activities',    label: 'Actividades',    shortLabel: 'Act.',        path: '/admin/actividades',    icon: IconCalendar    },
        { name: 'inscriptions',  label: 'Inscripciones',  shortLabel: 'Inscrip.',    path: '/admin/inscripciones',  icon: IconClipboard   },
        { name: 'grades',        label: 'Calificaciones', shortLabel: 'Notas',       path: '/admin/calificaciones', icon: IconCheckCircle },
        { name: 'attendance',    label: 'Asistencias',    shortLabel: 'Asist.',      path: '/admin/asistencias',    icon: IconCheckCircle },
        { name: 'certificates',  label: 'Certificados',   shortLabel: 'Certif.',     path: '/admin/certificados',   icon: IconAward       },
      ]

    case 'COORDINADOR':
      return [
        { name: 'dashboard',  label: 'Dashboard',           shortLabel: 'Inicio',   path: '/coordinador',            icon: IconDashboard },
        { name: 'activities', label: 'Cursos',          shortLabel: 'Act.',     path: '/coordinador/actividades', icon: IconCalendar },
        { name: 'events',     label: 'Eventos',              shortLabel: 'Eventos',  path: '/coordinador/eventos',     icon: IconCalendar },
        { name: 'enrolled',   label: 'Inscritos',            shortLabel: 'Inscrip.', path: '/coordinador/inscritos',  icon: IconClipboard },
        { name: 'reports',    label: 'Reportes',             shortLabel: 'Reportes', path: '/coordinador/reportes',   icon: IconChart },
        { name: 'inbox',      label: 'Bandeja',              shortLabel: 'Bandeja',  path: '/coordinador/bandeja',    icon: IconInbox     },
        { name: 'designers',  label: 'Diseñadores',          shortLabel: 'Diseñ.',   path: '/coordinador/disenadores', icon: IconPhoto     },
        { name: 'emit',       label: 'Emitir Certificados',  shortLabel: 'Emitir',   path: '/coordinador/emitir',     icon: IconAward     },
      ]

    case 'DOCENTE':
      return [
        { name: 'dashboard', label: 'Dashboard',       shortLabel: 'Inicio', path: '/docente',             icon: IconDashboard   },
        { name: 'courses',   label: 'Mis Cursos',      shortLabel: 'Cursos', path: '/docente/mis-cursos',  icon: IconBook        },
        { name: 'grades',    label: 'Calificaciones',  shortLabel: 'Notas',  path: '/docente/calificaciones', icon: IconClipboard },
      ]

    case 'AUXILIAR':
      return [
        { name: 'events',     label: 'Mis Eventos',        shortLabel: 'Eventos', path: '/auxiliar/eventos',    icon: IconCalendar    },
      ]

    case 'DISENADOR':
      return [
        { name: 'templates',      label: 'Plantillas',       shortLabel: 'Plantillas',      path: '/disenador/plantillas',      icon: IconPhoto },
        { name: 'my-templates',    label: 'Mis Plantillas',   shortLabel: 'MisPlant.',       path: '/disenador/mis-plantillas',  icon: IconInbox },
      ]

    default:
      return []
  }
})

/**
 * Los primeros 4 ítems van en la barra inferior mobile.
 * Si hay 4 o menos, no aparece el botón "Más".
 */
const mobileBottomItems = computed(() => navigationItems.value.slice(0, 4))

// =====================================================
// MÉTODOS
// =====================================================

/** Alterna el estado colapsado del sidebar desktop y lo persiste */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(COLLAPSED_KEY, String(isCollapsed.value))
}

const openMobileDrawer = () => { isMobileDrawerOpen.value = true }
const closeMobileDrawer = () => {
  isMobileDrawerOpen.value = false
  emit('close')
}

/** Ruta activa: exacta para dashboards, prefijo para el resto */
const isActive = (path: string): boolean => {
  const dashboards = ['/admin', '/coordinador', '/docente', '/auxiliar', '/disenador']
  if (dashboards.includes(path)) {
    return route.path === path
  }
  return route.path === path || route.path.startsWith(path + '/')
}

const getRoleName = (): string => {
  const roleNames: Record<string, string> = {
    ADMINISTRADOR: 'Administrador',
    COORDINADOR:   'Coordinador',
    DOCENTE:       'Docente',
    PARTICIPANTE:  'Participante',
    AUXILIAR:      'Auxiliar',
    DISENADOR:     'Diseñador',
  }
  return authStore.currentRole ? roleNames[authStore.currentRole] ?? 'Usuario' : 'Usuario'
}

const getRoleNameForOption = (role: Rol): string => {
  const roleNames: Record<string, string> = {
    ADMINISTRADOR: 'Administrador',
    COORDINADOR:   'Coordinador',
    DOCENTE:       'Docente',
    PARTICIPANTE:  'Participante',
    AUXILIAR:      'Auxiliar',
    DISENADOR:     'Diseñador',
  }
  return roleNames[role] ?? role
}

const toggleRoleMenu = () => { showRoleMenu.value = !showRoleMenu.value }

const handleChangeRole = (role: Rol) => {
  const success = authStore.changeRole(role)
  if (success) {
    showRoleMenu.value = false
    const routes: Record<string, string> = {
      ADMINISTRADOR: '/admin',
      COORDINADOR:   '/coordinador',
      DOCENTE:       '/docente',
      PARTICIPANTE:  '/participante',
      AUXILIAR:      '/auxiliar/eventos',
      DISENADOR:     '/disenador',
    }
    router.push(routes[role] || '/')
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

/** Cierra el menú de roles si se hace click fuera */
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const outside =
    (!roleMenuRef.value || !roleMenuRef.value.contains(target)) &&
    (!roleMenuMobileRef.value || !roleMenuMobileRef.value.contains(target))
  if (outside) {
    showRoleMenu.value = false
  }
}
</script>

<style scoped>
/* Scroll suave y discreto en la navegación */
.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}
.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}
.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Safe area para la barra inferior en iPhones con notch */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>