import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import logo from '@/assets/images/logo.jpg';
// =====================================================
// PROPS & EMITS
// =====================================================
// Ya no necesitamos prop "open" desde el padre porque
// el sidebar maneja su propio estado internamente.
// Si necesitas acceso externo, puedes exponer métodos con defineExpose.
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const props = defineProps();
const emit = defineEmits();
// =====================================================
// ESTADO INTERNO
// =====================================================
/** Controla si el sidebar desktop está colapsado */
const isCollapsed = ref(false);
/** Controla si el drawer mobile está abierto */
const isMobileDrawerOpen = ref(false);
/** Controla el menú desplegable de roles */
const showRoleMenu = ref(false);
/** Referencias para click-outside */
const roleMenuRef = ref(null);
const roleMenuMobileRef = ref(null);
// =====================================================
// PERSISTENCIA DEL ESTADO COLAPSADO
// =====================================================
const COLLAPSED_KEY = 'sidebar_collapsed';
onMounted(() => {
    // Restaurar estado colapsado desde localStorage
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved !== null) {
        isCollapsed.value = saved === 'true';
    }
    document.addEventListener('click', handleClickOutside);
});
watch(() => props.mobileOpen, (value) => {
    if (typeof value === 'boolean') {
        isMobileDrawerOpen.value = value;
    }
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
// =====================================================
// ÍCONOS (componentes inline para evitar dependencias)
// =====================================================
const IconDashboard = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>` };
const IconUsers = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>` };
const IconBook = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>` };
const IconCalendar = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` };
const IconClipboard = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>` };
const IconAward = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>` };
const IconInbox = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>` };
const IconPhoto = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` };
const IconCheckCircle = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` };
const IconChart = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3v18m4-13v13m4-9v9M5 13v8" /></svg>` };
// =====================================================
// COMPUTED
// =====================================================
const canChangeRole = computed(() => authStore.availableRoles.length > 1);
/** Iniciales del usuario para el avatar colapsado */
const userInitials = computed(() => {
    const name = authStore.fullName || '';
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
});
/** Ítems de navegación según el rol actual */
const navigationItems = computed(() => {
    const role = authStore.currentRole;
    switch (role) {
        case 'ADMINISTRADOR':
            return [
                { name: 'dashboard', label: 'Dashboard', shortLabel: 'Inicio', path: '/admin', icon: IconDashboard },
                { name: 'users', label: 'Usuarios', shortLabel: 'Usuarios', path: '/admin/usuarios', icon: IconUsers },
                { name: 'activities', label: 'Actividades', shortLabel: 'Act.', path: '/admin/actividades', icon: IconCalendar },
                { name: 'inscriptions', label: 'Inscripciones', shortLabel: 'Inscrip.', path: '/admin/inscripciones', icon: IconClipboard },
                { name: 'grades', label: 'Calificaciones', shortLabel: 'Notas', path: '/admin/calificaciones', icon: IconCheckCircle },
                { name: 'attendance', label: 'Asistencias', shortLabel: 'Asist.', path: '/admin/asistencias', icon: IconCheckCircle },
                { name: 'certificates', label: 'Certificados', shortLabel: 'Certif.', path: '/admin/certificados', icon: IconAward },
            ];
        case 'COORDINADOR':
            return [
                { name: 'dashboard', label: 'Dashboard', shortLabel: 'Inicio', path: '/coordinador', icon: IconDashboard },
                { name: 'activities', label: 'Cursos', shortLabel: 'Act.', path: '/coordinador/actividades', icon: IconCalendar },
                { name: 'events', label: 'Eventos', shortLabel: 'Eventos', path: '/coordinador/eventos', icon: IconCalendar },
                { name: 'enrolled', label: 'Inscritos', shortLabel: 'Inscrip.', path: '/coordinador/inscritos', icon: IconClipboard },
                { name: 'reports', label: 'Reportes', shortLabel: 'Reportes', path: '/coordinador/reportes', icon: IconChart },
                { name: 'inbox', label: 'Bandeja', shortLabel: 'Bandeja', path: '/coordinador/bandeja', icon: IconInbox },
                { name: 'designers', label: 'Diseñadores', shortLabel: 'Diseñ.', path: '/coordinador/disenadores', icon: IconPhoto },
                { name: 'emit', label: 'Emitir Certificados', shortLabel: 'Emitir', path: '/coordinador/emitir', icon: IconAward },
            ];
        case 'DOCENTE':
            return [
                { name: 'dashboard', label: 'Dashboard', shortLabel: 'Inicio', path: '/docente', icon: IconDashboard },
                { name: 'courses', label: 'Mis Cursos', shortLabel: 'Cursos', path: '/docente/mis-cursos', icon: IconBook },
                { name: 'grades', label: 'Calificaciones', shortLabel: 'Notas', path: '/docente/calificaciones', icon: IconClipboard },
            ];
        case 'AUXILIAR':
            return [
                { name: 'events', label: 'Mis Eventos', shortLabel: 'Eventos', path: '/auxiliar/eventos', icon: IconCalendar },
            ];
        case 'DISENADOR':
            return [
                { name: 'templates', label: 'Plantillas', shortLabel: 'Plantillas', path: '/disenador/plantillas', icon: IconPhoto },
                { name: 'my-templates', label: 'Mis Plantillas', shortLabel: 'MisPlant.', path: '/disenador/mis-plantillas', icon: IconInbox },
            ];
        default:
            return [];
    }
});
/**
 * Los primeros 4 ítems van en la barra inferior mobile.
 * Si hay 4 o menos, no aparece el botón "Más".
 */
