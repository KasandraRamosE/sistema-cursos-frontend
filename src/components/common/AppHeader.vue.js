import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import logo from '@/assets/images/logo.jpg';
// ============================================
// COMPOSABLES
// ============================================
const router = useRouter();
const authStore = useAuthStore();
// ============================================
// ESTADO LOCAL
// ============================================
/** Control del menú mobile */
const showMobileMenu = ref(false);
/** Control del menú de roles */
const showRoleMenu = ref(false);
/** Referencia al menú de roles para cerrar al hacer click fuera */
const roleMenuRef = ref(null);
// ============================================
// COMPUTED
// ============================================
/**
 * Verifica si el usuario puede cambiar de rol
 * Solo si tiene más de un rol
 */
const canChangeRole = computed(() => {
    if (!authStore.user)
        return false;
    const roles = authStore.availableRoles;
    // Solo puede cambiar si tiene más de un rol
    return roles.length > 1;
});
// ============================================
// MÉTODOS
// ============================================
/**
 * Abre/cierra el menú mobile
 */
const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value;
    if (showMobileMenu.value) {
        showRoleMenu.value = false;
    }
};
/**
 * Cierra el menú mobile
 */
const closeMobileMenu = () => {
    showMobileMenu.value = false;
};
/**
 * Abre/cierra el menú de selección de roles
 */
const toggleRoleMenu = () => {
    showRoleMenu.value = !showRoleMenu.value;
};
/**
 * Cambia el rol activo del usuario
 */
const handleChangeRole = (role) => {
    const success = authStore.changeRole(role);
    if (success) {
        showRoleMenu.value = false;
        showMobileMenu.value = false;
        // Redirigir al dashboard correspondiente
        redirectToDashboard(role);
    }
};
/**
 * Redirige al dashboard según el rol
 */
const redirectToDashboard = (role) => {
    const routes = {
        'ADMINISTRADOR': '/admin',
        'COORDINADOR': '/coordinador',
        'DOCENTE': '/docente',
        'PARTICIPANTE': '/participante',
        'AUXILIAR': '/auxiliar/eventos',
        'DISENADOR': '/disenador'
    };
    router.push(routes[role] || '/');
};
/**
 * Obtiene el nombre legible del rol actual
 */
const getCurrentRoleName = () => {
    return getRoleName(authStore.currentRole);
};
/**
 * Obtiene el nombre legible de un rol
 */
const getRoleName = (role) => {
    if (!role)
        return '';
    const roleNames = {
        ADMINISTRADOR: 'Administrador',
        COORDINADOR: 'Coordinador',
        DOCENTE: 'Docente',
        PARTICIPANTE: 'Participante',
        AUXILIAR: 'Auxiliar',
        DISENADOR: 'Diseñador Gráfico'
    };
    return roleNames[role] || role;
};
/**
 * Cierra sesión del usuario
 */
const handleLogout = () => {
    authStore.logout();
    showMobileMenu.value = false;
    showRoleMenu.value = false;
    // Redirigir al home
    router.push('/');
};
/**
 * Cierra el menú de roles al hacer click fuera
 */
