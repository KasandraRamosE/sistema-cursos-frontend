import { computed, onMounted, ref } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
import { formatDateTime, parseLocalDate } from '@/utils/dateFormatter';
import { useAlertStore } from '@/stores/alert.store';
const alertStore = useAlertStore();
const carreras = ref([]);
const selectedCarreraId = ref(null);
const eventos = ref([]);
const auxiliares = ref([]);
const auxiliaresAsignados = ref([]);
const participantes = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchTerm = ref('');
const estadoFiltro = ref('');
const showEventoModal = ref(false);
const editingEvento = ref(null);
const editingEstado = ref('');
const eventoImageInputRef = ref(null);
const eventoImageFile = ref(null);
const eventoImagePreview = ref('');
const formEvento = ref({
    idCarrera: 0,
    nombre: '',
    descripcion: '',
    imagen: '',
    lugar: '',
    cargaHoraria: 1,
    modalidad: 'PRESENCIAL',
    fechaHora: '',
    cupoMaximo: null,
    costoExterno: 0,
    costoUmsa: 0,
    link: '',
    estado: 'ABIERTO'
});
const showAuxiliaresModal = ref(false);
const selectedEvento = ref(null);
const auxiliarSearch = ref('');
const selectedAuxiliarIds = ref([]);
const savingAuxiliar = ref(false);
const loadingAuxiliaresAsignados = ref(false);
const loadingAuxiliaresData = ref(false);
const auxiliaresDataReady = ref(false);
const showDeleteModal = ref(false);
const deleting = ref(false);
const eventoToDelete = ref(null);
const getEstadoMostrado = (evento) => {
    if (evento.fechaHora && parseLocalDate(evento.fechaHora).getTime() < Date.now()) {
        return 'FINALIZADO';
    }
    return evento.estado;
};
const eventosFiltrados = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    return eventos.value.filter(evento => {
        if (selectedCarreraId.value && evento.idCarrera !== selectedCarreraId.value)
            return false;
        if (estadoFiltro.value && getEstadoMostrado(evento) !== estadoFiltro.value)
            return false;
        if (term && !evento.nombre.toLowerCase().includes(term))
            return false;
        return true;
    });
});
const auxiliaresFiltrados = computed(() => {
    const term = auxiliarSearch.value.trim().toLowerCase();
    if (!term)
        return [];
    const assignedIds = new Set(auxiliaresAsignados.value.map(auxiliar => auxiliar.idUsuario));
    const merged = new Map();
    auxiliares.value.forEach(auxiliar => merged.set(auxiliar.idUsuario, auxiliar));
    participantes.value.forEach(participante => {
        if (!merged.has(participante.idUsuario)) {
            merged.set(participante.idUsuario, participante);
        }
    });
    return Array.from(merged.values()).filter(persona => {
        if (assignedIds.has(persona.idUsuario))
            return false;
        const fullName = `${persona.nombres} ${persona.apellidos}`.toLowerCase();
        return fullName.includes(term) || persona.username.toLowerCase().includes(term);
    });
});
const loadCarreras = async () => {
    const response = await api.get('/coordinador/carreras');
    carreras.value = response;
    selectedCarreraId.value = response[0]?.idCarrera ?? null;
};
const loadEventos = async () => {
    loading.value = true;
    try {
        const response = await api.get('/eventos/todos');
        eventos.value = response;
    }
    finally {
        loading.value = false;
    }
};
const loadAuxiliares = async () => {
    const response = await api.get('/usuarios/auxiliares');
    auxiliares.value = response;
};
const normalizeAuxiliares = (response) => {
    let items = [];
    if (Array.isArray(response)) {
        items = response;
    }
    else if (response && typeof response === 'object') {
        const container = response;
        const list = container.auxiliares ?? container.data ?? container.items ?? container.result;
        if (Array.isArray(list)) {
            items = list;
        }
    }
    return items.map((item, index) => {
        if (typeof item === 'string') {
            return {
                idUsuario: -(index + 1),
                username: '',
                nombres: item,
                apellidos: '',
                roles: ['AUXILIAR']
            };
        }
        const usuario = item.usuario && typeof item.usuario === 'object'
            ? item.usuario
            : null;
        const idUsuario = Number(item.idUsuario ?? item.idUsuarioAuxiliar ?? item.idAuxiliar ?? item.id_usuario ?? item.id ?? usuario?.idUsuario ?? usuario?.id_usuario ?? 0);
        if (!idUsuario)
            return null;
        return {
            idUsuario,
            username: String(item.username ?? item.usernameAuxiliar ?? usuario?.username ?? ''),
            nombres: String(item.nombres ?? item.nombre ?? usuario?.nombres ?? ''),
            apellidos: String(item.apellidos ?? item.apellido ?? usuario?.apellidos ?? ''),
            roles: Array.isArray(item.roles) ? item.roles.map(role => String(role)) : ['AUXILIAR']
        };
    }).filter((item) => Boolean(item));
};
const loadAuxiliaresAsignados = async () => {
    if (!selectedEvento.value)
        return;
    loadingAuxiliaresAsignados.value = true;
    try {
        const response = await api.get(`/eventos/${selectedEvento.value.idEvento}/auxiliares`);
        auxiliaresAsignados.value = normalizeAuxiliares(response);
    }
    catch (error) {
        console.error('Error al cargar auxiliares asignados:', error);
        auxiliaresAsignados.value = [];
    }
    finally {
        loadingAuxiliaresAsignados.value = false;
    }
};
const loadParticipantes = async () => {
    const response = await api.get('/usuarios/participantes');
    participantes.value = response;
};
const ensureAuxiliaresData = async () => {
    if (auxiliaresDataReady.value || loadingAuxiliaresData.value)
        return;
    loadingAuxiliaresData.value = true;
    try {
        await Promise.all([loadAuxiliares(), loadParticipantes()]);
        auxiliaresDataReady.value = true;
    }
    finally {
        loadingAuxiliaresData.value = false;
    }
};
const loadAll = async () => {
    await Promise.all([loadCarreras(), loadEventos()]);
};
const openCreateEvento = () => {
    editingEvento.value = null;
    editingEstado.value = '';
    formEvento.value = {
        idCarrera: selectedCarreraId.value || carreras.value[0]?.idCarrera || 0,
        nombre: '',
        descripcion: '',
        imagen: '',
        lugar: '',
        cargaHoraria: 1,
        modalidad: 'PRESENCIAL',
        fechaHora: '',
        cupoMaximo: null,
        costoExterno: 0,
        costoUmsa: 0,
        link: '',
        estado: 'ABIERTO'
    };
    clearEventoImagePreview();
    eventoImageFile.value = null;
    showEventoModal.value = true;
};
const openEditEvento = (evento) => {
    editingEvento.value = evento;
    editingEstado.value = evento.estado;
    formEvento.value = {
        idCarrera: evento.idCarrera,
        nombre: evento.nombre,
        descripcion: evento.descripcion || '',
        imagen: evento.imagen || '',
        lugar: evento.lugar || '',
        cargaHoraria: evento.cargaHoraria,
        modalidad: evento.modalidad,
        fechaHora: evento.fechaHora ? evento.fechaHora.slice(0, 16) : '',
        cupoMaximo: evento.cupoMaximo ?? null,
        costoExterno: Number(evento.costoExterno || 0),
        costoUmsa: Number(evento.costoUmsa || 0),
        link: evento.link || '',
        estado: evento.estado
    };
    eventoImageFile.value = null;
    if (evento.imagen) {
        eventoImagePreview.value = evento.imagen;
    }
    else {
        clearEventoImagePreview();
    }
    showEventoModal.value = true;
};
const closeEventoModal = () => {
    showEventoModal.value = false;
    editingEvento.value = null;
    editingEstado.value = '';
    clearEventoImagePreview();
    eventoImageFile.value = null;
};
const saveEvento = async () => {
    saving.value = true;
    try {
        if (!formEvento.value.imagen && !eventoImageFile.value) {
            alertStore.push({ type: 'warning', message: 'Debes subir una imagen para el evento.' });
            saving.value = false;
            return;
        }
        const imagenUrl = await uploadEventoImagen();
        formEvento.value.imagen = imagenUrl;
        const payload = {
            idCarrera: formEvento.value.idCarrera,
            nombre: formEvento.value.nombre,
            descripcion: formEvento.value.descripcion,
            imagen: imagenUrl,
            lugar: formEvento.value.lugar || null,
            cargaHoraria: formEvento.value.cargaHoraria,
            modalidad: formEvento.value.modalidad,
            fechaHora: formEvento.value.fechaHora,
            cupoMaximo: formEvento.value.cupoMaximo,
            costoExterno: formEvento.value.costoExterno,
            costoUmsa: formEvento.value.costoUmsa,
            link: formEvento.value.link
        };
        if (editingEvento.value) {
            await api.put(`/eventos/${editingEvento.value.idEvento}`, payload);
            if (formEvento.value.estado !== editingEstado.value) {
                await api.patch(`/eventos/${editingEvento.value.idEvento}/estado?estado=${encodeURIComponent(formEvento.value.estado)}`);
            }
            alertStore.push({ type: 'success', message: 'Evento actualizado.' });
        }
        else {
            await api.post('/eventos', payload);
            alertStore.push({ type: 'success', message: 'Evento creado.' });
        }
        closeEventoModal();
        await loadEventos();
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo guardar el evento.' });
    }
    finally {
        saving.value = false;
    }
};
const clearEventoImagePreview = () => {
    if (eventoImagePreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(eventoImagePreview.value);
    }
    eventoImagePreview.value = '';
};
const handleEventoImageChange = (event) => {
    const input = event.target;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
        eventoImageFile.value = null;
        clearEventoImagePreview();
        return;
    }
    eventoImageFile.value = file;
    clearEventoImagePreview();
    eventoImagePreview.value = URL.createObjectURL(file);
};
const triggerEventoImagePicker = () => {
    eventoImageInputRef.value?.click();
};
const uploadEventoImagen = async () => {
    if (!eventoImageFile.value)
        return formEvento.value.imagen || '';
    const formData = new FormData();
    formData.append('archivo', eventoImageFile.value);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('token');
    const response = await fetch(`${baseUrl}/archivos/imagenes`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message || response.statusText || 'No se pudo subir la imagen.';
        throw new Error(message);
    }
    const data = await response.json().catch(() => null);
    return String(data?.url ?? '');
};
const openAuxiliares = async (evento) => {
    try {
        await ensureAuxiliaresData();
        selectedEvento.value = evento;
        auxiliarSearch.value = '';
        selectedAuxiliarIds.value = [];
        await loadAuxiliaresAsignados();
        showAuxiliaresModal.value = true;
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo cargar la lista de auxiliares.'
        });
    }
};
const confirmDeleteEvento = (evento) => {
    eventoToDelete.value = evento;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    eventoToDelete.value = null;
};
const closeAuxiliaresModal = () => {
    showAuxiliaresModal.value = false;
    selectedEvento.value = null;
    selectedAuxiliarIds.value = [];
    auxiliarSearch.value = '';
    auxiliaresAsignados.value = [];
};
const selectAuxiliar = (persona) => {
    toggleAuxiliarSelection(persona);
};
const toggleAuxiliarSelection = (persona) => {
    if (selectedAuxiliarIds.value.includes(persona.idUsuario)) {
        selectedAuxiliarIds.value = selectedAuxiliarIds.value.filter(id => id !== persona.idUsuario);
    }
    else {
        selectedAuxiliarIds.value = [...selectedAuxiliarIds.value, persona.idUsuario];
    }
};
const clearAuxiliarSelection = () => {
    selectedAuxiliarIds.value = [];
};
const removeAuxiliar = async (auxiliar) => {
    if (!selectedEvento.value)
        return;
    savingAuxiliar.value = true;
    try {
        await api.delete(`/eventos/${selectedEvento.value.idEvento}/auxiliares/${auxiliar.idUsuario}`);
        alertStore.push({ type: 'success', message: 'Auxiliar removido del evento.' });
        // remove from local list immediately
        auxiliaresAsignados.value = auxiliaresAsignados.value.filter(a => a.idUsuario !== auxiliar.idUsuario);
        await loadAuxiliaresAsignados();
    }
    catch (error) {
        const err = error;
        if (err?.status === 404) {
            // already removed; sync list
            auxiliaresAsignados.value = auxiliaresAsignados.value.filter(a => a.idUsuario !== auxiliar.idUsuario);
            alertStore.push({ type: 'warning', message: 'El auxiliar ya no estaba asignado.' });
            await loadAuxiliaresAsignados();
        }
        else {
            alertStore.push({ type: 'error', message: error.message || 'No se pudo quitar el auxiliar.' });
        }
    }
    finally {
        savingAuxiliar.value = false;
    }
};
const assignAuxiliar = async () => {
    if (!selectedEvento.value || selectedAuxiliarIds.value.length === 0)
        return;
    savingAuxiliar.value = true;
    try {
        const eventoId = selectedEvento.value.idEvento;
        const selectedPersonas = [...selectedAuxiliarIds.value];
        const personasParaAsignar = selectedPersonas
            .map((idAuxiliar) => {
            const auxiliarExistente = auxiliares.value.find((auxiliar) => auxiliar.idUsuario === idAuxiliar);
            if (auxiliarExistente)
                return auxiliarExistente;
            const participante = participantes.value.find((persona) => persona.idUsuario === idAuxiliar);
            if (!participante)
                return null;
            return {
                idUsuario: participante.idUsuario,
                username: participante.username,
                nombres: participante.nombres,
                apellidos: participante.apellidos,
                roles: participante.roles.includes('AUXILIAR') ? participante.roles : [...participante.roles, 'AUXILIAR']
            };
        })
            .filter((persona) => persona !== null);
        const participantesNuevos = participantes.value.filter((persona) => selectedPersonas.includes(persona.idUsuario) && !persona.roles.includes('AUXILIAR'));
        if (participantesNuevos.length > 0) {
            await Promise.all(participantesNuevos.map((persona) => api.post(`/usuarios/${persona.idUsuario}/roles`, {
                nombreRol: 'AUXILIAR'
            })));
            await Promise.all([loadAuxiliares(), loadParticipantes()]);
        }
        // Filter out ids that are already assigned locally to avoid sending duplicates
        const toAssign = selectedPersonas.filter(id => !auxiliaresAsignados.value.some(a => a.idUsuario === id));
        // Send requests per-id and collect results so we can show which failed
        const results = await Promise.all(toAssign.map(async (idAuxiliar) => {
            try {
                await api.post(`/eventos/${eventoId}/auxiliares`, { idAuxiliar });
                return { id: idAuxiliar, ok: true };
            }
            catch (err) {
                return { id: idAuxiliar, ok: false, status: err.status, message: err.message };
            }
        }));
        const succeededIds = results.filter(r => r.ok).map(r => r.id);
        const failed = results.filter(r => !r.ok);
        // Optimistic update: add successfully assigned personas to the local list
        const currentAssigned = new Map();
        auxiliaresAsignados.value.forEach((auxiliar) => {
            currentAssigned.set(auxiliar.idUsuario, auxiliar);
        });
        personasParaAsignar.forEach((persona) => {
            if (succeededIds.includes(persona.idUsuario)) {
                currentAssigned.set(persona.idUsuario, persona);
            }
        });
        auxiliaresAsignados.value = Array.from(currentAssigned.values());
        // Feedback: show success or partial failure
        if (failed.length === 0) {
            alertStore.push({ type: 'success', message: 'Auxiliar(es) asignado(s).' });
        }
        else if (succeededIds.length > 0) {
            alertStore.push({ type: 'warning', message: `${succeededIds.length} asignados, ${failed.length} fallaron.` });
        }
        else {
            alertStore.push({ type: 'error', message: 'No se pudo asignar ninguno de los auxiliares seleccionados.' });
        }
        // Clear selections and refresh assigned list to be safe
        selectedAuxiliarIds.value = [];
        auxiliarSearch.value = '';
        await loadAuxiliaresAsignados();
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo asignar el auxiliar.' });
    }
    finally {
        savingAuxiliar.value = false;
    }
};
const deleteEvento = async () => {
    if (!eventoToDelete.value)
        return;
    deleting.value = true;
    try {
        await api.delete(`/eventos/${eventoToDelete.value.idEvento}`);
        alertStore.push({ type: 'success', message: 'Evento eliminado.' });
        closeDeleteModal();
        await loadEventos();
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo eliminar el evento.' });
    }
    finally {
        deleting.value = false;
    }
};
const formatFecha = (value) => {
    if (!value)
        return '-';
    return formatDateTime(value);
};
onMounted(async () => {
    try {
        await loadAll();
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo cargar la pantalla de eventos.'
        });
    }
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
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreateEvento) });
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[openCreateEvento,];
var __VLS_3;
var __VLS_4;
const __VLS_8 = Card || Card;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-4 grid gap-3 md:grid-cols-3" },
});
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.searchTerm),
    type: "text",
    placeholder: "Nombre del evento...",
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
    value: (__VLS_ctx.estadoFiltro),
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
    value: "ABIERTO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "LLENO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "FINALIZADO",
});
if (__VLS_ctx.carreras.length > 1) {
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
        [searchTerm, estadoFiltro, carreras, carreras, selectedCarreraId,];
    }
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-10 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.eventosFiltrados.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-10 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
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
    for (const [evento] of __VLS_vFor((__VLS_ctx.eventosFiltrados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (evento.idEvento),
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
        (evento.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (evento.cargaHoraria);
        (evento.modalidad);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        (evento.nombreCarrera);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        (__VLS_ctx.formatFecha(evento.fechaHora));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_14 = Badge || Badge;
        // @ts-ignore
        const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            variant: (__VLS_ctx.getEstadoMostrado(evento) === 'ABIERTO' ? 'success' : 'gray'),
            size: "sm",
        }));
        const __VLS_16 = __VLS_15({
            variant: (__VLS_ctx.getEstadoMostrado(evento) === 'ABIERTO' ? 'success' : 'gray'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_15));
        const { default: __VLS_19 } = __VLS_17.slots;
        (__VLS_ctx.getEstadoMostrado(evento));
        // @ts-ignore
        [loading, eventosFiltrados, eventosFiltrados, formatFecha, getEstadoMostrado, getEstadoMostrado,];
        var __VLS_17;
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
        const __VLS_20 = Button || Button;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_25;
        const __VLS_26 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.eventosFiltrados.length === 0))
                        return;
                    __VLS_ctx.openAuxiliares(evento);
                    // @ts-ignore
                    [openAuxiliares,];
                } });
        const { default: __VLS_27 } = __VLS_23.slots;
        // @ts-ignore
        [];
        var __VLS_23;
        var __VLS_24;
        const __VLS_28 = Button || Button;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_33;
        const __VLS_34 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.eventosFiltrados.length === 0))
                        return;
                    __VLS_ctx.openEditEvento(evento);
                    // @ts-ignore
                    [openEditEvento,];
                } });
        const { default: __VLS_35 } = __VLS_31.slots;
        // @ts-ignore
        [];
        var __VLS_31;
        var __VLS_32;
        const __VLS_36 = Button || Button;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
            ...{ class: "text-rose-600 hover:text-rose-700" },
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
            ...{ class: "text-rose-600 hover:text-rose-700" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_41;
        const __VLS_42 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.eventosFiltrados.length === 0))
                        return;
                    __VLS_ctx.confirmDeleteEvento(evento);
                    // @ts-ignore
                    [confirmDeleteEvento,];
                } });
        /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-rose-700']} */ ;
        const { default: __VLS_43 } = __VLS_39.slots;
        // @ts-ignore
        [];
        var __VLS_39;
        var __VLS_40;
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
var __VLS_11;
const __VLS_44 = Modal || Modal;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEventoModal),
    title: (__VLS_ctx.editingEvento ? 'Editar evento' : 'Nuevo evento'),
    size: "lg",
}));
const __VLS_46 = __VLS_45({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEventoModal),
    title: (__VLS_ctx.editingEvento ? 'Editar evento' : 'Nuevo evento'),
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_49;
const __VLS_50 = ({ close: {} },
    { onClose: (__VLS_ctx.closeEventoModal) });
const { default: __VLS_51 } = __VLS_47.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.saveEvento) },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
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
    value: (__VLS_ctx.formEvento.nombre),
    type: "text",
    required: true,
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-sm font-medium text-slate-700" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    value: (__VLS_ctx.formEvento.descripcion),
    rows: "3",
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-2 block text-sm font-medium text-slate-700" },
});
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleEventoImageChange) },
    ref: "eventoImageInputRef",
    type: "file",
    accept: "image/*",
    ...{ class: "hidden" },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.triggerEventoImagePicker) },
    type: "button",
    ...{ class: "inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" },
});
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-2 text-xs text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
if (__VLS_ctx.eventoImagePreview) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.eventoImagePreview),
        alt: "Vista previa",
        ...{ class: "h-32 w-full rounded-lg object-cover" },
    });
    /** @type {__VLS_StyleScopedClasses['h-32']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 md:grid-cols-2" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-sm font-medium text-slate-700" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.formEvento.idCarrera),
    required: true,
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
for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (carrera.idCarrera),
        value: (carrera.idCarrera),
    });
    (carrera.nombre);
    // @ts-ignore
    [carreras, showEventoModal, editingEvento, closeEventoModal, saveEvento, formEvento, formEvento, formEvento, handleEventoImageChange, triggerEventoImagePicker, eventoImagePreview, eventoImagePreview,];
}
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
    type: "datetime-local",
    required: true,
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formEvento.fechaHora);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
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
    value: (__VLS_ctx.formEvento.lugar),
    type: "text",
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
    ...{ class: "grid gap-4 md:grid-cols-3" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
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
    type: "number",
    min: "1",
    required: true,
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formEvento.cargaHoraria);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-sm font-medium text-slate-700" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.formEvento.modalidad),
    required: true,
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
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "PRESENCIAL",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "VIRTUAL",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "MIXTO",
});
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
    type: "number",
    min: "1",
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formEvento.cupoMaximo);
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
    ...{ class: "grid gap-4 md:grid-cols-2" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
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
    type: "number",
    min: "0",
    step: "0.01",
    required: true,
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formEvento.costoExterno);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
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
    type: "number",
    min: "0",
    step: "0.01",
    required: true,
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formEvento.costoUmsa);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
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
    value: (__VLS_ctx.formEvento.link),
    type: "text",
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-sm font-medium text-slate-700" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.formEvento.estado),
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
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ABIERTO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "LLENO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "FINALIZADO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_52 = Button || Button;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
    ...{ 'onClick': {} },
    variant: "outline",
    type: "button",
}));
const __VLS_54 = __VLS_53({
    ...{ 'onClick': {} },
    variant: "outline",
    type: "button",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_57;
const __VLS_58 = ({ click: {} },
    { onClick: (__VLS_ctx.closeEventoModal) });
const { default: __VLS_59 } = __VLS_55.slots;
// @ts-ignore
[closeEventoModal, formEvento, formEvento, formEvento, formEvento, formEvento, formEvento, formEvento, formEvento, formEvento,];
var __VLS_55;
var __VLS_56;
const __VLS_60 = Button || Button;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
    type: "submit",
    loading: (__VLS_ctx.saving),
}));
const __VLS_62 = __VLS_61({
    type: "submit",
    loading: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const { default: __VLS_65 } = __VLS_63.slots;
// @ts-ignore
[saving,];
var __VLS_63;
// @ts-ignore
[];
var __VLS_47;
var __VLS_48;
const __VLS_66 = Modal || Modal;
// @ts-ignore
const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAuxiliaresModal),
    title: "Asignar auxiliares",
    size: "lg",
}));
const __VLS_68 = __VLS_67({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAuxiliaresModal),
    title: "Asignar auxiliares",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_67));
let __VLS_71;
const __VLS_72 = ({ close: {} },
    { onClose: (__VLS_ctx.closeAuxiliaresModal) });
const { default: __VLS_73 } = __VLS_69.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-sm font-medium text-slate-700" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
if (__VLS_ctx.loadingAuxiliaresAsignados) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-center text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.auxiliaresAsignados.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-center text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else {
    for (const [auxiliar] of __VLS_vFor((__VLS_ctx.auxiliaresAsignados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (auxiliar.idUsuario),
            ...{ class: "flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium text-slate-900" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
        (auxiliar.nombres);
        (auxiliar.apellidos);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "ml-2 text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (auxiliar.username);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingAuxiliaresAsignados))
                        return;
                    if (!!(__VLS_ctx.auxiliaresAsignados.length === 0))
                        return;
                    __VLS_ctx.removeAuxiliar(auxiliar);
                    // @ts-ignore
                    [showAuxiliaresModal, closeAuxiliaresModal, loadingAuxiliaresAsignados, auxiliaresAsignados, auxiliaresAsignados, removeAuxiliar,];
                } },
            type: "button",
            ...{ class: "rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-rose-50']} */ ;
        // @ts-ignore
        [];
    }
}
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
    value: (__VLS_ctx.auxiliarSearch),
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
for (const [persona] of __VLS_vFor((__VLS_ctx.auxiliaresFiltrados))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectAuxiliar(persona);
                // @ts-ignore
                [auxiliarSearch, auxiliaresFiltrados, selectAuxiliar,];
            } },
        key: (persona.idUsuario),
        type: "button",
        ...{ class: "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition" },
        ...{ class: (__VLS_ctx.selectedAuxiliarIds.includes(persona.idUsuario)
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.toggleAuxiliarSelection(persona);
                // @ts-ignore
                [selectedAuxiliarIds, toggleAuxiliarSelection,];
            } },
        ...{ onClick: () => { } },
        type: "checkbox",
        ...{ class: "h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" },
        checked: (__VLS_ctx.selectedAuxiliarIds.includes(persona.idUsuario)),
    });
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-emerald-500']} */ ;
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
    (persona.roles.includes('AUXILIAR') ? 'Auxiliar' : 'Participante');
    // @ts-ignore
    [selectedAuxiliarIds,];
}
if (__VLS_ctx.auxiliarSearch.trim() === '') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-center text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.auxiliaresFiltrados.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-center text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-1 text-xs text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
if (__VLS_ctx.selectedAuxiliarIds.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-xs font-medium text-emerald-700" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
    (__VLS_ctx.selectedAuxiliarIds.length);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_74 = Button || Button;
// @ts-ignore
const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
    ...{ 'onClick': {} },
    variant: "outline",
}));
const __VLS_76 = __VLS_75({
    ...{ 'onClick': {} },
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_75));
let __VLS_79;
const __VLS_80 = ({ click: {} },
    { onClick: (__VLS_ctx.closeAuxiliaresModal) });
