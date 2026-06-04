import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import { api } from '@/utils/api';
// ============================================
// COMPOSABLES
// ============================================
const authStore = useAuthStore();
// ============================================
// ESTADO
// ============================================
const modoEdicion = ref(false);
const guardando = ref(false);
const mostrarCambioPassword = ref(false);
const mostrarPasswordActual = ref(false);
const mostrarPasswordNueva = ref(false);
const mostrarPasswordConfirmar = ref(false);
const feedbackMessage = ref('');
const feedbackType = ref('success');
// Datos del formulario
const formData = reactive({
    ci: '',
    nombres: '',
    apellidos: '',
    email: ''
});
const perfil = ref(null);
const stats = reactive({
    inscripciones: 0,
    certificados: 0,
    horasTotales: 0
});
// Backup de datos originales
let datosOriginales = {};
// Datos de cambio de contraseña
const passwordData = reactive({
    actual: '',
    nueva: '',
    confirmar: ''
});
// ============================================
// MÉTODOS
// ============================================
const esExterno = computed(() => {
    if (perfil.value?.tipoUsuario) {
        return perfil.value.tipoUsuario === 'EXTERNO';
    }
    return authStore.user?.tipoParticipante === 'EXTERNO';
});
const cargarEstadisticas = async () => {
    try {
        const [inscripcionesResponse, certificadosResponse] = await Promise.all([
            api.get('/inscripciones/mis-inscripciones'),
            api.get('/certificados/mis-certificados')
        ]);
        const inscripciones = inscripcionesResponse;
        const certificados = certificadosResponse
            .filter(cert => String(cert.estadoEmision ?? '') !== 'ANULADO');
        stats.inscripciones = inscripciones.length;
        stats.certificados = certificados.length;
        stats.horasTotales = certificados.reduce((sum, cert) => {
            const horas = cert.cargaHoraria !== undefined && cert.cargaHoraria !== null
                ? Number(cert.cargaHoraria)
                : 0;
            return sum + horas;
        }, 0);
    }
    catch (error) {
        console.error('Error al cargar estadisticas:', error);
        stats.inscripciones = 0;
        stats.certificados = 0;
        stats.horasTotales = 0;
    }
};
/**
 * Carga los datos del usuario
 */
const cargarDatos = async () => {
    if (!authStore.user)
        return;
    try {
        const response = await api.get('/usuarios/me');
        perfil.value = response;
        formData.ci = response.ci ?? '';
        formData.nombres = response.nombres;
        formData.apellidos = response.apellidos;
        formData.email = response.email;
        if (authStore.user) {
            authStore.updateUser({
                ...authStore.user,
                nombres: response.nombres,
                apellidos: response.apellidos
            });
        }
    }
    catch (error) {
        console.error('Error al cargar perfil:', error);
        formData.ci = '';
        formData.nombres = authStore.user.nombres;
        formData.apellidos = authStore.user.apellidos;
        formData.email = '';
    }
    // Guardar copia de datos originales
    datosOriginales = { ...formData };
};
/**
 * Activa el modo edición
 */
const activarEdicion = () => {
    if (!esExterno.value) {
        feedbackMessage.value = 'Solo usuarios externos pueden editar su perfil.';
        feedbackType.value = 'error';
        return;
    }
    modoEdicion.value = true;
    feedbackMessage.value = '';
};
/**
 * Cancela la edición y restaura datos originales
 */
const cancelarEdicion = () => {
    Object.assign(formData, datosOriginales);
    modoEdicion.value = false;
    mostrarCambioPassword.value = false;
    mostrarPasswordActual.value = false;
    mostrarPasswordNueva.value = false;
    mostrarPasswordConfirmar.value = false;
    feedbackMessage.value = '';
    // Limpiar campos de contraseña
    passwordData.actual = '';
    passwordData.nueva = '';
    passwordData.confirmar = '';
};
/**
 * Guarda los cambios del perfil
 */
