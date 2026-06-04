import { ref, computed, onMounted, watch } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/api';
// ============================================
// ESTADO
// ============================================
const loading = ref(false);
const saving = ref(false);
const carreras = ref([]);
const cursos = ref([]);
const paralelosDisponibles = ref([]);
const calificaciones = ref([]);
const estadisticas = ref({
    totalParalelos: 0,
    totalCalificaciones: 0,
    inscritosCurso: 0,
    aprobadosCurso: 0,
    reprobadosCurso: 0,
    pendientesCurso: 0,
    confirmadasCurso: 0
});
const filtros = ref({
    carrera: ''
});
const paraleloSeleccionado = ref(null);
const infoParalelo = ref(null);
const showEditModal = ref(false);
const showDetalleModal = ref(false);
const calificacionSeleccionada = ref(null);
const formCalificacion = ref({
    notaFinal: null,
    motivo: ''
});
const errorMotivo = ref('');
// ============================================
// COMPUTED
// ============================================
const todasConfirmadas = computed(() => {
    return calificaciones.value.length > 0 &&
        calificaciones.value.every(c => c.confirmadaPorDocente);
});
const cambiaEstadoCalificacion = computed(() => {
    if (!calificacionSeleccionada.value || formCalificacion.value.notaFinal === null) {
        return false;
    }
    const notaMinima = infoParalelo.value?.notaMinima || 51;
    const notaActual = calificacionSeleccionada.value.notaFinal || 0;
    const notaNueva = formCalificacion.value.notaFinal;
    const estadoActual = notaActual >= notaMinima ? 'APROBADO' : 'REPROBADO';
    const estadoNuevo = notaNueva >= notaMinima ? 'APROBADO' : 'REPROBADO';
    return estadoActual !== estadoNuevo;
});
const certificadoAccion = computed(() => {
    if (!cambiaEstadoCalificacion.value || !calificacionSeleccionada.value) {
        return 'NINGUNA';
    }
    const notaMinima = infoParalelo.value?.notaMinima || 51;
    const notaActual = calificacionSeleccionada.value.notaFinal || 0;
    const notaNueva = formCalificacion.value.notaFinal || 0;
    const estabaAprobado = notaActual >= notaMinima;
    const estaraAprobado = notaNueva >= notaMinima;
    if (!estabaAprobado && estaraAprobado) {
        return 'EMITIR';
    }
    if (estabaAprobado && !estaraAprobado) {
        return 'ANULAR';
    }
    return 'NINGUNA';
});
// ============================================
// MÉTODOS
// ============================================
const cargarCarreras = async () => {
    try {
        const [carrerasResponse, cursosResponse] = await Promise.all([
            api.get('/carreras/todas'),
            api.get('/cursos/todos')
        ]);
        carreras.value = carrerasResponse.map(carrera => ({
            idCarrera: Number(carrera.idCarrera ?? carrera.id ?? 0),
            nombre: String(carrera.nombre ?? '')
        }));
        cursos.value = cursosResponse;
        await cargarParalelos();
        await cargarEstadisticasGenerales();
    }
    catch (error) {
        console.error('Error:', error);
    }
};
const cargarEstadisticasGenerales = async () => {
    try {
        estadisticas.value.totalParalelos = paralelosDisponibles.value.length;
        estadisticas.value.totalCalificaciones = calificaciones.value.length;
    }
    catch (error) {
        console.error('Error:', error);
    }
};
const cargarParalelos = async () => {
    try {
        const todosParalelos = [];
        cursos.value.forEach(curso => {
            const idCurso = Number(curso.idCurso ?? 0);
            const nombreCurso = String(curso.nombre ?? '');
            const idCarrera = Number(curso.idCarrera ?? 0);
            const nombreCarrera = String(curso.nombreCarrera ?? '');
            const notaMinima = Number(curso.notaAprobacion ?? 51);
            const paralelos = Array.isArray(curso.paralelos)
                ? curso.paralelos
                : [];
            paralelos.forEach(paralelo => {
                const codigo = String(paralelo.codigo ?? '');
                const inscritos = Number(paralelo.inscritos ?? 0);
                todosParalelos.push({
                    idParalelo: `${idCurso}-${codigo}`,
                    codigo,
                    idCurso,
                    actividadNombre: nombreCurso,
                    idCarrera,
                    carreraNombre: nombreCarrera,
                    inscritos,
                    notaMinima
                });
            });
        });
        const filtrados = filtros.value.carrera
            ? todosParalelos.filter(p => p.idCarrera === Number(filtros.value.carrera))
            : todosParalelos;
        paralelosDisponibles.value = filtrados;
        paraleloSeleccionado.value = null;
        calificaciones.value = [];
        infoParalelo.value = null;
    }
    catch (error) {
        console.error('Error:', error);
    }
};
const cargarCalificaciones = async () => {
    if (!paraleloSeleccionado.value)
        return;
    loading.value = true;
    try {
        infoParalelo.value = paralelosDisponibles.value.find(p => p.idParalelo === paraleloSeleccionado.value) || null;
        if (!infoParalelo.value)
            return;
        const [idCursoStr, codigo] = infoParalelo.value.idParalelo.split('-');
        const idCurso = Number(idCursoStr);
        const response = await api.get(`/evaluaciones/paralelo/${idCurso}/${codigo}`);
        const evaluaciones = response;
        calificaciones.value = evaluaciones.map(item => {
            const nombreParticipante = String(item.nombreParticipante ?? '');
            const nombreParts = nombreParticipante.split(' ');
            const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante;
            const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : '';
            const notaFinal = item.notaFinal !== undefined && item.notaFinal !== null
                ? Number(item.notaFinal)
                : null;
            return {
                idCalificacion: Number(item.idEvaluacion),
                idInscripcion: Number(item.idInscripcion),
                estudiante: {
                    idUsuario: 0,
                    nombres,
                    apellidos,
                    email: '-',
                    username: String(item.username ?? ''),
                    tipoUsuario: null
                },
                notaFinal,
                estado: item.estado ? String(item.estado) : null,
                confirmadaPorDocente: Boolean(item.estado),
                fechaConfirmacion: null,
                idDocenteConfirma: null,
                nombreDocenteConfirma: undefined,
                certificadoId: undefined,
                detalles: [],
                fechaRegistro: String(item.fechaRegistro ?? '')
            };
        });
        calcularEstadisticasCurso();
        await cargarEstadisticasGenerales();
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        loading.value = false;
    }
};
const calcularEstadisticasCurso = () => {
    estadisticas.value.inscritosCurso = calificaciones.value.length;
    estadisticas.value.aprobadosCurso = calificaciones.value.filter(c => c.estado === 'APROBADO').length;
    estadisticas.value.reprobadosCurso = calificaciones.value.filter(c => c.estado === 'REPROBADO').length;
    estadisticas.value.pendientesCurso = calificaciones.value.filter(c => c.notaFinal === null).length;
    estadisticas.value.confirmadasCurso = calificaciones.value.filter(c => c.confirmadaPorDocente).length;
};
const editarCalificacion = (calificacion) => {
    calificacionSeleccionada.value = calificacion;
    formCalificacion.value.notaFinal = calificacion.notaFinal;
    formCalificacion.value.motivo = '';
    errorMotivo.value = '';
    showEditModal.value = true;
};
const guardarCalificacion = async () => {
    if (!calificacionSeleccionada.value)
        return;
    if (!formCalificacion.value.motivo.trim()) {
        errorMotivo.value = 'El motivo es obligatorio.';
        return;
    }
    saving.value = true;
    try {
        await api.patch(`/evaluaciones/${calificacionSeleccionada.value.idCalificacion}/nota`, {
            notaNueva: formCalificacion.value.notaFinal,
            motivo: formCalificacion.value.motivo
        });
        const notaMinima = infoParalelo.value?.notaMinima || 51;
        calificacionSeleccionada.value.notaFinal = formCalificacion.value.notaFinal;
        if (formCalificacion.value.notaFinal !== null) {
            calificacionSeleccionada.value.estado =
                formCalificacion.value.notaFinal >= notaMinima ? 'APROBADO' : 'REPROBADO';
        }
        calcularEstadisticasCurso();
        closeEditModal();
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        saving.value = false;
    }
};
const verDetalle = (calificacion) => {
    calificacionSeleccionada.value = calificacion;
    showDetalleModal.value = true;
};
const closeEditModal = () => {
    showEditModal.value = false;
    calificacionSeleccionada.value = null;
    formCalificacion.value = { notaFinal: null, motivo: '' };
    errorMotivo.value = '';
};
const closeDetalleModal = () => {
    showDetalleModal.value = false;
    calificacionSeleccionada.value = null;
};
const getNotaColor = (nota, notaMinima) => {
    if (nota === null)
        return 'text-gray-400';
    return nota >= notaMinima ? 'text-green-600' : 'text-red-600';
};
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    cargarCarreras();
});
watch(() => filtros.value.carrera, () => {
    cargarParalelos();
});
watch(paraleloSeleccionado, (newVal) => {
    if (newVal) {
        cargarCalificaciones();
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
    ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
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
(__VLS_ctx.estadisticas.totalParalelos);
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
(__VLS_ctx.estadisticas.totalCalificaciones);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_9;
if (__VLS_ctx.paraleloSeleccionado && __VLS_ctx.infoParalelo) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-5 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
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
        ...{ class: "text-2xl font-bold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.estadisticas.inscritosCurso);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    // @ts-ignore
    [estadisticas, paraleloSeleccionado, infoParalelo,];
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
        ...{ class: "text-2xl font-bold text-green-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
    (__VLS_ctx.estadisticas.aprobadosCurso);
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
        ...{ class: "text-2xl font-bold text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    (__VLS_ctx.estadisticas.reprobadosCurso);
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
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-bold text-yellow-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-yellow-600']} */ ;
    (__VLS_ctx.estadisticas.pendientesCurso);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    // @ts-ignore
    [estadisticas,];
    var __VLS_33;
    const __VLS_36 = Card || Card;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const { default: __VLS_41 } = __VLS_39.slots;
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
    (__VLS_ctx.estadisticas.confirmadasCurso);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    // @ts-ignore
    [estadisticas,];
    var __VLS_39;
}
const __VLS_42 = Card || Card;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({}));
const __VLS_44 = __VLS_43({}, ...__VLS_functionalComponentArgsRest(__VLS_43));
const { default: __VLS_47 } = __VLS_45.slots;
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
        key: (carrera.idCarrera),
        value: (carrera.idCarrera),
    });
    (carrera.nombre);
    // @ts-ignore
    [filtros, carreras,];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.paraleloSeleccionado),
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
for (const [paralelo] of __VLS_vFor((__VLS_ctx.paralelosDisponibles))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (paralelo.idParalelo),
        value: (paralelo.idParalelo),
    });
    (paralelo.actividadNombre);
    (paralelo.codigo);
    (paralelo.carreraNombre);
    (paralelo.inscritos);
    // @ts-ignore
    [paraleloSeleccionado, paralelosDisponibles,];
}
if (__VLS_ctx.paraleloSeleccionado && __VLS_ctx.infoParalelo) {
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
    (__VLS_ctx.infoParalelo.actividadNombre);
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
    (__VLS_ctx.infoParalelo.codigo);
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
    (__VLS_ctx.infoParalelo.carreraNombre);
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
    (__VLS_ctx.infoParalelo.notaMinima);
}
// @ts-ignore
[paraleloSeleccionado, infoParalelo, infoParalelo, infoParalelo, infoParalelo, infoParalelo,];
var __VLS_45;
if (__VLS_ctx.paraleloSeleccionado) {
    const __VLS_48 = Card || Card;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({}));
    const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
    const { default: __VLS_53 } = __VLS_51.slots;
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
    (__VLS_ctx.infoParalelo?.actividadNombre);
    if (__VLS_ctx.todasConfirmadas) {
        const __VLS_54 = Badge || Badge;
        // @ts-ignore
        const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
            variant: "success",
            size: "lg",
        }));
        const __VLS_56 = __VLS_55({
            variant: "success",
            size: "lg",
        }, ...__VLS_functionalComponentArgsRest(__VLS_55));
        const { default: __VLS_59 } = __VLS_57.slots;
        // @ts-ignore
        [paraleloSeleccionado, infoParalelo, todasConfirmadas,];
        var __VLS_57;
    }
    else {
        const __VLS_60 = Badge || Badge;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
            variant: "warning",
            size: "lg",
        }));
        const __VLS_62 = __VLS_61({
            variant: "warning",
            size: "lg",
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
        const { default: __VLS_65 } = __VLS_63.slots;
        // @ts-ignore
        [];
        var __VLS_63;
    }
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
    else if (__VLS_ctx.calificaciones.length > 0) {
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
        for (const [calificacion, index] of __VLS_vFor((__VLS_ctx.calificaciones))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (calificacion.idCalificacion),
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
            (calificacion.estudiante.nombres);
            (calificacion.estudiante.apellidos);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (calificacion.estudiante.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (calificacion.estudiante.username);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            if (calificacion.notaFinal !== null) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-lg font-bold" },
                    ...{ class: (__VLS_ctx.getNotaColor(calificacion.notaFinal, __VLS_ctx.infoParalelo?.notaMinima || 51)) },
                });
                /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                (calificacion.notaFinal);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-gray-400 text-sm" },
                });
                /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            if (calificacion.estado) {
                const __VLS_66 = Badge || Badge;
                // @ts-ignore
                const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
                    variant: (calificacion.estado === 'APROBADO' ? 'success' : 'danger'),
                }));
                const __VLS_68 = __VLS_67({
                    variant: (calificacion.estado === 'APROBADO' ? 'success' : 'danger'),
                }, ...__VLS_functionalComponentArgsRest(__VLS_67));
                const { default: __VLS_71 } = __VLS_69.slots;
                (calificacion.estado);
                // @ts-ignore
                [infoParalelo, loading, calificaciones, calificaciones, getNotaColor,];
                var __VLS_69;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-gray-400 text-sm" },
                });
                /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
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
            const __VLS_72 = Button || Button;
            // @ts-ignore
            const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }));
            const __VLS_74 = __VLS_73({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_73));
            let __VLS_77;
            const __VLS_78 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.paraleloSeleccionado))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.calificaciones.length > 0))
                            return;
                        __VLS_ctx.editarCalificacion(calificacion);
                        // @ts-ignore
                        [editarCalificacion,];
                    } });
            const { default: __VLS_79 } = __VLS_75.slots;
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
            var __VLS_75;
            var __VLS_76;
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
                        if (!(__VLS_ctx.paraleloSeleccionado))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.calificaciones.length > 0))
                            return;
                        __VLS_ctx.verDetalle(calificacion);
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
            d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_51;
}
else {
    const __VLS_88 = Card || Card;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
        ...{ class: "text-center py-12" },
    }));
    const __VLS_90 = __VLS_89({
        ...{ class: "text-center py-12" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    const { default: __VLS_93 } = __VLS_91.slots;
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
    var __VLS_91;
}
const __VLS_94 = Modal || Modal;
// @ts-ignore
const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditModal),
    title: "Corrección de Calificación (Admin)",
    size: "lg",
}));
const __VLS_96 = __VLS_95({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditModal),
    title: "Corrección de Calificación (Admin)",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_95));
