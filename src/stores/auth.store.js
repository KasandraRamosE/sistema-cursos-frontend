/**
 * Store de Autenticación (versión simplificada)
 * Compatible con tu implementación actual
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/utils/api';
/**
 * Store de autenticación con Composition API
 */
export const useAuthStore = defineStore('auth', () => {
    // ============================================
    // ESTADO
    // ============================================
    const user = ref(null);
    const token = ref(null);
    const refreshToken = ref(null);
    const currentRole = ref(null);
    const loginError = ref('');
    // ============================================
    // GETTERS
    // ============================================
    /**
     * Verifica si el usuario está autenticado
     */
    const isAuthenticated = computed(() => {
        return !!token.value && !!user.value;
    });
    /**
     * Verifica si el usuario tiene un rol específico
     */
    const hasRole = (rol) => {
        return user.value?.roles.includes(rol) || false;
    };
    /**
     * Nombre completo del usuario
     */
    const fullName = computed(() => {
        if (!user.value)
            return '';
        return `${user.value.nombres} ${user.value.apellidos}`;
    });
    /**
     * Roles disponibles para el usuario
     * NOTA: El DISENADOR SÍ puede tener otros roles (ej: PARTICIPANTE + DISENADOR)
     */
    const availableRoles = computed(() => {
        if (!user.value)
            return [];
        return user.value.roles;
    });
    // ============================================
    // ACTIONS
    // ============================================
    /**
     * Login real (para cuando conectes con el backend)
     */
    const login = async (username, password) => {
        try {
            loginError.value = '';
            const response = await api.post('/auth/login', { username, password });
            const roles = normalizeRoles(response.roles);
            token.value = response.token;
            refreshToken.value = response.refreshToken;
            user.value = {
                idUsuario: response.idUsuario,
                username: response.username,
                nombres: response.nombres,
                apellidos: response.apellidos,
                roles,
                tipoParticipante: response.tipoParticipante ?? null
            };
            try {
                localStorage.setItem('token', token.value);
                const perfil = await api.get('/usuarios/me');
                const emailVerificado = perfil.emailVerificado ?? perfil.email_verificado;
                const verificado = emailVerificado === true || emailVerificado === 1 || emailVerificado === 'true';
                if (!verificado) {
                    loginError.value = 'Debes verificar tu correo antes de iniciar sesion.';
                    logout();
                    return false;
                }
                const rawRoles = Array.isArray(perfil.roles)
                    ? perfil.roles
                    : (Array.isArray(perfil.rolesAsignados) ? perfil.rolesAsignados : []);
                if (rawRoles.length > 0) {
                    const roleNames = rawRoles.map((role) => {
                        if (role && typeof role === 'object' && 'nombre' in role) {
                            return String(role.nombre ?? '');
                        }
                        return String(role);
                    });
                    const normalizedPerfilRoles = normalizeRoles(roleNames);
                    user.value = {
                        ...user.value,
                        roles: normalizedPerfilRoles
                    };
                    localStorage.setItem('user', JSON.stringify(user.value));
                }
            }
            catch (error) {
                loginError.value = 'No se pudo validar el estado del correo. Intenta de nuevo.';
                console.warn('No se pudo validar el email verificado:', error);
                logout();
                return false;
            }
            const storedRole = localStorage.getItem('currentRole');
            const normalizedStoredRole = storedRole ? normalizeRoles([storedRole])[0] : null;
            const effectiveRoles = user.value?.roles ?? roles;
            if (normalizedStoredRole && effectiveRoles.includes(normalizedStoredRole)) {
                currentRole.value = normalizedStoredRole;
            }
            else {
                currentRole.value = effectiveRoles[0] || null;
            }
            localStorage.setItem('user', JSON.stringify(user.value));
            localStorage.setItem('token', token.value);
            localStorage.setItem('refreshToken', refreshToken.value);
            if (currentRole.value) {
                localStorage.setItem('currentRole', currentRole.value);
            }
            return true;
        }
        catch (error) {
            loginError.value = error.message || 'Error al iniciar sesion';
            console.error('❌ Error en login:', error);
            return false;
        }
    };
    const register = async (payload) => {
        const response = await api.post('/auth/registro', payload);
        return response.mensaje;
    };
    const verifyEmail = async (payload) => {
        const response = await api.post('/auth/verificar-email', payload);
        return response.mensaje;
    };
    const resendCode = async (username) => {
        const response = await api.post(`/auth/reenviar-codigo?username=${encodeURIComponent(username)}`);
        return response.mensaje;
    };
    // ============================================
    // RESET PASSWORD - 3 pasos
    // ============================================
    /**
     * Paso 1: Solicitar código de reset
     */
    const solicitarResetPassword = async (username) => {
        const response = await api.post('/auth/solicitar-reset-password', {
            username
        });
        return response.mensaje;
    };
    /**
     * Paso 2: Verificar código de reset
     */
    const verificarCodigoReset = async (username, codigo) => {
        const response = await api.post('/auth/verificar-codigo-reset', {
            username,
            codigo
        });
        return response.mensaje;
    };
    /**
     * Paso 3: Cambiar contraseña
     */
    const cambiarPassword = async (username, codigo, newPassword) => {
        const response = await api.post('/auth/cambiar-password', {
            username,
            codigo,
            newPassword
        });
        return response.mensaje;
    };
    /**
     * Cerrar sesión
     */
    const logout = () => {
        const tokenToRevoke = refreshToken.value;
        if (tokenToRevoke) {
            api.post('/auth/logout', { refreshToken: tokenToRevoke }).catch(() => {
                console.warn('No se pudo revocar el refresh token en el backend');
            });
        }
        user.value = null;
        token.value = null;
        refreshToken.value = null;
        currentRole.value = null;
        // Limpiar localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentRole');
        console.log('✅ Sesión cerrada');
    };
    /**
     * Cambiar el rol activo
     */
    const changeRole = (newRole) => {
        if (!user.value) {
            console.error('❌ No hay usuario autenticado');
            return false;
        }
        if (!user.value.roles.includes(newRole)) {
            console.error(`❌ El usuario no tiene el rol: ${newRole}`);
            return false;
        }
        currentRole.value = newRole;
        localStorage.setItem('currentRole', newRole);
        console.log(`✅ Rol cambiado a: ${newRole}`);
        return true;
    };
    /**
     * Actualizar datos del usuario
     */
    const updateUser = (updatedUser) => {
        if (!user.value) {
            console.error('❌ No hay usuario autenticado');
            return;
        }
        user.value = updatedUser;
        // Actualizar en localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('✅ Datos del usuario actualizados');
    };
    /**
     * Restaurar sesión desde localStorage
     */
    const initializeAuth = () => {
        try {
            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('token');
            const savedRefreshToken = localStorage.getItem('refreshToken');
            const savedRole = localStorage.getItem('currentRole');
            if (savedUser && savedToken) {
                const parsedUser = JSON.parse(savedUser);
                const normalizedRoles = normalizeRoles(parsedUser.roles);
                user.value = {
                    ...parsedUser,
                    roles: normalizedRoles
                };
                token.value = savedToken;
                refreshToken.value = savedRefreshToken;
                // Validar que el rol sea válido
                const validRoles = ['ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'PARTICIPANTE', 'AUXILIAR', 'DISENADOR'];
                const normalizedSavedRole = savedRole ? normalizeRoles([savedRole])[0] : null;
                if (normalizedSavedRole && validRoles.includes(normalizedSavedRole)) {
                    currentRole.value = normalizedSavedRole;
                }
                else {
                    // Verificar que user.value no sea null antes de acceder a roles
                    currentRole.value = user.value?.roles[0] || null;
                }
                console.log('✅ Sesión restaurada desde localStorage');
            }
        }
        catch (error) {
            console.error('❌ Error al restaurar sesión:', error);
            logout();
        }
    };
    const refreshAccessToken = async () => {
        if (!refreshToken.value)
            return false;
        try {
            const response = await api.post('/auth/refresh', {
                refreshToken: refreshToken.value
            });
            token.value = response.token;
            refreshToken.value = response.refreshToken;
            localStorage.setItem('token', token.value);
            localStorage.setItem('refreshToken', refreshToken.value);
            return true;
        }
        catch (error) {
            console.warn('No se pudo refrescar el token:', error);
            return false;
        }
    };
    const normalizeRoles = (roles) => {
        return roles.map((role) => {
            const cleaned = role.replace('ROLE_', '').replace('DISEÑADOR', 'DISENADOR');
            return cleaned;
        });
    };
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
        updateUser, // ← AGREGADO
        initializeAuth
    };
});
//# sourceMappingURL=auth.store.js.map