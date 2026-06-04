import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil } from '@/utils/dateFormatter';
const filtroActivo = ref('TODAS');
const loading = ref(false);
const inscripciones = ref([]);
const router = useRouter();
// ============================================
// COMPUTED
// ============================================
const inscripcionesActivas = computed(() => inscripciones.value.filter(i => i.estado === 'ACTIVO'));
const inscripcionesCompletadas = computed(() => inscripciones.value.filter(i => i.estado === 'COMPLETADO'));
const inscripcionesCursos = computed(() => inscripciones.value.filter(i => i.tipo === 'CURSO'));
const inscripcionesEventos = computed(() => inscripciones.value.filter(i => i.tipo === 'EVENTO'));
const inscripcionesFiltradas = computed(() => {
    switch (filtroActivo.value) {
        case 'ACTIVAS':
            return inscripcionesActivas.value;
        case 'COMPLETADAS':
            return inscripcionesCompletadas.value;
        case 'CURSOS':
            return inscripcionesCursos.value;
        case 'EVENTOS':
            return inscripcionesEventos.value;
        default:
            return inscripciones.value;
    }
});
// ============================================
// MÉTODOS
// ============================================
const formatDate = (dateString) => {
    return formatDateUtil(dateString, 'es-ES');
};
const getEstadoBadge = (estado) => {
    switch (estado) {
        case 'ACTIVO':
            return 'info';
        case 'COMPLETADO':
            return 'success';
        case 'PENDIENTE DE PAGO':
            return 'warning';
        case 'CANCELADO':
            return 'danger';
        default:
            return 'gray';
    }
};
const descargarCertificado = (certificadoId) => {
    if (!certificadoId)
        return;
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
const verDetalles = (inscripcion) => {
    const id = inscripcion.tipo === 'CURSO' ? inscripcion.idCurso : inscripcion.idEvento;
    if (!id)
        return;
    router.push({
        name: 'activity-detail',
        params: { id: String(id) },
        query: { tipo: inscripcion.tipo }
    });
};
const cargarInscripciones = async () => {
    loading.value = true;
    try {
        const [inscripcionesResponse, certificadosResponse] = await Promise.all([
            api.get('/inscripciones/mis-inscripciones'),
            api.get('/certificados/mis-certificados')
        ]);
        const certificados = certificadosResponse;
        const certificadosPorInscripcion = new Map();
        certificados.forEach(cert => {
            const idInscripcion = Number(cert.idInscripcion ?? 0);
            if (!idInscripcion)
                return;
            const estadoEmision = String(cert.estadoEmision ?? '');
            if (estadoEmision === 'ANULADO')
                return;
            certificadosPorInscripcion.set(idInscripcion, cert);
        });
        const inscripcionesApi = inscripcionesResponse;
        const detalles = await Promise.all(inscripcionesApi.map(async (item) => {
            const tipo = String(item.tipoActividad ?? '');
            const idCurso = item.idCurso !== undefined ? Number(item.idCurso) : null;
            const idEvento = item.idEvento !== undefined ? Number(item.idEvento) : null;
            if (tipo === 'CURSO' && idCurso) {
                const curso = await api.get(`/cursos/${idCurso}`);
                return { item, detalle: curso };
            }
            if (tipo === 'EVENTO' && idEvento) {
                const evento = await api.get(`/eventos/${idEvento}`);
                return { item, detalle: evento };
            }
            return { item, detalle: null };
        }));
        inscripciones.value = detalles.map(({ item, detalle }) => {
            const tipo = String(item.tipoActividad ?? '');
            const idCurso = item.idCurso !== undefined ? Number(item.idCurso) : null;
            const idEvento = item.idEvento !== undefined ? Number(item.idEvento) : null;
            const certificado = certificadosPorInscripcion.get(Number(item.idInscripcion ?? 0));
            const certificadoId = certificado ? Number(certificado.idCertificado ?? 0) : undefined;
            const notaFinal = certificado?.notaFinal !== undefined && certificado?.notaFinal !== null
                ? Number(certificado.notaFinal)
                : null;
            const estadoInscripcion = String(item.estado ?? 'PENDIENTE').toUpperCase();
            const estadoPago = String(item.estadoPago ?? '').toUpperCase();
            let fechaInicio = '';
            let fechaFin = '';
            let cargaHoraria = 0;
            let modalidad = '';
            if (tipo === 'CURSO' && detalle) {
                fechaInicio = String(detalle.fechaInicio ?? '');
                fechaFin = String(detalle.fechaInicio ?? '');
                cargaHoraria = Number(detalle.cargaHoraria ?? 0);
                const codigoParalelo = String(item.codigoParalelo ?? '');
                const paralelos = Array.isArray(detalle.paralelos)
                    ? detalle.paralelos
                    : [];
                const paralelo = paralelos.find(p => String(p.codigo ?? '') === codigoParalelo);
                modalidad = paralelo ? String(paralelo.modalidad ?? '') : '';
            }
            if (tipo === 'EVENTO' && detalle) {
                const fechaHora = String(detalle.fechaHora ?? '');
                fechaInicio = fechaHora;
                fechaFin = fechaHora;
                cargaHoraria = Number(detalle.cargaHoraria ?? 0);
                modalidad = String(detalle.modalidad ?? '');
            }
            const estado = certificadoId
                ? 'COMPLETADO'
                : (estadoInscripcion === 'CANCELADA'
                    ? 'CANCELADO'
                    : (estadoInscripcion === 'CONFIRMADA' || estadoPago === 'APROBADO'
                        ? 'ACTIVO'
                        : 'PENDIENTE DE PAGO'));
            return {
                id: Number(item.idInscripcion),
                tipo,
                idCurso,
                idEvento,
                nombre: String(item.nombreActividad ?? ''),
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                carga_horaria: cargaHoraria,
                modalidad: modalidad || '-',
                monto_pagado: Number(item.saldo ?? 0),
                estado,
                nota: notaFinal,
                certificado_disponible: Boolean(certificadoId),
                certificadoId
            };
        });
    }
    catch (error) {
        console.error('Error al cargar inscripciones:', error);
        inscripciones.value = [];
    }
    finally {
        loading.value = false;
    }
};
onMounted(() => {
    cargarInscripciones();
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
    ...{ class: "flex flex-wrap gap-3 mb-6" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
const __VLS_0 = Button || Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'TODAS' ? 'primary' : 'outline'),
    size: "sm",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'TODAS' ? 'primary' : 'outline'),
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.filtroActivo = 'TODAS';
            // @ts-ignore
            [filtroActivo, filtroActivo,];
        } });
