import { ref, computed, onMounted } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '@/utils/dateFormatter';
// ============================================
// ESTADO
// ============================================
const loading = ref(false);
const saving = ref(false);
const carreras = ref([]);
const eventosDisponibles = ref([]);
const asistencias = ref([]);
const estadisticas = ref({
    totalEventos: 0,
    totalInscritos: 0,
    asistieron: 0,
    noAsistieron: 0
});
const filtros = ref({
    carrera: ''
});
const busquedaEvento = ref('');
const eventoSeleccionado = ref(null);
const infoEvento = ref(null);
const showEditModal = ref(false);
const asistenciaSeleccionada = ref(null);
const formAsistencia = ref({
    asistio: null,
    observaciones: ''
});
// ============================================
// COMPUTED
// ============================================
const asistenciasRegistradas = computed(() => {
    return asistencias.value.filter(a => a.asistio).length;
});
const eventosFiltrados = computed(() => {
    const term = busquedaEvento.value.trim().toLowerCase();
    const idCarrera = filtros.value.carrera ? Number(filtros.value.carrera) : null;
    return eventosDisponibles.value.filter(evento => {
        const carreraOk = !idCarrera || evento.idCarrera === idCarrera;
        const searchOk = !term || evento.nombre.toLowerCase().includes(term);
        return carreraOk && searchOk;
    });
});
// ============================================
// MÉTODOS - CARGA DE DATOS
// ============================================
const cargarCarreras = async () => {
    try {
        const response = await api.get('/carreras/todas');
        carreras.value = response.map(carrera => ({
            id: Number(carrera.idCarrera ?? carrera.id ?? 0),
            nombre: String(carrera.nombre ?? '')
        }));
    }
    catch (error) {
        console.error('Error al cargar carreras:', error);
    }
};
const cargarEventos = async () => {
    try {
        const response = await api.get('/eventos/todos');
        eventosDisponibles.value = response.map(evento => ({
            id: Number(evento.idEvento),
            nombre: String(evento.nombre ?? ''),
            fechaInicio: String(evento.fechaHora ?? ''),
            inscritos: Number(evento.inscritos ?? 0),
            idCarrera: evento.idCarrera !== undefined ? Number(evento.idCarrera) : null
        }));
        eventoSeleccionado.value = null;
        asistencias.value = [];
        infoEvento.value = null;
    }
    catch (error) {
        console.error('Error al cargar eventos:', error);
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
        asistencias.value = items.map(item => {
            const nombreParticipante = String(item.nombreParticipante ?? '');
            const nombreParts = nombreParticipante.split(' ');
            const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante;
            const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : '';
            return {
                idAsistencia: Number(item.idAsistencia),
                idInscripcion: Number(item.idInscripcion),
                participante: {
                    nombres,
                    apellidos,
                    email: String(item.email ?? '-'),
                    username: String(item.username ?? '-')
                },
                asistio: Boolean(item.asistio),
                certificado: null,
                registradoPor: item.registradoPor
                    ? { nombre: String(item.registradoPor), rol: '' }
                    : null,
                fechaRegistro: String(item.fechaRegistro ?? ''),
                observaciones: null
            };
        });
        calcularEstadisticas();
    }
    catch (error) {
        console.error('Error al cargar asistencias:', error);
    }
    finally {
        loading.value = false;
    }
};
const calcularEstadisticas = () => {
    estadisticas.value = {
        totalEventos: eventosDisponibles.value.length,
        totalInscritos: asistencias.value.length,
        asistieron: asistencias.value.filter(a => a.asistio).length,
        noAsistieron: asistencias.value.filter(a => !a.asistio).length
    };
};
// ============================================
// MÉTODOS - CRUD
// ============================================
const editarAsistencia = (asistencia) => {
    asistenciaSeleccionada.value = asistencia;
    formAsistencia.value = {
        asistio: asistencia.asistio,
        observaciones: asistencia.observaciones || ''
    };
    showEditModal.value = true;
};
const guardarAsistencia = async () => {
    if (!asistenciaSeleccionada.value)
        return;
    saving.value = true;
    try {
        if (formAsistencia.value.asistio) {
            await api.post('/asistencias', {
                idInscripcion: asistenciaSeleccionada.value.idInscripcion
            });
        }
        else {
            await api.delete(`/asistencias/${asistenciaSeleccionada.value.idInscripcion}`);
        }
        await cargarAsistencias();
        calcularEstadisticas();
        closeEditModal();
    }
    catch (error) {
        console.error('Error al guardar asistencia:', error);
    }
    finally {
        saving.value = false;
    }
};
// ============================================
// MÉTODOS - MODALES
// ============================================
const verDetalle = (asistencia) => {
    asistenciaSeleccionada.value = asistencia;
    showEditModal.value = true;
};
const closeEditModal = () => {
    showEditModal.value = false;
    asistenciaSeleccionada.value = null;
    formAsistencia.value = {
        asistio: null,
        observaciones: ''
    };
};
// ============================================
// MÉTODOS - UTILIDADES
// ============================================
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
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    cargarCarreras();
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
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
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
(__VLS_ctx.estadisticas.totalEventos);
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
    ...{ class: "text-2xl font-bold text-blue-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
(__VLS_ctx.estadisticas.totalInscritos);
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
    ...{ class: "text-2xl font-bold text-green-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
(__VLS_ctx.estadisticas.asistieron);
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
(__VLS_ctx.estadisticas.noAsistieron);
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
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-semibold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-3 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-3" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.busquedaEvento),
    type: "text",
    placeholder: "Nombre del evento...",
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
    [busquedaEvento, filtros, carreras,];
}
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
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.cargarAsistencias) },
    value: (__VLS_ctx.eventoSeleccionado),
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
    [cargarAsistencias, eventoSeleccionado, eventosFiltrados, formatDate,];
}
if (__VLS_ctx.eventoSeleccionado && __VLS_ctx.infoEvento) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.infoEvento.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.infoEvento.fechaInicio));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.infoEvento.inscritos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.asistenciasRegistradas);
    (__VLS_ctx.infoEvento.inscritos);
}
// @ts-ignore
[eventoSeleccionado, formatDate, infoEvento, infoEvento, infoEvento, infoEvento, infoEvento, asistenciasRegistradas,];
var __VLS_27;
if (__VLS_ctx.eventoSeleccionado) {
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
        ...{ class: "flex items-center justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.infoEvento?.nombre);
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
    else if (__VLS_ctx.asistencias.length > 0) {
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
            ...{ class: "px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
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
            ...{ class: "px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
            ...{ class: "divide-y divide-gray-200" },
        });
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
        for (const [asistencia, index] of __VLS_vFor((__VLS_ctx.asistencias))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (asistencia.idAsistencia),
                ...{ class: "hover:bg-gray-50" },
            });
            /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (index + 1);
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
            (asistencia.participante.nombres);
            (asistencia.participante.apellidos);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (asistencia.participante.username);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (asistencia.participante.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            const __VLS_36 = Badge || Badge;
            // @ts-ignore
            const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
                variant: (asistencia.asistio ? 'success' : 'danger'),
                size: "sm",
            }));
            const __VLS_38 = __VLS_37({
                variant: (asistencia.asistio ? 'success' : 'danger'),
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_37));
            const { default: __VLS_41 } = __VLS_39.slots;
            (asistencia.asistio ? 'SÍ ASISTIÓ' : 'NO ASISTIÓ');
            // @ts-ignore
            [eventoSeleccionado, infoEvento, loading, asistencias, asistencias,];
            var __VLS_39;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            if (asistencia.registradoPor) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-sm" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                (asistencia.registradoPor.nombre);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-gray-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                (__VLS_ctx.formatDatetime(asistencia.fechaRegistro));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-gray-400" },
                });
                /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-center space-x-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
            const __VLS_42 = Button || Button;
            // @ts-ignore
            const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }));
            const __VLS_44 = __VLS_43({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_43));
            let __VLS_47;
            const __VLS_48 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.eventoSeleccionado))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.asistencias.length > 0))
                            return;
                        __VLS_ctx.editarAsistencia(asistencia);
                        // @ts-ignore
                        [formatDatetime, editarAsistencia,];
                    } });
            const { default: __VLS_49 } = __VLS_45.slots;
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
            var __VLS_45;
            var __VLS_46;
            const __VLS_50 = Button || Button;
            // @ts-ignore
            const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }));
            const __VLS_52 = __VLS_51({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_51));
            let __VLS_55;
            const __VLS_56 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.eventoSeleccionado))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.asistencias.length > 0))
                            return;
                        __VLS_ctx.verDetalle(asistencia);
                        // @ts-ignore
                        [verDetalle,];
                    } });
            const { default: __VLS_57 } = __VLS_53.slots;
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
            var __VLS_53;
            var __VLS_54;
            // @ts-ignore
            [];
        }
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
            d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_33;
}
else {
    const __VLS_58 = Card || Card;
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        ...{ class: "text-center py-12" },
    }));
    const __VLS_60 = __VLS_59({
        ...{ class: "text-center py-12" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    const { default: __VLS_63 } = __VLS_61.slots;
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
        ...{ class: "text-gray-600 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    // @ts-ignore
    [];
    var __VLS_61;
}
const __VLS_64 = Modal || Modal;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditModal),
    title: "Editar Asistencia",
}));
const __VLS_66 = __VLS_65({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditModal),
    title: "Editar Asistencia",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
let __VLS_69;
const __VLS_70 = ({ close: {} },
    { onClose: (__VLS_ctx.closeEditModal) });
const { default: __VLS_71 } = __VLS_67.slots;
if (__VLS_ctx.asistenciaSeleccionada) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.guardarAsistencia) },
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.asistenciaSeleccionada.participante.nombres);
    (__VLS_ctx.asistenciaSeleccionada.participante.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.asistenciaSeleccionada.participante.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-blue-800 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    const __VLS_72 = Badge || Badge;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        variant: (__VLS_ctx.asistenciaSeleccionada.asistio ? 'success' : 'danger'),
    }));
    const __VLS_74 = __VLS_73({
        variant: (__VLS_ctx.asistenciaSeleccionada.asistio ? 'success' : 'danger'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    const { default: __VLS_77 } = __VLS_75.slots;
    (__VLS_ctx.asistenciaSeleccionada.asistio ? 'SÍ ASISTIÓ' : 'NO ASISTIÓ');
    // @ts-ignore
    [showEditModal, closeEditModal, asistenciaSeleccionada, asistenciaSeleccionada, asistenciaSeleccionada, asistenciaSeleccionada, asistenciaSeleccionada, asistenciaSeleccionada, guardarAsistencia,];
    var __VLS_75;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50" },
        ...{ class: (__VLS_ctx.formAsistencia.asistio === true ? 'border-green-500 bg-green-50' : 'border-gray-300') },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: (true),
        ...{ class: "w-4 h-4 text-green-600" },
    });
    (__VLS_ctx.formAsistencia.asistio);
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ml-3 font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50" },
        ...{ class: (__VLS_ctx.formAsistencia.asistio === false ? 'border-red-500 bg-red-50' : 'border-gray-300') },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: (false),
        ...{ class: "w-4 h-4 text-red-600" },
    });
    (__VLS_ctx.formAsistencia.asistio);
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ml-3 font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
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
        value: (__VLS_ctx.formAsistencia.observaciones),
        rows: "2",
        placeholder: "Notas adicionales sobre el cambio...",
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
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_78 = Button || Button;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }));
    const __VLS_80 = __VLS_79({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    let __VLS_83;
    const __VLS_84 = ({ click: {} },
        { onClick: (__VLS_ctx.closeEditModal) });
    const { default: __VLS_85 } = __VLS_81.slots;
    // @ts-ignore
    [closeEditModal, formAsistencia, formAsistencia, formAsistencia, formAsistencia, formAsistencia,];
    var __VLS_81;
    var __VLS_82;
    const __VLS_86 = Button || Button;
    // @ts-ignore
    const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
        type: "submit",
        disabled: (__VLS_ctx.saving),
    }));
    const __VLS_88 = __VLS_87({
        type: "submit",
        disabled: (__VLS_ctx.saving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_87));
    const { default: __VLS_91 } = __VLS_89.slots;
    (__VLS_ctx.saving ? 'Guardando...' : 'Guardar Cambios');
    // @ts-ignore
    [saving, saving,];
    var __VLS_89;
}
// @ts-ignore
[];
var __VLS_67;
var __VLS_68;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Asistencias.vue.js.map