const { default: __VLS_81 } = __VLS_77.slots;
// @ts-ignore
[closeAuxiliaresModal, auxiliarSearch, auxiliaresFiltrados, selectedAuxiliarIds, selectedAuxiliarIds,];
var __VLS_77;
var __VLS_78;
const __VLS_82 = Button || Button;
// @ts-ignore
const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
    ...{ 'onClick': {} },
    variant: "outline",
    loading: (__VLS_ctx.savingAuxiliar),
}));
const __VLS_84 = __VLS_83({
    ...{ 'onClick': {} },
    variant: "outline",
    loading: (__VLS_ctx.savingAuxiliar),
}, ...__VLS_functionalComponentArgsRest(__VLS_83));
let __VLS_87;
const __VLS_88 = ({ click: {} },
    { onClick: (__VLS_ctx.clearAuxiliarSelection) });
const { default: __VLS_89 } = __VLS_85.slots;
// @ts-ignore
[savingAuxiliar, clearAuxiliarSelection,];
var __VLS_85;
var __VLS_86;
const __VLS_90 = Button || Button;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.savingAuxiliar),
}));
const __VLS_92 = __VLS_91({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.savingAuxiliar),
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
let __VLS_95;
const __VLS_96 = ({ click: {} },
    { onClick: (__VLS_ctx.assignAuxiliar) });
const { default: __VLS_97 } = __VLS_93.slots;
// @ts-ignore
[savingAuxiliar, assignAuxiliar,];
var __VLS_93;
var __VLS_94;
// @ts-ignore
[];
var __VLS_69;
var __VLS_70;
const __VLS_98 = Modal || Modal;
// @ts-ignore
const __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDeleteModal),
    title: "Eliminar evento",
    size: "md",
}));
const __VLS_100 = __VLS_99({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDeleteModal),
    title: "Eliminar evento",
    size: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_99));
