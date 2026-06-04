/**
 * Navigation Guards (Protección de Rutas)
 * Controla el acceso a las rutas según autenticación y roles
 */

import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Rol } from '@/types'

/**
 * Configura los guards globales del router
 * @param router - Instancia del router
 */
export function setupRouterGuards(router: Router) {
  /**
   * Guard global que se ejecuta ANTES de cada navegación
   */
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // Verificar autenticación (considera meta en rutas anidadas)
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    if (requiresAuth && !authStore.isAuthenticated) {
      console.warn('⚠️ Acceso denegado: Se requiere autenticación')
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    // Bloquear acceso de autenticados a vistas de invitado
    const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)
    if (requiresGuest && authStore.isAuthenticated) {
      return next(getDashboardRoute(authStore, authStore.currentRole || authStore.user?.roles?.[0] || null))
    }

    // Verificar roles (toma el primer meta.roles definido en la cadena)
    const allowedRoles = to.matched
      .map((record) => record.meta.roles as Rol[] | undefined)
      .find((roles) => roles && roles.length > 0)

    if (allowedRoles && allowedRoles.length > 0) {
      const hasPermission = allowedRoles.some((rol) => authStore.hasRole(rol))

      if (!hasPermission) {
        console.warn(`⚠️ Acceso denegado: Se requiere uno de estos roles: ${allowedRoles.join(', ')}`)

        // Redirigir al dashboard correspondiente o home
        return next(getDashboardRoute(authStore, authStore.currentRole || authStore.user?.roles?.[0] || null))
      }
    }

    console.log(`✅ Navegando a: ${to.path}`)
    next()
  })
}

/**
 * Guard simple para usar directamente en rutas
 */
export function authGuard(to: any, _from: any, next: any) {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as Rol[]
    const hasPermission = allowedRoles.some((rol) => auth.hasRole(rol))

    if (!hasPermission) {
      return next({ name: 'home' })
    }
  }

  next()
}

/**
 * Obtiene la ruta del dashboard según el rol
 */
function getDashboardRoute(authStore: ReturnType<typeof useAuthStore>, role: Rol | null): { name: string } {
  switch (role) {
    case 'ADMINISTRADOR':
      return { name: 'admin-dashboard' }
    case 'COORDINADOR':
      return { name: 'coordinator-dashboard' }
    case 'DOCENTE':
      return { name: 'teacher-dashboard' }
    case 'AUXILIAR':
      return authStore.hasRole('PARTICIPANTE')
        ? { name: 'participant-home' }
        : { name: 'auxiliary-events' }
   case 'DISENADOR':
     return { name: 'designer-templates' }
    case 'PARTICIPANTE':
      return { name: 'participant-home' }
    default:
      return { name: 'home' }
  }
}