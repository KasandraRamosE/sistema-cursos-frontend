import { ref, computed, onMounted } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import Pagination from '@/components/common/Pagination.vue';
import { usePagination } from '@/composables/usePagination';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '@/utils/dateFormatter';
// ============================================
// COMPUTED CORREGIDO
// ============================================
const inscripcionesFiltradas = computed(() => {
    let resultado = [...inscripciones.value];
    // Filtro por usuario
    if (filtros.value.busquedaUsuario) {
        const busqueda = filtros.value.busquedaUsuario.toLowerCase();
        resultado = resultado.filter(i => i.usuario.nombres.toLowerCase().includes(busqueda) ||
            i.usuario.apellidos.toLowerCase().includes(busqueda) ||
            i.usuario.email.toLowerCase().includes(busqueda) ||
            i.usuario.username.toLowerCase().includes(busqueda));
    }
    // Filtro por actividad
    if (filtros.value.busquedaActividad) {
        const busqueda = filtros.value.busquedaActividad.toLowerCase();
        resultado = resultado.filter(i => i.actividad.nombre.toLowerCase().includes(busqueda));
    }
    // Filtro por estado
    if (filtros.value.estado) {
        resultado = resultado.filter(i => i.estado === filtros.value.estado);
    }
    // Filtro por tipo de actividad
    if (filtros.value.tipoActividad) {
        resultado = resultado.filter(i => i.actividad.tipo === filtros.value.tipoActividad);
    }
    // Filtro por tipo de precio
    if (filtros.value.tipoPrecio) {
        if (filtros.value.tipoPrecio === 'GRATUITO') {
            resultado = resultado.filter(i => i.montoPagado === 0);
        }
        else {
            resultado = resultado.filter(i => i.tipoPrecio === filtros.value.tipoPrecio && i.montoPagado > 0);
        }
    }
    if (filtros.value.carrera) {
        const idCarrera = Number(filtros.value.carrera);
        // ✅ Console.log corregido — i dentro del callback
        resultado = resultado.filter(i => i.actividad.idCarrera === idCarrera);
    }
    return resultado;
});
// ============================================
// MOCK DATA CORREGIDO
// ============================================
const cargarDatos = async () => {
    loading.value = true;
    try {
        const [carrerasResponse, cursosResponse, eventosResponse] = await Promise.all([
            api.get('/carreras'),
            api.get('/cursos/todos'),
            api.get('/eventos/todos')
        ]);
        carreras.value = carrerasResponse.map(carrera => ({
            id: Number(carrera.idCarrera ?? carrera.id ?? 0),
            nombre: String(carrera.nombre ?? '')
        }));
        const cursos = cursosResponse;
        const eventos = eventosResponse;
        const inscripcionesCurso = await Promise.all(cursos.map(curso => api.get(`/inscripciones/curso/${curso.idCurso}`)));
        const inscripcionesEvento = await Promise.all(eventos.map(evento => api.get(`/inscripciones/evento/${evento.idEvento}`)));
        const cursosById = new Map(cursos.map(curso => [Number(curso.idCurso), curso]));
        const eventosById = new Map(eventos.map(evento => [Number(evento.idEvento), evento]));
        const resolveCarreraId = (nombreCarrera) => {
            if (!nombreCarrera?.trim())
                return null;
            const target = nombreCarrera.trim().toLowerCase();
            const encontrada = carreras.value.find(c => c.nombre.trim().toLowerCase() === target);
            return encontrada ? encontrada.id : null;
        };
        const mapInscripcion = (item) => {
            const nombreParticipante = String(item.nombreParticipante ?? '');
            const nombreParts = nombreParticipante.split(' ');
            const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante;
            const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : '';
            const tipoActividad = String(item.tipoActividad ?? '');
            const idCurso = item.idCurso !== undefined ? Number(item.idCurso) : null;
            const idEvento = item.idEvento !== undefined ? Number(item.idEvento) : null;
            const curso = idCurso ? cursosById.get(idCurso) : null;
            const evento = idEvento ? eventosById.get(idEvento) : null;
            const dtoIdCarrera = item.idCarrera !== undefined && item.idCarrera !== null
                ? Number(item.idCarrera)
                : null;
            const dtoNombreCarrera = String(item.nombreCarrera ?? '');
            const nombreCarrera = dtoNombreCarrera || (tipoActividad === 'CURSO'
                ? String(curso?.nombreCarrera ?? '')
                : String(evento?.nombreCarrera ?? ''));
            const rawIdCarrera = dtoIdCarrera ?? (tipoActividad === 'CURSO'
                ? curso?.idCarrera
                : evento?.idCarrera);
            // Parsear independientemente del tipo que venga del API
            const parsedId = rawIdCarrera !== undefined && rawIdCarrera !== null
                ? Number(rawIdCarrera)
                : NaN;
            const idCarrera = !isNaN(parsedId) && parsedId > 0
                ? parsedId
                : resolveCarreraId(nombreCarrera);
            const carreraNombreResolvida = idCarrera
                ? String(carreras.value.find(c => c.id === idCarrera)?.nombre ?? '') || nombreCarrera
                : nombreCarrera;
            const modalidadActividad = String(item.modalidadActividad ?? '');
            const actividad = {
                idActividad: idCurso ?? idEvento ?? 0,
                nombre: String(item.nombreActividad ?? ''),
                tipo: tipoActividad,
                idCarrera,
                carreraNombre: carreraNombreResolvida,
                modalidad: (modalidadActividad || (tipoActividad === 'CURSO'
                    ? ''
                    : String(evento?.modalidad ?? ''))),
                cargaHoraria: Number(tipoActividad === 'CURSO'
                    ? (curso?.cargaHoraria ?? 0)
                    : (evento?.cargaHoraria ?? 0)),
                fechaInicio: String(tipoActividad === 'CURSO'
                    ? (curso?.fechaInicio ?? '')
                    : (evento?.fechaHora ?? '')),
                fechaFin: String(tipoActividad === 'CURSO'
                    ? (curso?.fechaInicio ?? '')
                    : (evento?.fechaHora ?? ''))
            };
            const saldo = Number(item.saldo ?? 0);
            const tipoPrecio = saldo === 0 ? 'GRATUITO' : String(item.tipoPrecio ?? '');
            // Poner esto dentro de mapInscripcion, justo después de definir curso/evento
            return {
                idInscripcion: Number(item.idInscripcion),
                usuario: {
                    idUsuario: Number(item.idParticipante ?? 0),
                    nombres,
                    apellidos,
                    email: String(item.emailParticipante ?? ''),
                    username: String(item.usernameParticipante ?? ''),
                    tipoUsuario: null
                },
                actividad,
                paralelo: (item.codigoParalelo ? String(item.codigoParalelo) : null),
                tipoPrecio,
                montoPagado: saldo,
                fechaInscripcion: String(item.fechaInscripcion ?? ''),
                estado: String(item.estado ?? 'PENDIENTE'),
                estadoPago: String(item.estadoPago ?? '') || undefined
            };
        };
        inscripciones.value = [
            ...inscripcionesCurso.flat().map(item => mapInscripcion(item)),
            ...inscripcionesEvento.flat().map(item => mapInscripcion(item))
        ];
    }
    catch (error) {
        console.error('Error al cargar datos:', error);
    }
    finally {
        loading.value = false;
    }
};
// ============================================
// ESTADO
// ============================================
const loading = ref(false);
const inscripciones = ref([]);
const carreras = ref([]);
const estadisticas = computed(() => {
    const base = inscripcionesFiltradas.value;
    return {
        total: base.length,
        confirmadas: base.filter(i => i.estado === 'CONFIRMADA').length,
        pendientes: base.filter(i => i.estado === 'PENDIENTE').length,
        canceladas: base.filter(i => i.estado === 'CANCELADA').length,
        totalIngresos: base
            .filter(i => i.estado === 'CONFIRMADA')
            .reduce((sum, i) => sum + i.montoPagado, 0)
    };
});
const filtros = ref({
    busquedaUsuario: '',
    busquedaActividad: '',
    estado: '',
    tipoActividad: '',
    tipoPrecio: '',
    carrera: ''
});
const showDetalleModal = ref(false);
const inscripcionSeleccionada = ref(null);
// Para Actividades.vue
const { paginatedData: inscripcionesPaginadas, // ← Cambiar nombre según tu vista
currentPage, pageSize, totalItems, goToPage, setPageSize } = usePagination(inscripcionesFiltradas, {
    pageSize: 10,
    initialPage: 1
});
const cambiarEstado = async (inscripcion) => {
    if (!confirm('¿Cancelar esta inscripción?'))
        return;
    try {
        await api.patch(`/inscripciones/${inscripcion.idInscripcion}/cancelar`);
        inscripcion.estado = 'CANCELADA';
        closeDetalleModal();
    }
    catch (error) {
        console.error('Error al cambiar estado:', error);
    }
};
// ============================================
// MÉTODOS - MODALES
// ============================================
const verDetalle = (inscripcion) => {
    inscripcionSeleccionada.value = inscripcion;
    showDetalleModal.value = true;
};
const closeDetalleModal = () => {
    showDetalleModal.value = false;
    inscripcionSeleccionada.value = null;
};
// ============================================
// MÉTODOS - UTILIDADES
// ============================================
const limpiarFiltros = () => {
    filtros.value = {
        busquedaUsuario: '',
        busquedaActividad: '',
        estado: '',
        tipoActividad: '',
        tipoPrecio: '',
        carrera: ''
    };
};
const formatDate = (date) => {
    if (!date)
        return '-';
    return formatDateUtil(date, 'es-BO');
};
const formatDatetime = (datetime) => {
    if (!datetime)
        return '-';
    return formatDateTimeUtil(datetime, 'es-BO');
};
const getEstadoBadge = (estado) => {
    const variants = {
        'CONFIRMADA': 'success',
        'PENDIENTE': 'warning',
        'CANCELADA': 'danger'
    };
    return variants[estado] || 'gray';
};
// ============================================
// LIFECYCLE
// ============================================
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-5 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-5']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
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
var __VLS_3;
const __VLS_6 = Card || Card;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
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
(__VLS_ctx.estadisticas.confirmadas);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_9;
const __VLS_12 = Card || Card;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-yellow-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-600']} */ ;
(__VLS_ctx.estadisticas.pendientes);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_15;
const __VLS_18 = Card || Card;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
(__VLS_ctx.estadisticas.canceladas);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_21;
const __VLS_24 = Card || Card;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const { default: __VLS_29 } = __VLS_27.slots;
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
(__VLS_ctx.estadisticas.totalIngresos.toFixed(2));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_27;
const __VLS_30 = Card || Card;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
const __VLS_32 = __VLS_31({}, ...__VLS_functionalComponentArgsRest(__VLS_31));
const { default: __VLS_35 } = __VLS_33.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
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
    value: (__VLS_ctx.filtros.busquedaUsuario),
    type: "text",
    placeholder: "Nombre, apellido, email o RU del usuario...",
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
    value: (__VLS_ctx.filtros.busquedaActividad),
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-5 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-5']} */ ;
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
    value: "CONFIRMADA",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "PENDIENTE",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "CANCELADA",
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
    value: (__VLS_ctx.filtros.tipoActividad),
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
    value: (__VLS_ctx.filtros.tipoPrecio),
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
    value: "UMSA",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "EXTERNO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "GRATUITO",
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
    ...{ onChange: ((e) => __VLS_ctx.filtros.carrera = e.target.value) },
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
        value: (String(carrera.id)),
    });
    (carrera.nombre);
    // @ts-ignore
    [filtros, filtros, filtros, filtros, filtros, filtros, filtros, carreras,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-end" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
const __VLS_36 = Button || Button;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}));
const __VLS_38 = __VLS_37({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_41;
const __VLS_42 = ({ click: {} },
    { onClick: (__VLS_ctx.limpiarFiltros) });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_43 } = __VLS_39.slots;
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
[limpiarFiltros,];
var __VLS_39;
var __VLS_40;
// @ts-ignore
[];
var __VLS_33;
const __VLS_44 = Card || Card;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({}));
const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const { default: __VLS_49 } = __VLS_47.slots;
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
else if (__VLS_ctx.inscripcionesPaginadas.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-4 text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.inscripcionesPaginadas.length);
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
    for (const [inscripcion] of __VLS_vFor((__VLS_ctx.inscripcionesPaginadas))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (inscripcion.idInscripcion),
            ...{ class: "hover:bg-gray-50" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm font-mono text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (inscripcion.idInscripcion);
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
        (inscripcion.usuario.nombres);
        (inscripcion.usuario.apellidos);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (inscripcion.usuario.email || '-');
        const __VLS_50 = Badge || Badge;
        // @ts-ignore
        const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
            variant: (inscripcion.usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'),
            size: "sm",
            ...{ class: "mt-1" },
        }));
        const __VLS_52 = __VLS_51({
            variant: (inscripcion.usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'),
            size: "sm",
            ...{ class: "mt-1" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_51));
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        const { default: __VLS_55 } = __VLS_53.slots;
        (inscripcion.usuario.tipoUsuario || 'N/A');
        // @ts-ignore
        [loading, inscripcionesPaginadas, inscripcionesPaginadas, inscripcionesPaginadas,];
        var __VLS_53;
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
        (inscripcion.actividad.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (inscripcion.actividad.carreraNombre || 'Sin carrera');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_56 = Badge || Badge;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
            variant: (inscripcion.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_58 = __VLS_57({
            variant: (inscripcion.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        const { default: __VLS_61 } = __VLS_59.slots;
        (inscripcion.actividad.tipo);
        // @ts-ignore
        [];
        var __VLS_59;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (inscripcion.paralelo || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        if (inscripcion.montoPagado === 0) {
            const __VLS_62 = Badge || Badge;
            // @ts-ignore
            const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
                variant: "success",
                size: "sm",
            }));
            const __VLS_64 = __VLS_63({
                variant: "success",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_63));
            const { default: __VLS_67 } = __VLS_65.slots;
            // @ts-ignore
            [];
            var __VLS_65;
        }
        else {
            const __VLS_68 = Badge || Badge;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
                variant: (inscripcion.tipoPrecio === 'UMSA' ? 'info' : 'warning'),
                size: "sm",
            }));
            const __VLS_70 = __VLS_69({
                variant: (inscripcion.tipoPrecio === 'UMSA' ? 'info' : 'warning'),
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
            const { default: __VLS_73 } = __VLS_71.slots;
            (inscripcion.tipoPrecio);
            // @ts-ignore
            [];
            var __VLS_71;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        if (inscripcion.montoPagado === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-green-600 font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "font-medium text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (inscripcion.montoPagado.toFixed(2));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-xs text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (__VLS_ctx.formatDate(inscripcion.fechaInscripcion));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_74 = Badge || Badge;
        // @ts-ignore
        const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
            variant: (__VLS_ctx.getEstadoBadge(inscripcion.estado)),
            size: "sm",
        }));
        const __VLS_76 = __VLS_75({
            variant: (__VLS_ctx.getEstadoBadge(inscripcion.estado)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_75));
        const { default: __VLS_79 } = __VLS_77.slots;
        (inscripcion.estado);
        // @ts-ignore
        [formatDate, getEstadoBadge,];
        var __VLS_77;
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
        const __VLS_80 = Button || Button;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }));
        const __VLS_82 = __VLS_81({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        let __VLS_85;
        const __VLS_86 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.inscripcionesPaginadas.length > 0))
                        return;
                    __VLS_ctx.verDetalle(inscripcion);
                    // @ts-ignore
                    [verDetalle,];
                } });
        const { default: __VLS_87 } = __VLS_83.slots;
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
        var __VLS_83;
        var __VLS_84;
        if (inscripcion.estado !== 'CANCELADA') {
            const __VLS_88 = Button || Button;
            // @ts-ignore
            const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
                ...{ class: "text-red-600 hover:text-red-800" },
            }));
            const __VLS_90 = __VLS_89({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
                ...{ class: "text-red-600 hover:text-red-800" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_89));
            let __VLS_93;
            const __VLS_94 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.inscripcionesPaginadas.length > 0))
                            return;
                        if (!(inscripcion.estado !== 'CANCELADA'))
                            return;
                        __VLS_ctx.cambiarEstado(inscripcion);
                        // @ts-ignore
                        [cambiarEstado,];
                    } });
            /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-red-800']} */ ;
            const { default: __VLS_95 } = __VLS_91.slots;
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
                d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
            });
            // @ts-ignore
            [];
            var __VLS_91;
            var __VLS_92;
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.totalItems > 0) {
    const __VLS_96 = Pagination;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }));
    const __VLS_98 = __VLS_97({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    let __VLS_101;
    const __VLS_102 = ({ 'update:currentPage': {} },
        { 'onUpdate:currentPage': (__VLS_ctx.goToPage) });
    const __VLS_103 = ({ 'update:pageSize': {} },
        { 'onUpdate:pageSize': (__VLS_ctx.setPageSize) });
    var __VLS_99;
    var __VLS_100;
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
        d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
}
// @ts-ignore
[totalItems, totalItems, currentPage, pageSize, goToPage, setPageSize,];
var __VLS_47;
const __VLS_104 = Modal || Modal;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDetalleModal),
    title: "Detalle de Inscripción",
    size: "lg",
}));
const __VLS_106 = __VLS_105({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDetalleModal),
    title: "Detalle de Inscripción",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
let __VLS_109;
const __VLS_110 = ({ close: {} },
    { onClose: (__VLS_ctx.closeDetalleModal) });
const { default: __VLS_111 } = __VLS_107.slots;
if (__VLS_ctx.inscripcionSeleccionada) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-6" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800 mb-3" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 rounded-lg p-4 space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-2 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.usuario.nombres);
    (__VLS_ctx.inscripcionSeleccionada.usuario.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_112 = Badge || Badge;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
        variant: (__VLS_ctx.inscripcionSeleccionada.usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'),
    }));
    const __VLS_114 = __VLS_113({
        variant: (__VLS_ctx.inscripcionSeleccionada.usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    const { default: __VLS_117 } = __VLS_115.slots;
    (__VLS_ctx.inscripcionSeleccionada.usuario.tipoUsuario || 'N/A');
    // @ts-ignore
    [showDetalleModal, closeDetalleModal, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada,];
    var __VLS_115;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.usuario.email || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.usuario.username || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800 mb-3" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 rounded-lg p-4 space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-2 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.actividad.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_118 = Badge || Badge;
    // @ts-ignore
    const __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({
        variant: (__VLS_ctx.inscripcionSeleccionada.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
    }));
    const __VLS_120 = __VLS_119({
        variant: (__VLS_ctx.inscripcionSeleccionada.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_119));
    const { default: __VLS_123 } = __VLS_121.slots;
    (__VLS_ctx.inscripcionSeleccionada.actividad.tipo);
    // @ts-ignore
    [inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada,];
    var __VLS_121;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.actividad.carreraNombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.actividad.modalidad || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.actividad.cargaHoraria);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.actividad.fechaInicio ? __VLS_ctx.formatDate(__VLS_ctx.inscripcionSeleccionada.actividad.fechaInicio) : '-');
    (__VLS_ctx.inscripcionSeleccionada.actividad.fechaFin ? __VLS_ctx.formatDate(__VLS_ctx.inscripcionSeleccionada.actividad.fechaFin) : '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800 mb-3" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 rounded-lg p-4 space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-2 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_124 = Badge || Badge;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
        variant: (__VLS_ctx.inscripcionSeleccionada.tipoPrecio === 'UMSA' ? 'info' : 'warning'),
    }));
    const __VLS_126 = __VLS_125({
        variant: (__VLS_ctx.inscripcionSeleccionada.tipoPrecio === 'UMSA' ? 'info' : 'warning'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    const { default: __VLS_129 } = __VLS_127.slots;
    (__VLS_ctx.inscripcionSeleccionada.tipoPrecio);
    // @ts-ignore
    [formatDate, formatDate, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada,];
    var __VLS_127;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-lg font-bold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.inscripcionSeleccionada.montoPagado.toFixed(2));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_130 = Badge || Badge;
    // @ts-ignore
    const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
        variant: (__VLS_ctx.inscripcionSeleccionada.estadoPago === 'APROBADO' ? 'success' : 'warning'),
    }));
    const __VLS_132 = __VLS_131({
        variant: (__VLS_ctx.inscripcionSeleccionada.estadoPago === 'APROBADO' ? 'success' : 'warning'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_131));
    const { default: __VLS_135 } = __VLS_133.slots;
    (__VLS_ctx.inscripcionSeleccionada.estadoPago || (__VLS_ctx.inscripcionSeleccionada.estado === 'CONFIRMADA' ? 'APROBADO' : 'PENDIENTE'));
    // @ts-ignore
    [inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada,];
    var __VLS_133;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.formatDatetime(__VLS_ctx.inscripcionSeleccionada.fechaInscripcion));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800 mb-3" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    const __VLS_136 = Badge || Badge;
    // @ts-ignore
    const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
        variant: (__VLS_ctx.getEstadoBadge(__VLS_ctx.inscripcionSeleccionada.estado)),
        size: "lg",
    }));
    const __VLS_138 = __VLS_137({
        variant: (__VLS_ctx.getEstadoBadge(__VLS_ctx.inscripcionSeleccionada.estado)),
        size: "lg",
    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
    const { default: __VLS_141 } = __VLS_139.slots;
    (__VLS_ctx.inscripcionSeleccionada.estado);
    // @ts-ignore
    [getEstadoBadge, inscripcionSeleccionada, inscripcionSeleccionada, inscripcionSeleccionada, formatDatetime,];
    var __VLS_139;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex space-x-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
    if (__VLS_ctx.inscripcionSeleccionada.estado !== 'CANCELADA') {
        const __VLS_142 = Button || Button;
        // @ts-ignore
        const __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({
            ...{ 'onClick': {} },
            variant: "danger",
            size: "sm",
        }));
        const __VLS_144 = __VLS_143({
            ...{ 'onClick': {} },
            variant: "danger",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_143));
        let __VLS_147;
        const __VLS_148 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.inscripcionSeleccionada))
                        return;
                    if (!(__VLS_ctx.inscripcionSeleccionada.estado !== 'CANCELADA'))
                        return;
                    __VLS_ctx.cambiarEstado(__VLS_ctx.inscripcionSeleccionada);
                    // @ts-ignore
                    [cambiarEstado, inscripcionSeleccionada, inscripcionSeleccionada,];
                } });
        const { default: __VLS_149 } = __VLS_145.slots;
        // @ts-ignore
        [];
        var __VLS_145;
        var __VLS_146;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_150 = Button || Button;
    // @ts-ignore
    const __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
        ...{ 'onClick': {} },
        variant: "outline",
    }));
    const __VLS_152 = __VLS_151({
        ...{ 'onClick': {} },
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_151));
    let __VLS_155;
    const __VLS_156 = ({ click: {} },
        { onClick: (__VLS_ctx.closeDetalleModal) });
    const { default: __VLS_157 } = __VLS_153.slots;
    // @ts-ignore
    [closeDetalleModal,];
    var __VLS_153;
    var __VLS_154;
}
// @ts-ignore
[];
var __VLS_107;
var __VLS_108;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Inscripciones.vue.js.map