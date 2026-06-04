import { computed, onMounted, ref, watch } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
import { useAlertStore } from '@/stores/alert.store';
const alertStore = useAlertStore();
const carreras = ref([]);
const selectedCarreraId = ref(null);
const cursos = ref([]);
const eventos = ref([]);
const solicitudes = ref([]);
const plantillas = ref([]);
const loadingSolicitudes = ref(false);
const loadingPlantillas = ref(false);
const savingSolicitudId = ref(null);
const savingPlantillaId = ref(null);
const showRejectModal = ref(false);
const rejectingPlantilla = ref(null);
const rejectObservaciones = ref('');
const rejectError = ref('');
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const cursosActivos = computed(() => {
    return cursosFiltrados.value.filter(curso => curso.estado === 'ABIERTO').length;
});
const eventosActivos = computed(() => {
    return eventosFiltrados.value.filter(evento => evento.estado === 'ABIERTO').length;
});
const pendingSolicitudes = computed(() => solicitudesFiltradas.value.length);
const pendingPlantillas = computed(() => plantillasFiltradas.value.length);
const cursosFiltrados = computed(() => {
    if (!selectedCarreraId.value)
        return cursos.value;
    return cursos.value.filter(curso => curso.idCarrera === selectedCarreraId.value);
});
const eventosFiltrados = computed(() => {
    if (!selectedCarreraId.value)
        return eventos.value;
    return eventos.value.filter(evento => evento.idCarrera === selectedCarreraId.value);
});
const solicitudesFiltradas = computed(() => {
    const carreraId = selectedCarreraId.value;
    if (!carreraId)
        return solicitudes.value;
    const cursosMap = new Map(cursos.value.map(curso => [curso.nombre, curso.idCarrera]));
    const eventosMap = new Map(eventos.value.map(evento => [evento.nombre, evento.idCarrera]));
    return solicitudes.value.filter(solicitud => {
        if (solicitud.codigoParalelo) {
            return cursosMap.get(solicitud.nombreActividad) === carreraId;
        }
        return eventosMap.get(solicitud.nombreActividad) === carreraId;
    });
});
const plantillasFiltradas = computed(() => {
    if (!selectedCarreraId.value)
        return plantillas.value;
    const cursosMap = new Map(cursos.value.map(curso => [curso.idCurso, curso.idCarrera]));
    const eventosMap = new Map(eventos.value.map(evento => [evento.idEvento, evento.idCarrera]));
    return plantillas.value.filter(plantilla => {
        if (plantilla.idCurso) {
            return cursosMap.get(plantilla.idCurso) === selectedCarreraId.value;
        }
        if (plantilla.idEvento) {
            return eventosMap.get(plantilla.idEvento) === selectedCarreraId.value;
        }
        return false;
    });
});
const loadCarreras = async () => {
    const response = await api.get('/coordinador/carreras');
    carreras.value = response;
    selectedCarreraId.value = response[0]?.idCarrera ?? null;
};
const loadCursos = async () => {
    const response = await api.get('/cursos/todos');
    cursos.value = response;
};
const loadEventos = async () => {
    const response = await api.get('/eventos/todos');
    eventos.value = response;
};
const loadSolicitudes = async () => {
    loadingSolicitudes.value = true;
    try {
        const response = await api.get('/evaluaciones/solicitudes');
        solicitudes.value = response.filter(solicitud => solicitud.estado === 'PENDIENTE');
    }
    finally {
        loadingSolicitudes.value = false;
    }
};
const loadPlantillas = async () => {
    loadingPlantillas.value = true;
    try {
        const response = await api.get('/plantillas/pendientes');
        plantillas.value = response.filter(plantilla => plantilla.estado === 'PENDIENTE');
    }
    finally {
        loadingPlantillas.value = false;
    }
};
const loadAll = async () => {
    await Promise.all([loadCarreras(), loadCursos(), loadEventos(), loadSolicitudes(), loadPlantillas()]);
};
const aprobarSolicitud = async (solicitud) => {
    savingSolicitudId.value = solicitud.idSolicitud;
    try {
        await api.patch(`/evaluaciones/solicitudes/${solicitud.idSolicitud}?estado=COMPLETADO`);
        solicitudes.value = solicitudes.value.filter(item => item.idSolicitud !== solicitud.idSolicitud);
        alertStore.push({
            type: 'success',
            message: 'Solicitud aprobada y lista para emitir certificados.'
        });
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo aprobar la solicitud.'
        });
    }
    finally {
        savingSolicitudId.value = null;
    }
};
const verPlantilla = async (plantilla) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${baseUrl}/plantillas/${plantilla.idPlantilla}/descargar`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!response.ok) {
            throw new Error('No se pudo descargar la plantilla');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo abrir la plantilla.'
        });
    }
};
const aprobarPlantilla = async (plantilla) => {
    savingPlantillaId.value = plantilla.idPlantilla;
    try {
        await api.patch(`/plantillas/${plantilla.idPlantilla}/revisar`, {
            estado: 'APROBADA',
            observaciones: ''
        });
        plantillas.value = plantillas.value.filter(item => item.idPlantilla !== plantilla.idPlantilla);
        alertStore.push({
            type: 'success',
            message: 'Plantilla aprobada.'
        });
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo aprobar la plantilla.'
        });
    }
    finally {
        savingPlantillaId.value = null;
    }
};
const openRejectModal = (plantilla) => {
    rejectingPlantilla.value = plantilla;
    rejectObservaciones.value = '';
    rejectError.value = '';
    showRejectModal.value = true;
};
const closeRejectModal = () => {
    showRejectModal.value = false;
    rejectingPlantilla.value = null;
    rejectObservaciones.value = '';
    rejectError.value = '';
};
const rechazarPlantilla = async () => {
    if (!rejectingPlantilla.value)
        return;
    if (!rejectObservaciones.value.trim()) {
        rejectError.value = 'Las observaciones son obligatorias.';
        return;
    }
    const plantilla = rejectingPlantilla.value;
    savingPlantillaId.value = plantilla.idPlantilla;
    try {
        await api.patch(`/plantillas/${plantilla.idPlantilla}/revisar`, {
            estado: 'RECHAZADA',
            observaciones: rejectObservaciones.value.trim()
        });
        plantillas.value = plantillas.value.filter(item => item.idPlantilla !== plantilla.idPlantilla);
        alertStore.push({
            type: 'warning',
            message: 'Plantilla rechazada. Se envio observaciones.'
        });
        closeRejectModal();
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo rechazar la plantilla.'
        });
    }
    finally {
        savingPlantillaId.value = null;
    }
};
watch(selectedCarreraId, () => {
    // re-render computed lists
});
onMounted(() => {
    loadAll();
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
if (__VLS_ctx.pendingSolicitudes > 0) {
    const __VLS_0 = Badge || Badge;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        variant: "warning",
        size: "sm",
    }));
    const __VLS_2 = __VLS_1({
        variant: "warning",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    (__VLS_ctx.pendingSolicitudes);
    // @ts-ignore
    [pendingSolicitudes, pendingSolicitudes,];
    var __VLS_3;
}
const __VLS_6 = Button || Button;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}));
const __VLS_8 = __VLS_7({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
let __VLS_11;
const __VLS_12 = ({ click: {} },
    { onClick: (__VLS_ctx.loadAll) });
const { default: __VLS_13 } = __VLS_9.slots;
// @ts-ignore
[loadAll,];
var __VLS_9;
var __VLS_10;
if (__VLS_ctx.carreras.length > 1) {
    const __VLS_14 = Card || Card;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
    const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
    const { default: __VLS_19 } = __VLS_17.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-2 md:flex-row md:items-center md:justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-semibold text-slate-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.selectedCarreraId),
        ...{ class: "w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
    for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (carrera.idCarrera),
            value: (carrera.idCarrera),
        });
        (carrera.nombre);
        // @ts-ignore
        [carreras, carreras, selectedCarreraId,];
    }
    // @ts-ignore
    [];
    var __VLS_17;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 gap-4 md:grid-cols-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
const __VLS_20 = Card || Card;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({}));
const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const { default: __VLS_25 } = __VLS_23.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-semibold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
(__VLS_ctx.pendingSolicitudes);
// @ts-ignore
[pendingSolicitudes,];
var __VLS_23;
const __VLS_26 = Card || Card;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
const { default: __VLS_31 } = __VLS_29.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-semibold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
(__VLS_ctx.pendingPlantillas);
// @ts-ignore
[pendingPlantillas,];
var __VLS_29;
const __VLS_32 = Card || Card;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const { default: __VLS_37 } = __VLS_35.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-semibold text-emerald-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
(__VLS_ctx.cursosActivos);
// @ts-ignore
[cursosActivos,];
var __VLS_35;
const __VLS_38 = Card || Card;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
const { default: __VLS_43 } = __VLS_41.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-semibold text-emerald-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
(__VLS_ctx.eventosActivos);
// @ts-ignore
[eventosActivos,];
var __VLS_41;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-6 lg:grid-cols-2" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
const __VLS_44 = Card || Card;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({}));
const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const { default: __VLS_49 } = __VLS_47.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-semibold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
if (__VLS_ctx.pendingSolicitudes > 0) {
    const __VLS_50 = Badge || Badge;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        variant: "warning",
        size: "sm",
    }));
    const __VLS_52 = __VLS_51({
        variant: "warning",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    const { default: __VLS_55 } = __VLS_53.slots;
    (__VLS_ctx.pendingSolicitudes);
    // @ts-ignore
    [pendingSolicitudes, pendingSolicitudes,];
    var __VLS_53;
}
if (__VLS_ctx.loadingSolicitudes) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.solicitudesFiltradas.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    for (const [solicitud] of __VLS_vFor((__VLS_ctx.solicitudesFiltradas))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (solicitud.idSolicitud),
            ...{ class: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-start justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (solicitud.codigoParalelo ? 'Curso' : 'Evento');
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
            ...{ class: "text-base font-semibold text-slate-900" },
        });
        /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
        (solicitud.nombreActividad);
        if (solicitud.codigoParalelo) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            (solicitud.codigoParalelo);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (solicitud.nombreDocente);
        const __VLS_56 = Badge || Badge;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
            variant: "warning",
            size: "sm",
        }));
        const __VLS_58 = __VLS_57({
            variant: "warning",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        const { default: __VLS_61 } = __VLS_59.slots;
        // @ts-ignore
        [loadingSolicitudes, solicitudesFiltradas, solicitudesFiltradas,];
        var __VLS_59;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 flex items-center justify-between text-sm text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (solicitud.cantidadAprobados);
        const __VLS_62 = Button || Button;
        // @ts-ignore
        const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
            ...{ 'onClick': {} },
            size: "sm",
            loading: (__VLS_ctx.savingSolicitudId === solicitud.idSolicitud),
        }));
        const __VLS_64 = __VLS_63({
            ...{ 'onClick': {} },
            size: "sm",
            loading: (__VLS_ctx.savingSolicitudId === solicitud.idSolicitud),
        }, ...__VLS_functionalComponentArgsRest(__VLS_63));
        let __VLS_67;
        const __VLS_68 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingSolicitudes))
                        return;
                    if (!!(__VLS_ctx.solicitudesFiltradas.length === 0))
                        return;
                    __VLS_ctx.aprobarSolicitud(solicitud);
                    // @ts-ignore
                    [savingSolicitudId, aprobarSolicitud,];
                } });
        const { default: __VLS_69 } = __VLS_65.slots;
        // @ts-ignore
        [];
        var __VLS_65;
        var __VLS_66;
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
var __VLS_47;
const __VLS_70 = Card || Card;
// @ts-ignore
const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({}));
const __VLS_72 = __VLS_71({}, ...__VLS_functionalComponentArgsRest(__VLS_71));
const { default: __VLS_75 } = __VLS_73.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-semibold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
if (__VLS_ctx.pendingPlantillas > 0) {
    const __VLS_76 = Badge || Badge;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
        variant: "warning",
        size: "sm",
    }));
    const __VLS_78 = __VLS_77({
        variant: "warning",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    const { default: __VLS_81 } = __VLS_79.slots;
    (__VLS_ctx.pendingPlantillas);
    // @ts-ignore
    [pendingPlantillas, pendingPlantillas,];
    var __VLS_79;
}
if (__VLS_ctx.loadingPlantillas) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.plantillasFiltradas.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    for (const [plantilla] of __VLS_vFor((__VLS_ctx.plantillasFiltradas))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (plantilla.idPlantilla),
            ...{ class: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-start justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (plantilla.tipoActividad);
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
            ...{ class: "text-base font-semibold text-slate-900" },
        });
        /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
        (plantilla.nombreActividad);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (plantilla.version);
        const __VLS_82 = Badge || Badge;
        // @ts-ignore
        const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
            variant: "warning",
            size: "sm",
        }));
        const __VLS_84 = __VLS_83({
            variant: "warning",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_83));
        const { default: __VLS_87 } = __VLS_85.slots;
        // @ts-ignore
        [loadingPlantillas, plantillasFiltradas, plantillasFiltradas,];
        var __VLS_85;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 flex flex-wrap items-center gap-2 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        const __VLS_88 = Button || Button;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }));
        const __VLS_90 = __VLS_89({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_89));
        let __VLS_93;
        const __VLS_94 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingPlantillas))
                        return;
                    if (!!(__VLS_ctx.plantillasFiltradas.length === 0))
                        return;
                    __VLS_ctx.verPlantilla(plantilla);
                    // @ts-ignore
                    [verPlantilla,];
                } });
        const { default: __VLS_95 } = __VLS_91.slots;
        // @ts-ignore
        [];
        var __VLS_91;
        var __VLS_92;
        const __VLS_96 = Button || Button;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
            ...{ 'onClick': {} },
            size: "sm",
            loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
        }));
        const __VLS_98 = __VLS_97({
            ...{ 'onClick': {} },
            size: "sm",
            loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        let __VLS_101;
        const __VLS_102 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingPlantillas))
                        return;
                    if (!!(__VLS_ctx.plantillasFiltradas.length === 0))
                        return;
                    __VLS_ctx.aprobarPlantilla(plantilla);
                    // @ts-ignore
                    [savingPlantillaId, aprobarPlantilla,];
                } });
        const { default: __VLS_103 } = __VLS_99.slots;
        // @ts-ignore
        [];
        var __VLS_99;
        var __VLS_100;
        const __VLS_104 = Button || Button;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
            ...{ 'onClick': {} },
            variant: "danger",
            size: "sm",
            loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
        }));
        const __VLS_106 = __VLS_105({
            ...{ 'onClick': {} },
            variant: "danger",
            size: "sm",
            loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
        }, ...__VLS_functionalComponentArgsRest(__VLS_105));
        let __VLS_109;
        const __VLS_110 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingPlantillas))
                        return;
                    if (!!(__VLS_ctx.plantillasFiltradas.length === 0))
                        return;
                    __VLS_ctx.openRejectModal(plantilla);
                    // @ts-ignore
                    [savingPlantillaId, openRejectModal,];
                } });
        const { default: __VLS_111 } = __VLS_107.slots;
        // @ts-ignore
        [];
        var __VLS_107;
        var __VLS_108;
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
var __VLS_73;
const __VLS_112 = Modal || Modal;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showRejectModal),
    title: "Rechazar plantilla",
}));
const __VLS_114 = __VLS_113({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showRejectModal),
    title: "Rechazar plantilla",
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
let __VLS_117;
const __VLS_118 = ({ close: {} },
    { onClose: (__VLS_ctx.closeRejectModal) });
const { default: __VLS_119 } = __VLS_115.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    value: (__VLS_ctx.rejectObservaciones),
    rows: "4",
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-rose-400" },
    placeholder: "Observaciones de rechazo",
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-rose-400']} */ ;
if (__VLS_ctx.rejectError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-rose-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
    (__VLS_ctx.rejectError);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_120 = Button || Button;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120({
    ...{ 'onClick': {} },
    variant: "outline",
}));
const __VLS_122 = __VLS_121({
    ...{ 'onClick': {} },
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
let __VLS_125;
const __VLS_126 = ({ click: {} },
    { onClick: (__VLS_ctx.closeRejectModal) });
const { default: __VLS_127 } = __VLS_123.slots;
// @ts-ignore
[showRejectModal, closeRejectModal, closeRejectModal, rejectObservaciones, rejectError, rejectError,];
var __VLS_123;
var __VLS_124;
const __VLS_128 = Button || Button;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.savingPlantillaId === (__VLS_ctx.rejectingPlantilla?.idPlantilla || 0)),
}));
const __VLS_130 = __VLS_129({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.savingPlantillaId === (__VLS_ctx.rejectingPlantilla?.idPlantilla || 0)),
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
let __VLS_133;
const __VLS_134 = ({ click: {} },
    { onClick: (__VLS_ctx.rechazarPlantilla) });
const { default: __VLS_135 } = __VLS_131.slots;
// @ts-ignore
[savingPlantillaId, rejectingPlantilla, rechazarPlantilla,];
var __VLS_131;
var __VLS_132;
// @ts-ignore
[];
var __VLS_115;
var __VLS_116;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Dashboard.vue.js.map