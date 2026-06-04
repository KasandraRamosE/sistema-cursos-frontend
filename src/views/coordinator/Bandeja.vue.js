import { computed, onMounted, ref } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
import { useAlertStore } from '@/stores/alert.store';
const alertStore = useAlertStore();
const activeTab = ref('solicitudes');
const searchTerm = ref('');
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
const pendingTotal = computed(() => filteredSolicitudes.value.length + filteredPlantillas.value.length);
const solicitudesFiltradasPorCarrera = computed(() => {
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
const filteredSolicitudes = computed(() => {
    const query = searchTerm.value.trim().toLowerCase();
    if (!query)
        return solicitudesFiltradasPorCarrera.value;
    return solicitudesFiltradasPorCarrera.value.filter(solicitud => {
        const values = [
            solicitud.nombreActividad,
            solicitud.nombreDocente,
            solicitud.codigoParalelo ?? ''
        ];
        return values.some(value => value.toLowerCase().includes(query));
    });
});
const plantillasFiltradasPorCarrera = computed(() => {
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
const filteredPlantillas = computed(() => {
    const query = searchTerm.value.trim().toLowerCase();
    if (!query)
        return plantillasFiltradasPorCarrera.value;
    return plantillasFiltradasPorCarrera.value.filter(plantilla => {
        const values = [
            plantilla.nombreActividad,
            plantilla.tipoActividad,
            plantilla.subidaPor,
            String(plantilla.version)
        ];
        return values.some(value => value.toLowerCase().includes(query));
    });
});
const loadCarreras = async () => {
    const response = await api.get('/coordinador/carreras');
    carreras.value = response;
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
if (__VLS_ctx.pendingTotal > 0) {
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
    (__VLS_ctx.pendingTotal);
    // @ts-ignore
    [pendingTotal, pendingTotal,];
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
const __VLS_14 = Card || Card;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_19 } = __VLS_17.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 md:grid-cols-3" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-xs font-semibold uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.selectedCarreraId),
    ...{ class: "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
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
if (__VLS_ctx.carreras.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
}
for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (carrera.idCarrera),
        value: (carrera.idCarrera),
    });
    (carrera.nombre);
    // @ts-ignore
    [selectedCarreraId, carreras, carreras,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-xs font-semibold uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.searchTerm),
    type: "text",
    placeholder: "Buscar por actividad, docente o codigo",
    ...{ class: "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'solicitudes';
            // @ts-ignore
            [searchTerm, activeTab,];
        } },
    ...{ class: "rounded-full px-4 py-2 text-sm font-medium" },
    ...{ class: (__VLS_ctx.activeTab === 'solicitudes' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600') },
});
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
(__VLS_ctx.filteredSolicitudes.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'plantillas';
            // @ts-ignore
            [activeTab, activeTab, filteredSolicitudes,];
        } },
    ...{ class: "rounded-full px-4 py-2 text-sm font-medium" },
    ...{ class: (__VLS_ctx.activeTab === 'plantillas' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600') },
});
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
(__VLS_ctx.filteredPlantillas.length);
// @ts-ignore
[activeTab, filteredPlantillas,];
var __VLS_17;
if (__VLS_ctx.activeTab === 'solicitudes') {
    const __VLS_20 = Card || Card;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({}));
    const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
    const { default: __VLS_25 } = __VLS_23.slots;
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
    if (__VLS_ctx.filteredSolicitudes.length > 0) {
        const __VLS_26 = Badge || Badge;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            variant: "warning",
            size: "sm",
        }));
        const __VLS_28 = __VLS_27({
            variant: "warning",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        const { default: __VLS_31 } = __VLS_29.slots;
        (__VLS_ctx.filteredSolicitudes.length);
        // @ts-ignore
        [activeTab, filteredSolicitudes, filteredSolicitudes,];
        var __VLS_29;
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
    else if (__VLS_ctx.filteredSolicitudes.length === 0) {
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
        for (const [solicitud] of __VLS_vFor((__VLS_ctx.filteredSolicitudes))) {
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
            const __VLS_32 = Badge || Badge;
            // @ts-ignore
            const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
                variant: "warning",
                size: "sm",
            }));
            const __VLS_34 = __VLS_33({
                variant: "warning",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_33));
            const { default: __VLS_37 } = __VLS_35.slots;
            // @ts-ignore
            [filteredSolicitudes, filteredSolicitudes, loadingSolicitudes,];
            var __VLS_35;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (solicitud.cantidadAprobados);
            const __VLS_38 = Button || Button;
            // @ts-ignore
            const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.savingSolicitudId === solicitud.idSolicitud),
            }));
            const __VLS_40 = __VLS_39({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.savingSolicitudId === solicitud.idSolicitud),
            }, ...__VLS_functionalComponentArgsRest(__VLS_39));
            let __VLS_43;
            const __VLS_44 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'solicitudes'))
                            return;
                        if (!!(__VLS_ctx.loadingSolicitudes))
                            return;
                        if (!!(__VLS_ctx.filteredSolicitudes.length === 0))
                            return;
                        __VLS_ctx.aprobarSolicitud(solicitud);
                        // @ts-ignore
                        [savingSolicitudId, aprobarSolicitud,];
                    } });
            const { default: __VLS_45 } = __VLS_41.slots;
            // @ts-ignore
            [];
            var __VLS_41;
            var __VLS_42;
            // @ts-ignore
            [];
        }
    }
    // @ts-ignore
    [];
    var __VLS_23;
}
else {
    const __VLS_46 = Card || Card;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({}));
    const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
    const { default: __VLS_51 } = __VLS_49.slots;
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
    if (__VLS_ctx.filteredPlantillas.length > 0) {
        const __VLS_52 = Badge || Badge;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            variant: "warning",
            size: "sm",
        }));
        const __VLS_54 = __VLS_53({
            variant: "warning",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        const { default: __VLS_57 } = __VLS_55.slots;
        (__VLS_ctx.filteredPlantillas.length);
        // @ts-ignore
        [filteredPlantillas, filteredPlantillas,];
        var __VLS_55;
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
    else if (__VLS_ctx.filteredPlantillas.length === 0) {
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
        for (const [plantilla] of __VLS_vFor((__VLS_ctx.filteredPlantillas))) {
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
            const __VLS_58 = Badge || Badge;
            // @ts-ignore
            const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
                variant: "warning",
                size: "sm",
            }));
            const __VLS_60 = __VLS_59({
                variant: "warning",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_59));
            const { default: __VLS_63 } = __VLS_61.slots;
            // @ts-ignore
            [filteredPlantillas, filteredPlantillas, loadingPlantillas,];
            var __VLS_61;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-3 flex flex-wrap items-center gap-2 text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            const __VLS_64 = Button || Button;
            // @ts-ignore
            const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
                ...{ 'onClick': {} },
                variant: "outline",
                size: "sm",
            }));
            const __VLS_66 = __VLS_65({
                ...{ 'onClick': {} },
                variant: "outline",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_65));
            let __VLS_69;
            const __VLS_70 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activeTab === 'solicitudes'))
                            return;
                        if (!!(__VLS_ctx.loadingPlantillas))
                            return;
                        if (!!(__VLS_ctx.filteredPlantillas.length === 0))
                            return;
                        __VLS_ctx.verPlantilla(plantilla);
                        // @ts-ignore
                        [verPlantilla,];
                    } });
            const { default: __VLS_71 } = __VLS_67.slots;
            // @ts-ignore
            [];
            var __VLS_67;
            var __VLS_68;
            const __VLS_72 = Button || Button;
            // @ts-ignore
            const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
            }));
            const __VLS_74 = __VLS_73({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
            }, ...__VLS_functionalComponentArgsRest(__VLS_73));
            let __VLS_77;
            const __VLS_78 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activeTab === 'solicitudes'))
                            return;
                        if (!!(__VLS_ctx.loadingPlantillas))
                            return;
                        if (!!(__VLS_ctx.filteredPlantillas.length === 0))
                            return;
                        __VLS_ctx.aprobarPlantilla(plantilla);
                        // @ts-ignore
                        [savingPlantillaId, aprobarPlantilla,];
                    } });
            const { default: __VLS_79 } = __VLS_75.slots;
            // @ts-ignore
            [];
            var __VLS_75;
            var __VLS_76;
            const __VLS_80 = Button || Button;
            // @ts-ignore
            const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
                ...{ 'onClick': {} },
                variant: "danger",
                size: "sm",
                loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
            }));
            const __VLS_82 = __VLS_81({
                ...{ 'onClick': {} },
                variant: "danger",
                size: "sm",
                loading: (__VLS_ctx.savingPlantillaId === plantilla.idPlantilla),
            }, ...__VLS_functionalComponentArgsRest(__VLS_81));
            let __VLS_85;
            const __VLS_86 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activeTab === 'solicitudes'))
                            return;
                        if (!!(__VLS_ctx.loadingPlantillas))
                            return;
                        if (!!(__VLS_ctx.filteredPlantillas.length === 0))
                            return;
                        __VLS_ctx.openRejectModal(plantilla);
                        // @ts-ignore
                        [savingPlantillaId, openRejectModal,];
                    } });
            const { default: __VLS_87 } = __VLS_83.slots;
            // @ts-ignore
            [];
            var __VLS_83;
            var __VLS_84;
            // @ts-ignore
            [];
        }
    }
    // @ts-ignore
    [];
    var __VLS_49;
}
const __VLS_88 = Modal || Modal;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showRejectModal),
    title: "Rechazar plantilla",
}));
const __VLS_90 = __VLS_89({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showRejectModal),
    title: "Rechazar plantilla",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
let __VLS_93;
const __VLS_94 = ({ close: {} },
    { onClose: (__VLS_ctx.closeRejectModal) });
const { default: __VLS_95 } = __VLS_91.slots;
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
const __VLS_96 = Button || Button;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
    ...{ 'onClick': {} },
    variant: "outline",
}));
const __VLS_98 = __VLS_97({
    ...{ 'onClick': {} },
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
let __VLS_101;
const __VLS_102 = ({ click: {} },
    { onClick: (__VLS_ctx.closeRejectModal) });
const { default: __VLS_103 } = __VLS_99.slots;
// @ts-ignore
[showRejectModal, closeRejectModal, closeRejectModal, rejectObservaciones, rejectError, rejectError,];
var __VLS_99;
var __VLS_100;
const __VLS_104 = Button || Button;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.savingPlantillaId === (__VLS_ctx.rejectingPlantilla?.idPlantilla || 0)),
}));
const __VLS_106 = __VLS_105({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.savingPlantillaId === (__VLS_ctx.rejectingPlantilla?.idPlantilla || 0)),
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
let __VLS_109;
const __VLS_110 = ({ click: {} },
    { onClick: (__VLS_ctx.rechazarPlantilla) });
const { default: __VLS_111 } = __VLS_107.slots;
// @ts-ignore
[savingPlantillaId, rejectingPlantilla, rechazarPlantilla,];
var __VLS_107;
var __VLS_108;
// @ts-ignore
[];
var __VLS_91;
var __VLS_92;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Bandeja.vue.js.map