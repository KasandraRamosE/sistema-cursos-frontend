/**
 * Store de Autenticación (versión simplificada)
 * Compatible con tu implementación actual
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rol } from '@/types'
import { api } from '@/utils/api'

/**
 * Interface del usuario (versión simplificada)
 */
export interface Usuario {
  idUsuario: number
  username: string
  ci?: string
  nombres: string
  apellidos: string
  roles: Rol[]
  tipoParticipante?: 'UMSA' | 'EXTERNO' | null
}

interface LoginResponse {
  token: string
  tipo: string
  refreshToken: string
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  tipoParticipante?: 'UMSA' | 'EXTERNO' | null
  roles: string[]
}

interface RefreshResponse {
  token: string
  tipo: string
  refreshToken: string
}

interface MensajeResponse {
  mensaje: string
}

/**
 * Store de autenticación con Composition API
 */
export const useAuthStore = defineStore('auth', () => {
  // ============================================
  // ESTADO
  // ============================================
  
  const user = ref<Usuario | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const currentRole = ref<Rol | null>(null)
  const loginError = ref('')

  // ============================================
  // GETTERS
  // ============================================
  
  /**
   * Verifica si el usuario está autenticado
   */
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (rol: Rol): boolean => {
    return user.value?.roles.includes(rol) || false
  }

  /**
   * Nombre completo del usuario
   */
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.nombres} ${user.value.apellidos}`
  })

  /**
   * Roles disponibles para el usuario
   * NOTA: El DISENADOR SÍ puede tener otros roles (ej: PARTICIPANTE + DISENADOR)
   */
  const availableRoles = computed((): Rol[] => {
    if (!user.value) return []
    return user.value.roles
  })

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Login real (para cuando conectes con el backend)
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      loginError.value = ''
      const response = await api.post('/auth/login', { username, password }) as LoginResponse
      const roles = normalizeRoles(response.roles)

      token.value = response.token
      refreshToken.value = response.refreshToken
      user.value = {
        idUsuario: response.idUsuario,
        username: response.username,
        nombres: response.nombres,
        apellidos: response.apellidos,
        roles,
        tipoParticipante: response.tipoParticipante ?? null
      }

      try {
        localStorage.setItem('token', token.value)
        const perfil = await api.get('/usuarios/me') as Record<string, unknown>
        const emailVerificado = perfil.emailVerificado ?? perfil.email_verificado
        const verificado = emailVerificado === true || emailVerificado === 1 || emailVerificado === 'true'
        if (!verificado) {
          loginError.value = 'Debes verificar tu correo antes de iniciar sesion.'
          logout()
          return false
        }

        const rawRoles = Array.isArray(perfil.roles)
          ? perfil.roles
          : (Array.isArray(perfil.rolesAsignados) ? perfil.rolesAsignados : [])
        if (rawRoles.length > 0) {
          const roleNames = rawRoles.map((role) => {
            if (role && typeof role === 'object' && 'nombre' in role) {
              return String((role as { nombre?: unknown }).nombre ?? '')
            }
            return String(role)
          })
          const normalizedPerfilRoles = normalizeRoles(roleNames)
          user.value = {
            ...user.value,
            roles: normalizedPerfilRoles
          }
          localStorage.setItem('user', JSON.stringify(user.value))
        }
      } catch (error) {
        loginError.value = 'No se pudo validar el estado del correo. Intenta de nuevo.'
        console.warn('No se pudo validar el email verificado:', error)
        logout()
        return false
      }

      const storedRole = localStorage.getItem('currentRole')
      const normalizedStoredRole = storedRole ? normalizeRoles([storedRole])[0] : null
      const effectiveRoles = user.value?.roles ?? roles
      if (normalizedStoredRole && effectiveRoles.includes(normalizedStoredRole)) {
        currentRole.value = normalizedStoredRole
      } else {
        currentRole.value = effectiveRoles[0] || null
      }

      localStorage.setItem('user', JSON.stringify(user.value))
      localStorage.setItem('token', token.value)
      localStorage.setItem('refreshToken', refreshToken.value)
      if (currentRole.value) {
        localStorage.setItem('currentRole', currentRole.value)
      }

      return true
    } catch (error) {
      loginError.value = (error as Error).message || 'Error al iniciar sesion'
      console.error('❌ Error en login:', error)
      return false
    }
  }

  const register = async (payload: {
    username: string
    ci: string
    nombres: string
    apellidos: string
    email: string
    password: string
    tipoParticipante: 'UMSA' | 'EXTERNO'
  }): Promise<string> => {
    const response = await api.post('/auth/registro', payload) as MensajeResponse
    return response.mensaje
  }

  const verifyEmail = async (payload: {
    username: string
    codigo: string
  }): Promise<string> => {
    const response = await api.post('/auth/verificar-email', payload) as MensajeResponse
    return response.mensaje
  }

  const resendCode = async (username: string): Promise<string> => {
    const response = await api.post(`/auth/reenviar-codigo?username=${encodeURIComponent(username)}`) as MensajeResponse
    return response.mensaje
  }

  // ============================================
  // RESET PASSWORD - 3 pasos
  // ============================================

  /**
   * Paso 1: Solicitar código de reset
   */
  const solicitarResetPassword = async (username: string): Promise<string> => {
    const response = await api.post('/auth/solicitar-reset-password', {
      username
    }) as MensajeResponse
    return response.mensaje
  }

  /**
   * Paso 2: Verificar código de reset
   */
  const verificarCodigoReset = async (username: string, codigo: string): Promise<string> => {
    const response = await api.post('/auth/verificar-codigo-reset', {
      username,
      codigo
    }) as MensajeResponse
    return response.mensaje
  }

  /**
   * Paso 3: Cambiar contraseña
   */
  const cambiarPassword = async (username: string, codigo: string, newPassword: string): Promise<string> => {
    const response = await api.post('/auth/cambiar-password', {
      username,
      codigo,
      newPassword
    }) as MensajeResponse
    return response.mensaje
  }

  /**
   * Cerrar sesión
   */
  const logout = () => {
    const tokenToRevoke = refreshToken.value
    if (tokenToRevoke) {
      api.post('/auth/logout', { refreshToken: tokenToRevoke }).catch(() => {
        console.warn('No se pudo revocar el refresh token en el backend')
      })
    }

    user.value = null
    token.value = null
    refreshToken.value = null
    currentRole.value = null

    // Limpiar localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentRole')

    console.log('✅ Sesión cerrada')
  }

  /**
   * Cambiar el rol activo
   */
  const changeRole = (newRole: Rol): boolean => {
    if (!user.value) {
      console.error('❌ No hay usuario autenticado')
      return false
    }

    if (!user.value.roles.includes(newRole)) {
      console.error(`❌ El usuario no tiene el rol: ${newRole}`)
      return false
    }

    currentRole.value = newRole
    localStorage.setItem('currentRole', newRole)
    
    console.log(`✅ Rol cambiado a: ${newRole}`)
    return true
  }

  /**
   * Actualizar datos del usuario
   */
  const updateUser = (updatedUser: Usuario) => {
    if (!user.value) {
      console.error('❌ No hay usuario autenticado')
      return
    }

    user.value = updatedUser

    // Actualizar en localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser))

    console.log('✅ Datos del usuario actualizados')
  }

  /**
   * Restaurar sesión desde localStorage
   */
  const initializeAuth = () => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedToken = localStorage.getItem('token')
      const savedRefreshToken = localStorage.getItem('refreshToken')
      const savedRole = localStorage.getItem('currentRole')

      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser) as Usuario
        const normalizedRoles = normalizeRoles(parsedUser.roles as unknown as string[])
        user.value = {
          ...parsedUser,
          roles: normalizedRoles
        }
        token.value = savedToken
        refreshToken.value = savedRefreshToken
        
        // Validar que el rol sea válido
        const validRoles: Rol[] = ['ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'PARTICIPANTE', 'AUXILIAR', 'DISENADOR']
        const normalizedSavedRole = savedRole ? normalizeRoles([savedRole])[0] : null
        if (normalizedSavedRole && validRoles.includes(normalizedSavedRole)) {
          currentRole.value = normalizedSavedRole
        } else {
          // Verificar que user.value no sea null antes de acceder a roles
          currentRole.value = user.value?.roles[0] || null
        }

        console.log('✅ Sesión restaurada desde localStorage')
      }
    } catch (error) {
      console.error('❌ Error al restaurar sesión:', error)
      logout()
    }
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken.value) return false

    try {
      const response = await api.post('/auth/refresh', {
        refreshToken: refreshToken.value
      }) as RefreshResponse

      token.value = response.token
      refreshToken.value = response.refreshToken
      localStorage.setItem('token', token.value)
      localStorage.setItem('refreshToken', refreshToken.value)
      return true
    } catch (error) {
      console.warn('No se pudo refrescar el token:', error)
      return false
    }
  }

  const normalizeRoles = (roles: string[]): Rol[] => {
    return roles.map((role) => {
      const cleaned = role.replace('ROLE_', '').replace('DISEÑADOR', 'DISENADOR')
      return cleaned as Rol
    })
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    // Estado
    user,
    token,
    refreshToken,
    currentRole,
    loginError,

    // Getters
    isAuthenticated,
    hasRole,
    fullName,
    availableRoles,

    // Actions
    login,
    register,
    verifyEmail,
    resendCode,
    solicitarResetPassword,
    verificarCodigoReset,
    cambiarPassword,
    logout,
    refreshAccessToken,
    changeRole,
    updateUser,  // ← AGREGADO
    initializeAuth
  }
})