const handleClickOutside = (event) => {
    if (roleMenuRef.value && !roleMenuRef.value.contains(event.target)) {
        showRoleMenu.value = false;
    }
};
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    // Escuchar clicks fuera del menú de roles
    document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
    // Limpiar event listener
    document.removeEventListener('click', handleClickOutside);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "bg-white shadow-md sticky top-0 z-50" },
});
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "container mx-auto px-4 py-4" },
});
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/",
    ...{ class: "flex items-center space-x-3 hover:opacity-80 transition" },
}));
const __VLS_2 = __VLS_1({
    to: "/",
    ...{ class: "flex items-center space-x-3 hover:opacity-80 transition" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-80']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-11 h-11 rounded-lg overflow-hidden ring-2 ring-emerald-500/30 bg-white" },
});
/** @type {__VLS_StyleScopedClasses['w-11']} */ ;
/** @type {__VLS_StyleScopedClasses['h-11']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-emerald-500/30']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: (__VLS_ctx.logo),
    alt: "Logo FHCE",
    ...{ class: "w-full h-full object-cover" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-lg font-bold text-gray-800 hidden sm:block" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:block']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-gray-500 hidden md:block" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['md:block']} */ ;
// @ts-ignore
[logo,];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "hidden md:flex items-center space-x-6" },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-6']} */ ;
if (!__VLS_ctx.authStore.isAuthenticated) {
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        to: "/",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }));
    const __VLS_8 = __VLS_7({
        to: "/",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    const { default: __VLS_11 } = __VLS_9.slots;
    // @ts-ignore
    [authStore,];
    var __VLS_9;
}
if (__VLS_ctx.authStore.isAuthenticated && __VLS_ctx.authStore.currentRole === 'PARTICIPANTE') {
    let __VLS_12;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        to: "/participante",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }));
    const __VLS_14 = __VLS_13({
        to: "/participante",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    const { default: __VLS_17 } = __VLS_15.slots;
    // @ts-ignore
    [authStore, authStore,];
    var __VLS_15;
    let __VLS_18;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        to: "/participante/inscripciones",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }));
    const __VLS_20 = __VLS_19({
        to: "/participante/inscripciones",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    const { default: __VLS_23 } = __VLS_21.slots;
    // @ts-ignore
    [];
    var __VLS_21;
    let __VLS_24;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        to: "/participante/certificados",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }));
    const __VLS_26 = __VLS_25({
        to: "/participante/certificados",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    const { default: __VLS_29 } = __VLS_27.slots;
    // @ts-ignore
    [];
    var __VLS_27;
}
if (!__VLS_ctx.authStore.isAuthenticated) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center space-x-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    let __VLS_30;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        to: "/auth/login",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }));
    const __VLS_32 = __VLS_31({
        to: "/auth/login",
        ...{ class: "text-gray-700 hover:text-purple-600 transition-colors font-medium" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    const { default: __VLS_35 } = __VLS_33.slots;
    // @ts-ignore
    [authStore,];
    var __VLS_33;
    let __VLS_36;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        to: "/auth/registro",
        ...{ class: "bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium" },
    }));
    const __VLS_38 = __VLS_37({
        to: "/auth/registro",
        ...{ class: "bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    const { default: __VLS_41 } = __VLS_39.slots;
    // @ts-ignore
    [];
    var __VLS_39;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center space-x-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-4']} */ ;
    if (__VLS_ctx.canChangeRole) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative" },
            ref: "roleMenuRef",
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.toggleRoleMenu) },
            ...{ class: "flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-5 h-5 text-purple-600" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-sm font-medium text-gray-700" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        (__VLS_ctx.getCurrentRoleName());
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-4 h-4 text-gray-500" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M19 9l-7 7-7-7",
        });
        if (__VLS_ctx.showRoleMenu) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-56']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "px-4 py-2 text-xs text-gray-500 font-semibold uppercase" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            for (const [role] of __VLS_vFor((__VLS_ctx.authStore.availableRoles))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(!__VLS_ctx.authStore.isAuthenticated))
                                return;
                            if (!(__VLS_ctx.canChangeRole))
                                return;
                            if (!(__VLS_ctx.showRoleMenu))
                                return;
                            __VLS_ctx.handleChangeRole(role);
                            // @ts-ignore
                            [authStore, canChangeRole, toggleRoleMenu, getCurrentRoleName, showRoleMenu, handleChangeRole,];
                        } },
                    key: (role),
                    ...{ class: ([
                            'w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between',
                            __VLS_ctx.authStore.currentRole === role ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        ]) },
                });
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.getRoleName(role));
                if (__VLS_ctx.authStore.currentRole === role) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                        ...{ class: "w-5 h-5 text-purple-600" },
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                    });
                    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                        'fill-rule': "evenodd",
                        d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                        'clip-rule': "evenodd",
                    });
                }
                // @ts-ignore
                [authStore, authStore, getRoleName,];
            }
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.authStore.fullName);
    if (__VLS_ctx.authStore.currentRole === 'PARTICIPANTE') {
        let __VLS_42;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            to: "/participante/perfil",
            ...{ class: "text-gray-600 hover:text-purple-600 transition-colors" },
            title: "Mi perfil",
        }));
        const __VLS_44 = __VLS_43({
            to: "/participante/perfil",
            ...{ class: "text-gray-600 hover:text-purple-600 transition-colors" },
            title: "Mi perfil",
        }, ...__VLS_functionalComponentArgsRest(__VLS_43));
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        const { default: __VLS_47 } = __VLS_45.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-6 h-6" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        });
        // @ts-ignore
        [authStore, authStore,];
        var __VLS_45;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleLogout) },
        ...{ class: "text-gray-600 hover:text-red-600 transition-colors" },
        title: "Cerrar sesión",
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-6 h-6" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    });
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleMobileMenu) },
    ...{ class: "md:hidden text-gray-700 focus:outline-none" },
});
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-6 h-6" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
if (!__VLS_ctx.showMobileMenu) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M4 6h16M4 12h16M4 18h16",
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
}
if (__VLS_ctx.showMobileMenu) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    if (!__VLS_ctx.authStore.isAuthenticated) {
        let __VLS_48;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            ...{ 'onClick': {} },
            to: "/",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }));
        const __VLS_50 = __VLS_49({
            ...{ 'onClick': {} },
            to: "/",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        let __VLS_53;
        const __VLS_54 = ({ click: {} },
            { onClick: (__VLS_ctx.closeMobileMenu) });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        const { default: __VLS_55 } = __VLS_51.slots;
        // @ts-ignore
        [authStore, handleLogout, toggleMobileMenu, showMobileMenu, showMobileMenu, closeMobileMenu,];
        var __VLS_51;
        var __VLS_52;
    }
    if (__VLS_ctx.authStore.isAuthenticated && __VLS_ctx.authStore.currentRole === 'PARTICIPANTE') {
        let __VLS_56;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
            ...{ 'onClick': {} },
            to: "/participante",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }));
        const __VLS_58 = __VLS_57({
            ...{ 'onClick': {} },
            to: "/participante",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        let __VLS_61;
        const __VLS_62 = ({ click: {} },
            { onClick: (__VLS_ctx.closeMobileMenu) });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        const { default: __VLS_63 } = __VLS_59.slots;
        // @ts-ignore
        [authStore, authStore, closeMobileMenu,];
        var __VLS_59;
        var __VLS_60;
        let __VLS_64;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
            ...{ 'onClick': {} },
            to: "/participante/inscripciones",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }));
        const __VLS_66 = __VLS_65({
            ...{ 'onClick': {} },
            to: "/participante/inscripciones",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        let __VLS_69;
        const __VLS_70 = ({ click: {} },
            { onClick: (__VLS_ctx.closeMobileMenu) });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        const { default: __VLS_71 } = __VLS_67.slots;
        // @ts-ignore
        [closeMobileMenu,];
        var __VLS_67;
        var __VLS_68;
        let __VLS_72;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
            ...{ 'onClick': {} },
            to: "/participante/certificados",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }));
        const __VLS_74 = __VLS_73({
            ...{ 'onClick': {} },
            to: "/participante/certificados",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_73));
        let __VLS_77;
        const __VLS_78 = ({ click: {} },
            { onClick: (__VLS_ctx.closeMobileMenu) });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        const { default: __VLS_79 } = __VLS_75.slots;
        // @ts-ignore
        [closeMobileMenu,];
        var __VLS_75;
        var __VLS_76;
        let __VLS_80;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
            ...{ 'onClick': {} },
            to: "/participante/perfil",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }));
        const __VLS_82 = __VLS_81({
            ...{ 'onClick': {} },
            to: "/participante/perfil",
            ...{ class: "block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        let __VLS_85;
        const __VLS_86 = ({ click: {} },
            { onClick: (__VLS_ctx.closeMobileMenu) });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        const { default: __VLS_87 } = __VLS_83.slots;
        // @ts-ignore
        [closeMobileMenu,];
        var __VLS_83;
        var __VLS_84;
    }
    if (!__VLS_ctx.authStore.isAuthenticated) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-2 pt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        let __VLS_88;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
            ...{ 'onClick': {} },
            to: "/auth/login",
            ...{ class: "block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium" },
        }));
        const __VLS_90 = __VLS_89({
            ...{ 'onClick': {} },
            to: "/auth/login",
            ...{ class: "block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_89));
        let __VLS_93;
        const __VLS_94 = ({ click: {} },
            { onClick: (__VLS_ctx.closeMobileMenu) });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        const { default: __VLS_95 } = __VLS_91.slots;
        // @ts-ignore
        [authStore, closeMobileMenu,];
        var __VLS_91;
        var __VLS_92;
        let __VLS_96;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
            ...{ 'onClick': {} },
            to: "/auth/registro",
            ...{ class: "block w-full text-center bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium" },
        }));
        const __VLS_98 = __VLS_97({
            ...{ 'onClick': {} },
            to: "/auth/registro",
            ...{ class: "block w-full text-center bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        let __VLS_101;
        const __VLS_102 = ({ click: {} },
            { onClick: (__VLS_ctx.closeMobileMenu) });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-blue-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        const { default: __VLS_103 } = __VLS_99.slots;
        // @ts-ignore
        [closeMobileMenu,];
        var __VLS_99;
        var __VLS_100;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-3 pt-2 border-t border-gray-200" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (__VLS_ctx.authStore.fullName);
        if (__VLS_ctx.canChangeRole) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-2" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-500 font-semibold uppercase" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            for (const [role] of __VLS_vFor((__VLS_ctx.authStore.availableRoles))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.showMobileMenu))
                                return;
                            if (!!(!__VLS_ctx.authStore.isAuthenticated))
                                return;
                            if (!(__VLS_ctx.canChangeRole))
                                return;
                            __VLS_ctx.handleChangeRole(role);
                            // @ts-ignore
                            [authStore, authStore, canChangeRole, handleChangeRole,];
                        } },
                    key: (role),
                    ...{ class: ([
                            'w-full text-left px-3 py-2 rounded-lg transition-colors',
                            __VLS_ctx.authStore.currentRole === role
                                ? 'bg-purple-100 text-purple-700 font-semibold'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        ]) },
                });
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
                (__VLS_ctx.getRoleName(role));
                // @ts-ignore
                [authStore, getRoleName,];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.handleLogout) },
            ...{ class: "w-full text-center bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    }
}
// @ts-ignore
[handleLogout,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=AppHeader.vue.js.map