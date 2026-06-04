import { computed, onMounted, ref } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil, parseLocalDate } from '@/utils/dateFormatter';
import { useAlertStore } from '@/stores/alert.store';
const alertStore = useAlertStore();
const carreras = ref([]);
const selectedCarreraId = ref(null);
const cursos = ref([]);
const docentes = ref([]);
const participantes = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchTerm = ref('');
const estadoFiltro = ref('');
const docenteSearch = ref('');
const selectedDocente = ref(null);
const tituloDocente = ref('');
const docenteAssignError = ref('');
const cursoFormError = ref('');
const showDocenteResults = ref(false);
const showCursoModal = ref(false);
const editingCurso = ref(null);
const editingEstado = ref('');
const cursoImageInputRef = ref(null);
const cursoImageFile = ref(null);
const cursoImagePreview = ref('');
const formCurso = ref({
    idCarrera: 0,
    nombre: '',
    descripcion: '',
    imagen: '',
    cargaHoraria: 1,
    duracion: null,
    unidad: null,
    fechaInicio: '',
    costoExterno: 0,
    costoUmsa: 0,
    notaAprobacion: 51,
    estado: 'ABIERTO'
});
const showDeleteModal = ref(false);
const deleting = ref(false);
const cursoToDelete = ref(null);
const showParalelosModal = ref(false);
const paraleloCurso = ref(null);
const showParaleloModal = ref(false);
const editingParalelo = ref(null);
const savingParalelo = ref(false);
const formParalelo = ref({
    codigo: '',
    idDocente: null,
    modalidad: 'PRESENCIAL',
    cupoMaximo: null,
    horarioDescripcion: '',
    lugar: '',
    link: ''
});
const cursosFiltrados = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    return cursos.value.filter(curso => {
        if (selectedCarreraId.value && curso.idCarrera !== selectedCarreraId.value)
            return false;
        if (estadoFiltro.value && curso.estado !== estadoFiltro.value)
            return false;
        if (term && !curso.nombre.toLowerCase().includes(term))
            return false;
        return true;
    });
});
const docentesFiltrados = computed(() => {
    const term = docenteSearch.value.trim().toLowerCase();
    if (!term)
        return [];
    const merged = new Map();
    docentes.value.forEach(docente => {
        merged.set(docente.idUsuario, docente);
    });
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
const findPersonaById = (idUsuario) => {
    if (idUsuario == null)
        return null;
    const docente = docentes.value.find(persona => persona.idUsuario === idUsuario);
    if (docente)
        return docente;
    return participantes.value.find(persona => persona.idUsuario === idUsuario) || null;
};
const formatPersonaNombre = (persona) => {
    return `${persona.nombres} ${persona.apellidos}`.trim();
};
const loadCarreras = async () => {
    const response = await api.get('/coordinador/carreras');
    carreras.value = response;
    selectedCarreraId.value = response[0]?.idCarrera ?? null;
};
const loadCursos = async () => {
    loading.value = true;
    try {
        const response = await api.get('/cursos/todos');
        cursos.value = response;
    }
    finally {
        loading.value = false;
    }
};
const loadDocentes = async () => {
    const response = await api.get('/usuarios/docentes');
    docentes.value = response;
};
const loadParticipantes = async () => {
    const response = await api.get('/usuarios/participantes');
    participantes.value = response;
};
const loadAll = async () => {
    await Promise.all([loadCarreras(), loadCursos(), loadDocentes(), loadParticipantes()]);
};
const openCreateCurso = () => {
    editingCurso.value = null;
    editingEstado.value = '';
    cursoFormError.value = '';
    formCurso.value = {
        idCarrera: selectedCarreraId.value || carreras.value[0]?.idCarrera || 0,
        nombre: '',
        descripcion: '',
        imagen: '',
        cargaHoraria: 1,
        duracion: null,
        unidad: null,
        fechaInicio: '',
        costoExterno: 0,
        costoUmsa: 0,
        notaAprobacion: 51,
        estado: 'ABIERTO'
    };
    clearCursoImagePreview();
    cursoImageFile.value = null;
    showCursoModal.value = true;
};
const openEditCurso = (curso) => {
    editingCurso.value = curso;
    editingEstado.value = curso.estado;
    cursoFormError.value = '';
    formCurso.value = {
        idCarrera: curso.idCarrera,
        nombre: curso.nombre,
        descripcion: curso.descripcion || '',
        imagen: curso.imagen || '',
        cargaHoraria: curso.cargaHoraria,
        duracion: curso.duracion ?? null,
        unidad: curso.unidad ? String(curso.unidad) : null,
        fechaInicio: curso.fechaInicio,
        costoExterno: Number(curso.costoExterno || 0),
        costoUmsa: Number(curso.costoUmsa || 0),
        notaAprobacion: Number(curso.notaAprobacion || 51),
        estado: curso.estado
    };
    cursoImageFile.value = null;
    if (curso.imagen) {
        cursoImagePreview.value = curso.imagen;
    }
    else {
        clearCursoImagePreview();
    }
    showCursoModal.value = true;
};
const closeCursoModal = () => {
    showCursoModal.value = false;
    editingCurso.value = null;
    editingEstado.value = '';
    cursoFormError.value = '';
    clearCursoImagePreview();
    cursoImageFile.value = null;
};
const saveCurso = async () => {
    cursoFormError.value = '';
    if (formCurso.value.fechaInicio) {
        const startDate = parseLocalDate(formCurso.value.fechaInicio);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
            cursoFormError.value = 'La fecha de inicio no puede ser anterior al día de hoy.';
            alertStore.push({
                type: 'warning',
                message: cursoFormError.value
            });
            return;
        }
    }
    saving.value = true;
    try {
        if (!formCurso.value.imagen && !cursoImageFile.value) {
            alertStore.push({ type: 'warning', message: 'Debes subir una imagen para el curso.' });
            saving.value = false;
            return;
        }
        const imagenUrl = await uploadCursoImagen();
        formCurso.value.imagen = imagenUrl;
        if (editingCurso.value) {
            await api.put(`/cursos/${editingCurso.value.idCurso}`, {
                idCarrera: formCurso.value.idCarrera,
                nombre: formCurso.value.nombre,
                descripcion: formCurso.value.descripcion,
                imagen: imagenUrl,
                cargaHoraria: formCurso.value.cargaHoraria,
                duracion: formCurso.value.duracion,
                unidad: formCurso.value.unidad,
                fechaInicio: formCurso.value.fechaInicio,
                costoExterno: formCurso.value.costoExterno,
                costoUmsa: formCurso.value.costoUmsa,
                notaAprobacion: formCurso.value.notaAprobacion
            });
            if (formCurso.value.estado !== editingEstado.value) {
                await api.patch(`/cursos/${editingCurso.value.idCurso}/estado?estado=${encodeURIComponent(formCurso.value.estado)}`);
            }
            alertStore.push({ type: 'success', message: 'Curso actualizado.' });
        }
        else {
            const created = await api.post('/cursos', {
                idCarrera: formCurso.value.idCarrera,
                nombre: formCurso.value.nombre,
                descripcion: formCurso.value.descripcion,
                imagen: imagenUrl,
                cargaHoraria: formCurso.value.cargaHoraria,
                duracion: formCurso.value.duracion,
                unidad: formCurso.value.unidad,
                fechaInicio: formCurso.value.fechaInicio,
                costoExterno: formCurso.value.costoExterno,
                costoUmsa: formCurso.value.costoUmsa,
                notaAprobacion: formCurso.value.notaAprobacion
            });
            alertStore.push({ type: 'success', message: 'Curso creado. Agrega al menos un paralelo.' });
            closeCursoModal();
            await loadCursos();
            paraleloCurso.value = created;
            showParalelosModal.value = true;
            openCreateParalelo('A');
            return;
        }
        closeCursoModal();
        await loadCursos();
    }
    catch (error) {
        const message = error.message || 'No se pudo guardar el curso.';
        alertStore.push({ type: 'error', message });
    }
    finally {
        saving.value = false;
    }
};
const clearCursoImagePreview = () => {
    if (cursoImagePreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(cursoImagePreview.value);
    }
    cursoImagePreview.value = '';
};
const handleCursoImageChange = (event) => {
    const input = event.target;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
        cursoImageFile.value = null;
        clearCursoImagePreview();
        return;
    }
    cursoImageFile.value = file;
    clearCursoImagePreview();
    cursoImagePreview.value = URL.createObjectURL(file);
};
const triggerCursoImagePicker = () => {
    cursoImageInputRef.value?.click();
};
const uploadCursoImagen = async () => {
    if (!cursoImageFile.value)
        return formCurso.value.imagen || '';
    const formData = new FormData();
    formData.append('archivo', cursoImageFile.value);
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
const confirmDeleteCurso = (curso) => {
    cursoToDelete.value = curso;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    cursoToDelete.value = null;
};
const deleteCurso = async () => {
    if (!cursoToDelete.value)
        return;
    deleting.value = true;
    try {
        await api.delete(`/cursos/${cursoToDelete.value.idCurso}`);
        alertStore.push({ type: 'success', message: 'Curso eliminado.' });
        closeDeleteModal();
        await loadCursos();
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo eliminar el curso.' });
    }
    finally {
        deleting.value = false;
    }
};
const openParalelos = (curso) => {
    paraleloCurso.value = curso;
    showParalelosModal.value = true;
};
const closeParalelos = () => {
    showParalelosModal.value = false;
    paraleloCurso.value = null;
};
const openCreateParalelo = (defaultCode = '') => {
    const codigoInicial = typeof defaultCode === 'string' ? defaultCode : '';
    editingParalelo.value = null;
    formParalelo.value = {
        codigo: codigoInicial,
        idDocente: null,
        modalidad: 'PRESENCIAL',
        cupoMaximo: null,
        horarioDescripcion: '',
        lugar: '',
        link: ''
    };
    docenteSearch.value = '';
    selectedDocente.value = null;
    tituloDocente.value = '';
    docenteAssignError.value = '';
    showDocenteResults.value = false;
    showParaleloModal.value = true;
};
const openEditParalelo = (paralelo) => {
    editingParalelo.value = paralelo;
    formParalelo.value = {
        codigo: paralelo.codigo,
        idDocente: paralelo.idDocente,
        modalidad: paralelo.modalidad,
        cupoMaximo: paralelo.cupoMaximo ?? null,
        horarioDescripcion: paralelo.horarioDescripcion || '',
        lugar: paralelo.lugar || '',
        link: paralelo.link || ''
    };
    selectedDocente.value = findPersonaById(paralelo.idDocente);
    docenteSearch.value = selectedDocente.value
        ? formatPersonaNombre(selectedDocente.value)
        : (paralelo.nombreDocente || '');
    tituloDocente.value = '';
    docenteAssignError.value = '';
    showDocenteResults.value = false;
    showParaleloModal.value = true;
};
const closeParaleloModal = () => {
    showParaleloModal.value = false;
    editingParalelo.value = null;
    selectedDocente.value = null;
    docenteSearch.value = '';
    tituloDocente.value = '';
    docenteAssignError.value = '';
    showDocenteResults.value = false;
};
const handleDocenteSearchInput = () => {
    showDocenteResults.value = !!docenteSearch.value.trim();
    selectedDocente.value = null;
    formParalelo.value.idDocente = null;
    tituloDocente.value = '';
    docenteAssignError.value = '';
};
const handleDocenteFocus = () => {
    if (!selectedDocente.value && docenteSearch.value.trim()) {
        showDocenteResults.value = true;
    }
};
const selectDocente = (persona) => {
    selectedDocente.value = persona;
    formParalelo.value.idDocente = persona.idUsuario;
    docenteSearch.value = formatPersonaNombre(persona);
    tituloDocente.value = '';
    docenteAssignError.value = '';
    showDocenteResults.value = false;
};
const saveParalelo = async () => {
    if (!paraleloCurso.value)
        return;
    savingParalelo.value = true;
    try {
        if (selectedDocente.value && !selectedDocente.value.roles.includes('DOCENTE')) {
            if (!tituloDocente.value.trim()) {
                docenteAssignError.value = 'El titulo es obligatorio para asignar DOCENTE.';
                savingParalelo.value = false;
                return;
            }
            await api.post(`/usuarios/${selectedDocente.value.idUsuario}/roles`, {
                nombreRol: 'DOCENTE',
                titulo: tituloDocente.value.trim()
            });
            await Promise.all([loadDocentes(), loadParticipantes()]);
        }
        const payload = {
            codigo: formParalelo.value.codigo,
            idDocente: formParalelo.value.idDocente || null,
            modalidad: formParalelo.value.modalidad,
            cupoMaximo: formParalelo.value.cupoMaximo,
            horarioDescripcion: formParalelo.value.horarioDescripcion,
            lugar: formParalelo.value.lugar,
            link: formParalelo.value.link
        };
        if (editingParalelo.value) {
            await api.put(`/cursos/${paraleloCurso.value.idCurso}/paralelos/${editingParalelo.value.codigo}`, payload);
            alertStore.push({ type: 'success', message: 'Paralelo actualizado.' });
        }
        else {
            await api.post(`/cursos/${paraleloCurso.value.idCurso}/paralelos`, payload);
            alertStore.push({ type: 'success', message: 'Paralelo creado.' });
        }
        closeParaleloModal();
        await loadCursos();
        if (paraleloCurso.value) {
            const updated = cursos.value.find(curso => curso.idCurso === paraleloCurso.value?.idCurso);
            paraleloCurso.value = updated || null;
        }
    }
    catch (error) {
        alertStore.push({ type: 'error', message: error.message || 'No se pudo guardar el paralelo.' });
    }
    finally {
        savingParalelo.value = false;
    }
};
const formatFechaInicio = (value) => {
    if (!value)
        return '-';
    return formatDateUtil(value, 'es-BO');
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
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreateCurso) });
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[openCreateCurso,];
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
    placeholder: "Nombre del curso...",
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
else if (__VLS_ctx.cursosFiltrados.length === 0) {
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
    for (const [curso] of __VLS_vFor((__VLS_ctx.cursosFiltrados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (curso.idCurso),
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
        (curso.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (curso.cargaHoraria);
        (curso.notaAprobacion);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        (curso.nombreCarrera);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        (__VLS_ctx.formatFechaInicio(curso.fechaInicio));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_14 = Badge || Badge;
        // @ts-ignore
        const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            variant: (curso.estado === 'ABIERTO' ? 'success' : 'gray'),
            size: "sm",
        }));
        const __VLS_16 = __VLS_15({
            variant: (curso.estado === 'ABIERTO' ? 'success' : 'gray'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_15));
        const { default: __VLS_19 } = __VLS_17.slots;
        (curso.estado);
        // @ts-ignore
        [loading, cursosFiltrados, cursosFiltrados, formatFechaInicio,];
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
                    if (!!(__VLS_ctx.cursosFiltrados.length === 0))
                        return;
                    __VLS_ctx.openParalelos(curso);
                    // @ts-ignore
                    [openParalelos,];
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
                    if (!!(__VLS_ctx.cursosFiltrados.length === 0))
                        return;
                    __VLS_ctx.openEditCurso(curso);
                    // @ts-ignore
                    [openEditCurso,];
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
                    if (!!(__VLS_ctx.cursosFiltrados.length === 0))
                        return;
                    __VLS_ctx.confirmDeleteCurso(curso);
                    // @ts-ignore
                    [confirmDeleteCurso,];
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
    modelValue: (__VLS_ctx.showCursoModal),
    title: (__VLS_ctx.editingCurso ? 'Editar curso' : 'Nuevo curso'),
    size: "lg",
}));
const __VLS_46 = __VLS_45({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showCursoModal),
    title: (__VLS_ctx.editingCurso ? 'Editar curso' : 'Nuevo curso'),
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_49;
const __VLS_50 = ({ close: {} },
    { onClose: (__VLS_ctx.closeCursoModal) });
const { default: __VLS_51 } = __VLS_47.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.saveCurso) },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
if (__VLS_ctx.cursoFormError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-rose-200 bg-rose-50 p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-rose-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-rose-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-rose-700" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-700']} */ ;
    (__VLS_ctx.cursoFormError);
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
    value: (__VLS_ctx.formCurso.nombre),
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
    value: (__VLS_ctx.formCurso.descripcion),
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
    ...{ onChange: (__VLS_ctx.handleCursoImageChange) },
    ref: "cursoImageInputRef",
    type: "file",
    accept: "image/*",
    ...{ class: "hidden" },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.triggerCursoImagePicker) },
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
if (__VLS_ctx.cursoImagePreview) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.cursoImagePreview),
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
    value: (__VLS_ctx.formCurso.idCarrera),
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
    [carreras, showCursoModal, editingCurso, closeCursoModal, saveCurso, cursoFormError, cursoFormError, formCurso, formCurso, formCurso, handleCursoImageChange, triggerCursoImagePicker, cursoImagePreview, cursoImagePreview,];
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
    type: "date",
    required: true,
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formCurso.fechaInicio);
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
(__VLS_ctx.formCurso.cargaHoraria);
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
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formCurso.duracion);
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
    value: (__VLS_ctx.formCurso.unidad),
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
    value: (null),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "días",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "semanas",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "meses",
});
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
(__VLS_ctx.formCurso.costoExterno);
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
(__VLS_ctx.formCurso.costoUmsa);
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
    max: "100",
    step: "0.01",
    required: true,
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.formCurso.notaAprobacion);
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
    value: (__VLS_ctx.formCurso.estado),
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
    { onClick: (__VLS_ctx.closeCursoModal) });