const { default: __VLS_7 } = __VLS_3.slots;
(__VLS_ctx.inscripciones.length);
// @ts-ignore
[inscripciones,];
var __VLS_3;
var __VLS_4;
const __VLS_8 = Button || Button;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'ACTIVAS' ? 'primary' : 'outline'),
    size: "sm",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'ACTIVAS' ? 'primary' : 'outline'),
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_13;
const __VLS_14 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.filtroActivo = 'ACTIVAS';
            // @ts-ignore
            [filtroActivo, filtroActivo,];
        } });
const { default: __VLS_15 } = __VLS_11.slots;
(__VLS_ctx.inscripcionesActivas.length);
// @ts-ignore
[inscripcionesActivas,];
var __VLS_11;
var __VLS_12;
const __VLS_16 = Button || Button;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'COMPLETADAS' ? 'primary' : 'outline'),
    size: "sm",
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'COMPLETADAS' ? 'primary' : 'outline'),
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_21;
const __VLS_22 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.filtroActivo = 'COMPLETADAS';
            // @ts-ignore
            [filtroActivo, filtroActivo,];
        } });
const { default: __VLS_23 } = __VLS_19.slots;
(__VLS_ctx.inscripcionesCompletadas.length);
// @ts-ignore
[inscripcionesCompletadas,];
var __VLS_19;
var __VLS_20;
const __VLS_24 = Button || Button;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'CURSOS' ? 'primary' : 'outline'),
    size: "sm",
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'CURSOS' ? 'primary' : 'outline'),
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_29;
const __VLS_30 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.filtroActivo = 'CURSOS';
            // @ts-ignore
            [filtroActivo, filtroActivo,];
        } });
const { default: __VLS_31 } = __VLS_27.slots;
(__VLS_ctx.inscripcionesCursos.length);
// @ts-ignore
[inscripcionesCursos,];
var __VLS_27;
var __VLS_28;
const __VLS_32 = Button || Button;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'EVENTOS' ? 'primary' : 'outline'),
    size: "sm",
}));
const __VLS_34 = __VLS_33({
    ...{ 'onClick': {} },
    variant: (__VLS_ctx.filtroActivo === 'EVENTOS' ? 'primary' : 'outline'),
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_37;
const __VLS_38 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.filtroActivo = 'EVENTOS';
            // @ts-ignore
            [filtroActivo, filtroActivo,];
        } });
