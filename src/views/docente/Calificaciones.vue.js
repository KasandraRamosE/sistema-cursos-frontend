import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/utils/api';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
const authStore = useAuthStore();
const route = useRoute();
const cursosDocente = ref([]);
const selectedCursoId = ref(null);
const selectedParaleloCodigo = ref('');
const estudiantes = ref([]);
const loading = ref(false);
const saving = ref(false);
const paraleloConfirmado = ref(false);
const showConfirmModal = ref(false);
const confirmando = ref(false);
const notasConfirmacion = ref('');
const confirmacionExitosa = ref(false);
const normalizeName = (value) => {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
};
const cursoSeleccionado = computed(() => {
    return cursosDocente.value.find(curso => curso.idCurso === selectedCursoId.value) || null;
});
const paralelosDelCurso = computed(() => {
    return cursoSeleccionado.value?.paralelos || [];
});
const stats = computed(() => {
    const inscritos = estudiantes.value.length;
    const aprobados = estudiantes.value.filter(est => {
        const nota = est.notaEditada ?? est.notaFinal;
        return nota !== null && nota >= (cursoSeleccionado.value?.notaAprobacion ?? 51);
    }).length;
    const reprobados = estudiantes.value.filter(est => {
        const nota = est.notaEditada ?? est.notaFinal;
        return nota !== null && nota < (cursoSeleccionado.value?.notaAprobacion ?? 51);
    }).length;
    const pendientes = estudiantes.value.filter(est => (est.notaEditada ?? est.notaFinal) === null).length;
    return { inscritos, aprobados, reprobados, pendientes };
});
const cambiosPendientes = computed(() => {
    return estudiantes.value.filter(est => est.notaEditada !== est.notaFinal);
});
const puedeConfirmar = computed(() => {
    if (!selectedCursoId.value || !selectedParaleloCodigo.value)
        return false;
    if (stats.value.pendientes > 0)
        return false;
    if (cambiosPendientes.value.length > 0)
        return false;
    if (paraleloConfirmado.value)
        return false;
    return true;
});
const esAdmin = computed(() => {
    try {
        return authStore.hasRole('ADMINISTRADOR');
    }
    catch (e) {
        return false;
    }
});
const loadCursos = async () => {
    try {
        const docenteNombre = normalizeName(authStore.fullName || '');
        if (!docenteNombre) {
            cursosDocente.value = [];
            return;
        }
        const cursos = await api.get('/cursos');
        const cursosFiltrados = [];
        cursos.forEach(curso => {
            const paralelosCurso = Array.isArray(curso.paralelos)
                ? curso.paralelos
                : [];
            const paralelosDocente = paralelosCurso
                .filter(paralelo => normalizeName(String(paralelo.nombreDocente ?? '')) === docenteNombre)
                .map(paralelo => ({
                codigo: String(paralelo.codigo ?? ''),
                modalidad: String(paralelo.modalidad ?? 'PRESENCIAL'),
                inscritos: Number(paralelo.inscritos ?? 0),
                horarioDescripcion: String(paralelo.horarioDescripcion ?? '')
            }));
            if (paralelosDocente.length === 0)
                return;
            cursosFiltrados.push({
                idCurso: Number(curso.idCurso ?? 0),
                nombre: String(curso.nombre ?? ''),
                nombreCarrera: String(curso.nombreCarrera ?? ''),
                notaAprobacion: Number(curso.notaAprobacion ?? 51),
                paralelos: paralelosDocente
            });
        });
        cursosDocente.value = cursosFiltrados;
    }
    catch (error) {
        console.error('Error al cargar cursos:', error);
    }
};
const loadEstudiantes = async () => {
    if (!selectedCursoId.value || !selectedParaleloCodigo.value)
        return;
    loading.value = true;
    confirmacionExitosa.value = false;
    // Reiniciar bandera de confirmado al recargar paralelo
    paraleloConfirmado.value = false;
    try {
        // Consultar estado de confirmacion del paralelo (nuevo endpoint)
        try {
            const estadoResp = await api.get(`/evaluaciones/paralelo/${selectedCursoId.value}/${selectedParaleloCodigo.value}/estado`);
            const confirmado = (estadoResp && estadoResp.confirmado) || (estadoResp && estadoResp.confirmado === false ? false : null);
            if (typeof confirmado === 'boolean') {
                paraleloConfirmado.value = confirmado;
            }
        }
        catch (errEstado) {
            // Silencioso: si el endpoint no existe o falla, se mantiene la lógica existente
            console.warn('No se pudo obtener estado de paralelo:', errEstado);
        }
        const [inscripcionesResponse, evaluacionesResponse] = await Promise.all([
            api.get(`/inscripciones/curso/${selectedCursoId.value}`),
            api.get(`/evaluaciones/paralelo/${selectedCursoId.value}/${selectedParaleloCodigo.value}`)
        ]);
        const inscripciones = inscripcionesResponse;
        const evaluaciones = evaluacionesResponse;
        // Algunos endpoints pueden devolver metadatos sobre el paralelo (ej: confirmado)
        const maybeMeta = (!Array.isArray(inscripcionesResponse) && inscripcionesResponse && typeof inscripcionesResponse === 'object')
            ? inscripcionesResponse
            : ((!Array.isArray(evaluacionesResponse) && evaluacionesResponse && typeof evaluacionesResponse === 'object')
                ? evaluacionesResponse
                : null);
        if (maybeMeta) {
            const confirmadoFlag = maybeMeta.confirmado ?? maybeMeta.paraleloConfirmado ?? maybeMeta.confirmadoParalelo;
            if (typeof confirmadoFlag === 'boolean') {
                paraleloConfirmado.value = confirmadoFlag;
            }
        }
        const evaluacionesMap = new Map();
        evaluaciones.forEach(item => {
            const idInscripcion = Number(item.idInscripcion);
            const notaFinal = item.notaFinal !== undefined && item.notaFinal !== null
                ? Number(item.notaFinal)
                : null;
            if (idInscripcion) {
                evaluacionesMap.set(idInscripcion, notaFinal ?? null);
            }
        });
        estudiantes.value = inscripciones
            .filter(item => String(item.codigoParalelo ?? '') === selectedParaleloCodigo.value)
            .filter(item => String(item.estado ?? '') === 'CONFIRMADA')
            .map(item => {
            const idInscripcion = Number(item.idInscripcion);
            const notaFinal = evaluacionesMap.has(idInscripcion)
                ? evaluacionesMap.get(idInscripcion) ?? null
                : null;
            return {
                idInscripcion,
                nombre: String(item.nombreParticipante ?? ''),
                email: String(item.emailParticipante ?? '-'),
                username: String(item.usernameParticipante ?? ''),
                notaFinal,
                notaEditada: notaFinal
            };
        });
    }
    catch (error) {
        console.error('Error al cargar estudiantes:', error);
    }
    finally {
        loading.value = false;
    }
};
const guardarNotas = async () => {
    if (cambiosPendientes.value.length === 0)
        return;
    if (paraleloConfirmado.value && !esAdmin.value) {
        // Evitar guardar si el paralelo ya fue confirmado y el usuario no es admin
        console.warn('Intento de guardar notas en paralelo confirmado por usuario no administrador');
        return;
    }
    saving.value = true;
    try {
        const payload = cambiosPendientes.value
            .filter(est => est.notaEditada !== null)
            .map(est => ({
            idInscripcion: est.idInscripcion,
            notaFinal: est.notaEditada
        }));
        if (payload.length === 0) {
            saving.value = false;
            return;
        }
        await api.post('/evaluaciones/lote', payload);
        estudiantes.value = estudiantes.value.map(est => {
            if (est.notaEditada === est.notaFinal)
                return est;
            return { ...est, notaFinal: est.notaEditada };
        });
    }
    catch (error) {
        console.error('Error al guardar notas:', error);
    }
    finally {
        saving.value = false;
    }
};
const confirmarNotas = async () => {
    if (!selectedCursoId.value || !selectedParaleloCodigo.value)
        return;
    confirmando.value = true;
    try {
        await api.post(`/evaluaciones/confirmar/${selectedCursoId.value}`, {
            codigoParalelo: selectedParaleloCodigo.value,
            notas: notasConfirmacion.value || null
        });
        confirmacionExitosa.value = true;
        showConfirmModal.value = false;
        notasConfirmacion.value = '';
        // Marcar el paralelo como confirmado para evitar ediciones posteriores
        paraleloConfirmado.value = true;
    }
    catch (error) {
        console.error('Error al confirmar notas:', error);
    }
    finally {
        confirmando.value = false;
    }
};
const closeConfirmModal = () => {
    showConfirmModal.value = false;
    notasConfirmacion.value = '';
};
const getEstadoVariant = (estudiante) => {
    const nota = estudiante.notaEditada ?? estudiante.notaFinal;
    if (nota === null)
        return 'warning';
    return nota >= (cursoSeleccionado.value?.notaAprobacion ?? 51) ? 'success' : 'danger';
};
const getEstadoLabel = (estudiante) => {
    const nota = estudiante.notaEditada ?? estudiante.notaFinal;
    if (nota === null)
        return 'Pendiente';
    return nota >= (cursoSeleccionado.value?.notaAprobacion ?? 51) ? 'Aprobado' : 'Reprobado';
};
onMounted(async () => {
    await loadCursos();
    const cursoQuery = Number(route.query.curso);
    const paraleloQuery = String(route.query.paralelo ?? '');
    if (cursoQuery) {
        selectedCursoId.value = cursoQuery;
    }
    if (paraleloQuery) {
        selectedParaleloCodigo.value = paraleloQuery;
    }
});
watch([selectedCursoId, selectedParaleloCodigo], () => {
    if (selectedCursoId.value && selectedParaleloCodigo.value) {
        loadEstudiantes();
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
    value: (__VLS_ctx.selectedCursoId),
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
    value: (null),
});
for (const [curso] of __VLS_vFor((__VLS_ctx.cursosDocente))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (curso.idCurso),
        value: (curso.idCurso),
    });
    (curso.nombre);
    (curso.nombreCarrera);
    // @ts-ignore
    [selectedCursoId, cursosDocente,];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.selectedParaleloCodigo),
    disabled: (!__VLS_ctx.selectedCursoId),
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100" },
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
/** @type {__VLS_StyleScopedClasses['disabled:bg-slate-100']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (''),
});
for (const [paralelo] of __VLS_vFor((__VLS_ctx.paralelosDelCurso))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (paralelo.codigo),
        value: (paralelo.codigo),
    });
    (paralelo.codigo);
    (paralelo.modalidad);
    (paralelo.inscritos);
    // @ts-ignore
    [selectedCursoId, selectedParaleloCodigo, paralelosDelCurso,];
}
// @ts-ignore
[];
var __VLS_3;
if (__VLS_ctx.cursoSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-4 md:grid-cols-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
    const __VLS_6 = Card || Card;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
    const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.stats.inscritos);
    // @ts-ignore
    [cursoSeleccionado, stats,];
    var __VLS_9;
    const __VLS_12 = Card || Card;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
    const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const { default: __VLS_17 } = __VLS_15.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold text-emerald-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    (__VLS_ctx.stats.aprobados);
    // @ts-ignore
    [stats,];
    var __VLS_15;
    const __VLS_18 = Card || Card;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
    const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
    const { default: __VLS_23 } = __VLS_21.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold text-rose-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
    (__VLS_ctx.stats.reprobados);
    // @ts-ignore
    [stats,];
    var __VLS_21;
    const __VLS_24 = Card || Card;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
    const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
    const { default: __VLS_29 } = __VLS_27.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold text-amber-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-amber-600']} */ ;
    (__VLS_ctx.stats.pendientes);
    // @ts-ignore
    [stats,];
    var __VLS_27;
}
if (__VLS_ctx.selectedCursoId && __VLS_ctx.selectedParaleloCodigo) {
    const __VLS_30 = Card || Card;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
    const __VLS_32 = __VLS_31({}, ...__VLS_functionalComponentArgsRest(__VLS_31));
    const { default: __VLS_35 } = __VLS_33.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.cursoSeleccionado?.notaAprobacion ?? 51);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_36 = Button || Button;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        disabled: (__VLS_ctx.cambiosPendientes.length === 0 || (__VLS_ctx.paraleloConfirmado && !__VLS_ctx.esAdmin)),
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        disabled: (__VLS_ctx.cambiosPendientes.length === 0 || (__VLS_ctx.paraleloConfirmado && !__VLS_ctx.esAdmin)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_41;
    const __VLS_42 = ({ click: {} },
        { onClick: (__VLS_ctx.guardarNotas) });
    const { default: __VLS_43 } = __VLS_39.slots;
    // @ts-ignore
    [selectedCursoId, selectedParaleloCodigo, cursoSeleccionado, cambiosPendientes, paraleloConfirmado, esAdmin, guardarNotas,];
    var __VLS_39;
    var __VLS_40;
    const __VLS_44 = Button || Button;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        size: "sm",
        disabled: (!__VLS_ctx.puedeConfirmar),
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        size: "sm",
        disabled: (!__VLS_ctx.puedeConfirmar),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_49;
    const __VLS_50 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedCursoId && __VLS_ctx.selectedParaleloCodigo))
                    return;
                __VLS_ctx.showConfirmModal = true;
                // @ts-ignore
                [puedeConfirmar, showConfirmModal,];
            } });
    const { default: __VLS_51 } = __VLS_47.slots;
    // @ts-ignore
    [];
    var __VLS_47;
    var __VLS_48;
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "py-10 text-center text-sm text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    else if (__VLS_ctx.estudiantes.length === 0) {
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
            ...{ class: "mt-6 overflow-x-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
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
            ...{ class: "px-4 py-3 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "px-4 py-3 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
            ...{ class: "divide-y divide-slate-100" },
        });
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-slate-100']} */ ;
        for (const [estudiante] of __VLS_vFor((__VLS_ctx.estudiantes))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (estudiante.idInscripcion),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-medium text-slate-900" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
            (estudiante.nombre);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            (estudiante.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-slate-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
            (estudiante.username);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                min: "0",
                max: "100",
                step: "0.01",
                disabled: (__VLS_ctx.paraleloConfirmado && !__VLS_ctx.esAdmin),
                ...{ class: "w-24 rounded-lg border border-slate-200 px-2 py-1 text-center focus:border-transparent focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100" },
            });
            (estudiante.notaEditada);
            /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:bg-slate-100']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            const __VLS_52 = Badge || Badge;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
                variant: (__VLS_ctx.getEstadoVariant(estudiante)),
            }));
            const __VLS_54 = __VLS_53({
                variant: (__VLS_ctx.getEstadoVariant(estudiante)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            const { default: __VLS_57 } = __VLS_55.slots;
            (__VLS_ctx.getEstadoLabel(estudiante));
            // @ts-ignore
            [paraleloConfirmado, esAdmin, loading, estudiantes, estudiantes, getEstadoVariant, getEstadoLabel,];
            var __VLS_55;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.cambiosPendientes.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 text-xs text-amber-700" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-700']} */ ;
        (__VLS_ctx.cambiosPendientes.length);
    }
    if (__VLS_ctx.paraleloConfirmado && !__VLS_ctx.esAdmin) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-xs text-rose-600" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
    }
    if (__VLS_ctx.confirmacionExitosa) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-xs text-emerald-600" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    }
    // @ts-ignore
    [cambiosPendientes, cambiosPendientes, paraleloConfirmado, esAdmin, confirmacionExitosa,];
    var __VLS_33;
}
const __VLS_58 = Modal || Modal;
// @ts-ignore
const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showConfirmModal),
    title: "Confirmar notas",
    size: "lg",
}));
const __VLS_60 = __VLS_59({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showConfirmModal),
    title: "Confirmar notas",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_59));