let __VLS_103;
const __VLS_104 = ({ close: {} },
    { onClose: (__VLS_ctx.closeDeleteModal) });
const { default: __VLS_105 } = __VLS_101.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_106 = Button || Button;
// @ts-ignore
const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
    ...{ 'onClick': {} },
    variant: "outline",
}));
const __VLS_108 = __VLS_107({
    ...{ 'onClick': {} },
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_107));
let __VLS_111;
const __VLS_112 = ({ click: {} },
    { onClick: (__VLS_ctx.closeDeleteModal) });
const { default: __VLS_113 } = __VLS_109.slots;
// @ts-ignore
[showDeleteModal, closeDeleteModal, closeDeleteModal,];
var __VLS_109;
var __VLS_110;
const __VLS_114 = Button || Button;
// @ts-ignore
const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.deleting),
}));
const __VLS_116 = __VLS_115({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.deleting),
}, ...__VLS_functionalComponentArgsRest(__VLS_115));
let __VLS_119;
const __VLS_120 = ({ click: {} },
    { onClick: (__VLS_ctx.deleteEvento) });
const { default: __VLS_121 } = __VLS_117.slots;
// @ts-ignore
[deleting, deleteEvento,];
var __VLS_117;
var __VLS_118;
// @ts-ignore
[];
var __VLS_101;
var __VLS_102;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Eventos.vue.js.map