const mobileBottomItems = computed(() => navigationItems.value.slice(0, 4));
// =====================================================
// MÉTODOS
// =====================================================
/** Alterna el estado colapsado del sidebar desktop y lo persiste */
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    localStorage.setItem(COLLAPSED_KEY, String(isCollapsed.value));
};
const openMobileDrawer = () => { isMobileDrawerOpen.value = true; };
const closeMobileDrawer = () => {
    isMobileDrawerOpen.value = false;
    emit('close');
};
/** Ruta activa: exacta para dashboards, prefijo para el resto */
const isActive = (path) => {
    const dashboards = ['/admin', '/coordinador', '/docente', '/auxiliar', '/disenador'];
    if (dashboards.includes(path)) {
        return route.path === path;
    }
    return route.path === path || route.path.startsWith(path + '/');
};
const getRoleName = () => {
    const roleNames = {
        ADMINISTRADOR: 'Administrador',
        COORDINADOR: 'Coordinador',
        DOCENTE: 'Docente',
        PARTICIPANTE: 'Participante',
        AUXILIAR: 'Auxiliar',
        DISENADOR: 'Diseñador',
    };
    return authStore.currentRole ? roleNames[authStore.currentRole] ?? 'Usuario' : 'Usuario';
};
const getRoleNameForOption = (role) => {
    const roleNames = {
        ADMINISTRADOR: 'Administrador',
        COORDINADOR: 'Coordinador',
        DOCENTE: 'Docente',
        PARTICIPANTE: 'Participante',
        AUXILIAR: 'Auxiliar',
        DISENADOR: 'Diseñador',
    };
    return roleNames[role] ?? role;
};
const toggleRoleMenu = () => { showRoleMenu.value = !showRoleMenu.value; };
const handleChangeRole = (role) => {
    const success = authStore.changeRole(role);
    if (success) {
        showRoleMenu.value = false;
        const routes = {
            ADMINISTRADOR: '/admin',
            COORDINADOR: '/coordinador',
            DOCENTE: '/docente',
            PARTICIPANTE: '/participante',
            AUXILIAR: '/auxiliar/eventos',
            DISENADOR: '/disenador',
        };
        router.push(routes[role] || '/');
    }
};
const handleLogout = () => {
    authStore.logout();
    router.push('/');
};
/** Cierra el menú de roles si se hace click fuera */
const handleClickOutside = (event) => {
    const target = event.target;
    const outside = (!roleMenuRef.value || !roleMenuRef.value.contains(target)) &&
        (!roleMenuMobileRef.value || !roleMenuMobileRef.value.contains(target));
    if (outside) {
        showRoleMenu.value = false;
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['sidebar-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-scroll']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
if (__VLS_ctx.isMobileDrawerOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeMobileDrawer) },
        ...{ class: "fixed inset-0 z-30 bg-black/40 md:hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 sticky top-0" },
    ...{ class: (__VLS_ctx.isCollapsed ? 'w-16' : 'w-64') },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border-r']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "border-b border-gray-200 flex-shrink-0 flex items-center" },
    ...{ class: (__VLS_ctx.isCollapsed ? 'justify-center p-3' : 'justify-between p-4') },
});
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/",
    ...{ class: "flex items-center hover:opacity-80 transition" },
    ...{ class: (__VLS_ctx.isCollapsed ? 'justify-center' : 'space-x-3') },
}));
const __VLS_2 = __VLS_1({
    to: "/",
    ...{ class: "flex items-center hover:opacity-80 transition" },
    ...{ class: (__VLS_ctx.isCollapsed ? 'justify-center' : 'space-x-3') },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-80']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-9 h-9 rounded-lg overflow-hidden bg-white ring-1 ring-purple-200 flex items-center justify-center flex-shrink-0" },
});
/** @type {__VLS_StyleScopedClasses['w-9']} */ ;
/** @type {__VLS_StyleScopedClasses['h-9']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-purple-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: (__VLS_ctx.logo),
    alt: "Logo FHCE",
    ...{ class: "w-full h-full object-cover" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
if (!__VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-sm font-bold text-gray-800 leading-tight" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.getRoleName());
}
// @ts-ignore
[isMobileDrawerOpen, closeMobileDrawer, isCollapsed, isCollapsed, isCollapsed, isCollapsed, logo, getRoleName,];
var __VLS_3;
if (!__VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleCollapse) },
        ...{ class: "p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" },
        title: "Contraer menú",
    });
    /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-4 h-4" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M11 19l-7-7 7-7m8 14l-7-7 7-7",
    });
}
if (__VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleCollapse) },
        ...{ class: "mx-auto mt-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" },
        title: "Expandir menú",
    });
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-4 h-4" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M13 5l7 7-7 7M5 5l7 7-7 7",
    });
}
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "flex-1 py-3 overflow-y-auto sidebar-scroll" },
    ...{ class: (__VLS_ctx.isCollapsed ? 'px-1' : 'px-3') },
});
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-scroll']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.navigationItems))) {
    (item.name);
    if (__VLS_ctx.isCollapsed) {
        let __VLS_6;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            to: (item.path),
            title: (item.label),
            ...{ class: "flex flex-col items-center justify-center w-12 h-14 mx-auto mb-1 rounded-lg transition-all relative gap-0.5" },
            ...{ class: (__VLS_ctx.isActive(item.path)
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700') },
        }));
        const __VLS_8 = __VLS_7({
            to: (item.path),
            title: (item.label),
            ...{ class: "flex flex-col items-center justify-center w-12 h-14 mx-auto mb-1 rounded-lg transition-all relative gap-0.5" },
            ...{ class: (__VLS_ctx.isActive(item.path)
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700') },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
        const { default: __VLS_11 } = __VLS_9.slots;
        const __VLS_12 = (item.icon);
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            ...{ class: "w-5 h-5 flex-shrink-0" },
        }));
        const __VLS_14 = __VLS_13({
            ...{ class: "w-5 h-5 flex-shrink-0" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-[9px] font-medium leading-tight text-center max-w-full px-0.5 truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (item.shortLabel || item.label.split(' ')[0]);
        if (item.badge) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['-top-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['-right-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (item.badge);
        }
        // @ts-ignore
        [isCollapsed, isCollapsed, isCollapsed, isCollapsed, toggleCollapse, toggleCollapse, navigationItems, isActive,];
        var __VLS_9;
    }
    else {
        let __VLS_17;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            to: (item.path),
            ...{ class: "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1" },
            ...{ class: (__VLS_ctx.isActive(item.path)
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100') },
        }));
        const __VLS_19 = __VLS_18({
            to: (item.path),
            ...{ class: "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1" },
            ...{ class: (__VLS_ctx.isActive(item.path)
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100') },
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        const { default: __VLS_22 } = __VLS_20.slots;
        const __VLS_23 = (item.icon);
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
            ...{ class: "w-5 h-5 flex-shrink-0" },
        }));
        const __VLS_25 = __VLS_24({
            ...{ class: "w-5 h-5 flex-shrink-0" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "flex-1 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        (item.label);
        if (item.badge) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (item.badge);
        }
        // @ts-ignore
        [isActive,];
        var __VLS_20;
    }
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "border-t border-gray-200 flex-shrink-0" },
    ...{ class: (__VLS_ctx.isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2') },
});
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
if (__VLS_ctx.canChangeRole && !__VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative" },
        ref: "roleMenuRef",
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleRoleMenu) },
        ...{ class: "w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center space-x-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-4 h-4 text-purple-600 flex-shrink-0" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-gray-700 font-medium text-xs" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-3.5 h-3.5 text-gray-500" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M19 9l-7 7-7-7",
    });
    if (__VLS_ctx.showRoleMenu) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 pb-1 text-xs text-gray-400 font-semibold uppercase tracking-wider" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
        for (const [role] of __VLS_vFor((__VLS_ctx.authStore.availableRoles))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.canChangeRole && !__VLS_ctx.isCollapsed))
                            return;
                        if (!(__VLS_ctx.showRoleMenu))
                            return;
                        __VLS_ctx.handleChangeRole(role);
                        // @ts-ignore
                        [isCollapsed, isCollapsed, canChangeRole, toggleRoleMenu, showRoleMenu, authStore, handleChangeRole,];
                    } },
                key: (role),
                ...{ class: "w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm flex items-center justify-between" },
                ...{ class: (__VLS_ctx.authStore.currentRole === role ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700') },
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.getRoleNameForOption(role));
            if (__VLS_ctx.authStore.currentRole === role) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    ...{ class: "w-4 h-4 text-purple-600" },
                    fill: "currentColor",
                    viewBox: "0 0 20 20",
                });
                /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                    'fill-rule': "evenodd",
                    d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                    'clip-rule': "evenodd",
                });
            }
            // @ts-ignore
            [authStore, authStore, getRoleNameForOption,];
        }
    }
}
if (__VLS_ctx.canChangeRole && __VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleCollapse) },
        ...{ class: "flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-gray-400 hover:bg-gray-100 hover:text-purple-600 transition-colors" },
        title: "Expandir para cambiar rol",
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-5 h-5" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    });
}
if (!__VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "px-3 py-2 bg-gray-50 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs font-semibold text-gray-800 truncate" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    (__VLS_ctx.authStore.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500 truncate" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    (__VLS_ctx.getRoleName());
}
if (__VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-purple-100 text-purple-700 font-semibold text-sm" },
        title: (__VLS_ctx.authStore.fullName),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-purple-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-purple-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_ctx.userInitials);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleLogout) },
    title: (__VLS_ctx.isCollapsed ? 'Cerrar sesión' : undefined),
    ...{ class: "w-full flex items-center rounded-lg transition-colors text-sm font-medium text-red-600 hover:bg-red-50" },
    ...{ class: (__VLS_ctx.isCollapsed ? 'justify-center p-2' : 'space-x-2 px-3 py-2') },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-5 h-5 flex-shrink-0" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
});
if (!__VLS_ctx.isCollapsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl flex flex-col h-screen transform transition-transform duration-300 md:hidden" },
    ...{ class: (__VLS_ctx.isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full') },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['w-64']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0" },
});
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
let __VLS_28;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    to: "/",
    ...{ class: "flex items-center space-x-3 hover:opacity-80 transition" },
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    to: "/",
    ...{ class: "flex items-center space-x-3 hover:opacity-80 transition" },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_33;
const __VLS_34 = ({ click: {} },
    { onClick: (__VLS_ctx.closeMobileDrawer) });
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-80']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
const { default: __VLS_35 } = __VLS_31.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-9 h-9 rounded-lg overflow-hidden bg-white ring-1 ring-purple-200 flex items-center justify-center" },
});
/** @type {__VLS_StyleScopedClasses['w-9']} */ ;
/** @type {__VLS_StyleScopedClasses['h-9']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-purple-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: (__VLS_ctx.logo),
    alt: "Logo FHCE",
    ...{ class: "w-full h-full object-cover" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "text-sm font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-gray-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
(__VLS_ctx.getRoleName());
// @ts-ignore
[isMobileDrawerOpen, closeMobileDrawer, isCollapsed, isCollapsed, isCollapsed, isCollapsed, isCollapsed, isCollapsed, logo, getRoleName, getRoleName, toggleCollapse, canChangeRole, authStore, authStore, userInitials, handleLogout,];
var __VLS_31;
var __VLS_32;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.closeMobileDrawer) },
    ...{ class: "p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" },
});
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-5 h-5" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M6 18L18 6M6 6l12 12",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "flex-1 px-3 py-3 space-y-1 overflow-y-auto sidebar-scroll" },
});
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-scroll']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.navigationItems))) {
    let __VLS_36;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        ...{ 'onClick': {} },
        to: (item.path),
        ...{ class: "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all" },
        ...{ class: (__VLS_ctx.isActive(item.path)
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100') },
        key: (item.name),
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onClick': {} },
        to: (item.path),
        ...{ class: "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all" },
        ...{ class: (__VLS_ctx.isActive(item.path)
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100') },
        key: (item.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_41;
    const __VLS_42 = ({ click: {} },
        { onClick: (__VLS_ctx.closeMobileDrawer) });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    const { default: __VLS_43 } = __VLS_39.slots;
    const __VLS_44 = (item.icon);
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        ...{ class: "w-5 h-5 flex-shrink-0" },
    }));
    const __VLS_46 = __VLS_45({
        ...{ class: "w-5 h-5 flex-shrink-0" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "flex-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (item.label);
    if (item.badge) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (item.badge);
    }
    // @ts-ignore
    [closeMobileDrawer, closeMobileDrawer, navigationItems, isActive,];
    var __VLS_39;
    var __VLS_40;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "border-t border-gray-200 p-3 space-y-2 flex-shrink-0" },
});
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
if (__VLS_ctx.canChangeRole) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative" },
        ref: "roleMenuMobileRef",
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleRoleMenu) },
        ...{ class: "w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center space-x-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-4 h-4 text-purple-600" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-gray-700 font-medium text-xs" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-3.5 h-3.5 text-gray-500" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M19 9l-7 7-7-7",
    });
    if (__VLS_ctx.showRoleMenu) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 pb-1 text-xs text-gray-400 font-semibold uppercase tracking-wider" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
        for (const [role] of __VLS_vFor((__VLS_ctx.authStore.availableRoles))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.canChangeRole))
                            return;
                        if (!(__VLS_ctx.showRoleMenu))
                            return;
                        __VLS_ctx.handleChangeRole(role);
                        // @ts-ignore
                        [canChangeRole, toggleRoleMenu, showRoleMenu, authStore, handleChangeRole,];
                    } },
                key: (role),
                ...{ class: "w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm flex items-center justify-between" },
                ...{ class: (__VLS_ctx.authStore.currentRole === role ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700') },
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.getRoleNameForOption(role));
            if (__VLS_ctx.authStore.currentRole === role) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    ...{ class: "w-4 h-4 text-purple-600" },
                    fill: "currentColor",
                    viewBox: "0 0 20 20",
                });
                /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                    'fill-rule': "evenodd",
                    d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                    'clip-rule': "evenodd",
                });
            }
            // @ts-ignore
            [authStore, authStore, getRoleNameForOption,];
        }
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "px-3 py-2 bg-gray-50 rounded-lg" },
});
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs font-semibold text-gray-800 truncate" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
(__VLS_ctx.authStore.fullName);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-gray-500 truncate" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
(__VLS_ctx.getRoleName());
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleLogout) },
    ...{ class: "w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-5 h-5" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-safe" },
});
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-30']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-around']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-safe']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.mobileBottomItems))) {
    let __VLS_49;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        to: (item.path),
        ...{ class: "flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors relative" },
        ...{ class: (__VLS_ctx.isActive(item.path) ? 'text-purple-700' : 'text-gray-500') },
        key: (item.name),
    }));
    const __VLS_51 = __VLS_50({
        to: (item.path),
        ...{ class: "flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors relative" },
        ...{ class: (__VLS_ctx.isActive(item.path) ? 'text-purple-700' : 'text-gray-500') },
        key: (item.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    const { default: __VLS_54 } = __VLS_52.slots;
    const __VLS_55 = (item.icon);
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
        ...{ class: "w-6 h-6 flex-shrink-0" },
    }));
    const __VLS_57 = __VLS_56({
        ...{ class: "w-6 h-6 flex-shrink-0" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xs mt-0.5 truncate w-full text-center leading-tight" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
    (item.shortLabel || item.label);
    if (item.badge) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute top-1 right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (item.badge);
    }
    // @ts-ignore
    [getRoleName, isActive, authStore, handleLogout, mobileBottomItems,];
    var __VLS_52;
    // @ts-ignore
    [];
}
if (__VLS_ctx.navigationItems.length > 4) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openMobileDrawer) },
        ...{ class: "flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors" },
        ...{ class: (__VLS_ctx.isMobileDrawerOpen ? 'text-purple-700' : 'text-gray-500') },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
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
        d: "M4 6h16M4 12h16M4 18h16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xs mt-0.5" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
}
// @ts-ignore
[isMobileDrawerOpen, navigationItems, openMobileDrawer,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
//# sourceMappingURL=Sidebar.vue.js.map