let __VLS_63;
const __VLS_64 = ({ close: {} },
    { onClose: (__VLS_ctx.closeConfirmModal) });
const { default: __VLS_65 } = __VLS_61.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" },
});
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-amber-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-amber-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-amber-800']} */ ;
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
    value: (__VLS_ctx.notasConfirmacion),
    rows: "3",
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
    placeholder: "Notas para coordinacion...",
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
const __VLS_66 = Button || Button;
// @ts-ignore
const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
    ...{ 'onClick': {} },
    variant: "outline",
}));
const __VLS_68 = __VLS_67({
    ...{ 'onClick': {} },
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_67));
let __VLS_71;
const __VLS_72 = ({ click: {} },
    { onClick: (__VLS_ctx.closeConfirmModal) });
const { default: __VLS_73 } = __VLS_69.slots;
// @ts-ignore
[showConfirmModal, closeConfirmModal, closeConfirmModal, notasConfirmacion,];
var __VLS_69;
var __VLS_70;
const __VLS_74 = Button || Button;
// @ts-ignore
const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.confirmando),
}));
const __VLS_76 = __VLS_75({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.confirmando),
}, ...__VLS_functionalComponentArgsRest(__VLS_75));
let __VLS_79;
const __VLS_80 = ({ click: {} },
    { onClick: (__VLS_ctx.confirmarNotas) });
const { default: __VLS_81 } = __VLS_77.slots;
// @ts-ignore
[confirmando, confirmarNotas,];
var __VLS_77;
var __VLS_78;
// @ts-ignore
[];
var __VLS_61;
var __VLS_62;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Calificaciones.vue.js.map