const { default: __VLS_59 } = __VLS_55.slots;
// @ts-ignore
[closeCursoModal, formCurso, formCurso, formCurso, formCurso, formCurso, formCurso, formCurso, formCurso,];
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
    modelValue: (__VLS_ctx.showDeleteModal),
    title: "Eliminar curso",
    size: "md",
}));
const __VLS_68 = __VLS_67({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDeleteModal),
    title: "Eliminar curso",
    size: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_67));
let __VLS_71;
const __VLS_72 = ({ close: {} },
    { onClose: (__VLS_ctx.closeDeleteModal) });
const { default: __VLS_73 } = __VLS_69.slots;
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
    { onClick: (__VLS_ctx.closeDeleteModal) });
const { default: __VLS_81 } = __VLS_77.slots;
// @ts-ignore
[showDeleteModal, closeDeleteModal, closeDeleteModal,];
var __VLS_77;
var __VLS_78;
const __VLS_82 = Button || Button;
// @ts-ignore
const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.deleting),
}));
const __VLS_84 = __VLS_83({
    ...{ 'onClick': {} },
    variant: "danger",
    loading: (__VLS_ctx.deleting),
}, ...__VLS_functionalComponentArgsRest(__VLS_83));
let __VLS_87;
const __VLS_88 = ({ click: {} },
    { onClick: (__VLS_ctx.deleteCurso) });
