import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, formatDateRange as formatDateRangeUtil } from '@/utils/dateFormatter';
import { useAuthStore } from '@/stores/auth.store';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const actividad = ref(null);
const paralelos = ref([]);
const selectedParalelo = ref('');
const loading = ref(true);
const errorMessage = ref('');
const formError = ref('');
const isSubmitting = ref(false);
const isPaying = ref(false);
const step = ref('detalle');
const inscripcionId = ref(null);
const inscripcionConfirmada = ref(false);
const inscripcionPendiente = ref(false);
const costoPago = computed(() => actividad.value?.costo_externo ?? 0);
const isInterno = computed(() => authStore.user?.tipoParticipante === 'UMSA');
const isExterno = computed(() => !authStore.user?.tipoParticipante || authStore.user?.tipoParticipante === 'EXTERNO');
const botonInscripcionLabel = computed(() => {
    if (inscripcionConfirmada.value)
        return 'Ya inscrito';
    if (inscripcionPendiente.value)
        return costoPago.value > 0 ? 'Continuar con el pago' : 'Inscripcion pendiente';
    if (actividad.value?.tipo === 'CURSO' && paralelos.value.length > 0 && !selectedParalelo.value) {
        return 'Selecciona un paralelo';
    }
    return costoPago.value > 0 ? 'Ir a pago' : 'Confirmar inscripcion';
});
const formatDateRange = (inicio, fin) => {
    if (!inicio)
        return '-';
    return formatDateRangeUtil(inicio, fin, 'es-BO');
};
const formatDateOnly = (inicio) => {
    if (!inicio)
        return '-';
    return formatDateUtil(inicio, 'es-BO');
};
const formatEventDateTime = (datetime) => {
    if (!datetime)
        return '-';
    return formatDateTimeUtil(datetime, 'es-BO');
};
const formatDurationUnit = (unidad) => {
    switch (unidad) {
        case 'días':
            return 'días';
        case 'semanas':
            return 'semanas';
        case 'meses':
            return 'meses';
        default:
            return 'horas';
    }
};
const hasDurationInfo = computed(() => {
    return actividad.value?.duracion != null && Boolean(actividad.value?.unidad);
});
const cargarDetalle = async () => {
    loading.value = true;
    errorMessage.value = '';
    const id = Number(route.params.id);
    const tipoQuery = String(route.query.tipo || '').toUpperCase();
    try {
        if (tipoQuery === 'EVENTO') {
            const response = await api.get(`/eventos/${id}`);
            mapEvento(response);
        }
        else if (tipoQuery === 'CURSO') {
            const response = await api.get(`/cursos/${id}`);
            mapCurso(response);
        }
        else {
            const curso = await api.get(`/cursos/${id}`);
            mapCurso(curso);
        }
    }
    catch (error) {
        errorMessage.value = 'No se pudo cargar el detalle de la actividad.';
    }
    finally {
        loading.value = false;
    }
};
const mapCurso = (curso) => {
    const paralelosList = Array.isArray(curso.paralelos) ? curso.paralelos : [];
    const cupoMaximo = paralelosList.reduce((sum, p) => sum + Number(p.cupoMaximo ?? 0), 0);
    const inscritos = paralelosList.reduce((sum, p) => sum + Number(p.inscritos ?? 0), 0);
    actividad.value = {
        id: Number(curso.idCurso),
        tipo: 'CURSO',
        nombre: String(curso.nombre ?? ''),
        descripcion: String(curso.descripcion ?? ''),
        carga_horaria: Number(curso.cargaHoraria ?? 0),
        duracion: curso.duracion !== undefined && curso.duracion !== null ? Number(curso.duracion) : null,
        unidad: curso.unidad ? String(curso.unidad) : null,
        modalidad: String(curso.modalidad ?? 'PRESENCIAL'),
        fecha_inicio: String(curso.fechaInicio ?? ''),
        fecha_fin: String(curso.fechaInicio ?? ''),
        cupo_maximo: cupoMaximo,
        cupos_disponibles: Math.max(0, cupoMaximo - inscritos),
        costo_externo: Number(curso.costoExterno ?? 0),
        costo_umsa: Number(curso.costoUmsa ?? 0),
        estado: String(curso.estado ?? 'ABIERTO'),
        lugar: paralelosList.length > 0 ? String(paralelosList[0].lugar ?? '') || null : null,
        link: paralelosList.length > 0 ? String(paralelosList[0].link ?? '') || null : null
    };
    paralelos.value = paralelosList.map((paralelo) => ({
        codigo: String(paralelo.codigo ?? ''),
        modalidad: String(paralelo.modalidad ?? ''),
        cupoMaximo: Number(paralelo.cupoMaximo ?? 0),
        cuposDisponibles: paralelo.cuposDisponibles !== undefined && paralelo.cuposDisponibles !== null
            ? Number(paralelo.cuposDisponibles)
            : null,
        nombreDocente: paralelo.nombreDocente ? String(paralelo.nombreDocente) : null,
        tituloDocente: paralelo.tituloDocente ? String(paralelo.tituloDocente) : null,
        horarioDescripcion: paralelo.horarioDescripcion ? String(paralelo.horarioDescripcion) : null,
        lugar: paralelo.lugar ? String(paralelo.lugar) : null,
        link: paralelo.link ? String(paralelo.link) : null
    }));
    if (paralelos.value.length === 1) {
        selectedParalelo.value = paralelos.value[0].codigo;
    }
    verificarInscripcion();
};
const mapEvento = (evento) => {
    actividad.value = {
        id: Number(evento.idEvento),
        tipo: 'EVENTO',
        nombre: String(evento.nombre ?? ''),
        descripcion: String(evento.descripcion ?? ''),
        carga_horaria: Number(evento.cargaHoraria ?? 0),
        duracion: evento.duracion !== undefined && evento.duracion !== null ? Number(evento.duracion) : null,
        unidad: evento.unidad ? String(evento.unidad) : null,
        modalidad: String(evento.modalidad ?? 'PRESENCIAL'),
        fecha_inicio: String(evento.fechaHora ?? ''),
        fecha_fin: String(evento.fechaHora ?? ''),
        cupo_maximo: Number(evento.cupoMaximo ?? 0),
        cupos_disponibles: Number(evento.cuposDisponibles ?? 0),
        costo_externo: Number(evento.costoExterno ?? 0),
        costo_umsa: Number(evento.costoUmsa ?? 0),
        estado: String(evento.estado ?? 'ABIERTO'),
        lugar: String(evento.lugar ?? '') || null,
        link: String(evento.link ?? evento.url ?? '') || null
    };
    paralelos.value = [];
    verificarInscripcion();
};
const asegurarParticipante = () => {
    if (!authStore.isAuthenticated) {
        router.push({ name: 'login', query: { redirect: route.fullPath } });
        return false;
    }
    if (authStore.currentRole !== 'PARTICIPANTE') {
        const success = authStore.changeRole('PARTICIPANTE');
        if (!success) {
            formError.value = 'No se pudo cambiar al rol participante.';
            return false;
        }
    }
    return true;
};
const crearInscripcion = async () => {
    if (!actividad.value)
        return null;
    const payload = actividad.value.tipo === 'CURSO'
        ? { idCurso: actividad.value.id, codigoParalelo: selectedParalelo.value }
        : { idEvento: actividad.value.id };
    const response = await api.post('/inscripciones', payload);
    return Number(response.idInscripcion ?? 0);
};
const abrirVentanaPago = () => {
    if (!inscripcionId.value || !actividad.value)
        return;
    // Iniciar el pago en backend para crear un registro PENDIENTE
    api.post('/inscripciones/pago', { idInscripcion: inscripcionId.value }).catch(() => {
        // Si falla, no bloqueamos la apertura del popup — el usuario puede reintentar.
    });
    const url = router.resolve({
        name: 'payment-simulacion',
        params: { idInscripcion: inscripcionId.value },
        query: { monto: costoPago.value, actividad: actividad.value.nombre }
    }).href;
    const popup = window.open(url, '_blank', 'width=520,height=720');
    if (!popup) {
        router.push(url);
    }
};
const sincronizarInscripcion = (match) => {
    inscripcionId.value = Number(match.idInscripcion ?? inscripcionId.value);
    const estado = String(match.estado ?? '').toUpperCase();
    const estadoPago = String(match.estadoPago ?? '').toUpperCase();
    if (estado === 'CONFIRMADA' || estadoPago === 'APROBADO') {
        inscripcionConfirmada.value = true;
        inscripcionPendiente.value = false;
        step.value = 'detalle';
        return;
    }
    if (estado === 'PENDIENTE') {
        inscripcionConfirmada.value = false;
        inscripcionPendiente.value = true;
        if (costoPago.value > 0) {
            step.value = 'pago';
        }
        return;
    }
    inscripcionConfirmada.value = false;
    inscripcionPendiente.value = false;
};
const verificarInscripcion = async () => {
    if (!authStore.isAuthenticated)
        return;
    if (authStore.currentRole !== 'PARTICIPANTE')
        return;
    if (!actividad.value)
        return;
    try {
        const response = await api.get('/inscripciones/mis-inscripciones');
        const match = response.find((item) => {
            const idCurso = Number(item.idCurso ?? 0);
            const idEvento = Number(item.idEvento ?? 0);
            const estado = String(item.estado ?? '').toUpperCase();
            if (estado === 'CANCELADA')
                return false;
            if (actividad.value?.tipo === 'CURSO') {
                return idCurso === actividad.value?.id;
            }
            return idEvento === actividad.value?.id;
        });
        if (match) {
            sincronizarInscripcion(match);
        }
    }
    catch {
        // Silencioso: no bloquea el detalle si falla la verificacion.
    }
};
const continuarInscripcion = async () => {
    if (!actividad.value)
        return;
    formError.value = '';
    if (inscripcionConfirmada.value)
        return;
    if (actividad.value.tipo === 'CURSO' && paralelos.value.length > 0 && !selectedParalelo.value) {
        formError.value = 'Selecciona un paralelo antes de continuar.';
        return;
    }
    if (!asegurarParticipante())
        return;
    if (inscripcionPendiente.value && inscripcionId.value && costoPago.value > 0) {
        step.value = 'pago';
        abrirVentanaPago();
        return;
    }
    isSubmitting.value = true;
    try {
        const nuevaInscripcionId = await crearInscripcion();
        if (!nuevaInscripcionId) {
            throw new Error('No se pudo crear la inscripcion');
        }
        inscripcionId.value = nuevaInscripcionId;
        if (costoPago.value > 0) {
            step.value = 'pago';
            abrirVentanaPago();
            return;
        }
        inscripcionConfirmada.value = true;
        inscripcionPendiente.value = false;
        router.push('/participante/inscripciones');
    }
    catch (error) {
        formError.value = error.message || 'No se pudo completar la inscripcion.';
    }
    finally {
        isSubmitting.value = false;
    }
};
const handlePaymentMessage = (event) => {
    if (event.origin !== window.location.origin)
        return;
    const data = event.data;
    if (!data || data.type !== 'payment:confirmed')
        return;
    if (!inscripcionId.value || Number(data.idInscripcion ?? 0) !== inscripcionId.value)
        return;
    sincronizarInscripcion({
        idInscripcion: inscripcionId.value,
        estado: 'CONFIRMADA',
        estadoPago: data.estadoPago ?? 'APROBADO'
    });
};
const handleFocus = () => {
    verificarInscripcion();
};
onMounted(() => {
    cargarDetalle();
    window.addEventListener('message', handlePaymentMessage);
    window.addEventListener('focus', handleFocus);
});
onUnmounted(() => {
    window.removeEventListener('message', handlePaymentMessage);
    window.removeEventListener('focus', handleFocus);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-h-screen bg-gray-50" },
});
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "container mx-auto px-4 py-8" },
});
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
}
else if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    (__VLS_ctx.errorMessage);
}
else if (__VLS_ctx.actividad) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "lg:col-span-2 space-y-6" },
    });
    /** @type {__VLS_StyleScopedClasses['lg:col-span-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    const __VLS_0 = Card || Card;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_6 = Badge || Badge;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        variant: (__VLS_ctx.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
        size: "sm",
    }));
    const __VLS_8 = __VLS_7({
        variant: (__VLS_ctx.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
    (__VLS_ctx.actividad.tipo);
    // @ts-ignore
    [loading, errorMessage, errorMessage, actividad, actividad, actividad,];
    var __VLS_9;
    const __VLS_12 = Badge || Badge;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        variant: (__VLS_ctx.actividad.estado === 'ABIERTO' ? 'success' : 'warning'),
        size: "sm",
    }));
    const __VLS_14 = __VLS_13({
        variant: (__VLS_ctx.actividad.estado === 'ABIERTO' ? 'success' : 'warning'),
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const { default: __VLS_17 } = __VLS_15.slots;
    (__VLS_ctx.actividad.estado);
    // @ts-ignore
    [actividad, actividad,];
    var __VLS_15;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-2xl font-bold text-gray-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
    (__VLS_ctx.actividad.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600 whitespace-pre-line" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
    (__VLS_ctx.actividad.descripcion || 'Sin descripcion.');
    // @ts-ignore
    [actividad, actividad,];
    var __VLS_3;
    if (__VLS_ctx.actividad.tipo === 'EVENTO') {
        const __VLS_18 = Card || Card;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
        const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
        const { default: __VLS_23 } = __VLS_21.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.actividad.modalidad);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.formatEventDateTime(__VLS_ctx.actividad.fecha_inicio));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.actividad.carga_horaria);
        if (__VLS_ctx.hasDurationInfo) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs uppercase text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_ctx.actividad.duracion);
            (__VLS_ctx.formatDurationUnit(__VLS_ctx.actividad.unidad));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.actividad.tipo);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.actividad.cupos_disponibles);
        (__VLS_ctx.actividad.cupo_maximo);
        if (__VLS_ctx.actividad.lugar) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs uppercase text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_ctx.actividad.lugar);
        }
        if (__VLS_ctx.actividad.link) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs uppercase text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                href: (__VLS_ctx.actividad.link),
                target: "_blank",
                rel: "noreferrer",
                ...{ class: "font-semibold text-emerald-700 hover:text-emerald-800" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-emerald-800']} */ ;
        }
        // @ts-ignore
        [actividad, actividad, actividad, actividad, actividad, actividad, actividad, actividad, actividad, actividad, actividad, actividad, actividad, formatEventDateTime, hasDurationInfo, formatDurationUnit,];
        var __VLS_21;
    }
    if (__VLS_ctx.actividad.tipo === 'CURSO') {
        const __VLS_24 = Card || Card;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
        const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
        const { default: __VLS_29 } = __VLS_27.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        if (__VLS_ctx.paralelos.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-sm text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-3" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            for (const [paralelo] of __VLS_vFor((__VLS_ctx.paralelos))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    key: (paralelo.codigo),
                    ...{ class: "flex items-start gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-gray-300" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:border-gray-300']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "radio",
                    name: "paralelo",
                    ...{ class: "mt-1" },
                    value: (paralelo.codigo),
                });
                (__VLS_ctx.selectedParalelo);
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex-1" },
                });
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex flex-wrap items-center gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-sm font-semibold text-gray-800" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
                (paralelo.codigo);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-gray-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                (paralelo.modalidad);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-gray-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                (paralelo.nombreDocente || 'Sin asignar');
                if (paralelo.tituloDocente) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (paralelo.tituloDocente);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-gray-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                (paralelo.cuposDisponibles ?? paralelo.cupoMaximo);
                (paralelo.cupoMaximo);
                if (paralelo.horarioDescripcion) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "text-xs text-gray-500" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                    (paralelo.horarioDescripcion);
                }
                if (paralelo.lugar) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "text-xs text-gray-500" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                    (paralelo.lugar);
                }
                if (paralelo.link) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "text-xs text-emerald-700" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
                }
                if (paralelo.link) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                        href: (paralelo.link),
                        target: "_blank",
                        rel: "noreferrer",
                        ...{ class: "mt-1 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:text-emerald-800']} */ ;
                }
                // @ts-ignore
                [actividad, paralelos, paralelos, selectedParalelo,];
            }
        }
        // @ts-ignore
        [];
        var __VLS_27;
    }
    if (__VLS_ctx.step === 'pago') {
        const __VLS_30 = Card || Card;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
        const __VLS_32 = __VLS_31({}, ...__VLS_functionalComponentArgsRest(__VLS_31));
        const { default: __VLS_35 } = __VLS_33.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        const __VLS_36 = Button || Button;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
            ...{ 'onClick': {} },
            variant: "primary",
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onClick': {} },
            variant: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_41;
        const __VLS_42 = ({ click: {} },
            { onClick: (__VLS_ctx.abrirVentanaPago) });
        const { default: __VLS_43 } = __VLS_39.slots;
        // @ts-ignore
        [step, abrirVentanaPago,];
        var __VLS_39;
        var __VLS_40;
        // @ts-ignore
        [];
        var __VLS_33;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-6" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    if (__VLS_ctx.actividad.tipo === 'CURSO') {
        const __VLS_44 = Card || Card;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({}));
        const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
        const { default: __VLS_49 } = __VLS_47.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.actividad.modalidad);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.formatDateOnly(__VLS_ctx.actividad.fecha_inicio));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.actividad.carga_horaria);
        if (__VLS_ctx.hasDurationInfo) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs uppercase text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_ctx.actividad.duracion);
            (__VLS_ctx.formatDurationUnit(__VLS_ctx.actividad.unidad));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs uppercase text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.actividad.cupos_disponibles);
        (__VLS_ctx.actividad.cupo_maximo);
        // @ts-ignore
        [actividad, actividad, actividad, actividad, actividad, actividad, actividad, actividad, hasDurationInfo, formatDurationUnit, formatDateOnly,];
        var __VLS_47;
    }
    const __VLS_50 = Card || Card;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({}));
    const __VLS_52 = __VLS_51({}, ...__VLS_functionalComponentArgsRest(__VLS_51));
    const { default: __VLS_55 } = __VLS_53.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-lg font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border px-3 py-2" },
        ...{ class: (__VLS_ctx.isExterno ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50') },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase" },
        ...{ class: (__VLS_ctx.isExterno ? 'text-emerald-600' : 'text-slate-500') },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: (__VLS_ctx.isExterno ? 'text-xl font-bold text-emerald-700' : 'text-lg font-semibold text-slate-700') },
    });
    (__VLS_ctx.actividad.costo_externo);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border px-3 py-2" },
        ...{ class: (__VLS_ctx.isInterno ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50') },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase" },
        ...{ class: (__VLS_ctx.isInterno ? 'text-emerald-600' : 'text-slate-500') },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: (__VLS_ctx.isInterno ? 'text-xl font-bold text-emerald-700' : 'text-lg font-semibold text-slate-700') },
    });
    (__VLS_ctx.actividad.costo_umsa);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.actividad.estado);
    // @ts-ignore
    [actividad, actividad, actividad, isExterno, isExterno, isExterno, isInterno, isInterno, isInterno,];
    var __VLS_53;
    const __VLS_56 = Card || Card;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({}));
    const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
    const { default: __VLS_61 } = __VLS_59.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-lg font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_62 = Button || Button;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.isSubmitting),
        disabled: (__VLS_ctx.actividad.estado !== 'ABIERTO' || __VLS_ctx.inscripcionConfirmada),
        variant: "primary",
        ...{ class: "w-full" },
    }));
    const __VLS_64 = __VLS_63({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.isSubmitting),
        disabled: (__VLS_ctx.actividad.estado !== 'ABIERTO' || __VLS_ctx.inscripcionConfirmada),
        variant: "primary",
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    let __VLS_67;
    const __VLS_68 = ({ click: {} },
        { onClick: (__VLS_ctx.continuarInscripcion) });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    const { default: __VLS_69 } = __VLS_65.slots;
    (__VLS_ctx.actividad.estado !== 'ABIERTO' ? 'Sin cupos' : __VLS_ctx.botonInscripcionLabel);
    // @ts-ignore
    [actividad, actividad, isSubmitting, inscripcionConfirmada, continuarInscripcion, botonInscripcionLabel,];
    var __VLS_65;
    var __VLS_66;
    if (__VLS_ctx.formError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-red-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
        (__VLS_ctx.formError);
    }
    // @ts-ignore
    [formError, formError,];
    var __VLS_59;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=ActivityDetail.vue.js.map