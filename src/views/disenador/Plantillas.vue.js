import { computed, onMounted, ref } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
import { formatDateTime as formatDateTimeUtil } from '@/utils/dateFormatter';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
const alertStore = useAlertStore();
const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.idUsuario ?? null);
const archivo = ref(null);
const fileInputRef = ref(null);
const subiendo = ref(false);
const cursos = ref([]);
const eventos = ref([]);
const plantillas = ref([]);
const cargandoPlantillas = ref(false);
const loadingActividades = ref(false);
const actividadSearch = ref('');
const estadoPlantillaFiltro = ref('');
const showActividadModal = ref(false);
const selectedActividad = ref(null);
const showInfoModal = ref(false);
const selectedInfoActividad = ref(null);
const actividadDetalle = ref(null);
const aprobaciones = ref([]);
const cargandoAprobaciones = ref(false);
const cargandoDetalle = ref(false);
const STATUS_STORAGE_KEY = 'plantillas_status_cache';
const canUpload = computed(() => {
    if (!selectedActividad.value)
        return false;
    // Si no existe plantilla aun, puede subir la primera
    if (!selectedActividad.value.idPlantilla)
        return true;
    // Intentamos obtener la ultima aprobacion desde el resumen global
    const resumen = selectedActividad.value.idPlantilla
        ? aprobacionesMap.value[selectedActividad.value.idPlantilla]
        : null;
    // Si estamos viendo el modal y ya cargamos aprobaciones específicas, usarlas
    const ultimaAprobacion = aprobaciones.value.length > 0
        ? aprobaciones.value[aprobaciones.value.length - 1]
        : resumen;
    // Solo permitir re-subir si la ultima aprobacion fue RECHAZADA
    return ultimaAprobacion ? ultimaAprobacion.estado === 'RECHAZADA' : false;
});
const uploadError = ref('');
const plantillaMap = computed(() => {
    const map = new Map();
    plantillas.value.forEach(plantilla => {
        const key = plantilla.idCurso
            ? `CURSO-${plantilla.idCurso}`
            : plantilla.idEvento
                ? `EVENTO-${plantilla.idEvento}`
                : '';
        if (!key)
            return;
        const existing = map.get(key);
        if (!existing || (plantilla.version ?? 0) > (existing.version ?? 0)) {
            map.set(key, plantilla);
        }
    });
    return map;
});
const aprobacionesMap = ref({});
const actividadesAsignadas = computed(() => {
    const cursosItems = cursos.value.map(curso => buildActividadAsignada('CURSO', curso));
    const eventosItems = eventos.value.map(evento => buildActividadAsignada('EVENTO', evento));
    return [...cursosItems, ...eventosItems];
});
const actividadesAsignadasFiltradas = computed(() => {
    const term = actividadSearch.value.trim().toLowerCase();
    return actividadesAsignadas.value.filter(item => {
        const searchOk = !term || item.nombre.toLowerCase().includes(term);
        const estadoOk = !estadoPlantillaFiltro.value || item.estadoPlantilla === estadoPlantillaFiltro.value;
        return searchOk && estadoOk;
    });
});
const archivoNombre = computed(() => archivo.value?.name || '');
const plantillasRevisadas = computed(() => {
    return plantillas.value.filter((item) => item.estado !== 'PENDIENTE');
});
const estadoRevision = (actividad) => {
    if (!actividad.idPlantilla)
        return 'SIN_PLANTILLA';
    if (actividad.estadoPlantilla === 'APROBADA')
        return 'APROBADA';
    const aprobacion = actividad.idPlantilla ? aprobacionesMap.value[actividad.idPlantilla] : null;
    if (!aprobacion)
        return 'PENDIENTE';
    return aprobacion.estado;
};
const cargarActividades = async () => {
    loadingActividades.value = true;
    try {
        const [cursosResponse, eventosResponse] = await Promise.all([
            api.get('/cursos/disenador'),
            api.get('/eventos/disenador')
        ]);
        cursos.value = cursosResponse.map(curso => ({
            id: Number(curso.idCurso),
            nombre: String(curso.nombre ?? ''),
            idDisenador: curso.idDisenador ? Number(curso.idDisenador) : null,
            estado: String(curso.estado ?? ''),
            carrera: String(curso.nombreCarrera ?? ''),
            fecha: String(curso.fechaInicio ?? '')
        }));
        eventos.value = eventosResponse.map(evento => ({
            id: Number(evento.idEvento),
            nombre: String(evento.nombre ?? ''),
            idDisenador: evento.idDisenador ? Number(evento.idDisenador) : null,
            estado: String(evento.estado ?? ''),
            carrera: String(evento.nombreCarrera ?? ''),
            fecha: String(evento.fechaHora ?? '')
        }));
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo cargar las actividades.'
        });
        cursos.value = [];
        eventos.value = [];
    }
    finally {
        loadingActividades.value = false;
    }
};
const cargarPlantillas = async () => {
    cargandoPlantillas.value = true;
    try {
        const response = await api.get('/plantillas/mis-plantillas');
        plantillas.value = response;
        notificarCambiosEstado(response);
        await cargarAprobacionesResumen(response);
    }
    finally {
        cargandoPlantillas.value = false;
    }
};
const cargarAprobacionesResumen = async (items) => {
    const entries = await Promise.all(items.map(async (item) => {
        try {
            const data = await api.get(`/plantillas/${item.idPlantilla}/aprobaciones`);
            const last = data.length > 0 ? data[data.length - 1] : null;
            return [item.idPlantilla, last];
        }
        catch {
            return [item.idPlantilla, null];
        }
    }));
    aprobacionesMap.value = entries.reduce((acc, [id, aprobacion]) => {
        acc[id] = aprobacion;
        return acc;
    }, {});
};
const handleFileChange = (event) => {
    const input = event.target;
    archivo.value = input.files && input.files.length > 0 ? input.files[0] : null;
    uploadError.value = '';
};
const triggerFilePicker = () => {
    if (!canUpload.value)
        return;
    fileInputRef.value?.click();
};
const handleUploadClick = () => {
    if (!archivo.value) {
        triggerFilePicker();
        return;
    }
    void subirPlantilla();
};
const subirPlantilla = async () => {
    if (!selectedActividad.value) {
        uploadError.value = 'Selecciona una actividad.';
        alertStore.push({ type: 'warning', message: 'Selecciona una actividad.' });
        return;
    }
    if (!archivo.value) {
        uploadError.value = 'Selecciona un archivo PDF.';
        alertStore.push({ type: 'warning', message: 'Selecciona un archivo PDF.' });
        return;
    }
    subiendo.value = true;
    try {
        const formData = new FormData();
        formData.append('archivo', archivo.value);
        if (selectedActividad.value.tipo === 'CURSO') {
            formData.append('idCurso', String(selectedActividad.value.id));
        }
        else {
            formData.append('idEvento', String(selectedActividad.value.id));
        }
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        const token = localStorage.getItem('token');
        const response = await fetch(`${baseUrl}/plantillas`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: formData
        });
        if (!response.ok) {
            const data = await response.json().catch(() => null);
            const message = data?.message || response.statusText || 'No se pudo subir la plantilla.';
            throw new Error(message);
        }
        alertStore.push({ type: 'success', message: 'Plantilla enviada a revision.' });
        archivo.value = null;
        uploadError.value = '';
        await Promise.all([cargarPlantillas(), cargarActividades()]);
        const updated = selectedActividad.value
            ? actividadesAsignadas.value.find(item => item.key === selectedActividad.value?.key)
            : null;
        if (updated) {
            selectedActividad.value = updated;
        }
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo subir la plantilla.' });
    }
    finally {
        subiendo.value = false;
    }
};
const verPlantilla = async (plantilla) => {
    try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
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
        alertStore.push({ type: 'error', message: error.message || 'No se pudo abrir la plantilla.' });
    }
};
const notificarCambiosEstado = (items) => {
    const cacheRaw = localStorage.getItem(STATUS_STORAGE_KEY);
    const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
    let huboCambio = false;
    items.forEach((item) => {
        const key = String(item.idPlantilla);
        const previous = cache[key];
        const current = { estado: item.estado, observacion: item.ultimaObservacion || null };
        if (previous && previous.estado !== current.estado && current.estado !== 'PENDIENTE') {
            const mensaje = current.estado === 'APROBADA'
                ? `Plantilla aprobada: ${item.nombreActividad}.`
                : `Plantilla rechazada: ${item.nombreActividad}. ${current.observacion || 'Revisa las observaciones.'}`;
            alertStore.push({ type: current.estado === 'APROBADA' ? 'success' : 'warning', message: mensaje });
            huboCambio = true;
        }
        cache[key] = current;
    });
    if (huboCambio || !cacheRaw) {
        localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(cache));
    }
};
const estadoPlantillaLabel = (estado) => {
    switch (estado) {
        case 'SIN_PLANTILLA':
            return 'Sin plantilla';
        case 'PENDIENTE':
            return 'Pendiente';
        case 'APROBADA':
            return 'Aprobada';
        case 'RECHAZADA':
            return 'Rechazada';
        default:
            return estado;
    }
};
const estadoRevisionLabel = (estado) => {
    switch (estado) {
        case 'SIN_PLANTILLA':
            return 'Sin plantilla';
        case 'PENDIENTE':
            return 'Pendiente';
        case 'APROBADA':
            return 'Aprobada';
        case 'RECHAZADA':
            return 'Rechazada';
        default:
            return estado;
    }
};
const estadoRevisionBadge = (estado) => {
    switch (estado) {
        case 'SIN_PLANTILLA':
            return 'warning';
        case 'PENDIENTE':
            return 'secondary';
        case 'APROBADA':
            return 'success';
        case 'RECHAZADA':
            return 'danger';
        default:
            return 'gray';
    }
};
const estadoPlantillaBadge = (estado) => {
    switch (estado) {
        case 'SIN_PLANTILLA':
            return 'warning';
        case 'PENDIENTE':
            return 'secondary';
        case 'APROBADA':
            return 'success';
        case 'RECHAZADA':
            return 'danger';
        default:
            return 'gray';
    }
};
const estadoPlantillaHint = (estado) => {
    switch (estado) {
        case 'SIN_PLANTILLA':
            return 'Debes subir la primera plantilla.';
        case 'PENDIENTE':
            return 'La plantilla esta en revision.';
        case 'APROBADA':
            return 'La plantilla esta aprobada. No requiere accion.';
        case 'RECHAZADA':
            return 'Revisa las observaciones y sube una nueva version.';
        default:
            return '';
    }
};
const estadoRevisionHint = (estado) => {
    switch (estado) {
        case 'SIN_PLANTILLA':
            return 'Debes subir la primera plantilla.';
        case 'PENDIENTE':
            return 'La plantilla esta en revision.';
        case 'APROBADA':
            return 'La plantilla esta aprobada. No requiere accion.';
        case 'RECHAZADA':
            return 'Revisa las observaciones y sube una nueva version.';
        default:
            return '';
    }
};
const formatDateTime = (value) => {
    if (!value)
        return '-';
    return formatDateTimeUtil(value, 'es-BO');
};
const buildActividadAsignada = (tipo, item) => {
    const key = `${tipo}-${item.id}`;
    const plantilla = plantillaMap.value.get(key);
    return {
        key,
        tipo,
        id: item.id,
        idPlantilla: plantilla?.idPlantilla ?? null,
        nombre: item.nombre,
        estadoActividad: item.estado || '-',
        carrera: item.carrera || '-',
        fecha: item.fecha || '',
        estadoPlantilla: plantilla?.estado ?? 'SIN_PLANTILLA',
        version: plantilla?.version ?? null,
        fechaSubida: plantilla?.fechaSubida ?? null,
        ultimaObservacion: plantilla?.ultimaObservacion ?? null
    };
};
const cargarDetalleActividad = async (actividad) => {
    cargandoDetalle.value = true;
    try {
        if (actividad.tipo === 'CURSO') {
            const curso = await api.get(`/cursos/${actividad.id}`);
            actividadDetalle.value = {
                descripcion: String(curso.descripcion ?? ''),
                modalidad: String(curso.modalidad ?? '-'),
                fechaInicio: String(curso.fechaInicio ?? ''),
                fechaFin: String(curso.fechaFin ?? curso.fechaInicio ?? ''),
                cargaHoraria: Number(curso.cargaHoraria ?? 0),
                cupoMaximo: Number(curso.cupoMaximo ?? 0),
                cuposDisponibles: Number(curso.cuposDisponibles ?? 0),
                costoExterno: Number(curso.costoExterno ?? 0),
                costoUmsa: Number(curso.costoUmsa ?? 0),
                notaAprobacion: curso.notaAprobacion !== undefined ? Number(curso.notaAprobacion) : null
            };
        }
        else {
            const evento = await api.get(`/eventos/${actividad.id}`);
            actividadDetalle.value = {
                descripcion: String(evento.descripcion ?? ''),
                modalidad: String(evento.modalidad ?? '-'),
                fechaInicio: String(evento.fechaHora ?? ''),
                fechaFin: String(evento.fechaHora ?? ''),
                cargaHoraria: Number(evento.cargaHoraria ?? 0),
                cupoMaximo: Number(evento.cupoMaximo ?? 0),
                cuposDisponibles: Number(evento.cuposDisponibles ?? 0),
                costoExterno: Number(evento.costoExterno ?? 0),
                costoUmsa: Number(evento.costoUmsa ?? 0)
            };
        }
    }
    catch {
        actividadDetalle.value = null;
    }
    finally {
        cargandoDetalle.value = false;
    }
};
const cargarAprobaciones = async (actividad) => {
    if (!actividad.idPlantilla) {
        aprobaciones.value = [];
        return;
    }
    cargandoAprobaciones.value = true;
    try {
        const data = await api.get(`/plantillas/${actividad.idPlantilla}/aprobaciones`);
        aprobaciones.value = data;
    }
    catch {
        aprobaciones.value = [];
    }
    finally {
        cargandoAprobaciones.value = false;
    }
};
const openActividadModal = (actividad) => {
    selectedActividad.value = actividad;
    archivo.value = null;
    uploadError.value = '';
    showActividadModal.value = true;
    aprobaciones.value = [];
    void cargarAprobaciones(actividad);
};
const openInfoModal = (actividad) => {
    selectedInfoActividad.value = actividad;
    actividadDetalle.value = null;
    showInfoModal.value = true;
    void cargarDetalleActividad(actividad);
};
const closeActividadModal = () => {
    selectedActividad.value = null;
    showActividadModal.value = false;
};
const closeInfoModal = () => {
    selectedInfoActividad.value = null;
    actividadDetalle.value = null;
    showInfoModal.value = false;
};
onMounted(async () => {
    await Promise.all([cargarActividades(), cargarPlantillas()]);
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
    ...{ class: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
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
if (__VLS_ctx.actividadesAsignadasFiltradas.length > 0) {
    const __VLS_6 = Badge || Badge;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        variant: "primary",
        size: "sm",
    }));
    const __VLS_8 = __VLS_7({
        variant: "primary",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
    (__VLS_ctx.actividadesAsignadasFiltradas.length);
    // @ts-ignore
    [actividadesAsignadasFiltradas, actividadesAsignadasFiltradas,];
    var __VLS_9;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 grid gap-3 md:grid-cols-3" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.actividadSearch),
    type: "text",
    placeholder: "Buscar por nombre",
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
    ...{ class: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.estadoPlantillaFiltro),
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
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "SIN_PLANTILLA",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "PENDIENTE",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "APROBADA",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "RECHAZADA",
});
if (__VLS_ctx.loadingActividades) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.actividadesAsignadasFiltradas.length === 0) {
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
    for (const [actividad] of __VLS_vFor((__VLS_ctx.actividadesAsignadasFiltradas))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (actividad.key),
            ...{ class: "hover:bg-slate-50" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-slate-50']} */ ;
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
        (actividad.carrera);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_12 = Badge || Badge;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            variant: (actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_14 = __VLS_13({
            variant: (actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        const { default: __VLS_17 } = __VLS_15.slots;
        (actividad.tipo);
        // @ts-ignore
        [actividadesAsignadasFiltradas, actividadesAsignadasFiltradas, actividadSearch, estadoPlantillaFiltro, loadingActividades,];
        var __VLS_15;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_18 = Badge || Badge;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            variant: (actividad.estadoActividad === 'ABIERTO' ? 'success' : 'gray'),
            size: "sm",
        }));
        const __VLS_20 = __VLS_19({
            variant: (actividad.estadoActividad === 'ABIERTO' ? 'success' : 'gray'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        const { default: __VLS_23 } = __VLS_21.slots;
        (actividad.estadoActividad);
        // @ts-ignore
        [];
        var __VLS_21;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_24 = Badge || Badge;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            variant: (__VLS_ctx.estadoRevisionBadge(__VLS_ctx.estadoRevision(actividad))),
            size: "sm",
        }));
        const __VLS_26 = __VLS_25({
            variant: (__VLS_ctx.estadoRevisionBadge(__VLS_ctx.estadoRevision(actividad))),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        const { default: __VLS_29 } = __VLS_27.slots;
        (__VLS_ctx.estadoRevisionLabel(__VLS_ctx.estadoRevision(actividad)));
        // @ts-ignore
        [estadoRevisionBadge, estadoRevision, estadoRevision, estadoRevisionLabel,];
        var __VLS_27;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap justify-end gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_30 = Button || Button;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }));
        const __VLS_32 = __VLS_31({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        let __VLS_35;
        const __VLS_36 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingActividades))
                        return;
                    if (!!(__VLS_ctx.actividadesAsignadasFiltradas.length === 0))
                        return;
                    __VLS_ctx.openInfoModal(actividad);
                    // @ts-ignore
                    [openInfoModal,];
                } });
        const { default: __VLS_37 } = __VLS_33.slots;
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
                    if (!!(__VLS_ctx.loadingActividades))
                        return;
                    if (!!(__VLS_ctx.actividadesAsignadasFiltradas.length === 0))
                        return;
                    __VLS_ctx.openActividadModal(actividad);
                    // @ts-ignore
                    [openActividadModal,];
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
var __VLS_3;
const __VLS_46 = Modal || Modal;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showActividadModal),
    title: "Detalle de actividad",
    size: "lg",
}));
const __VLS_48 = __VLS_47({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showActividadModal),
    title: "Detalle de actividad",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_47));