const { default: __VLS_89 } = __VLS_85.slots;
// @ts-ignore
[deleting, deleteCurso,];
var __VLS_85;
var __VLS_86;
// @ts-ignore
[];
var __VLS_69;
var __VLS_70;
const __VLS_90 = Modal || Modal;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showParalelosModal),
    title: "Gestion de paralelos",
    size: "xl",
}));
const __VLS_92 = __VLS_91({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showParalelosModal),
    title: "Gestion de paralelos",
    size: "xl",
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
let __VLS_95;
const __VLS_96 = ({ close: {} },
    { onClose: (__VLS_ctx.closeParalelos) });
const { default: __VLS_97 } = __VLS_93.slots;
if (__VLS_ctx.paraleloCurso) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.paraleloCurso.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    const __VLS_98 = Button || Button;
    // @ts-ignore
    const __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
    }));
    const __VLS_100 = __VLS_99({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_99));
    let __VLS_103;
    const __VLS_104 = ({ click: {} },
        { onClick: (__VLS_ctx.openCreateParalelo) });
    const { default: __VLS_105 } = __VLS_101.slots;
    // @ts-ignore
    [showParalelosModal, closeParalelos, paraleloCurso, paraleloCurso, openCreateParalelo,];
    var __VLS_101;
    var __VLS_102;
    if (__VLS_ctx.paraleloCurso.paralelos.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        for (const [paralelo] of __VLS_vFor((__VLS_ctx.paraleloCurso.paralelos))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (paralelo.codigo),
                ...{ class: "rounded-xl border border-slate-200 bg-white p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-between gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-semibold text-slate-900" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
            (paralelo.codigo);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            (paralelo.modalidad);
            (paralelo.cupoMaximo ?? 'Sin limite');
            const __VLS_106 = Button || Button;
            // @ts-ignore
            const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }));
            const __VLS_108 = __VLS_107({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_107));
            let __VLS_111;
            const __VLS_112 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.paraleloCurso))
                            return;
                        if (!!(__VLS_ctx.paraleloCurso.paralelos.length === 0))
                            return;
                        __VLS_ctx.openEditParalelo(paralelo);
                        // @ts-ignore
                        [paraleloCurso, paraleloCurso, openEditParalelo,];
                    } });
            const { default: __VLS_113 } = __VLS_109.slots;
            // @ts-ignore
            [];
            var __VLS_109;
            var __VLS_110;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-2 text-xs text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            (paralelo.nombreDocente || 'Sin asignar');
            if (paralelo.lugar) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 text-xs text-slate-500" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
                (paralelo.lugar);
            }
            // @ts-ignore
            [];
        }
    }
}
// @ts-ignore
[];
var __VLS_93;
var __VLS_94;
const __VLS_114 = Modal || Modal;
// @ts-ignore
const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showParaleloModal),
    title: (__VLS_ctx.editingParalelo ? 'Editar paralelo' : 'Nuevo paralelo'),
    size: "lg",
}));
const __VLS_116 = __VLS_115({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showParaleloModal),
    title: (__VLS_ctx.editingParalelo ? 'Editar paralelo' : 'Nuevo paralelo'),
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_115));
let __VLS_119;
const __VLS_120 = ({ close: {} },
    { onClose: (__VLS_ctx.closeParaleloModal) });
