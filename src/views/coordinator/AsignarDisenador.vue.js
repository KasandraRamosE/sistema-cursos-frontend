import { computed, onMounted, ref } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
const alertStore = useAlertStore();
const authStore = useAuthStore();
const carreras = ref([]);
const selectedCarreraId = ref('');
const tipoFiltro = ref('');
const estadoFiltro = ref('');
const cursos = ref([]);
const eventos = ref([]);
const designers = ref([]);
const participantes = ref([]);
const loadingCursos = ref(false);
const loadingEventos = ref(false);
const loadingDesigners = ref(false);
const loadingParticipantes = ref(false);
const savingDesigner = ref(false);
const searchTerm = ref('');
const designerSearch = ref('');
const showDesignerModal = ref(false);
const assigningActivity = ref(null);
const selectedDesigner = ref(null);
const actividades = computed(() => {
    const cursosRows = cursos.value.map((curso) => ({
        key: `CURSO-${curso.idCurso}`,
        tipo: 'CURSO',
        id: curso.idCurso,
        idCarrera: curso.idCarrera,
        nombre: curso.nombre,
        carreraNombre: curso.nombreCarrera,
        estadoActividad: curso.estado || '-',
        idDisenador: curso.idDisenador ?? null,
        nombreDisenador: curso.nombreDisenador ?? null
    }));
    const eventosRows = eventos.value.map((evento) => ({
        key: `EVENTO-${evento.idEvento}`,
        tipo: 'EVENTO',
        id: evento.idEvento,
        idCarrera: evento.idCarrera,
        nombre: evento.nombre,
        carreraNombre: evento.nombreCarrera,
        estadoActividad: evento.estado || '-',
        idDisenador: evento.idDisenador ?? null,
        nombreDisenador: evento.nombreDisenador ?? null
    }));
    return [...cursosRows, ...eventosRows];
});
const actividadesFiltradas = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    const carrerasPermitidas = new Set(carreras.value.map(carrera => carrera.idCarrera));
    return actividades.value.filter((actividad) => {
        const carreraPermitida = carrerasPermitidas.size === 0 ? false : carrerasPermitidas.has(actividad.idCarrera);
        const carreraOk = !selectedCarreraId.value || actividad.idCarrera === selectedCarreraId.value;
        const tipoOk = !tipoFiltro.value || actividad.tipo === tipoFiltro.value;
        const estadoOk = !estadoFiltro.value || actividad.estadoActividad === estadoFiltro.value;
        const searchOk = !term || actividad.nombre.toLowerCase().includes(term);
        return carreraPermitida && carreraOk && tipoOk && estadoOk && searchOk;
    });
});
const designersFiltrados = computed(() => {
    const term = designerSearch.value.trim().toLowerCase();
    if (!term)
        return [];
    const merged = new Map();
    designers.value.forEach(disenador => merged.set(disenador.idUsuario, disenador));
    participantes.value.forEach(participante => {
        if (!merged.has(participante.idUsuario)) {
            merged.set(participante.idUsuario, participante);
        }
    });
    return Array.from(merged.values()).filter(persona => {
        const fullName = `${persona.nombres} ${persona.apellidos}`.toLowerCase();
        return fullName.includes(term) || persona.username.toLowerCase().includes(term);
    });
});
const loadCarreras = async () => {
    const endpoint = authStore.hasRole('ADMINISTRADOR')
        ? '/carreras/todas'
        : '/coordinador/carreras';
    const response = await api.get(endpoint);
    carreras.value = response;
};
const loadCursos = async () => {
    loadingCursos.value = true;
    try {
        const response = await api.get('/cursos/todos');
        cursos.value = response;
    }
    finally {
        loadingCursos.value = false;
    }
};
const loadEventos = async () => {
    loadingEventos.value = true;
    try {
        const response = await api.get('/eventos/todos');
        eventos.value = response;
    }
    finally {
        loadingEventos.value = false;
    }
};
const loadDesigners = async () => {
    loadingDesigners.value = true;
    try {
        const response = await api.get('/usuarios/disenadores');
        designers.value = response;
    }
    finally {
        loadingDesigners.value = false;
    }
};
const loadParticipantes = async () => {
    loadingParticipantes.value = true;
    try {
        const response = await api.get('/usuarios/participantes');
        participantes.value = response;
    }
    finally {
        loadingParticipantes.value = false;
    }
};
const loadAll = async () => {
    await Promise.all([
        loadCarreras(),
        loadCursos(),
        loadEventos(),
        loadDesigners(),
        loadParticipantes()
    ]);
};
const loading = computed(() => {
    return loadingCursos.value || loadingEventos.value;
});
const openDesignerModal = (tipo, id, idCarrera, nombre, idDisenador, nombreDisenador) => {
    assigningActivity.value = {
        tipo,
        id,
        idCarrera,
        nombre,
        idDisenador: idDisenador ?? null,
        nombreDisenador: nombreDisenador ?? null
    };
    designerSearch.value = '';
    selectedDesigner.value = null;
    showDesignerModal.value = true;
};
const closeDesignerModal = () => {
    showDesignerModal.value = false;
    assigningActivity.value = null;
    selectedDesigner.value = null;
    designerSearch.value = '';
};
const selectDesigner = (persona) => {
    selectedDesigner.value = persona;
};
const assignDesigner = async () => {
    if (!assigningActivity.value || !selectedDesigner.value)
        return;
    const carrerasPermitidas = new Set(carreras.value.map(carrera => carrera.idCarrera));
    if (!carrerasPermitidas.has(assigningActivity.value.idCarrera)) {
        alertStore.push({
            type: 'error',
            message: 'No puedes asignar diseñadores a actividades fuera de tus carreras.'
        });
        return;
    }
    savingDesigner.value = true;
    try {
        const selectedId = Number(selectedDesigner.value.idUsuario);
        if (!isDesigner(selectedDesigner.value.roles)) {
            await api.post(`/usuarios/${selectedId}/roles`, {
                nombreRol: 'DISENADOR'
            });
            await Promise.all([loadDesigners(), loadParticipantes()]);
        }
        if (assigningActivity.value.tipo === 'CURSO') {
            const response = await api.patch(`/cursos/${assigningActivity.value.id}/disenador`, {
                idDisenador: selectedId
            });
            cursos.value = cursos.value.map(item => item.idCurso === response.idCurso ? response : item);
        }
        else {
            const response = await api.patch(`/eventos/${assigningActivity.value.id}/disenador`, {
                idDisenador: selectedId
            });
            eventos.value = eventos.value.map(item => item.idEvento === response.idEvento ? response : item);
        }
        alertStore.push({
            type: 'success',
            message: 'Diseñador asignado correctamente.'
        });
        closeDesignerModal();
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo asignar el diseñador.'
        });
    }
    finally {
        savingDesigner.value = false;
    }
};
const isDesigner = (roles) => {
    return roles.some(role => role === 'DISENADOR' || role === 'DISEÑADOR');
};
const estadoActividadBadge = (estado) => {
    switch (estado) {
        case 'ABIERTO':
            return 'success';
        case 'LLENO':
            return 'warning';
        case 'FINALIZADO':
            return 'gray';
        default:
            return 'gray';
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
const __VLS_0 = Button || Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.loadAll) });
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[loadAll,];
var __VLS_3;
var __VLS_4;
const __VLS_8 = Card || Card;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 md:grid-cols-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
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
    value: "",
});
for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (carrera.idCarrera),
        value: (carrera.idCarrera),
    });
    (carrera.nombre);
    // @ts-ignore
    [selectedCarreraId, carreras,];
}
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
    value: (__VLS_ctx.tipoFiltro),
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
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "CURSO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "EVENTO",
});
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
    value: (__VLS_ctx.estadoFiltro),
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
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ABIERTO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "LLENO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "FINALIZADO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
    placeholder: "Nombre de curso o evento",
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
// @ts-ignore
[tipoFiltro, estadoFiltro, searchTerm,];
var __VLS_11;
const __VLS_14 = Card || Card;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_19 } = __VLS_17.slots;
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
if (__VLS_ctx.actividadesFiltradas.length > 0) {
    const __VLS_20 = Badge || Badge;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        variant: "primary",
        size: "sm",
    }));
    const __VLS_22 = __VLS_21({
        variant: "primary",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    const { default: __VLS_25 } = __VLS_23.slots;
    (__VLS_ctx.actividadesFiltradas.length);
    // @ts-ignore
    [actividadesFiltradas, actividadesFiltradas,];
    var __VLS_23;
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.actividadesFiltradas.length === 0) {
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
        ...{ class: "mt-4 overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "min-w-full text-left text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-slate-100" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-slate-100']} */ ;
    for (const [actividad] of __VLS_vFor((__VLS_ctx.actividadesFiltradas))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (actividad.key),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold text-slate-900" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
        (actividad.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (actividad.carreraNombre || 'Sin carrera');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_26 = Badge || Badge;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            variant: (actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_28 = __VLS_27({
            variant: (actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        const { default: __VLS_31 } = __VLS_29.slots;
        (actividad.tipo);
        // @ts-ignore
        [actividadesFiltradas, actividadesFiltradas, loading,];
        var __VLS_29;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_32 = Badge || Badge;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            variant: (__VLS_ctx.estadoActividadBadge(actividad.estadoActividad)),
            size: "sm",
        }));
        const __VLS_34 = __VLS_33({
            variant: (__VLS_ctx.estadoActividadBadge(actividad.estadoActividad)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        const { default: __VLS_37 } = __VLS_35.slots;
        (actividad.estadoActividad);
        // @ts-ignore
        [estadoActividadBadge,];
        var __VLS_35;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        (actividad.nombreDisenador || 'Sin asignar');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
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
                    if (!!(__VLS_ctx.actividadesFiltradas.length === 0))
                        return;
                    __VLS_ctx.openDesignerModal(actividad.tipo, actividad.id, actividad.idCarrera, actividad.nombre, actividad.idDisenador, actividad.nombreDisenador);
                    // @ts-ignore
                    [openDesignerModal,];
                } });
        const { default: __VLS_45 } = __VLS_41.slots;
        (actividad.idDisenador ? 'Reasignar' : 'Asignar');
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
var __VLS_17;
const __VLS_46 = Modal || Modal;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDesignerModal),
    title: "Asignar diseñador",
    size: "lg",
}));
const __VLS_48 = __VLS_47({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDesignerModal),
    title: "Asignar diseñador",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_47));
let __VLS_51;
const __VLS_52 = ({ close: {} },
    { onClose: (__VLS_ctx.closeDesignerModal) });
const { default: __VLS_53 } = __VLS_49.slots;
if (__VLS_ctx.assigningActivity) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-semibold text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.assigningActivity.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.assigningActivity.tipo);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "mb-1 block text-sm font-medium text-slate-700" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.designerSearch),
        type: "text",
        placeholder: "Buscar por nombre o username",
        ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-48']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    for (const [persona] of __VLS_vFor((__VLS_ctx.designersFiltrados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.assigningActivity))
                        return;
                    __VLS_ctx.selectDesigner(persona);
                    // @ts-ignore
                    [showDesignerModal, closeDesignerModal, assigningActivity, assigningActivity, assigningActivity, designerSearch, designersFiltrados, selectDesigner,];
                } },
            key: (persona.idUsuario),
            type: "button",
            ...{ class: "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition" },
            ...{ class: (__VLS_ctx.selectedDesigner?.idUsuario === persona.idUsuario
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-transparent hover:bg-slate-50') },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium text-slate-900" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
        (persona.nombres);
        (persona.apellidos);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "ml-2 text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (persona.username);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (__VLS_ctx.isDesigner(persona.roles) ? 'Diseñador' : 'Participante');
        // @ts-ignore
        [selectedDesigner, isDesigner,];
    }
    if (__VLS_ctx.designerSearch.trim() === '') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-center text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    else if (__VLS_ctx.designersFiltrados.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-center text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    if (__VLS_ctx.loadingDesigners || __VLS_ctx.loadingParticipantes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    if (__VLS_ctx.assigningActivity.nombreDisenador) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (__VLS_ctx.assigningActivity.nombreDisenador);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_54 = Button || Button;
    // @ts-ignore
    const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
        ...{ 'onClick': {} },
        variant: "outline",
    }));
    const __VLS_56 = __VLS_55({
        ...{ 'onClick': {} },
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_55));
    let __VLS_59;
    const __VLS_60 = ({ click: {} },
        { onClick: (__VLS_ctx.closeDesignerModal) });
    const { default: __VLS_61 } = __VLS_57.slots;
    // @ts-ignore
    [closeDesignerModal, assigningActivity, assigningActivity, designerSearch, designersFiltrados, loadingDesigners, loadingParticipantes,];
    var __VLS_57;
    var __VLS_58;
    const __VLS_62 = Button || Button;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.savingDesigner),
    }));
    const __VLS_64 = __VLS_63({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.savingDesigner),
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    let __VLS_67;
    const __VLS_68 = ({ click: {} },
        { onClick: (__VLS_ctx.assignDesigner) });
    const { default: __VLS_69 } = __VLS_65.slots;
    // @ts-ignore
    [savingDesigner, assignDesigner,];
    var __VLS_65;
    var __VLS_66;
}
// @ts-ignore
[];
var __VLS_49;
var __VLS_50;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=AsignarDisenador.vue.js.map