const { default: __VLS_39 } = __VLS_35.slots;
(__VLS_ctx.inscripcionesEventos.length);
// @ts-ignore
[inscripcionesEventos,];
var __VLS_35;
var __VLS_36;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
}
else if (__VLS_ctx.inscripcionesFiltradas.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    for (const [inscripcion] of __VLS_vFor((__VLS_ctx.inscripcionesFiltradas))) {
        const __VLS_40 = Card || Card;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
            key: (inscripcion.id),
            hoverable: (true),
        }));
        const __VLS_42 = __VLS_41({
            key: (inscripcion.id),
            hoverable: (true),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        const { default: __VLS_45 } = __VLS_43.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col md:flex-row gap-6" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex-1 space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-start justify-between gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_46 = Badge || Badge;
        // @ts-ignore
        const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
            variant: (inscripcion.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_48 = __VLS_47({
            variant: (inscripcion.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_47));
        const { default: __VLS_51 } = __VLS_49.slots;
        (inscripcion.tipo);
        // @ts-ignore
        [loading, inscripcionesFiltradas, inscripcionesFiltradas,];
        var __VLS_49;
        const __VLS_52 = Badge || Badge;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            variant: (__VLS_ctx.getEstadoBadge(inscripcion.estado)),
            size: "sm",
        }));
        const __VLS_54 = __VLS_53({
            variant: (__VLS_ctx.getEstadoBadge(inscripcion.estado)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        const { default: __VLS_57 } = __VLS_55.slots;
        (inscripcion.estado);
        // @ts-ignore
        [getEstadoBadge,];
        var __VLS_55;
        if (inscripcion.tipo === 'CURSO' && inscripcion.nota !== null) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-2xl font-bold" },
                ...{ class: (inscripcion.nota >= 51 ? 'text-green-600' : 'text-red-600') },
            });
            /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            (inscripcion.nota);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-xl font-bold text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (inscripcion.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
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
            d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatDate(inscripcion.fecha_inicio));
        (__VLS_ctx.formatDate(inscripcion.fecha_fin));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
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
            d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (inscripcion.carga_horaria);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
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
            d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (inscripcion.modalidad);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
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
            d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (inscripcion.monto_pagado);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex md:flex-col gap-2 justify-center md:justify-start" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:justify-start']} */ ;
        if (inscripcion.certificado_disponible) {
            const __VLS_58 = Button || Button;
            // @ts-ignore
            const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
                ...{ 'onClick': {} },
                variant: "success",
                size: "sm",
            }));
            const __VLS_60 = __VLS_59({
                ...{ 'onClick': {} },
                variant: "success",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_59));
            let __VLS_63;
            const __VLS_64 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.inscripcionesFiltradas.length > 0))
                            return;
                        if (!(inscripcion.certificado_disponible))
                            return;
                        __VLS_ctx.descargarCertificado(inscripcion.certificadoId);
                        // @ts-ignore
                        [formatDate, formatDate, descargarCertificado,];
                    } });
            const { default: __VLS_65 } = __VLS_61.slots;
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
                d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            });
            // @ts-ignore
            [];
            var __VLS_61;
            var __VLS_62;
        }
        const __VLS_66 = Button || Button;
        // @ts-ignore
        const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }));
        const __VLS_68 = __VLS_67({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_67));
        let __VLS_71;
        const __VLS_72 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.inscripcionesFiltradas.length > 0))
                        return;
                    __VLS_ctx.verDetalles(inscripcion);
                    // @ts-ignore
                    [verDetalles,];
                } });
        const { default: __VLS_73 } = __VLS_69.slots;
        // @ts-ignore
        [];
        var __VLS_69;
        var __VLS_70;
        // @ts-ignore
        [];
        var __VLS_43;
        // @ts-ignore
        [];
    }
}
else {
    const __VLS_74 = Card || Card;
    // @ts-ignore
    const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({}));
    const __VLS_76 = __VLS_75({}, ...__VLS_functionalComponentArgsRest(__VLS_75));
    const { default: __VLS_79 } = __VLS_77.slots;
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
        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-xl font-semibold text-gray-800 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    (__VLS_ctx.filtroActivo.toLowerCase());
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-600 mb-6" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    let __VLS_80;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
        to: "/participante",
    }));
    const __VLS_82 = __VLS_81({
        to: "/participante",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    const { default: __VLS_85 } = __VLS_83.slots;
    const __VLS_86 = Button || Button;
    // @ts-ignore
    const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
        variant: "primary",
    }));
    const __VLS_88 = __VLS_87({
        variant: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_87));
    const { default: __VLS_91 } = __VLS_89.slots;
    // @ts-ignore
    [filtroActivo,];
    var __VLS_89;
    // @ts-ignore
    [];
    var __VLS_83;
    // @ts-ignore
    [];
    var __VLS_77;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=MisInscripciones.vue.js.map