const { default: __VLS_121 } = __VLS_117.slots;
if (__VLS_ctx.paraleloCurso) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveParalelo) },
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
        value: (__VLS_ctx.formParalelo.codigo),
        type: "text",
        required: true,
        disabled: (!!__VLS_ctx.editingParalelo),
        ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100" },
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
    /** @type {__VLS_StyleScopedClasses['disabled:bg-slate-100']} */ ;
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
        ...{ onInput: (__VLS_ctx.handleDocenteSearchInput) },
        ...{ onFocus: (__VLS_ctx.handleDocenteFocus) },
        value: (__VLS_ctx.docenteSearch),
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
    if (__VLS_ctx.showDocenteResults && __VLS_ctx.docentesFiltrados.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-h-48']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        for (const [persona] of __VLS_vFor((__VLS_ctx.docentesFiltrados))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.paraleloCurso))
                            return;
                        if (!(__VLS_ctx.showDocenteResults && __VLS_ctx.docentesFiltrados.length > 0))
                            return;
                        __VLS_ctx.selectDocente(persona);
                        // @ts-ignore
                        [paraleloCurso, showParaleloModal, editingParalelo, editingParalelo, closeParaleloModal, saveParalelo, formParalelo, handleDocenteSearchInput, handleDocenteFocus, docenteSearch, showDocenteResults, docentesFiltrados, docentesFiltrados, selectDocente,];
                    } },
                key: (persona.idUsuario),
                type: "button",
                ...{ class: "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition" },
                ...{ class: (__VLS_ctx.selectedDocente?.idUsuario === persona.idUsuario
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
            (persona.roles.includes('DOCENTE') ? 'Docente' : 'Participante');
            // @ts-ignore
            [selectedDocente,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-xs text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    if (__VLS_ctx.selectedDocente && !__VLS_ctx.selectedDocente.roles.includes('DOCENTE')) {
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
            value: (__VLS_ctx.tituloDocente),
            type: "text",
            placeholder: "Lic., MSc., PhD., etc.",
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
        if (__VLS_ctx.docenteAssignError) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs text-rose-600" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
            (__VLS_ctx.docenteAssignError);
        }
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
        value: (__VLS_ctx.formParalelo.modalidad),
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
    (__VLS_ctx.formParalelo.cupoMaximo);
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
        value: (__VLS_ctx.formParalelo.lugar),
        type: "text",
        placeholder: "Aula, plataforma o dirección",
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.formParalelo.horarioDescripcion),
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.formParalelo.link),
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
        ...{ class: "flex justify-end gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_122 = Button || Button;
    // @ts-ignore
    const __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
        ...{ 'onClick': {} },
        variant: "outline",
        type: "button",
    }));
    const __VLS_124 = __VLS_123({
        ...{ 'onClick': {} },
        variant: "outline",
        type: "button",
    }, ...__VLS_functionalComponentArgsRest(__VLS_123));
    let __VLS_127;
    const __VLS_128 = ({ click: {} },
        { onClick: (__VLS_ctx.closeParaleloModal) });
    const { default: __VLS_129 } = __VLS_125.slots;
    // @ts-ignore
    [closeParaleloModal, formParalelo, formParalelo, formParalelo, formParalelo, formParalelo, selectedDocente, selectedDocente, tituloDocente, docenteAssignError, docenteAssignError,];
    var __VLS_125;
    var __VLS_126;
    const __VLS_130 = Button || Button;
    // @ts-ignore
    const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
        type: "submit",
        loading: (__VLS_ctx.savingParalelo),
    }));
    const __VLS_132 = __VLS_131({
        type: "submit",
        loading: (__VLS_ctx.savingParalelo),
    }, ...__VLS_functionalComponentArgsRest(__VLS_131));
    const { default: __VLS_135 } = __VLS_133.slots;
    // @ts-ignore
    [savingParalelo,];
    var __VLS_133;
}
// @ts-ignore
[];
var __VLS_117;
var __VLS_118;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Cursos.vue.js.map