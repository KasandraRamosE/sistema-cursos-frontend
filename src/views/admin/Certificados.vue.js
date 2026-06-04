import { ref, computed, onMounted } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import Pagination from '@/components/common/Pagination.vue';
import { usePagination } from '@/composables/usePagination';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil } from '@/utils/dateFormatter';
// ============================================
// ESTADO
// ============================================
const loading = ref(false);
const procesando = ref(false);
const certificados = ref([]);
const estadisticas = ref({
    certificadosEmitidos: 0,
    certificadosAnulados: 0,
    certificadosReemitidos: 0,
    totalCertificados: 0
});
const filtrosCertificados = ref({
    busqueda: '',
    estado: '',
    tipo: ''
});
// Modales
const showAnularModal = ref(false);
const certificadoSeleccionado = ref(null);
// Anulación
const motivoAnulacion = ref('');
// ============================================
// COMPUTED
// ============================================
const certificadosFiltrados = computed(() => {
    const certificadosOrdenados = [...certificados.value].sort((a, b) => {
        const fechaA = new Date(a.fechaEmision).getTime();
        const fechaB = new Date(b.fechaEmision).getTime();
        if (Number.isNaN(fechaA) && Number.isNaN(fechaB))
            return b.idCertificado - a.idCertificado;
        if (Number.isNaN(fechaA))
            return 1;
        if (Number.isNaN(fechaB))
            return -1;
        const diferencia = fechaB - fechaA;
        return diferencia !== 0 ? diferencia : b.idCertificado - a.idCertificado;
    });
    let resultado = [...certificadosOrdenados];
    if (filtrosCertificados.value.busqueda) {
        const busqueda = filtrosCertificados.value.busqueda.toLowerCase();
        resultado = resultado.filter(c => c.usuario.nombres.toLowerCase().includes(busqueda) ||
            c.usuario.apellidos.toLowerCase().includes(busqueda) ||
            c.actividad.nombre.toLowerCase().includes(busqueda));
    }
    if (filtrosCertificados.value.estado) {
        resultado = resultado.filter(c => c.estadoEmision === filtrosCertificados.value.estado);
    }
    if (filtrosCertificados.value.tipo) {
        resultado = resultado.filter(c => c.tipo === filtrosCertificados.value.tipo);
    }
    return resultado;
});
const { paginatedData: certificadosPaginados, // Solo 10 usuarios a la vez
currentPage, pageSize, totalItems, goToPage, setPageSize } = usePagination(certificadosFiltrados, {
    pageSize: 10,
    initialPage: 1
});
// ============================================
// MÉTODOS - CARGA DE DATOS
// ============================================
const cargarDatos = async () => {
    loading.value = true;
    try {
        await cargarCertificados();
        calcularEstadisticas();
    }
    catch (error) {
        console.error('Error al cargar datos:', error);
    }
    finally {
        loading.value = false;
    }
};
const cargarCertificados = async () => {
    const response = await api.get('/certificados/admin');
    const items = response;
    certificados.value = items.map(item => {
        const nombreParticipante = String(item.nombreParticipante ?? '');
        const nombreParts = nombreParticipante.split(' ');
        const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante;
        const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : '';
        const tipoActividad = String(item.tipoActividad ?? 'EVENTO');
        return {
            idCertificado: Number(item.idCertificado),
            usuario: {
                nombres,
                apellidos,
                email: '-'
            },
            actividad: {
                nombre: String(item.nombreActividad ?? ''),
                tipo: tipoActividad,
                carrera: '-',
                cargaHoraria: Number(item.cargaHoraria ?? 0)
            },
            tipo: tipoActividad === 'CURSO' ? 'APROBACION' : 'PARTICIPACION',
            version: Number(item.version ?? 1),
            estadoEmision: String(item.estadoEmision ?? 'GENERADO'),
            fechaEmision: String(item.fechaEmision ?? '')
        };
    });
};
const calcularEstadisticas = () => {
    estadisticas.value = {
        certificadosEmitidos: certificados.value.filter(c => c.estadoEmision === 'GENERADO').length,
        certificadosAnulados: certificados.value.filter(c => c.estadoEmision === 'ANULADO').length,
        certificadosReemitidos: certificados.value.filter(c => c.estadoEmision === 'REEMITIDO').length,
        totalCertificados: certificados.value.length
    };
};
// ============================================
// MÉTODOS - CERTIFICADOS
// ============================================
const verCertificado = (certificado) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('token');
    fetch(`${baseUrl}/certificados/${certificado.idCertificado}/descargar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
        .then(async (response) => {
        if (!response.ok) {
            const message = response.statusText || 'No se pudo descargar el certificado.';
            throw new Error(message);
        }
        return response.blob();
    })
        .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    })
        .catch(error => {
        console.error('Error al ver certificado:', error);
    });
};
const anularCertificado = (certificado) => {
    certificadoSeleccionado.value = certificado;
    motivoAnulacion.value = '';
    showAnularModal.value = true;
};
const confirmarAnulacion = async () => {
    if (!certificadoSeleccionado.value || !motivoAnulacion.value.trim())
        return;
    procesando.value = true;
    try {
        await api.patch(`/certificados/${certificadoSeleccionado.value.idCertificado}/anular`, {
            motivo: motivoAnulacion.value,
            reemitir: false
        });
        closeAnularModal();
        await cargarDatos();
    }
    catch (error) {
        console.error('Error al anular certificado:', error);
    }
    finally {
        procesando.value = false;
    }
};
const reemitirCertificado = async (certificado) => {
    if (confirm('¿Reemitir este certificado con una nueva versión?')) {
        try {
            await api.patch(`/certificados/${certificado.idCertificado}/anular`, {
                motivo: 'Reemision solicitada por administrador',
                reemitir: true
            });
            await cargarDatos();
        }
        catch (error) {
            console.error('Error al reemitir certificado:', error);
        }
    }
};
// ============================================
// MÉTODOS - MODALES
// ============================================
const closeAnularModal = () => {
    showAnularModal.value = false;
    certificadoSeleccionado.value = null;
    motivoAnulacion.value = '';
};
// ============================================
// MÉTODOS - UTILIDADES
// ============================================
const limpiarFiltrosCertificados = () => {
    filtrosCertificados.value = {
        busqueda: '',
        estado: '',
        tipo: ''
    };
};
const formatDate = (date) => {
    if (!date)
        return '-';
    return formatDateUtil(date, 'es-BO');
};
const getEstadoCertificadoBadge = (estado) => {
    const variants = {
        'GENERADO': 'success',
        'ANULADO': 'danger',
        'REEMITIDO': 'info'
    };
    return variants[estado] || 'gray';
};
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    cargarDatos();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-6" },
});
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-green-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
(__VLS_ctx.estadisticas.certificadosEmitidos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_3;
const __VLS_6 = Card || Card;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
(__VLS_ctx.estadisticas.certificadosAnulados);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_9;
const __VLS_12 = Card || Card;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-blue-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
(__VLS_ctx.estadisticas.certificadosReemitidos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_15;
const __VLS_18 = Card || Card;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.estadisticas.totalCertificados);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_21;
const __VLS_24 = Card || Card;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const { default: __VLS_29 } = __VLS_27.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-semibold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.filtrosCertificados.busqueda),
    type: "text",
    placeholder: "Nombre de usuario o actividad...",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtrosCertificados.estado),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "GENERADO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ANULADO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "REEMITIDO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtrosCertificados.tipo),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "APROBACION",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "PARTICIPACION",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-end" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
const __VLS_30 = Button || Button;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}));
const __VLS_32 = __VLS_31({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
let __VLS_35;
const __VLS_36 = ({ click: {} },
    { onClick: (__VLS_ctx.limpiarFiltrosCertificados) });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_37 } = __VLS_33.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-4 h-4 mr-2" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
});
// @ts-ignore
[filtrosCertificados, filtrosCertificados, filtrosCertificados, limpiarFiltrosCertificados,];
var __VLS_33;
var __VLS_34;
if (__VLS_ctx.certificadosPaginados.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "bg-gray-50 border-b border-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
    for (const [certificado] of __VLS_vFor((__VLS_ctx.certificadosPaginados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (certificado.idCertificado),
            ...{ class: "hover:bg-gray-50" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm font-mono text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (certificado.idCertificado);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-medium text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (certificado.usuario.nombres);
        (certificado.usuario.apellidos);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (certificado.usuario.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-medium text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (certificado.actividad.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (certificado.actividad.cargaHoraria);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_38 = Badge || Badge;
        // @ts-ignore
        const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
            variant: (certificado.tipo === 'APROBACION' ? 'success' : 'info'),
            size: "sm",
        }));
        const __VLS_40 = __VLS_39({
            variant: (certificado.tipo === 'APROBACION' ? 'success' : 'info'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_39));
        const { default: __VLS_43 } = __VLS_41.slots;
        (certificado.tipo);
        // @ts-ignore
        [certificadosPaginados, certificadosPaginados,];
        var __VLS_41;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-center text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        if (certificado.version > 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-blue-600 font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (certificado.version);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_44 = Badge || Badge;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
            variant: (__VLS_ctx.getEstadoCertificadoBadge(certificado.estadoEmision)),
        }));
        const __VLS_46 = __VLS_45({
            variant: (__VLS_ctx.getEstadoCertificadoBadge(certificado.estadoEmision)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        const { default: __VLS_49 } = __VLS_47.slots;
        (certificado.estadoEmision);
        // @ts-ignore
        [getEstadoCertificadoBadge,];
        var __VLS_47;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-xs text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (__VLS_ctx.formatDate(certificado.fechaEmision));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
        const __VLS_50 = Button || Button;
        // @ts-ignore
        const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }));
        const __VLS_52 = __VLS_51({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_51));
        let __VLS_55;
        const __VLS_56 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.certificadosPaginados.length > 0))
                        return;
                    __VLS_ctx.verCertificado(certificado);
                    // @ts-ignore
                    [formatDate, verCertificado,];
                } });
        const { default: __VLS_57 } = __VLS_53.slots;
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
            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
        });
        // @ts-ignore
        [];
        var __VLS_53;
        var __VLS_54;
        if (certificado.estadoEmision === 'GENERADO') {
            const __VLS_58 = Button || Button;
            // @ts-ignore
            const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
                ...{ class: "text-red-600 hover:text-red-800" },
            }));
            const __VLS_60 = __VLS_59({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
                ...{ class: "text-red-600 hover:text-red-800" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_59));
            let __VLS_63;
            const __VLS_64 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.certificadosPaginados.length > 0))
                            return;
                        if (!(certificado.estadoEmision === 'GENERADO'))
                            return;
                        __VLS_ctx.anularCertificado(certificado);
                        // @ts-ignore
                        [anularCertificado,];
                    } });
            /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-red-800']} */ ;
            const { default: __VLS_65 } = __VLS_61.slots;
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
                d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
            });
            // @ts-ignore
            [];
            var __VLS_61;
            var __VLS_62;
        }
        if (certificado.estadoEmision === 'ANULADO') {
            const __VLS_66 = Button || Button;
            // @ts-ignore
            const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
                ...{ class: "text-blue-600 hover:text-blue-800" },
            }));
            const __VLS_68 = __VLS_67({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
                ...{ class: "text-blue-600 hover:text-blue-800" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_67));
            let __VLS_71;
            const __VLS_72 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.certificadosPaginados.length > 0))
                            return;
                        if (!(certificado.estadoEmision === 'ANULADO'))
                            return;
                        __VLS_ctx.reemitirCertificado(certificado);
                        // @ts-ignore
                        [reemitirCertificado,];
                    } });
            /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-blue-800']} */ ;
            const { default: __VLS_73 } = __VLS_69.slots;
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
                d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
            });
            // @ts-ignore
            [];
            var __VLS_69;
            var __VLS_70;
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.totalItems > 0) {
    const __VLS_74 = Pagination;
    // @ts-ignore
    const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }));
    const __VLS_76 = __VLS_75({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_75));
    let __VLS_79;
    const __VLS_80 = ({ 'update:currentPage': {} },
        { 'onUpdate:currentPage': (__VLS_ctx.goToPage) });
    const __VLS_81 = ({ 'update:pageSize': {} },
        { 'onUpdate:pageSize': (__VLS_ctx.setPageSize) });
    var __VLS_77;
    var __VLS_78;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-16 h-16 mx-auto text-gray-400 mb-4" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
}
// @ts-ignore
[totalItems, totalItems, currentPage, pageSize, goToPage, setPageSize,];
var __VLS_27;
const __VLS_82 = Modal || Modal;
// @ts-ignore
const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAnularModal),
    title: "Anular Certificado",
}));
const __VLS_84 = __VLS_83({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAnularModal),
    title: "Anular Certificado",
}, ...__VLS_functionalComponentArgsRest(__VLS_83));
let __VLS_87;
const __VLS_88 = ({ close: {} },
    { onClose: (__VLS_ctx.closeAnularModal) });
const { default: __VLS_89 } = __VLS_85.slots;
if (__VLS_ctx.certificadoSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-red-50 border border-red-200 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-red-800 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.certificadoSeleccionado.usuario.nombres);
    (__VLS_ctx.certificadoSeleccionado.usuario.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.certificadoSeleccionado.actividad.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.motivoAnulacion),
        rows: "3",
        required: true,
        placeholder: "Describe el motivo de la anulación...",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_90 = Button || Button;
    // @ts-ignore
    const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
        ...{ 'onClick': {} },
        variant: "outline",
    }));
    const __VLS_92 = __VLS_91({
        ...{ 'onClick': {} },
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_91));
    let __VLS_95;
    const __VLS_96 = ({ click: {} },
        { onClick: (__VLS_ctx.closeAnularModal) });
    const { default: __VLS_97 } = __VLS_93.slots;
    // @ts-ignore
    [showAnularModal, closeAnularModal, closeAnularModal, certificadoSeleccionado, certificadoSeleccionado, certificadoSeleccionado, certificadoSeleccionado, motivoAnulacion,];
    var __VLS_93;
    var __VLS_94;
    const __VLS_98 = Button || Button;
    // @ts-ignore
    const __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
        ...{ 'onClick': {} },
        variant: "danger",
        disabled: (!__VLS_ctx.motivoAnulacion.trim() || __VLS_ctx.procesando),
    }));
    const __VLS_100 = __VLS_99({
        ...{ 'onClick': {} },
        variant: "danger",
        disabled: (!__VLS_ctx.motivoAnulacion.trim() || __VLS_ctx.procesando),
    }, ...__VLS_functionalComponentArgsRest(__VLS_99));
    let __VLS_103;
    const __VLS_104 = ({ click: {} },
        { onClick: (__VLS_ctx.confirmarAnulacion) });
    const { default: __VLS_105 } = __VLS_101.slots;
    (__VLS_ctx.procesando ? 'Anulando...' : 'Anular Certificado');
    // @ts-ignore
    [motivoAnulacion, procesando, procesando, confirmarAnulacion,];
    var __VLS_101;
    var __VLS_102;
}
// @ts-ignore
[];
var __VLS_85;
var __VLS_86;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Certificados.vue.js.map