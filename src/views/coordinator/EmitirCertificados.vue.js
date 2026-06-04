import { computed, onMounted, ref, watch } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import { api } from '@/utils/api';
import { formatDateTime as formatDateTimeUtil, parseLocalDate } from '@/utils/dateFormatter';
import { useAlertStore } from '@/stores/alert.store';
import { usePagination } from '@/composables/usePagination';
const alertStore = useAlertStore();
const loading = ref(false);
const processingKey = ref(null);
const carreras = ref([]);
const cursos = ref([]);
const eventos = ref([]);
const solicitudes = ref([]);
const certificados = ref([]);
const searchTerm = ref('');
const tipoFiltro = ref('');
const estadoFiltro = ref('');
const selectedCarreraId = ref('');
const normalizeText = (s) => String(s || '').toLowerCase().trim();
const getRowDate = (dateString) => {
    if (!dateString)
        return 0;
    try {
        return parseLocalDate(dateString).getTime();
    }
    catch {
        return 0;
    }
};
const carrerasCoordinadorIds = computed(() => new Set(carreras.value.map(c => c.idCarrera)));
const formatActivityDate = (item) => {
    if (!item.fechaActividad)
        return '-';
    return item.tipo === 'CURSO'
        ? formatDateTimeUtil(item.fechaActividad, 'es-BO').split(',')[0]
        : formatDateTimeUtil(item.fechaActividad, 'es-BO');
};
const solicitudesView = computed(() => {
    const cursosByName = new Map(cursos.value.map(c => [normalizeText(c.nombre), c]));
    const eventosByName = new Map(eventos.value.map(e => [normalizeText(e.nombre), e]));
    const carrerasById = new Map(carreras.value.map(c => [c.idCarrera, c]));
    return solicitudes.value.map(item => {
        const isCurso = Boolean(item.codigoParalelo);
        const curso = isCurso ? cursosByName.get(normalizeText(item.nombreActividad)) : undefined;
        const evento = !isCurso ? eventosByName.get(normalizeText(item.nombreActividad)) : undefined;
        const carreraId = isCurso ? curso?.idCarrera : evento?.idCarrera;
        let carreraNombre = '';
        if (isCurso) {
            carreraNombre = curso?.nombreCarrera || (carrerasById.get(curso?.idCarrera || -1)?.nombre) || '';
        }
        else {
            carreraNombre = evento?.nombreCarrera || '';
        }
        return {
            ...item,
            tipoActividad: isCurso ? 'CURSO' : 'EVENTO',
            idCurso: curso?.idCurso,
            idEvento: evento?.idEvento,
            carreraId,
            carreraNombre,
            canEmit: Boolean(isCurso ? curso?.idCurso : evento?.idEvento),
            templateVigente: isCurso
                ? Boolean(curso?.idCurso && plantillaEstadosByActividad.value.get(`CURSO-${curso.idCurso}`)?.estado === 'VIGENTE')
                : Boolean(evento?.idEvento && plantillaEstadosByActividad.value.get(`EVENTO-${evento.idEvento}`)?.estado === 'VIGENTE')
        };
    });
});
const certificadosEmitidosMap = computed(() => {
    const map = new Map();
    certificados.value.forEach((certificado) => {
        if (String(certificado.estadoEmision) !== 'GENERADO')
            return;
        const key = `${String(certificado.tipoActividad || '')}-${String(certificado.nombreActividad || '')}`;
        map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
});
const solicitudCursoMap = computed(() => {
    const map = new Map();
    solicitudesView.value
        .filter(item => item.tipoActividad === 'CURSO')
        .forEach((item) => {
        map.set(normalizeText(item.nombreActividad), item);
    });
    return map;
});
const plantillaEstadosByActividad = computed(() => {
    const map = new Map();
    plantillasEstados.value.forEach(item => {
        if (item.idCurso != null) {
            map.set(`CURSO-${item.idCurso}`, item);
        }
        else if (item.idEvento != null) {
            map.set(`EVENTO-${item.idEvento}`, item);
        }
    });
    return map;
});
const getTemplateState = (estado) => {
    if (!estado) {
        return { estadoPlantilla: 'SIN_PLANTILLA', estadoPlantillaLabel: 'Sin plantilla' };
    }
    if (estado === 'PENDIENTE') {
        return { estadoPlantilla: 'PENDIENTE', estadoPlantillaLabel: 'Pendiente' };
    }
    return { estadoPlantilla: 'APROBADA', estadoPlantillaLabel: 'Aprobada' };
};
const activities = computed(() => {
    const cursosRows = cursos.value.map((curso) => {
        const solicitud = solicitudCursoMap.value.get(normalizeText(curso.nombre))
            ?? solicitudesView.value.find(item => item.tipoActividad === 'CURSO' && normalizeText(item.nombreActividad) === normalizeText(curso.nombre));
        const key = `CURSO-${curso.nombre}`;
        const emittedCount = certificadosEmitidosMap.value.get(key) || 0;
        const fechaActividad = curso.fechaInicio || curso.fechaCreacion || null;
        const templateMeta = plantillaEstadosByActividad.value.get(`CURSO-${curso.idCurso}`) ?? null;
        const templateState = getTemplateState(templateMeta?.estado ?? null);
        const estado = emittedCount > 0
            ? 'EMITIDO'
            : solicitud && templateMeta?.estado === 'VIGENTE'
                ? 'LISTO'
                : 'NO_EMITIDO';
        const carrerasById = new Map(carreras.value.map(c => [c.idCarrera, c]));
        const carreraNombre = curso.nombreCarrera || (carrerasById.get(curso.idCarrera)?.nombre) || 'Sin carrera';
        return {
            key,
            tipo: 'CURSO',
            nombre: curso.nombre,
            carreraNombre,
            fechaActividad,
            carreraId: curso.idCarrera,
            estado,
            ...templateState,
            canEmit: estado === 'LISTO',
            idCurso: curso.idCurso,
            idEvento: undefined,
            idSolicitud: solicitud?.idSolicitud,
            codigoParalelo: solicitud?.codigoParalelo ?? null,
            nombreDocente: solicitud?.nombreDocente ?? null,
            cantidadAprobados: solicitud?.cantidadAprobados ?? null,
            fechaSolicitud: solicitud?.fechaSolicitud ?? null,
            fechaEvento: undefined,
            templateVigente: templateMeta?.estado === 'VIGENTE',
            certificadosEmitidos: emittedCount
        };
    });
    const eventosRows = eventos.value.map(evento => {
        const key = `EVENTO-${evento.nombre}`;
        const emittedCount = certificadosEmitidosMap.value.get(key) || 0;
        const fechaActividad = evento.fechaHora || evento.fechaCreacion || null;
        const templateMeta = plantillaEstadosByActividad.value.get(`EVENTO-${evento.idEvento}`) ?? null;
        const templateState = getTemplateState(templateMeta?.estado ?? null);
        const fechaPasada = evento.fechaHora ? parseLocalDate(evento.fechaHora) <= new Date() : false;
        const estado = emittedCount > 0
            ? 'EMITIDO'
            : templateMeta?.estado === 'VIGENTE' && fechaPasada
                ? 'LISTO'
                : 'NO_EMITIDO';
        return {
            key,
            tipo: 'EVENTO',
            nombre: evento.nombre,
            carreraNombre: evento.nombreCarrera || 'Sin carrera',
            fechaActividad,
            carreraId: evento.idCarrera,
            estado,
            ...templateState,
            canEmit: estado === 'LISTO',
            idCurso: undefined,
            idEvento: evento.idEvento,
            idSolicitud: undefined,
            codigoParalelo: undefined,
            nombreDocente: undefined,
            cantidadAprobados: undefined,
            fechaSolicitud: undefined,
            fechaEvento: evento.fechaHora,
            templateVigente: templateMeta?.estado === 'VIGENTE',
            certificadosEmitidos: emittedCount
        };
    });
    return [...cursosRows, ...eventosRows].sort((a, b) => getRowDate(b.fechaActividad) - getRowDate(a.fechaActividad));
});
const filteredActivities = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    return activities.value.filter(item => {
        const carreraPermitida = item.carreraId !== undefined && carrerasCoordinadorIds.value.has(item.carreraId);
        const carreraSeleccionada = selectedCarreraId.value === '' || item.carreraId === selectedCarreraId.value;
        const carreraOk = carreraPermitida && carreraSeleccionada;
        const searchOk = !term
            || item.nombre.toLowerCase().includes(term)
            || (item.nombreDocente ?? '').toLowerCase().includes(term)
            || item.carreraNombre.toLowerCase().includes(term);
        const tipoOk = !tipoFiltro.value || item.tipo === tipoFiltro.value;
        const estadoOk = !estadoFiltro.value || item.estado === estadoFiltro.value;
        return carreraOk && searchOk && tipoOk && estadoOk;
    });
});
const { currentPage, pageSize, totalPages, totalItems, startIndex, endIndex, paginatedData: paginatedActivities, goToPage, goToFirstPage } = usePagination(filteredActivities, { pageSize: 10 });
const pageStart = computed(() => (totalItems.value === 0 ? 0 : startIndex.value + 1));
const pageEnd = computed(() => endIndex.value);
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
    const response = await api.get('/evaluaciones/solicitudes/todas');
    solicitudes.value = response;
};
const plantillasEstados = ref([]);
const loadPlantillasEstados = async () => {
    const response = await api.get('/plantillas/estados-por-actividad');
    plantillasEstados.value = response;
};
const loadCertificados = async () => {
    const response = await api.get('/certificados/admin');
    certificados.value = response;
};
const loadAll = async () => {
    loading.value = true;
    try {
        goToFirstPage();
        await Promise.all([loadCarreras(), loadCursos(), loadEventos(), loadSolicitudes(), loadCertificados(), loadPlantillasEstados()]);
    }
    finally {
        loading.value = false;
    }
};
const ensurePlantillaVigente = async (payload) => {
    if (payload.idCurso) {
        const historial = await api.get(`/plantillas/historial?idCurso=${payload.idCurso}`);
        const vigente = historial.some(item => String(item.estado) === 'VIGENTE');
        if (!vigente) {
            throw new Error('No hay plantilla aprobada para este curso.');
        }
        return;
    }
    if (payload.idEvento) {
        const historial = await api.get(`/plantillas/historial?idEvento=${payload.idEvento}`);
        const vigente = historial.some(item => String(item.estado) === 'VIGENTE');
        if (!vigente) {
            throw new Error('No hay plantilla aprobada para este evento.');
        }
        return;
    }
    throw new Error('No se encontro la actividad para emitir.');
};
const emitirCurso = async (item) => {
    if (!item || !item.canEmit || item.tipo !== 'CURSO') {
        alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' });
        return;
    }
    processingKey.value = item.key;
    try {
        await ensurePlantillaVigente({ idCurso: item.idCurso, idEvento: item.idEvento });
        await api.post('/certificados/lote', {
            idCurso: item.idCurso,
            codigoParalelo: item.codigoParalelo
        });
        if (item.idSolicitud) {
            await api.patch(`/evaluaciones/solicitudes/${item.idSolicitud}?estado=COMPLETADO`);
        }
        alertStore.push({
            type: 'success',
            message: 'Emision completada. Los certificados se generaron en lote.'
        });
        await loadAll();
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo emitir el lote.'
        });
    }
    finally {
        processingKey.value = null;
    }
};
const emitirEvento = async (item) => {
    if (!item || !item.canEmit || item.tipo !== 'EVENTO' || !item.idEvento) {
        alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' });
        return;
    }
    processingKey.value = item.key;
    try {
        const solicitud = await api.post(`/evaluaciones/solicitudes/evento/${item.idEvento}`, {
            notas: 'Generada desde el panel de emisión'
        });
        await api.patch(`/evaluaciones/solicitudes/${solicitud.idSolicitud}?estado=COMPLETADO`);
        alertStore.push({
            type: 'success',
            message: `Certificados de ${item.nombre} emitidos correctamente.`
        });
        await loadAll();
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo emitir el evento.'
        });
    }
    finally {
        processingKey.value = null;
    }
};
const estadoLabel = (estado) => {
    switch (estado) {
        case 'LISTO':
            return 'Listo para emitir';
        case 'EMITIDO':
            return 'Emitido';
        case 'NO_EMITIDO':
            return 'No emitido';
        default:
            return estado;
    }
};
const estadoPlantillaBadge = (estado) => {
    switch (estado) {
        case 'APROBADA':
            return 'success';
        case 'PENDIENTE':
            return 'warning';
        case 'SIN_PLANTILLA':
        default:
            return 'gray';
    }
};
watch([searchTerm, tipoFiltro, estadoFiltro, selectedCarreraId], () => {
    goToFirstPage();
});
const estadoBadge = (estado) => {
    switch (estado) {
        case 'LISTO':
            return 'warning';
        case 'EMITIDO':
            return 'success';
        case 'NO_EMITIDO':
            return 'gray';
        default:
            return 'gray';
    }
};
const formatDatetime = (datetime) => {
    if (!datetime)
        return '-';
    return formatDateTimeUtil(datetime, 'es-BO');
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
    ...{ class: "grid gap-4 md:grid-cols-5" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-5']} */ ;
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
    placeholder: "Buscar por actividad o docente",
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
    value: (''),
});
for (const [c] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (c.idCarrera),
        value: (c.idCarrera),
    });
    (c.nombre);
    // @ts-ignore
    [searchTerm, selectedCarreraId, carreras,];
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
    value: "LISTO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "NO_EMITIDO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "EMITIDO",
});
// @ts-ignore
[tipoFiltro, estadoFiltro,];
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
(__VLS_ctx.filteredActivities.length);
// @ts-ignore
[filteredActivities,];
var __VLS_23;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.filteredActivities.length === 0) {
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
    for (const [item] of __VLS_vFor((__VLS_ctx.paginatedActivities))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.key),
            ...{ class: "hover:bg-slate-50" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-slate-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-semibold text-slate-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
        (item.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (item.carreraNombre || 'Sin carrera');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        (__VLS_ctx.formatActivityDate(item));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_26 = Badge || Badge;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            variant: (item.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_28 = __VLS_27({
            variant: (item.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        const { default: __VLS_31 } = __VLS_29.slots;
        (item.tipo);
        // @ts-ignore
        [filteredActivities, loading, paginatedActivities, formatActivityDate,];
        var __VLS_29;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_32 = Badge || Badge;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            variant: (__VLS_ctx.estadoBadge(item.estado)),
            size: "sm",
        }));
        const __VLS_34 = __VLS_33({
            variant: (__VLS_ctx.estadoBadge(item.estado)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        const { default: __VLS_37 } = __VLS_35.slots;
        (__VLS_ctx.estadoLabel(item.estado));
        // @ts-ignore
        [estadoBadge, estadoLabel,];
        var __VLS_35;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_38 = Badge || Badge;
        // @ts-ignore
        const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
            variant: (__VLS_ctx.estadoPlantillaBadge(item.estadoPlantilla)),
            size: "sm",
        }));
        const __VLS_40 = __VLS_39({
            variant: (__VLS_ctx.estadoPlantillaBadge(item.estadoPlantilla)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_39));
        const { default: __VLS_43 } = __VLS_41.slots;
        (item.estadoPlantillaLabel);
        // @ts-ignore
        [estadoPlantillaBadge,];
        var __VLS_41;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        if (item.tipo === 'CURSO') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.nombreDocente || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.cantidadAprobados ?? '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.fechaSolicitud ? __VLS_ctx.formatDatetime(item.fechaSolicitud) : '-');
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.fechaEvento ? __VLS_ctx.formatDatetime(item.fechaEvento) : '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.templateVigente ? 'Aprobada' : 'Sin aprobar');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.certificadosEmitidos ?? 0);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        if (item.canEmit) {
            const __VLS_44 = Button || Button;
            // @ts-ignore
            const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.processingKey === item.key),
            }));
            const __VLS_46 = __VLS_45({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.processingKey === item.key),
            }, ...__VLS_functionalComponentArgsRest(__VLS_45));
            let __VLS_49;
            const __VLS_50 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.filteredActivities.length === 0))
                            return;
                        if (!(item.canEmit))
                            return;
                        item.tipo === 'CURSO' ? __VLS_ctx.emitirCurso(item) : __VLS_ctx.emitirEvento(item);
                        // @ts-ignore
                        [formatDatetime, formatDatetime, processingKey, emitirCurso, emitirEvento,];
                    } });
            const { default: __VLS_51 } = __VLS_47.slots;
            // @ts-ignore
            [];
            var __VLS_47;
            var __VLS_48;
        }
        else if (item.estado === 'EMITIDO') {
            const __VLS_52 = Button || Button;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
                variant: "outline",
                size: "sm",
                disabled: true,
            }));
            const __VLS_54 = __VLS_53({
                variant: "outline",
                size: "sm",
                disabled: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            const { default: __VLS_57 } = __VLS_55.slots;
            // @ts-ignore
            [];
            var __VLS_55;
        }
        else {
            const __VLS_58 = Button || Button;
            // @ts-ignore
            const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
                variant: "outline",
                size: "sm",
                disabled: true,
            }));
            const __VLS_60 = __VLS_59({
                variant: "outline",
                size: "sm",
                disabled: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_59));
            const { default: __VLS_63 } = __VLS_61.slots;
            // @ts-ignore
            [];
            var __VLS_61;
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.pageStart);
    (__VLS_ctx.pageEnd);
    (__VLS_ctx.filteredActivities.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.pageSize),
        ...{ class: "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (5),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (10),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (20),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (50),
    });
    const __VLS_64 = Button || Button;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        disabled: (__VLS_ctx.currentPage === 1),
    }));
    const __VLS_66 = __VLS_65({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        disabled: (__VLS_ctx.currentPage === 1),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    let __VLS_69;
    const __VLS_70 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPages > 1))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [filteredActivities, totalPages, pageStart, pageEnd, pageSize, currentPage, currentPage, goToPage,];
            } });
    const { default: __VLS_71 } = __VLS_67.slots;
    // @ts-ignore
    [];
    var __VLS_67;
    var __VLS_68;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    (__VLS_ctx.currentPage);
    (__VLS_ctx.totalPages);
    const __VLS_72 = Button || Button;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    }));
    const __VLS_74 = __VLS_73({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    let __VLS_77;
    const __VLS_78 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPages > 1))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.currentPage + 1);
                // @ts-ignore
                [totalPages, totalPages, currentPage, currentPage, currentPage, goToPage,];
            } });
    const { default: __VLS_79 } = __VLS_75.slots;
    // @ts-ignore
    [];
    var __VLS_75;
    var __VLS_76;
}
// @ts-ignore
[];
var __VLS_17;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=EmitirCertificados.vue.js.map