let __VLS_51;
const __VLS_52 = ({ close: {} },
    { onClose: (__VLS_ctx.closeActividadModal) });
const { default: __VLS_53 } = __VLS_49.slots;
if (__VLS_ctx.selectedActividad) {
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
    (__VLS_ctx.selectedActividad.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.selectedActividad.tipo);
    (__VLS_ctx.selectedActividad.carrera);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-3 md:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
    (__VLS_ctx.selectedActividad.estadoActividad);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
    (__VLS_ctx.estadoPlantillaLabel(__VLS_ctx.selectedActividad.estadoPlantilla));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-slate-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    (__VLS_ctx.selectedActividad.version ?? '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-slate-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    (__VLS_ctx.formatDateTime(__VLS_ctx.selectedActividad.fechaSubida));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-slate-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    (__VLS_ctx.selectedActividad.ultimaObservacion || 'Sin observaciones.');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-emerald-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-emerald-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-emerald-700" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-emerald-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-800']} */ ;
    (__VLS_ctx.estadoRevisionHint(__VLS_ctx.estadoRevision(__VLS_ctx.selectedActividad)));
    if (__VLS_ctx.estadoRevision(__VLS_ctx.selectedActividad) === 'RECHAZADA') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rounded-lg border border-rose-200 bg-rose-50 px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-rose-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-rose-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-rose-700" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-rose-700']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-rose-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-rose-800']} */ ;
        (__VLS_ctx.selectedActividad.ultimaObservacion || 'Se requieren ajustes en la plantilla.');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-slate-200 px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    if (__VLS_ctx.cargandoAprobaciones) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm text-slate-500 mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    }
    else if (__VLS_ctx.aprobaciones.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm text-slate-500 mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        for (const [aprobacion, index] of __VLS_vFor((__VLS_ctx.aprobaciones))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (index),
                ...{ class: "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-slate-100']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-between text-xs text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (aprobacion.coordinador || 'Coordinador');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.formatDateTime(aprobacion.fechaRevision));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-1 flex items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_54 = Badge || Badge;
            // @ts-ignore
            const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
                variant: (aprobacion.estado === 'APROBADA' ? 'success' : 'danger'),
                size: "sm",
            }));
            const __VLS_56 = __VLS_55({
                variant: (aprobacion.estado === 'APROBADA' ? 'success' : 'danger'),
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_55));
            const { default: __VLS_59 } = __VLS_57.slots;
            (aprobacion.estado);
            // @ts-ignore
            [estadoRevision, estadoRevision, showActividadModal, closeActividadModal, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, selectedActividad, estadoPlantillaLabel, formatDateTime, formatDateTime, estadoRevisionHint, cargandoAprobaciones, aprobaciones, aprobaciones,];
            var __VLS_57;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-slate-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
            (aprobacion.observaciones || 'Sin observaciones.');
            // @ts-ignore
            [];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3 rounded-lg border border-slate-200 px-4 py-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-semibold text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    if (__VLS_ctx.canUpload) {
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
            ...{ onChange: (__VLS_ctx.handleFileChange) },
            ref: "fileInputRef",
            type: "file",
            accept: "application/pdf",
            ...{ class: "hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        const __VLS_60 = Button || Button;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }));
        const __VLS_62 = __VLS_61({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
        let __VLS_65;
        const __VLS_66 = ({ click: {} },
            { onClick: (__VLS_ctx.triggerFilePicker) });
        const { default: __VLS_67 } = __VLS_63.slots;
        // @ts-ignore
        [canUpload, handleFileChange, triggerFilePicker,];
        var __VLS_63;
        var __VLS_64;
        if (__VLS_ctx.archivoNombre) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-slate-500 mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_ctx.archivoNombre);
        }
        if (__VLS_ctx.uploadError) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-rose-600 mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_ctx.uploadError);
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    const __VLS_68 = Button || Button;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.subiendo),
        disabled: (!__VLS_ctx.canUpload),
    }));
    const __VLS_70 = __VLS_69({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.subiendo),
        disabled: (!__VLS_ctx.canUpload),
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    let __VLS_73;
    const __VLS_74 = ({ click: {} },
        { onClick: (__VLS_ctx.handleUploadClick) });
    const { default: __VLS_75 } = __VLS_71.slots;
    // @ts-ignore
    [canUpload, archivoNombre, archivoNombre, uploadError, uploadError, subiendo, handleUploadClick,];
    var __VLS_71;
    var __VLS_72;
}
// @ts-ignore
[];
var __VLS_49;
var __VLS_50;
const __VLS_76 = Modal || Modal;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showInfoModal),
    title: "Informacion de actividad",
    size: "lg",
}));
const __VLS_78 = __VLS_77({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showInfoModal),
    title: "Informacion de actividad",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
let __VLS_81;
const __VLS_82 = ({ close: {} },
    { onClose: (__VLS_ctx.closeInfoModal) });
const { default: __VLS_83 } = __VLS_79.slots;
if (__VLS_ctx.selectedInfoActividad) {
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
    (__VLS_ctx.selectedInfoActividad.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.selectedInfoActividad.tipo);
    (__VLS_ctx.selectedInfoActividad.carrera);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-slate-200 px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    if (__VLS_ctx.cargandoDetalle) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm text-slate-500 mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    }
    else if (__VLS_ctx.actividadDetalle) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 grid gap-3 md:grid-cols-2 text-sm text-slate-700" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "md:col-span-2" },
        });
        /** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-slate-700 whitespace-pre-line" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
        (__VLS_ctx.actividadDetalle.descripcion || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.actividadDetalle.modalidad || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.actividadDetalle.cargaHoraria);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.formatDateTime(__VLS_ctx.actividadDetalle.fechaInicio));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.formatDateTime(__VLS_ctx.actividadDetalle.fechaFin));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.actividadDetalle.cuposDisponibles);
        (__VLS_ctx.actividadDetalle.cupoMaximo);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.actividadDetalle.costoExterno);
        (__VLS_ctx.actividadDetalle.costoUmsa);
        if (__VLS_ctx.selectedInfoActividad.tipo === 'CURSO') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_ctx.actividadDetalle.notaAprobacion ?? 51);
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm text-slate-500 mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    }
}
// @ts-ignore
[formatDateTime, formatDateTime, showInfoModal, closeInfoModal, selectedInfoActividad, selectedInfoActividad, selectedInfoActividad, selectedInfoActividad, selectedInfoActividad, cargandoDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle, actividadDetalle,];
var __VLS_79;
var __VLS_80;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Plantillas.vue.js.map