const guardarCambios = async () => {
    if (!esExterno.value) {
        feedbackMessage.value = 'Solo usuarios externos pueden editar su perfil.';
        feedbackType.value = 'error';
        return;
    }
    // Validar contraseñas si se está cambiando
    if (mostrarCambioPassword.value || (passwordData.nueva && passwordData.confirmar)) {
        if (!passwordData.actual) {
            feedbackMessage.value = 'Debes ingresar tu contrasena actual.';
            feedbackType.value = 'error';
            return;
        }
        if (passwordData.nueva !== passwordData.confirmar) {
            feedbackMessage.value = 'Las contrasenas no coinciden.';
            feedbackType.value = 'error';
            return;
        }
        if (passwordData.nueva.length < 6) {
            feedbackMessage.value = 'La contrasena debe tener al menos 6 caracteres.';
            feedbackType.value = 'error';
            return;
        }
    }
    guardando.value = true;
    try {
        if (mostrarCambioPassword.value || (passwordData.nueva && passwordData.confirmar)) {
            await api.post('/usuarios/me/password', {
                passwordActual: passwordData.actual,
                passwordNueva: passwordData.nueva
            });
        }
        const response = await api.put('/usuarios/me', {
            ci: formData.ci,
            nombres: formData.nombres,
            apellidos: formData.apellidos
        });
        perfil.value = response;
        // Actualizar datos en el store
        if (authStore.user) {
            authStore.updateUser({
                ...authStore.user,
                ci: formData.ci,
                nombres: formData.nombres,
                apellidos: formData.apellidos
            });
        }
        // Actualizar datos originales
        datosOriginales = { ...formData };
        modoEdicion.value = false;
        mostrarCambioPassword.value = false;
        mostrarPasswordActual.value = false;
        mostrarPasswordNueva.value = false;
        mostrarPasswordConfirmar.value = false;
        // Limpiar campos de contraseña
        passwordData.actual = '';
        passwordData.nueva = '';
        passwordData.confirmar = '';
        feedbackMessage.value = 'Perfil actualizado correctamente.';
        feedbackType.value = 'success';
    }
    catch (error) {
        console.error('Error al guardar:', error);
        feedbackMessage.value = error.message || 'Error al guardar los cambios.';
        feedbackType.value = 'error';
    }
    finally {
        guardando.value = false;
    }
};
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    cargarDatos();
    cargarEstadisticas();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "container mx-auto px-4 py-8" },
});
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-8" },
});
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-3xl font-bold text-gray-800 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "lg:col-span-1 space-y-6" },
});
/** @type {__VLS_StyleScopedClasses['lg:col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto" },
});
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
/** @type {__VLS_StyleScopedClasses['h-24']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-10 h-10 text-slate-400" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "text-xl font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.authStore.fullName);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
(__VLS_ctx.perfil?.email || '-');
const __VLS_6 = Badge || Badge;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    variant: (__VLS_ctx.esExterno ? 'secondary' : 'primary'),
    size: "sm",
    ...{ class: "mt-2" },
}));
const __VLS_8 = __VLS_7({
    variant: (__VLS_ctx.esExterno ? 'secondary' : 'primary'),
    size: "sm",
    ...{ class: "mt-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
(__VLS_ctx.esExterno ? 'Usuario Externo' : 'Usuario UMSA');
// @ts-ignore
[authStore, perfil, esExterno, esExterno,];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
const __VLS_12 = Card || Card;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "font-semibold text-gray-800 mb-3" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between py-2 border-b border-gray-200" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-semibold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.stats.inscripciones);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between py-2 border-b border-gray-200" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-semibold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.stats.certificados);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between py-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-semibold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.stats.horasTotales);
// @ts-ignore
[stats, stats, stats,];
var __VLS_15;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "lg:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['lg:col-span-2']} */ ;
const __VLS_18 = Card || Card;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.guardarCambios) },
    ...{ class: "space-y-6" },
});
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-semibold text-gray-800 mb-4" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-500" },
});
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.formData.nombres),
    type: "text",
    required: true,
    disabled: (!__VLS_ctx.modoEdicion),
    ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:text-gray-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-500" },
});
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.formData.apellidos),
    type: "text",
    required: true,
    disabled: (!__VLS_ctx.modoEdicion),
    ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:text-gray-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-500" },
});
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "email",
    required: true,
    disabled: true,
    ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" },
});
(__VLS_ctx.formData.email);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:text-gray-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-500" },
});
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.formData.ci),
    type: "text",
    required: true,
    disabled: (!__VLS_ctx.modoEdicion),
    placeholder: "Ej: 1234567 LP",
    ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:text-gray-500']} */ ;