let __VLS_99;
const __VLS_100 = ({ close: {} },
    { onClose: (__VLS_ctx.closeEditModal) });
const { default: __VLS_101 } = __VLS_97.slots;
if (__VLS_ctx.calificacionSeleccionada) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.guardarCalificacion) },
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
    (__VLS_ctx.calificacionSeleccionada.estudiante.nombres);
    (__VLS_ctx.calificacionSeleccionada.estudiante.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.calificacionSeleccionada.estudiante.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-start space-x-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" },
        fill: "currentColor",
        viewBox: "0 0 20 20",
    });
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'fill-rule': "evenodd",
        d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
        'clip-rule': "evenodd",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-semibold text-blue-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-blue-700 mt-1" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-100 border border-gray-300 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-700 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-bold" },
        ...{ class: (__VLS_ctx.getNotaColor(__VLS_ctx.calificacionSeleccionada.notaFinal, __VLS_ctx.infoParalelo?.notaMinima || 51)) },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    (__VLS_ctx.calificacionSeleccionada.notaFinal !== null ? __VLS_ctx.calificacionSeleccionada.notaFinal : 'Sin nota');
    if (__VLS_ctx.calificacionSeleccionada.estado) {
        const __VLS_102 = Badge || Badge;
        // @ts-ignore
        const __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102({
            variant: (__VLS_ctx.calificacionSeleccionada.estado === 'APROBADO' ? 'success' : 'danger'),
        }));
        const __VLS_104 = __VLS_103({
            variant: (__VLS_ctx.calificacionSeleccionada.estado === 'APROBADO' ? 'success' : 'danger'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_103));
        const { default: __VLS_107 } = __VLS_105.slots;
        (__VLS_ctx.calificacionSeleccionada.estado);
        // @ts-ignore
        [infoParalelo, getNotaColor, showEditModal, closeEditModal, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, guardarCalificacion,];
        var __VLS_105;
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
        min: "0",
        max: "100",
        step: "0.01",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" },
    });
    (__VLS_ctx.formCalificacion.notaFinal);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500 mt-1" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    (__VLS_ctx.infoParalelo?.notaMinima);
    if (__VLS_ctx.formCalificacion.notaFinal !== null) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bg-green-50 border border-green-200 rounded-lg p-4" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-green-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-green-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-green-800 mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-green-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center justify-between" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-2xl font-bold" },
            ...{ class: (__VLS_ctx.getNotaColor(__VLS_ctx.formCalificacion.notaFinal, __VLS_ctx.infoParalelo?.notaMinima || 51)) },
        });
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        (__VLS_ctx.formCalificacion.notaFinal);
        const __VLS_108 = Badge || Badge;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108({
            variant: (__VLS_ctx.formCalificacion.notaFinal >= (__VLS_ctx.infoParalelo?.notaMinima || 51) ? 'success' : 'danger'),
        }));
        const __VLS_110 = __VLS_109({
            variant: (__VLS_ctx.formCalificacion.notaFinal >= (__VLS_ctx.infoParalelo?.notaMinima || 51) ? 'success' : 'danger'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        const { default: __VLS_113 } = __VLS_111.slots;
        (__VLS_ctx.formCalificacion.notaFinal >= (__VLS_ctx.infoParalelo?.notaMinima || 51) ? 'APROBADO' : 'REPROBADO');
        // @ts-ignore
        [infoParalelo, infoParalelo, infoParalelo, infoParalelo, getNotaColor, formCalificacion, formCalificacion, formCalificacion, formCalificacion, formCalificacion, formCalificacion,];
        var __VLS_111;
    }
    if (__VLS_ctx.cambiaEstadoCalificacion) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: ([
                    'border rounded-lg p-4',
                    __VLS_ctx.certificadoAccion === 'ANULAR' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                ]) },
        });
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-semibold" },
            ...{ class: (__VLS_ctx.certificadoAccion === 'ANULAR' ? 'text-red-800' : 'text-yellow-800') },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.certificadoAccion === 'ANULAR'
            ? '⚠️ Se anulará el certificado si existe'
            : '✅ Se generará el certificado si el lote ya fue emitido; si no, quedará pendiente');
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        ...{ onInput: (...[$event]) => {
                if (!(__VLS_ctx.calificacionSeleccionada))
                    return;
                __VLS_ctx.errorMotivo = '';
                // @ts-ignore
                [cambiaEstadoCalificacion, certificadoAccion, certificadoAccion, certificadoAccion, errorMotivo,];
            } },
        value: (__VLS_ctx.formCalificacion.motivo),
        rows: "3",
        required: true,
        placeholder: "Explica el motivo de la corrección...",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    if (__VLS_ctx.errorMotivo) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-red-600 mt-1" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        (__VLS_ctx.errorMotivo);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_114 = Button || Button;
    // @ts-ignore
    const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }));
    const __VLS_116 = __VLS_115({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_115));
    let __VLS_119;
    const __VLS_120 = ({ click: {} },
        { onClick: (__VLS_ctx.closeEditModal) });
    const { default: __VLS_121 } = __VLS_117.slots;
    // @ts-ignore
    [closeEditModal, formCalificacion, errorMotivo, errorMotivo,];
    var __VLS_117;
    var __VLS_118;
    const __VLS_122 = Button || Button;
    // @ts-ignore
    const __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
        type: "submit",
        disabled: (__VLS_ctx.saving),
    }));
    const __VLS_124 = __VLS_123({
        type: "submit",
        disabled: (__VLS_ctx.saving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_123));
    const { default: __VLS_127 } = __VLS_125.slots;
    (__VLS_ctx.saving ? 'Guardando...' : 'Guardar Corrección');
    // @ts-ignore
    [saving, saving,];
    var __VLS_125;
}
// @ts-ignore
[];
var __VLS_97;
var __VLS_98;
const __VLS_128 = Modal || Modal;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDetalleModal),
    title: "Detalle de Calificación",
}));
const __VLS_130 = __VLS_129({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDetalleModal),
    title: "Detalle de Calificación",
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
let __VLS_133;
const __VLS_134 = ({ close: {} },
    { onClose: (__VLS_ctx.closeDetalleModal) });
const { default: __VLS_135 } = __VLS_131.slots;
if (__VLS_ctx.calificacionSeleccionada) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
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
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.calificacionSeleccionada.estudiante.nombres);
    (__VLS_ctx.calificacionSeleccionada.estudiante.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    (__VLS_ctx.calificacionSeleccionada.estudiante.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 rounded-lg p-4 space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-2xl font-bold" },
        ...{ class: (__VLS_ctx.getNotaColor(__VLS_ctx.calificacionSeleccionada.notaFinal, __VLS_ctx.infoParalelo?.notaMinima || 51)) },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    (__VLS_ctx.calificacionSeleccionada.notaFinal ?? '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    if (__VLS_ctx.calificacionSeleccionada.estado) {
        const __VLS_136 = Badge || Badge;
        // @ts-ignore
        const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
            variant: (__VLS_ctx.calificacionSeleccionada.estado === 'APROBADO' ? 'success' : 'danger'),
        }));
        const __VLS_138 = __VLS_137({
            variant: (__VLS_ctx.calificacionSeleccionada.estado === 'APROBADO' ? 'success' : 'danger'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_137));
        const { default: __VLS_141 } = __VLS_139.slots;
        (__VLS_ctx.calificacionSeleccionada.estado);
        // @ts-ignore
        [infoParalelo, getNotaColor, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, calificacionSeleccionada, showDetalleModal, closeDetalleModal,];
        var __VLS_139;
    }
    const __VLS_142 = Button || Button;
    // @ts-ignore
    const __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({
        ...{ 'onClick': {} },
        variant: "outline",
        ...{ class: "w-full" },
    }));
    const __VLS_144 = __VLS_143({
        ...{ 'onClick': {} },
        variant: "outline",
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_143));
    let __VLS_147;
    const __VLS_148 = ({ click: {} },
        { onClick: (__VLS_ctx.closeDetalleModal) });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    const { default: __VLS_149 } = __VLS_145.slots;
    // @ts-ignore
    [closeDetalleModal,];
    var __VLS_145;
    var __VLS_146;
}
// @ts-ignore
[];
var __VLS_131;
var __VLS_132;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Calificaciones.vue.js.map