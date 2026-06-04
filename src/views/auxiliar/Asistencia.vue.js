import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil, parseLocalDate } from '@/utils/dateFormatter';
import { useAlertStore } from '@/stores/alert.store';
const alertStore = useAlertStore();
const route = useRoute();
const loading = ref(false);
const savingId = ref(null);
const eventosDisponibles = ref([]);
const asistencias = ref([]);
const busquedaEvento = ref('');
const busquedaParticipante = ref('');
const eventoSeleccionado = ref(null);
const infoEvento = ref(null);
const eventosFiltrados = computed(() => {
    const term = busquedaEvento.value.trim().toLowerCase();
    if (!term)
        return eventosDisponibles.value;
    return eventosDisponibles.value.filter(evento => evento.nombre.toLowerCase().includes(term));
});
const asistenciasRegistradas = computed(() => {
    return asistencias.value.filter(a => a.asistio).length;
});
const asistenciasFiltradas = computed(() => {
    const term = busquedaParticipante.value.trim().toLowerCase();
    if (!term)
        return asistencias.value;
    return asistencias.value.filter(asistencia => {
        const values = [
            asistencia.participante.nombres,
            asistencia.participante.apellidos,
            asistencia.participante.username
        ];
        return values.some(value => value.toLowerCase().includes(term));
    });
});
const normalizarEventos = (response) => {
    if (!Array.isArray(response))
        return [];
    return response.map(evento => ({
        id: Number(evento.idEvento ?? evento.id ?? evento.id_evento ?? 0),
        nombre: String(evento.nombre ?? evento.titulo ?? ''),
        fechaInicio: String(evento.fechaHora ?? evento.fechaInicio ?? evento.fecha_inicio ?? ''),
        inscritos: Number(evento.inscritos ?? evento.totalInscritos ?? 0)
    })).filter(evento => evento.id);
};
const cargarEventos = async () => {
    const response = await api.get('/eventos/auxiliar');
    eventosDisponibles.value = normalizarEventos(response);
    if (eventosDisponibles.value.length === 0) {
        eventoSeleccionado.value = null;
        infoEvento.value = null;
        asistencias.value = [];
        return;
    }
    const fromQuery = Number(route.query.evento);
    if (fromQuery && eventosDisponibles.value.some(e => e.id === fromQuery)) {
        eventoSeleccionado.value = fromQuery;
        await cargarAsistencias();
    }
};
const cargarAsistencias = async () => {
    if (!eventoSeleccionado.value)
        return;
    loading.value = true;
    try {
        infoEvento.value = eventosDisponibles.value.find(e => e.id === eventoSeleccionado.value) || null;
        const response = await api.get(`/asistencias/evento/${eventoSeleccionado.value}/detalle`);
        const items = response;
        asistencias.value = items.map(item => ({
            idInscripcion: Number(item.idInscripcion),
            participante: {
                nombres: String(item.nombreParticipante ?? ''),
                apellidos: '',
                email: String(item.email ?? ''),
                username: String(item.username ?? '')
            },
            asistio: Boolean(item.asistio),
            fechaRegistro: item.fechaRegistro ? String(item.fechaRegistro) : undefined
        }));
    }
    finally {
        loading.value = false;
    }
};
const registrarAsistencia = async (item) => {
    if (item.asistio)
        return;
    savingId.value = item.idInscripcion;
    try {
        const response = await api.post('/asistencias', { idInscripcion: item.idInscripcion });
        item.asistio = true;
        item.fechaRegistro = response.fechaRegistro ? String(response.fechaRegistro) : new Date().toISOString();
        alertStore.push({ type: 'success', message: 'Asistencia registrada.' });
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo registrar.' });
    }
    finally {
        savingId.value = null;
    }
};
const puedeAnular = (item) => {
    if (!item.asistio || !item.fechaRegistro)
        return false;
    const fecha = parseLocalDate(item.fechaRegistro);
    if (Number.isNaN(fecha.getTime()))
        return false;
    const diffMs = Date.now() - fecha.getTime();
    return diffMs <= 60 * 60 * 1000;
};
const anularAsistencia = async (item) => {
    if (!item.asistio)
        return;
    savingId.value = item.idInscripcion;
    try {
        await api.delete(`/asistencias/${item.idInscripcion}`);
        item.asistio = false;
        item.fechaRegistro = undefined;
        alertStore.push({ type: 'success', message: 'Asistencia anulada.' });
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo anular.' });
    }
    finally {
        savingId.value = null;
    }
};
const formatDate = (date) => {
    if (!date)
        return '-';
    return formatDateUtil(date, 'es-BO');
};
onMounted(() => {
    cargarEventos();
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
    ...{ class: "text-3xl font-bold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-slate-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.busquedaEvento),
    type: "text",
    placeholder: "Nombre del evento",
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-slate-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.cargarAsistencias) },
    value: (__VLS_ctx.eventoSeleccionado),
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
for (const [evento] of __VLS_vFor((__VLS_ctx.eventosFiltrados))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (evento.id),
        value: (evento.id),
    });
    (evento.nombre);
    (__VLS_ctx.formatDate(evento.fechaInicio));
    // @ts-ignore
    [busquedaEvento, cargarAsistencias, eventoSeleccionado, eventosFiltrados, formatDate,];
}
if (__VLS_ctx.eventoSeleccionado && __VLS_ctx.infoEvento) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-emerald-200 bg-emerald-50 p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-emerald-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-emerald-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 gap-4 md:grid-cols-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-emerald-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-slate-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
    (__VLS_ctx.infoEvento.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-emerald-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-slate-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.infoEvento.fechaInicio));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-emerald-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-slate-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
    (__VLS_ctx.infoEvento.inscritos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-emerald-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-slate-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
    (__VLS_ctx.asistenciasRegistradas);
}
// @ts-ignore
[eventoSeleccionado, formatDate, infoEvento, infoEvento, infoEvento, infoEvento, asistenciasRegistradas,];
var __VLS_3;
if (__VLS_ctx.eventoSeleccionado) {
    const __VLS_6 = Card || Card;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
    const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
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
        ...{ class: "text-lg font-semibold text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-slate-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.busquedaParticipante),
        type: "text",
        placeholder: "Nombre o RU",
        ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "py-8 text-center text-sm text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    else if (__VLS_ctx.asistenciasFiltradas.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "py-8 text-center text-sm text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overflow-x-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "w-full" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
            ...{ class: "bg-slate-50 border-b border-slate-200" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
            ...{ class: "divide-y divide-slate-200" },
        });
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-slate-200']} */ ;
        for (const [asistencia, index] of __VLS_vFor((__VLS_ctx.asistenciasFiltradas))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (asistencia.idInscripcion),
                ...{ class: "hover:bg-slate-50" },
            });
            /** @type {__VLS_StyleScopedClasses['hover:bg-slate-50']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm text-slate-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
            (index + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-medium text-slate-800" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
            (asistencia.participante.nombres);
            (asistencia.participante.apellidos);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            (asistencia.participante.username);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-end gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_12 = Button || Button;
            // @ts-ignore
            const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.savingId === asistencia.idInscripcion),
                disabled: (asistencia.asistio),
            }));
            const __VLS_14 = __VLS_13({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.savingId === asistencia.idInscripcion),
                disabled: (asistencia.asistio),
            }, ...__VLS_functionalComponentArgsRest(__VLS_13));
            let __VLS_17;
            const __VLS_18 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.eventoSeleccionado))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.asistenciasFiltradas.length === 0))
                            return;
                        __VLS_ctx.registrarAsistencia(asistencia);
                        // @ts-ignore
                        [eventoSeleccionado, busquedaParticipante, loading, asistenciasFiltradas, asistenciasFiltradas, savingId, registrarAsistencia,];
                    } });
            const { default: __VLS_19 } = __VLS_15.slots;
            // @ts-ignore
            [];
            var __VLS_15;
            var __VLS_16;
            if (__VLS_ctx.puedeAnular(asistencia)) {
                const __VLS_20 = Button || Button;
                // @ts-ignore
                const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                    ...{ 'onClick': {} },
                    variant: "ghost",
                    size: "sm",
                    ...{ class: "text-rose-600 hover:text-rose-700" },
                    loading: (__VLS_ctx.savingId === asistencia.idInscripcion),
                }));
                const __VLS_22 = __VLS_21({
                    ...{ 'onClick': {} },
                    variant: "ghost",
                    size: "sm",
                    ...{ class: "text-rose-600 hover:text-rose-700" },
                    loading: (__VLS_ctx.savingId === asistencia.idInscripcion),
                }, ...__VLS_functionalComponentArgsRest(__VLS_21));
                let __VLS_25;
                const __VLS_26 = ({ click: {} },
                    { onClick: (...[$event]) => {
                            if (!(__VLS_ctx.eventoSeleccionado))
                                return;
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.asistenciasFiltradas.length === 0))
                                return;
                            if (!(__VLS_ctx.puedeAnular(asistencia)))
                                return;
                            __VLS_ctx.anularAsistencia(asistencia);
                            // @ts-ignore
                            [savingId, puedeAnular, anularAsistencia,];
                        } });
                /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-rose-700']} */ ;
                const { default: __VLS_27 } = __VLS_23.slots;
                // @ts-ignore
                [];
                var __VLS_23;
                var __VLS_24;
            }
            // @ts-ignore
            [];
        }
    }
    // @ts-ignore
    [];
    var __VLS_9;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Asistencia.vue.js.map