if (__VLS_ctx.esExterno) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "border-t border-gray-200 pt-6" },
    });
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    if (!__VLS_ctx.modoEdicion) {
        const __VLS_24 = Button || Button;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
            type: "button",
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
            type: "button",
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_29;
        const __VLS_30 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.esExterno))
                        return;
                    if (!(!__VLS_ctx.modoEdicion))
                        return;
                    __VLS_ctx.mostrarCambioPassword = !__VLS_ctx.mostrarCambioPassword;
                    // @ts-ignore
                    [esExterno, guardarCambios, formData, formData, formData, formData, modoEdicion, modoEdicion, modoEdicion, modoEdicion, mostrarCambioPassword, mostrarCambioPassword,];
                } });
        const { default: __VLS_31 } = __VLS_27.slots;
        (__VLS_ctx.mostrarCambioPassword ? 'Cancelar' : 'Cambiar contraseña');
        // @ts-ignore
        [mostrarCambioPassword,];
        var __VLS_27;
        var __VLS_28;
    }
    if (__VLS_ctx.mostrarCambioPassword || __VLS_ctx.modoEdicion) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-4" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: (__VLS_ctx.mostrarPasswordActual ? 'text' : 'password'),
            ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10" },
        });
        (__VLS_ctx.passwordData.actual);
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.esExterno))
                        return;
                    if (!(__VLS_ctx.mostrarCambioPassword || __VLS_ctx.modoEdicion))
                        return;
                    __VLS_ctx.mostrarPasswordActual = !__VLS_ctx.mostrarPasswordActual;
                    // @ts-ignore
                    [modoEdicion, mostrarCambioPassword, mostrarPasswordActual, mostrarPasswordActual, mostrarPasswordActual, passwordData,];
                } },
            type: "button",
            ...{ class: "absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700" },
            'aria-label': "Mostrar u ocultar contrasena actual",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
        if (!__VLS_ctx.mostrarPasswordActual) {
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
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            });
        }
        else {
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
                d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.132-3.368",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M6.223 6.223A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.057",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M3 3l18 18",
            });
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: (__VLS_ctx.mostrarPasswordNueva ? 'text' : 'password'),
            ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10" },
        });
        (__VLS_ctx.passwordData.nueva);
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.esExterno))
                        return;
                    if (!(__VLS_ctx.mostrarCambioPassword || __VLS_ctx.modoEdicion))
                        return;
                    __VLS_ctx.mostrarPasswordNueva = !__VLS_ctx.mostrarPasswordNueva;
                    // @ts-ignore
                    [mostrarPasswordActual, passwordData, mostrarPasswordNueva, mostrarPasswordNueva, mostrarPasswordNueva,];
                } },
            type: "button",
            ...{ class: "absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700" },
            'aria-label': "Mostrar u ocultar nueva contrasena",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
        if (!__VLS_ctx.mostrarPasswordNueva) {
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
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            });
        }
        else {
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
                d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.132-3.368",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M6.223 6.223A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.057",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M3 3l18 18",
            });
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: (__VLS_ctx.mostrarPasswordConfirmar ? 'text' : 'password'),
            ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10" },
        });
        (__VLS_ctx.passwordData.confirmar);
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.esExterno))
                        return;
                    if (!(__VLS_ctx.mostrarCambioPassword || __VLS_ctx.modoEdicion))
                        return;
                    __VLS_ctx.mostrarPasswordConfirmar = !__VLS_ctx.mostrarPasswordConfirmar;
                    // @ts-ignore
                    [passwordData, mostrarPasswordNueva, mostrarPasswordConfirmar, mostrarPasswordConfirmar, mostrarPasswordConfirmar,];
                } },
            type: "button",
            ...{ class: "absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700" },
            'aria-label': "Mostrar u ocultar confirmar contrasena",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
        if (!__VLS_ctx.mostrarPasswordConfirmar) {
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
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            });
        }
        else {
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
                d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.132-3.368",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M6.223 6.223A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.057",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M3 3l18 18",
            });
        }
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end space-x-3 pt-6 border-t border-gray-200" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
if (!__VLS_ctx.modoEdicion && __VLS_ctx.esExterno) {
    const __VLS_32 = Button || Button;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        ...{ 'onClick': {} },
        variant: "primary",
        type: "button",
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onClick': {} },
        variant: "primary",
        type: "button",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_37;
    const __VLS_38 = ({ click: {} },
        { onClick: (__VLS_ctx.activarEdicion) });
    const { default: __VLS_39 } = __VLS_35.slots;
    // @ts-ignore
    [esExterno, modoEdicion, mostrarPasswordConfirmar, activarEdicion,];
    var __VLS_35;
    var __VLS_36;
}
else if (!__VLS_ctx.modoEdicion) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
}
else {
    const __VLS_40 = Button || Button;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        ...{ 'onClick': {} },
        variant: "outline",
        type: "button",
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onClick': {} },
        variant: "outline",
        type: "button",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_45;
    const __VLS_46 = ({ click: {} },
        { onClick: (__VLS_ctx.cancelarEdicion) });
    const { default: __VLS_47 } = __VLS_43.slots;
    // @ts-ignore
    [modoEdicion, cancelarEdicion,];
    var __VLS_43;
    var __VLS_44;
    const __VLS_48 = Button || Button;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
        variant: "primary",
        type: "submit",
        disabled: (__VLS_ctx.guardando),
    }));
    const __VLS_50 = __VLS_49({
        variant: "primary",
        type: "submit",
        disabled: (__VLS_ctx.guardando),
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    const { default: __VLS_53 } = __VLS_51.slots;
    (__VLS_ctx.guardando ? 'Guardando...' : 'Guardar Cambios');
    // @ts-ignore
    [guardando, guardando,];
    var __VLS_51;
}
if (__VLS_ctx.feedbackMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "pt-2 text-sm" },
        ...{ class: (__VLS_ctx.feedbackType === 'error' ? 'text-red-600' : 'text-emerald-600') },
    });
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_ctx.feedbackMessage);
}
// @ts-ignore
[feedbackMessage, feedbackMessage, feedbackType,];
var __VLS_21;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Perfil.vue.js.map