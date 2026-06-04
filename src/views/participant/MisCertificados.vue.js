import { ref, computed, onMounted } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil } from '@/utils/dateFormatter';
const certificados = ref([]);
const loading = ref(false);
// ============================================
// COMPUTED
// ============================================
const certificadosCursos = computed(() => certificados.value.filter(c => c.actividad_tipo === 'CURSO').length);
const certificadosEventos = computed(() => certificados.value.filter(c => c.actividad_tipo === 'EVENTO').length);
// ============================================
// MÉTODOS
// ============================================
const formatDate = (dateString) => {
    return formatDateUtil(dateString, 'es-ES');
};
const descargarCertificado = (certificadoId) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('token');
    fetch(`${baseUrl}/certificados/${certificadoId}/descargar`, {
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
        console.error('Error al descargar certificado:', error);
    });
};
const verificarCertificado = (codigo) => {
    window.open(`/verificar/${codigo}`, '_blank');
};
const getActividadId = (item) => {
    return String(item.idActividad ??
        item.actividadId ??
        item.id_actividad ??
        item.actividad_id ??
        item.nombreActividad ??
        '');
};
const getTimestamp = (dateString) => {
    const timestamp = new Date(dateString).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};
const esCertificadoMasReciente = (actual, candidato) => {
    if (candidato.version !== actual.version) {
        return candidato.version > actual.version;
    }
    const fechaActual = getTimestamp(actual.fecha_emision);
    const fechaCandidato = getTimestamp(candidato.fecha_emision);
    if (fechaCandidato !== fechaActual) {
        return fechaCandidato > fechaActual;
    }
    return candidato.id > actual.id;
};
const obtenerUltimasVersiones = (items) => {
    const certificadosPorActividad = new Map();
    for (const item of items) {
        const key = `${item.actividad_tipo}:${item.tipo}:${item.actividad_id}`;
        const actual = certificadosPorActividad.get(key);
        if (!actual || esCertificadoMasReciente(actual, item)) {
            certificadosPorActividad.set(key, item);
        }
    }
    return Array.from(certificadosPorActividad.values()).sort((a, b) => {
        const diferenciaFecha = getTimestamp(b.fecha_emision) - getTimestamp(a.fecha_emision);
        return diferenciaFecha !== 0 ? diferenciaFecha : b.id - a.id;
    });
};
const cargarCertificados = async () => {
    loading.value = true;
    try {
        const response = await api.get('/certificados/mis-certificados');
        const items = response;
        const certificadosNormalizados = items
            .filter(item => String(item.estadoEmision ?? '') !== 'ANULADO')
            .map((item) => {
            const tipoActividad = String(item.tipoActividad ?? 'EVENTO');
            const tipoCertificado = tipoActividad === 'CURSO' ? 'APROBACION' : 'PARTICIPACION';
            const notaFinal = item.notaFinal !== undefined && item.notaFinal !== null
                ? Number(item.notaFinal)
                : null;
            return {
                id: Number(item.idCertificado),
                tipo: tipoCertificado,
                nombre_actividad: String(item.nombreActividad ?? ''),
                carga_horaria: Number(item.cargaHoraria ?? 0),
                nota: notaFinal,
                fecha_emision: String(item.fechaEmision ?? ''),
                codigo_verificacion: String(item.codigoVerificacion ?? ''),
                actividad_tipo: tipoActividad,
                version: Number(item.version ?? 1),
                actividad_id: getActividadId(item)
            };
        });
        certificados.value = obtenerUltimasVersiones(certificadosNormalizados);
    }
    catch (error) {
        console.error('Error al cargar certificados:', error);
        certificados.value = [];
    }
    finally {
        loading.value = false;
    }
};
onMounted(() => {
    cargarCertificados();
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
    ...{ class: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3" },
});
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-purple-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-6 h-6 text-purple-600" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-3xl font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.certificados.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600 mt-1" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
// @ts-ignore
[certificados,];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3" },
});
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-6 h-6 text-blue-600" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-3xl font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.certificadosCursos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600 mt-1" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
// @ts-ignore
[certificadosCursos,];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3" },
});
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-6 h-6 text-green-600" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-3xl font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.certificadosEventos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600 mt-1" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
// @ts-ignore
[certificadosEventos,];
var __VLS_15;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" },
    });
    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-purple-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
}
else if (__VLS_ctx.certificados.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    for (const [certificado] of __VLS_vFor((__VLS_ctx.certificados))) {
        const __VLS_18 = Card || Card;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            key: (certificado.id),
            hoverable: (true),
            ...{ class: "relative overflow-hidden" },
        }));
        const __VLS_20 = __VLS_19({
            key: (certificado.id),
            hoverable: (true),
            ...{ class: "relative overflow-hidden" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        const { default: __VLS_23 } = __VLS_21.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute top-4 right-4 z-10" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
        const __VLS_24 = Badge || Badge;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            variant: (certificado.tipo === 'APROBACION' ? 'success' : 'info'),
            size: "sm",
        }));
        const __VLS_26 = __VLS_25({
            variant: (certificado.tipo === 'APROBACION' ? 'success' : 'info'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        const { default: __VLS_29 } = __VLS_27.slots;
        (certificado.tipo === 'APROBACION' ? 'Aprobación' : 'Participación');
        // @ts-ignore
        [certificados, certificados, loading,];
        var __VLS_27;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center space-y-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-blue-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-10 h-10 text-white" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "font-bold text-gray-800 mb-1 line-clamp-2" },
        });
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
        (certificado.nombre_actividad);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (certificado.carga_horaria);
        if (certificado.tipo === 'APROBACION' && certificado.nota) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "py-2 px-4 bg-green-50 rounded-lg" },
            });
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-green-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-2xl font-bold text-green-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
            (certificado.nota);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (__VLS_ctx.formatDate(certificado.fecha_emision));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "py-3 bg-gray-50 rounded-lg" },
        });
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "w-24 h-24 bg-white border-2 border-gray-300 rounded mx-auto flex items-center justify-center" },
        });
        /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-16 h-16 text-gray-400" },
            fill: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-16']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500 mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_30 = Button || Button;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            ...{ 'onClick': {} },
            variant: "primary",
            size: "sm",
            ...{ class: "flex-1" },
        }));
        const __VLS_32 = __VLS_31({
            ...{ 'onClick': {} },
            variant: "primary",
            size: "sm",
            ...{ class: "flex-1" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        let __VLS_35;
        const __VLS_36 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.certificados.length > 0))
                        return;
                    __VLS_ctx.descargarCertificado(certificado.id);
                    // @ts-ignore
                    [formatDate, descargarCertificado,];
                } });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
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
            d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
        });
        // @ts-ignore
        [];
        var __VLS_33;
        var __VLS_34;
        const __VLS_38 = Button || Button;
        // @ts-ignore
        const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }));
        const __VLS_40 = __VLS_39({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_39));
        let __VLS_43;
        const __VLS_44 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.certificados.length > 0))
                        return;
                    __VLS_ctx.verificarCertificado(certificado.codigo_verificacion);
                    // @ts-ignore
                    [verificarCertificado,];
                } });
        const { default: __VLS_45 } = __VLS_41.slots;
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
            d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        });
        // @ts-ignore
        [];
        var __VLS_41;
        var __VLS_42;
        // @ts-ignore
        [];
        var __VLS_21;
        // @ts-ignore
        [];
    }
}
else {
    const __VLS_46 = Card || Card;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({}));
    const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
    const { default: __VLS_51 } = __VLS_49.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-20 h-20 mx-auto text-gray-300 mb-4" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-xl font-semibold text-gray-800 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-600 mb-6" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    let __VLS_52;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
        to: "/participante/inscripciones",
    }));
    const __VLS_54 = __VLS_53({
        to: "/participante/inscripciones",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    const { default: __VLS_57 } = __VLS_55.slots;
    const __VLS_58 = Button || Button;
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        variant: "primary",
    }));
    const __VLS_60 = __VLS_59({
        variant: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    const { default: __VLS_63 } = __VLS_61.slots;
    // @ts-ignore
    [];
    var __VLS_61;
    // @ts-ignore
    [];
    var __VLS_55;
    // @ts-ignore
    [];
    var __VLS_49;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=MisCertificados.vue.js.map