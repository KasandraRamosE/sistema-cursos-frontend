import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import Pagination from '@/components/common/Pagination.vue';
import { usePagination } from '@/composables/usePagination';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, parseLocalDate } from '@/utils/dateFormatter';
import { useAlertStore } from '@/stores/alert.store';
// ============================================
// ESTADO
// ============================================
const loading = ref(false);
const saving = ref(false);
const router = useRouter();
const alertStore = useAlertStore();
const actividades = ref([]);
const carreras = ref([]);
const estadisticas = ref({
    total: 0,
    cursos: 0,
    eventos: 0,
    abiertos: 0,
    finalizados: 0
});
const filtros = ref({
    busqueda: '',
    tipo: '',
    estado: '',
    carrera: '',
    modalidad: '',
    fechaDesde: ''
});
const showActividadModal = ref(false);
const modoEdicion = ref(false);
const actividadEditando = ref(null);
const showDeleteModal = ref(false);
const actividadAEliminar = ref(null);
const deleting = ref(false);
const imageInputRef = ref(null);
const imagenFile = ref(null);
const imagenPreview = ref('');
const formActividad = ref({
    tipo: 'CURSO',
    nombre: '',
    descripcion: '',
    lugar: '',
    imagen: '',
    cargaHoraria: 0,
    modalidad: '',
    fechaInicio: '',
    fechaHora: '',
    cupoMaximo: 0,
    costoExterno: 0,
    costoUmsa: 0,
    esGratuito: false,
    notaMinimaAprobacion: 51,
    idCarrera: '',
    link: ''
});
// ============================================
// COMPUTED
// ============================================
const actividadesFiltradas = computed(() => {
    let resultado = [...actividades.value];
    if (filtros.value.busqueda) {
        const busqueda = filtros.value.busqueda.toLowerCase();
        resultado = resultado.filter(a => a.nombre.toLowerCase().includes(busqueda));
    }
    if (filtros.value.tipo) {
        resultado = resultado.filter(a => a.tipo === filtros.value.tipo);
    }
    if (filtros.value.estado) {
        resultado = resultado.filter(a => getEstadoMostrado(a) === filtros.value.estado);
    }
    if (filtros.value.carrera) {
        resultado = resultado.filter(a => a.idCarrera === Number(filtros.value.carrera));
    }
    if (filtros.value.modalidad) {
        resultado = resultado.filter(a => a.modalidad === filtros.value.modalidad);
    }
    return resultado;
});
const { paginatedData: actividadesPaginadas, // ← Los datos que mostraremos en la tabla (10 items por defecto)
currentPage, // ← Página actual (reactivo)
pageSize, // ← Tamaño de página (reactivo)
totalPages, // ← Total de páginas (calculado automáticamente)
totalItems, // ← Total de items después de filtrar
goToPage, // ← Método para ir a una página específica
setPageSize // ← Método para cambiar el tamaño de página
 } = usePagination(actividadesFiltradas, {
    pageSize: 10,
    initialPage: 1
});
// ============================================
// MÉTODOS
// ============================================
const cargarDatos = async () => {
    loading.value = true;
    try {
        const [carrerasResponse, cursosResponse, eventosResponse] = await Promise.all([
            api.get('/carreras/todas'),
            api.get('/cursos/todos'),
            api.get('/eventos/todos')
        ]);
        carreras.value = carrerasResponse.map(carrera => ({
            id: Number(carrera.idCarrera ?? carrera.id ?? 0),
            nombre: String(carrera.nombre ?? '')
        }));
        const cursos = cursosResponse.map(curso => {
            const costoExterno = Number(curso.costoExterno ?? 0);
            const costoUmsa = Number(curso.costoUmsa ?? 0);
            const paralelos = Array.isArray(curso.paralelos)
                ? curso.paralelos
                : [];
            const inscritos = paralelos.reduce((sum, p) => sum + Number(p.inscritos ?? 0), 0);
            const cupoMaximo = paralelos.reduce((sum, p) => sum + Number(p.cupoMaximo ?? 0), 0);
            return {
                idActividad: Number(curso.idCurso),
                tipo: 'CURSO',
                nombre: String(curso.nombre ?? ''),
                descripcion: String(curso.descripcion ?? ''),
                imagen: String(curso.imagen ?? ''),
                cargaHoraria: Number(curso.cargaHoraria ?? 0),
                modalidad: 'PRESENCIAL',
                fechaInicio: String(curso.fechaInicio ?? ''),
                fechaFin: String(curso.fechaInicio ?? ''),
                cupoMaximo,
                costoExterno,
                costoUmsa,
                esGratuito: costoExterno === 0 && costoUmsa === 0,
                notaMinimaAprobacion: curso.notaAprobacion !== undefined ? Number(curso.notaAprobacion) : null,
                estado: String(curso.estado ?? 'ABIERTO'),
                idCarrera: curso.idCarrera !== undefined ? Number(curso.idCarrera) : null,
                carrera: String(curso.nombreCarrera ?? ''),
                inscritos
            };
        });
        const eventos = eventosResponse.map(evento => {
            const costoExterno = Number(evento.costoExterno ?? 0);
            const costoUmsa = Number(evento.costoUmsa ?? 0);
            const fechaHora = evento.fechaHora ? String(evento.fechaHora) : '';
            return {
                idActividad: Number(evento.idEvento),
                tipo: 'EVENTO',
                nombre: String(evento.nombre ?? ''),
                descripcion: String(evento.descripcion ?? ''),
                lugar: String(evento.lugar ?? ''),
                imagen: String(evento.imagen ?? ''),
                cargaHoraria: Number(evento.cargaHoraria ?? 0),
                modalidad: String(evento.modalidad ?? 'PRESENCIAL'),
                fechaInicio: fechaHora,
                fechaFin: fechaHora,
                cupoMaximo: Number(evento.cupoMaximo ?? 0),
                costoExterno,
                costoUmsa,
                esGratuito: costoExterno === 0 && costoUmsa === 0,
                notaMinimaAprobacion: null,
                link: String(evento.link ?? ''),
                estado: String(evento.estado ?? 'ABIERTO'),
                idCarrera: evento.idCarrera !== undefined ? Number(evento.idCarrera) : null,
                carrera: String(evento.nombreCarrera ?? ''),
                inscritos: Number(evento.inscritos ?? 0)
            };
        });
        actividades.value = [...cursos, ...eventos];
        calcularEstadisticas();
    }
    catch (error) {
        console.error('Error al cargar datos:', error);
    }
    finally {
        loading.value = false;
    }
};
const calcularEstadisticas = () => {
    const estadosMostrados = actividades.value.map(actividad => getEstadoMostrado(actividad));
    estadisticas.value = {
        total: actividades.value.length,
        cursos: actividades.value.filter(a => a.tipo === 'CURSO').length,
        eventos: actividades.value.filter(a => a.tipo === 'EVENTO').length,
        abiertos: estadosMostrados.filter(estado => estado === 'ABIERTO').length,
        finalizados: estadosMostrados.filter(estado => estado === 'FINALIZADO').length
    };
};
const submitActividad = async () => {
    saving.value = true;
    try {
        if (!formActividad.value.imagen && !imagenFile.value) {
            alertStore.push({ type: 'warning', message: 'Debes subir una imagen para la actividad.' });
            saving.value = false;
            return;
        }
        const imagenUrl = await uploadImagen();
        formActividad.value.imagen = imagenUrl;
        const costoExterno = formActividad.value.esGratuito ? 0 : Number(formActividad.value.costoExterno);
        const costoUmsa = formActividad.value.esGratuito ? 0 : Number(formActividad.value.costoUmsa);
        if (formActividad.value.tipo === 'CURSO') {
            const payload = {
                idCarrera: Number(formActividad.value.idCarrera),
                nombre: formActividad.value.nombre.trim(),
                descripcion: formActividad.value.descripcion?.trim() || null,
                imagen: imagenUrl,
                cargaHoraria: Number(formActividad.value.cargaHoraria),
                fechaInicio: formActividad.value.fechaInicio,
                costoExterno,
                costoUmsa,
                notaAprobacion: Number(formActividad.value.notaMinimaAprobacion)
            };
            if (modoEdicion.value && actividadEditando.value) {
                await api.put(`/cursos/${actividadEditando.value.idActividad}`, payload);
            }
            else {
                await api.post('/cursos', payload);
            }
        }
        else {
            const payload = {
                idCarrera: Number(formActividad.value.idCarrera),
                nombre: formActividad.value.nombre.trim(),
                descripcion: formActividad.value.descripcion?.trim() || null,
                lugar: formActividad.value.lugar?.trim() || null,
                imagen: imagenUrl,
                cargaHoraria: Number(formActividad.value.cargaHoraria),
                modalidad: formActividad.value.modalidad,
                fechaHora: formActividad.value.fechaHora,
                cupoMaximo: formActividad.value.cupoMaximo ? Number(formActividad.value.cupoMaximo) : null,
                costoExterno,
                costoUmsa,
                link: formActividad.value.link?.trim() || null
            };
            if (modoEdicion.value && actividadEditando.value) {
                await api.put(`/eventos/${actividadEditando.value.idActividad}`, payload);
            }
            else {
                await api.post('/eventos', payload);
            }
        }
        closeActividadModal();
        await cargarDatos();
    }
    catch (error) {
        console.error('Error al guardar actividad:', error);
        alertStore.push({ type: 'error', message: error.message || 'No se pudo guardar la actividad.' });
    }
    finally {
        saving.value = false;
    }
};
const openDeleteModal = (actividad) => {
    actividadAEliminar.value = actividad;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    actividadAEliminar.value = null;
};
const confirmDelete = async () => {
    if (!actividadAEliminar.value)
        return;
    deleting.value = true;
    try {
        if (actividadAEliminar.value.tipo === 'CURSO') {
            await api.delete(`/cursos/${actividadAEliminar.value.idActividad}`);
        }
        else {
            await api.delete(`/eventos/${actividadAEliminar.value.idActividad}`);
        }
        alertStore.push({ type: 'success', message: 'Actividad eliminada.' });
        closeDeleteModal();
        await cargarDatos();
    }
    catch (error) {
        console.error('Error al eliminar:', error);
        alertStore.push({ type: 'error', message: error.message || 'No se pudo eliminar la actividad.' });
    }
    finally {
        deleting.value = false;
    }
};
const openCreateModal = () => {
    modoEdicion.value = false;
    actividadEditando.value = null;
    formActividad.value = {
        tipo: 'CURSO',
        nombre: '',
        descripcion: '',
        lugar: '',
        imagen: '',
        cargaHoraria: 0,
        modalidad: '',
        fechaInicio: '',
        fechaHora: '',
        cupoMaximo: 0,
        costoExterno: 0,
        costoUmsa: 0,
        esGratuito: false,
        notaMinimaAprobacion: 51,
        idCarrera: '',
        link: ''
    };
    clearImagePreview();
    imagenFile.value = null;
    showActividadModal.value = true;
};
const openEditModal = (actividad) => {
    modoEdicion.value = true;
    actividadEditando.value = actividad;
    formActividad.value = {
        tipo: actividad.tipo,
        nombre: actividad.nombre,
        descripcion: actividad.descripcion,
        lugar: actividad.tipo === 'EVENTO' ? (actividad.lugar ?? '') : '',
        imagen: actividad.imagen ?? '',
        cargaHoraria: actividad.cargaHoraria,
        modalidad: actividad.modalidad || 'PRESENCIAL',
        fechaInicio: actividad.tipo === 'CURSO' ? toDateInput(actividad.fechaInicio) : '',
        fechaHora: actividad.tipo === 'EVENTO' ? toDateTimeInput(actividad.fechaInicio) : '',
        cupoMaximo: actividad.cupoMaximo,
        costoExterno: actividad.costoExterno,
        costoUmsa: actividad.costoUmsa,
        esGratuito: actividad.esGratuito,
        notaMinimaAprobacion: actividad.notaMinimaAprobacion ?? 51,
        idCarrera: actividad.idCarrera ? String(actividad.idCarrera) : '',
        link: actividad.link ?? ''
    };
    imagenFile.value = null;
    if (actividad.imagen) {
        imagenPreview.value = actividad.imagen;
    }
    else {
        clearImagePreview();
    }
    showActividadModal.value = true;
};
const closeActividadModal = () => {
    showActividadModal.value = false;
    actividadEditando.value = null;
    clearImagePreview();
    imagenFile.value = null;
};
const verDetalle = (actividad) => {
    router.push({
        name: 'activity-detail',
        params: { id: String(actividad.idActividad) },
        query: { tipo: actividad.tipo }
    });
};
const limpiarFiltros = () => {
    filtros.value = {
        busqueda: '',
        tipo: '',
        estado: '',
        carrera: '',
        modalidad: '',
        fechaDesde: ''
    };
};
const formatDate = (date) => {
    if (!date)
        return '-';
    return formatDateUtil(date, 'es-BO');
};
const formatDateTime = (date) => {
    if (!date)
        return '-';
    return formatDateTimeUtil(date, 'es-BO');
};
const isEventoFinalizadoPorFecha = (actividad) => {
    if (actividad.tipo !== 'EVENTO' || !actividad.fechaInicio)
        return false;
    return parseLocalDate(actividad.fechaInicio).getTime() < Date.now();
};
const getEstadoMostrado = (actividad) => {
    if (isEventoFinalizadoPorFecha(actividad))
        return 'FINALIZADO';
    return actividad.estado;
};
const toDateInput = (value) => {
    if (!value)
        return '';
    if (value.includes('T'))
        return value.split('T')[0];
    if (value.includes(' '))
        return value.split(' ')[0];
    return value;
};
const toDateTimeInput = (value) => {
    if (!value)
        return '';
    if (value.includes('T'))
        return value.slice(0, 16);
    if (value.includes(' '))
        return value.replace(' ', 'T').slice(0, 16);
    return value;
};
const getEstadoBadge = (estado) => {
    const variants = {
        'ABIERTO': 'success',
        'LLENO': 'warning',
        'FINALIZADO': 'gray'
    };
    return variants[estado] || 'info';
};
const getModalidadBadge = (modalidad) => {
    const variants = {
        'PRESENCIAL': 'info',
        'VIRTUAL': 'secondary',
        'MIXTO': 'primary'
    };
    return variants[modalidad] || 'gray';
};
const getCupoColor = (inscritos, maximo) => {
    if (!maximo || maximo <= 0)
        return 'bg-gray-400';
    const porcentaje = (inscritos / maximo) * 100;
    if (porcentaje >= 90)
        return 'bg-red-600';
    if (porcentaje >= 70)
        return 'bg-yellow-600';
    return 'bg-green-600';
};
const getCupoPorcentaje = (inscritos, maximo) => {
    if (!maximo || maximo <= 0)
        return 0;
    return Math.min(100, (inscritos / maximo) * 100);
};
const clearImagePreview = () => {
    if (imagenPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(imagenPreview.value);
    }
    imagenPreview.value = '';
};
const handleImageChange = (event) => {
    const input = event.target;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
        imagenFile.value = null;
        clearImagePreview();
        return;
    }
    imagenFile.value = file;
    clearImagePreview();
    imagenPreview.value = URL.createObjectURL(file);
};
const triggerImagePicker = () => {
    imageInputRef.value?.click();
};
const uploadImagen = async () => {
    if (!imagenFile.value)
        return formActividad.value.imagen || '';
    const formData = new FormData();
    formData.append('archivo', imagenFile.value);
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
onMounted(() => {
    cargarDatos();
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
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
const __VLS_0 = Button || Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreateModal) });
const { default: __VLS_7 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-5 h-5 mr-2" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M12 4v16m8-8H4",
});
// @ts-ignore
[openCreateModal,];
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-5 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-5']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
const __VLS_8 = Card || Card;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.estadisticas.total);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_11;
const __VLS_14 = Card || Card;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_19 } = __VLS_17.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-purple-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
(__VLS_ctx.estadisticas.cursos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_17;
const __VLS_20 = Card || Card;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({}));
const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const { default: __VLS_25 } = __VLS_23.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-green-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
(__VLS_ctx.estadisticas.eventos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_23;
const __VLS_26 = Card || Card;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
const { default: __VLS_31 } = __VLS_29.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-blue-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
(__VLS_ctx.estadisticas.abiertos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_29;
const __VLS_32 = Card || Card;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const { default: __VLS_37 } = __VLS_35.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
(__VLS_ctx.estadisticas.finalizados);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_35;
const __VLS_38 = Card || Card;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
const { default: __VLS_43 } = __VLS_41.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.filtros.busqueda),
    type: "text",
    placeholder: "Nombre de la actividad...",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.tipo),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
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
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.estado),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4 mt-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.carrera),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (carrera.id),
        value: (carrera.id),
    });
    (carrera.nombre);
    // @ts-ignore
    [filtros, filtros, filtros, filtros, carreras,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.modalidad),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
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
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "date",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
(__VLS_ctx.filtros.fechaDesde);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-end" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
const __VLS_44 = Button || Button;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}));
const __VLS_46 = __VLS_45({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_49;
const __VLS_50 = ({ click: {} },
    { onClick: (__VLS_ctx.limpiarFiltros) });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_51 } = __VLS_47.slots;
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
    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
});
// @ts-ignore
[filtros, filtros, limpiarFiltros,];
var __VLS_47;
var __VLS_48;
// @ts-ignore
[];
var __VLS_41;
const __VLS_52 = Card || Card;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({}));
const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const { default: __VLS_57 } = __VLS_55.slots;
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
else if (__VLS_ctx.actividadesPaginadas.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "bg-gray-50 border-b border-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
    for (const [actividad] of __VLS_vFor((__VLS_ctx.actividadesPaginadas))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (actividad.idActividad),
            ...{ class: "hover:bg-gray-50" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-medium text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (actividad.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (actividad.cargaHoraria);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_58 = Badge || Badge;
        // @ts-ignore
        const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
            variant: (actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_60 = __VLS_59({
            variant: (actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_59));
        const { default: __VLS_63 } = __VLS_61.slots;
        (actividad.tipo);
        // @ts-ignore
        [loading, actividadesPaginadas, actividadesPaginadas,];
        var __VLS_61;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (actividad.carrera);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        if (actividad.tipo === 'EVENTO') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_ctx.formatDateTime(actividad.fechaInicio));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_ctx.formatDate(actividad.fechaInicio));
            if (actividad.fechaFin && actividad.fechaFin !== actividad.fechaInicio) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-gray-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                (__VLS_ctx.formatDate(actividad.fechaFin));
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_64 = Badge || Badge;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
            variant: (__VLS_ctx.getModalidadBadge(actividad.modalidad)),
            size: "sm",
        }));
        const __VLS_66 = __VLS_65({
            variant: (__VLS_ctx.getModalidadBadge(actividad.modalidad)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        const { default: __VLS_69 } = __VLS_67.slots;
        (actividad.modalidad);
        // @ts-ignore
        [formatDateTime, formatDate, formatDate, getModalidadBadge,];
        var __VLS_67;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (actividad.inscritos);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (actividad.cupoMaximo);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "w-16 bg-gray-200 rounded-full h-2" },
        });
        /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-2 rounded-full" },
            ...{ class: (__VLS_ctx.getCupoColor(actividad.inscritos, actividad.cupoMaximo)) },
            ...{ style: ({ width: `${__VLS_ctx.getCupoPorcentaje(actividad.inscritos, actividad.cupoMaximo)}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        if (actividad.esGratuito) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-green-600 font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (actividad.costoExterno);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (actividad.costoUmsa);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_70 = Badge || Badge;
        // @ts-ignore
        const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
            variant: (__VLS_ctx.getEstadoBadge(__VLS_ctx.getEstadoMostrado(actividad))),
            size: "sm",
        }));
        const __VLS_72 = __VLS_71({
            variant: (__VLS_ctx.getEstadoBadge(__VLS_ctx.getEstadoMostrado(actividad))),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_71));
        const { default: __VLS_75 } = __VLS_73.slots;
        (__VLS_ctx.getEstadoMostrado(actividad));
        // @ts-ignore
        [getCupoColor, getCupoPorcentaje, getEstadoBadge, getEstadoMostrado, getEstadoMostrado,];
        var __VLS_73;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
        const __VLS_76 = Button || Button;
        // @ts-ignore
        const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }));
        const __VLS_78 = __VLS_77({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_77));
        let __VLS_81;
        const __VLS_82 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.actividadesPaginadas.length > 0))
                        return;
                    __VLS_ctx.verDetalle(actividad);
                    // @ts-ignore
                    [verDetalle,];
                } });
        const { default: __VLS_83 } = __VLS_79.slots;
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
            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
        });
        // @ts-ignore
        [];
        var __VLS_79;
        var __VLS_80;
        const __VLS_84 = Button || Button;
        // @ts-ignore
        const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }));
        const __VLS_86 = __VLS_85({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_85));
        let __VLS_89;
        const __VLS_90 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.actividadesPaginadas.length > 0))
                        return;
                    __VLS_ctx.openEditModal(actividad);
                    // @ts-ignore
                    [openEditModal,];
                } });
        const { default: __VLS_91 } = __VLS_87.slots;
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
            d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
        });
        // @ts-ignore
        [];
        var __VLS_87;
        var __VLS_88;
        const __VLS_92 = Button || Button;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
            ...{ class: "text-red-600 hover:text-red-800" },
        }));
        const __VLS_94 = __VLS_93({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
            ...{ class: "text-red-600 hover:text-red-800" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        let __VLS_97;
        const __VLS_98 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.actividadesPaginadas.length > 0))
                        return;
                    __VLS_ctx.openDeleteModal(actividad);
                    // @ts-ignore
                    [openDeleteModal,];
                } });
        /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-red-800']} */ ;
        const { default: __VLS_99 } = __VLS_95.slots;
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
            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
        });
        // @ts-ignore
        [];
        var __VLS_95;
        var __VLS_96;
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.totalItems > 0) {
    const __VLS_100 = Pagination;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }));
    const __VLS_102 = __VLS_101({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    let __VLS_105;
    const __VLS_106 = ({ 'update:currentPage': {} },
        { 'onUpdate:currentPage': (__VLS_ctx.goToPage) });
    const __VLS_107 = ({ 'update:pageSize': {} },
        { 'onUpdate:pageSize': (__VLS_ctx.setPageSize) });
    var __VLS_103;
    var __VLS_104;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-16 h-16 mx-auto text-gray-400 mb-4" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
}
// @ts-ignore
[totalItems, totalItems, currentPage, pageSize, goToPage, setPageSize,];
var __VLS_55;
const __VLS_108 = Modal || Modal;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showActividadModal),
    title: (__VLS_ctx.modoEdicion ? 'Editar Actividad' : 'Nueva Actividad'),
    size: "lg",
}));
const __VLS_110 = __VLS_109({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showActividadModal),
    title: (__VLS_ctx.modoEdicion ? 'Editar Actividad' : 'Nueva Actividad'),
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
let __VLS_113;
const __VLS_114 = ({ close: {} },
    { onClose: (__VLS_ctx.closeActividadModal) });
const { default: __VLS_115 } = __VLS_111.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.submitActividad) },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-2 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" },
    ...{ class: (__VLS_ctx.formActividad.tipo === 'CURSO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300') },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "radio",
    value: "CURSO",
    ...{ class: "w-4 h-4 text-blue-600" },
});
(__VLS_ctx.formActividad.tipo);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ml-3" },
});
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "font-medium text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" },
    ...{ class: (__VLS_ctx.formActividad.tipo === 'EVENTO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300') },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "radio",
    value: "EVENTO",
    ...{ class: "w-4 h-4 text-blue-600" },
});
(__VLS_ctx.formActividad.tipo);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ml-3" },
});
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "font-medium text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.formActividad.nombre),
    type: "text",
    required: true,
    placeholder: "Ej: Introducción a la Psicología Clínica",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.formActividad.idCarrera),
    required: true,
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (carrera.id),
        value: (carrera.id),
    });
    (carrera.nombre);
    // @ts-ignore
    [carreras, showActividadModal, modoEdicion, closeActividadModal, submitActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "number",
    required: true,
    min: "1",
    placeholder: "Horas académicas",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
(__VLS_ctx.formActividad.cargaHoraria);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
if (__VLS_ctx.formActividad.tipo === 'EVENTO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.formActividad.modalidad),
        required: true,
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "PRESENCIAL",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "VIRTUAL",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "MIXTO",
    });
}
if (__VLS_ctx.formActividad.tipo === 'EVENTO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "1",
        placeholder: "Número de participantes",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.formActividad.cupoMaximo);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    value: (__VLS_ctx.formActividad.descripcion),
    rows: "3",
    placeholder: "Describe los objetivos, contenidos y requisitos de la actividad...",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
if (__VLS_ctx.formActividad.tipo === 'EVENTO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.formActividad.lugar),
        type: "text",
        placeholder: "Ej: Auditorio principal",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleImageChange) },
    ref: "imageInputRef",
    type: "file",
    accept: "image/*",
    ...{ class: "hidden" },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.triggerImagePicker) },
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
    ...{ class: "mt-2 text-xs text-gray-500" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
if (__VLS_ctx.imagenPreview) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.imagenPreview),
        alt: "Vista previa",
        ...{ class: "h-32 w-full rounded-lg object-cover" },
    });
    /** @type {__VLS_StyleScopedClasses['h-32']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
if (__VLS_ctx.formActividad.tipo === 'CURSO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        required: true,
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.formActividad.fechaInicio);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "datetime-local",
        required: true,
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.formActividad.fechaHora);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
}
if (__VLS_ctx.formActividad.tipo === 'EVENTO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.formActividad.link),
        type: "text",
        placeholder: "https://...",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center mb-3" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "checkbox",
    ...{ class: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
});
(__VLS_ctx.formActividad.esGratuito);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "ml-2 text-sm font-medium text-gray-700" },
});
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
if (!__VLS_ctx.formActividad.esGratuito) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        required: (!__VLS_ctx.formActividad.esGratuito),
        disabled: (__VLS_ctx.formActividad.esGratuito),
        min: "0",
        step: "0.01",
        placeholder: "0.00",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.formActividad.costoExterno);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        required: (!__VLS_ctx.formActividad.esGratuito),
        disabled: (__VLS_ctx.formActividad.esGratuito),
        min: "0",
        step: "0.01",
        placeholder: "0.00",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.formActividad.costoUmsa);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
}
if (__VLS_ctx.formActividad.tipo === 'CURSO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        required: (__VLS_ctx.formActividad.tipo === 'CURSO'),
        min: "0",
        max: "100",
        placeholder: "Sobre 100 puntos",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.formActividad.notaMinimaAprobacion);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500 mt-1" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
const __VLS_116 = Button || Button;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
    ...{ 'onClick': {} },
    type: "button",
    variant: "outline",
}));
const __VLS_118 = __VLS_117({
    ...{ 'onClick': {} },
    type: "button",
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
let __VLS_121;
const __VLS_122 = ({ click: {} },
    { onClick: (__VLS_ctx.closeActividadModal) });
const { default: __VLS_123 } = __VLS_119.slots;
// @ts-ignore
[closeActividadModal, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, formActividad, handleImageChange, triggerImagePicker, imagenPreview, imagenPreview,];
var __VLS_119;
var __VLS_120;
const __VLS_124 = Button || Button;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
    type: "submit",
    disabled: (__VLS_ctx.saving),
}));
const __VLS_126 = __VLS_125({
    type: "submit",
    disabled: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
const { default: __VLS_129 } = __VLS_127.slots;
(__VLS_ctx.saving ? 'Guardando...' : (__VLS_ctx.modoEdicion ? 'Actualizar' : 'Crear'));
// @ts-ignore
[modoEdicion, saving, saving,];
var __VLS_127;
// @ts-ignore
[];
var __VLS_111;
var __VLS_112;
const __VLS_130 = Modal || Modal;
// @ts-ignore
const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDeleteModal),
    title: "Eliminar actividad",
    size: "md",
}));
const __VLS_132 = __VLS_131({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDeleteModal),
    title: "Eliminar actividad",
    size: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_131));
let __VLS_135;
const __VLS_136 = ({ close: {} },
    { onClose: (__VLS_ctx.closeDeleteModal) });
const { default: __VLS_137 } = __VLS_133.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end space-x-3" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
const __VLS_138 = Button || Button;
// @ts-ignore
const __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
    ...{ 'onClick': {} },
    type: "button",
    variant: "outline",
}));
const __VLS_140 = __VLS_139({
    ...{ 'onClick': {} },
    type: "button",
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_139));
let __VLS_143;
const __VLS_144 = ({ click: {} },
    { onClick: (__VLS_ctx.closeDeleteModal) });
const { default: __VLS_145 } = __VLS_141.slots;
// @ts-ignore
[showDeleteModal, closeDeleteModal, closeDeleteModal,];
var __VLS_141;
var __VLS_142;
const __VLS_146 = Button || Button;
// @ts-ignore
const __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146({
    ...{ 'onClick': {} },
    type: "button",
    variant: "danger",
    disabled: (__VLS_ctx.deleting),
}));
const __VLS_148 = __VLS_147({
    ...{ 'onClick': {} },
    type: "button",
    variant: "danger",
    disabled: (__VLS_ctx.deleting),
}, ...__VLS_functionalComponentArgsRest(__VLS_147));
let __VLS_151;
const __VLS_152 = ({ click: {} },
    { onClick: (__VLS_ctx.confirmDelete) });
const { default: __VLS_153 } = __VLS_149.slots;
(__VLS_ctx.deleting ? 'Eliminando...' : 'Eliminar');
// @ts-ignore
[deleting, deleting, confirmDelete,];
var __VLS_149;
var __VLS_150;
// @ts-ignore
[];
var __VLS_133;
var __VLS_134;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Actividades.vue.js.map