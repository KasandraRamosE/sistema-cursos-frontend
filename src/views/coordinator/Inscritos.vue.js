import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import { useAlertStore } from '@/stores/alert.store';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, parseLocalDate } from '@/utils/dateFormatter';
const route = useRoute();
const alertStore = useAlertStore();
const loadingActivities = ref(false);
const carreras = ref([]);
const cursos = ref([]);
const eventos = ref([]);
const searchTerm = ref('');
const selectedCarreraId = ref('');
const tipoFiltro = ref('');
const estadoFiltro = ref('');
const activities = ref([]);
const selectedActivityKey = ref(null);
const selectedParallelCode = ref('');
const loadingInscritos = ref(false);
const printingReport = ref(false);
const courseEnrolled = ref([]);
const eventEnrolled = ref([]);
const selectedActivity = computed(() => {
    return activities.value.find(activity => activity.key === selectedActivityKey.value) ?? null;
});
const selectedCourseMinGrade = computed(() => selectedActivity.value?.notaMinima ?? 51);
const activitiesFiltered = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    const carreraId = selectedCarreraId.value;
    const tipo = tipoFiltro.value;
    const estado = estadoFiltro.value;
    return activities.value.filter(activity => {
        const matchesCarrera = !carreraId || activity.carreraId === carreraId;
        const matchesTipo = !tipo || activity.tipo === tipo;
        const matchesEstado = !estado || activity.estado === estado;
        const matchesSearch = !term
            || activity.nombre.toLowerCase().includes(term)
            || activity.carreraNombre.toLowerCase().includes(term)
            || activity.tipo.toLowerCase().includes(term)
            || activity.estado.toLowerCase().includes(term)
            || formatDate(activity.fecha).toLowerCase().includes(term);
        return matchesCarrera && matchesTipo && matchesEstado && matchesSearch;
    });
});
const activitiesOrdered = computed(() => {
    return [...activitiesFiltered.value].sort((left, right) => {
        const leftTime = parseDateToTime(left.fecha);
        const rightTime = parseDateToTime(right.fecha);
        if (leftTime !== rightTime) {
            return rightTime - leftTime;
        }
        if (left.tipo !== right.tipo) {
            return left.tipo === 'CURSO' ? -1 : 1;
        }
        return left.nombre.localeCompare(right.nombre, 'es');
    });
});
const cursosFiltrados = computed(() => activitiesFiltered.value.filter(activity => activity.tipo === 'CURSO').length);
const eventosFiltrados = computed(() => activitiesFiltered.value.filter(activity => activity.tipo === 'EVENTO').length);
const formatDate = (value) => {
    if (!value)
        return '-';
    return formatDateUtil(value, 'es-BO');
};
const formatDateTime = (value) => {
    if (!value)
        return '-';
    return formatDateTimeUtil(value, 'es-BO');
};
const parseDateToTime = (value) => {
    const time = parseLocalDate(value).getTime();
    return Number.isNaN(time) ? 0 : time;
};
const formatCupo = (inscritos, cupoMaximo) => {
    const cupo = cupoMaximo > 0 ? cupoMaximo : '-';
    return `${inscritos}/${cupo}`;
};
const cupoRestante = (inscritos, cupoMaximo) => {
    if (!cupoMaximo || cupoMaximo <= 0)
        return 0;
    return Math.max(0, cupoMaximo - inscritos);
};
const getCupoPorcentaje = (inscritos, cupoMaximo) => {
    if (!cupoMaximo || cupoMaximo <= 0)
        return 0;
    return Math.min(100, (inscritos / cupoMaximo) * 100);
};
const estadoActividadVariant = (estado) => {
    if (estado === 'ABIERTO')
        return 'success';
    if (estado === 'LLENO')
        return 'warning';
    if (estado === 'FINALIZADO')
        return 'gray';
    return 'info';
};
const estadoEvaluacionVariant = (estado) => {
    if (estado === 'APROBADO')
        return 'success';
    if (estado === 'REPROBADO')
        return 'danger';
    return 'warning';
};
const getNotaColor = (nota, notaMinima) => {
    if (nota === null)
        return 'text-slate-400';
    return nota >= notaMinima ? 'text-emerald-600' : 'text-rose-600';
};
const splitNombreCompleto = (nombreCompleto) => {
    const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
    if (partes.length <= 1) {
        return {
            nombres: nombreCompleto || '-',
            apellidos: ''
        };
    }
    return {
        nombres: partes.slice(0, -1).join(' '),
        apellidos: partes.slice(-1).join(' ')
    };
};
const normalizeQueryValue = (value) => {
    if (Array.isArray(value))
        return value[0] ?? '';
    return typeof value === 'string' ? value : '';
};
// Helper to pick first available key from possible alternatives
const pick = (obj = {}, ...keys) => {
    for (const k of keys) {
        if (obj === null || obj === undefined)
            continue;
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null)
            return obj[k];
    }
    return undefined;
};
const buildActivities = () => {
    const cursosNormalizados = cursos.value.map(course => {
        const paralelos = Array.isArray(course.paralelos) ? course.paralelos : [];
        const normalizedParallels = paralelos.map((paralelo, index) => {
            const inscritos = Number(paralelo.inscritos ?? 0);
            const cupoMaximo = paralelo.cupoMaximo !== undefined && paralelo.cupoMaximo !== null
                ? Number(paralelo.cupoMaximo)
                : inscritos + Number(paralelo.cuposDisponibles ?? 0);
            return {
                codigo: String(paralelo.codigo ?? `P${index + 1}`),
                inscritos,
                cupoMaximo,
                fechaInicio: paralelo.fechaInicio ? String(paralelo.fechaInicio) : undefined,
                fechaFin: paralelo.fechaFin ? String(paralelo.fechaFin) : undefined
            };
        });
        const inscritos = normalizedParallels.reduce((sum, paralelo) => sum + paralelo.inscritos, 0);
        const cupoMaximo = normalizedParallels.reduce((sum, paralelo) => {
            if (paralelo.cupoMaximo > 0)
                return sum + paralelo.cupoMaximo;
            return sum + paralelo.inscritos;
        }, 0);
        const fecha = course.fechaInicio || normalizedParallels[0]?.fechaInicio || '';
        return {
            key: `curso-${course.idCurso}`,
            tipo: 'CURSO',
            idActividad: Number(course.idCurso),
            nombre: String(course.nombre ?? ''),
            descripcion: course.descripcion ? String(course.descripcion) : '',
            carreraId: Number(course.idCarrera ?? 0),
            carreraNombre: String(course.nombreCarrera ?? ''),
            fecha,
            inscritos,
            cupoMaximo,
            estado: String(course.estado ?? 'ABIERTO'),
            paralelos: normalizedParallels,
            notaMinima: course.notaAprobacion !== undefined ? Number(course.notaAprobacion) : 51
        };
    });
    const eventosNormalizados = eventos.value.map(evento => {
        const inscritos = Number(evento.inscritos ?? 0);
        const cupoMaximo = evento.cupoMaximo !== undefined && evento.cupoMaximo !== null
            ? Number(evento.cupoMaximo)
            : inscritos + Number(evento.cuposDisponibles ?? 0);
        return {
            key: `evento-${evento.idEvento}`,
            tipo: 'EVENTO',
            idActividad: Number(evento.idEvento),
            nombre: String(evento.nombre ?? ''),
            descripcion: evento.descripcion ? String(evento.descripcion) : '',
            carreraId: Number(evento.idCarrera ?? 0),
            carreraNombre: String(evento.nombreCarrera ?? ''),
            fecha: String(evento.fechaInicio ?? evento.fechaHora ?? ''),
            inscritos,
            cupoMaximo,
            estado: String(evento.estado ?? 'ABIERTO'),
            paralelos: [],
            notaMinima: undefined
        };
    });
    activities.value = [...cursosNormalizados, ...eventosNormalizados];
};
const loadCarreras = async () => {
    const response = await api.get('/coordinador/carreras');
    carreras.value = response.map(carrera => ({
        idCarrera: Number(carrera.idCarrera ?? carrera.id ?? 0),
        nombre: String(carrera.nombre ?? '')
    }));
};
const loadCursos = async () => {
    const response = await api.get('/cursos/todos');
    cursos.value = response.map(curso => ({
        idCurso: Number(curso.idCurso ?? 0),
        idCarrera: Number(curso.idCarrera ?? 0),
        nombre: String(curso.nombre ?? ''),
        nombreCarrera: String(curso.nombreCarrera ?? ''),
        descripcion: curso.descripcion ? String(curso.descripcion) : '',
        fechaInicio: curso.fechaInicio ? String(curso.fechaInicio) : '',
        estado: String(curso.estado ?? 'ABIERTO'),
        notaAprobacion: curso.notaAprobacion !== undefined ? Number(curso.notaAprobacion) : undefined,
        paralelos: Array.isArray(curso.paralelos)
            ? curso.paralelos
            : []
    }));
};
const loadEventos = async () => {
    const response = await api.get('/eventos/todos');
    eventos.value = response.map(evento => ({
        idEvento: Number(evento.idEvento ?? 0),
        idCarrera: Number(evento.idCarrera ?? 0),
        nombre: String(evento.nombre ?? ''),
        nombreCarrera: String(evento.nombreCarrera ?? ''),
        descripcion: evento.descripcion ? String(evento.descripcion) : '',
        fechaInicio: evento.fechaInicio ? String(evento.fechaInicio) : '',
        fechaHora: evento.fechaHora ? String(evento.fechaHora) : '',
        inscritos: evento.inscritos !== undefined ? Number(evento.inscritos) : 0,
        cupoMaximo: evento.cupoMaximo !== undefined ? Number(evento.cupoMaximo) : 0,
        cuposDisponibles: evento.cuposDisponibles !== undefined ? Number(evento.cuposDisponibles) : 0,
        estado: String(evento.estado ?? 'ABIERTO')
    }));
};
const clearSelectedActivity = () => {
    selectedActivityKey.value = null;
    selectedParallelCode.value = '';
    courseEnrolled.value = [];
    eventEnrolled.value = [];
};
const buildApiUrl = (path) => {
    const configuredBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const baseUrl = configuredBase.startsWith('http')
        ? configuredBase
        : `http://localhost:8080${configuredBase.startsWith('/') ? '' : '/'}${configuredBase}`;
    if (path.startsWith('http'))
        return path;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
const isPdfResponse = (arrayBuffer) => {
    const signature = new TextDecoder().decode(arrayBuffer.slice(0, 5));
    return signature === '%PDF-';
};
const printSelectedActivityReport = async () => {
    if (!selectedActivity.value) {
        alertStore.push({ type: 'warning', message: 'Selecciona una actividad para imprimir.' });
        return;
    }
    printingReport.value = true;
    try {
        const params = new URLSearchParams({
            tipo: selectedActivity.value.tipo,
            idActividad: String(selectedActivity.value.idActividad)
        });
        const token = localStorage.getItem('token');
        const response = await fetch(buildApiUrl(`/reportes/actividad/inscritos/pdf?${params.toString()}`), {
            method: 'GET',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!response.ok) {
            let message = 'No se pudo generar el reporte.';
            try {
                const data = await response.json();
                if (data?.message)
                    message = String(data.message);
            }
            catch {
                message = response.statusText || message;
            }
            throw new Error(message);
        }
        const contentType = response.headers.get('content-type') || '';
        const arrayBuffer = await response.arrayBuffer();
        if (!contentType.toLowerCase().includes('application/pdf') || !isPdfResponse(arrayBuffer)) {
            const preview = new TextDecoder().decode(arrayBuffer.slice(0, 300)).trim();
            throw new Error(`La respuesta no es un PDF válido. ${contentType ? `Content-Type: ${contentType}.` : ''} `
                + `${preview ? `Respuesta: ${preview}` : 'Verifica tu sesión o la configuración del endpoint.'}`);
        }
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        if (pdfBlob.size === 0)
            throw new Error('El PDF generado está vacío.');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(blobUrl, '_blank');
        if (!printWindow) {
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = `reporte-inscritos-${selectedActivity.value.tipo.toLowerCase()}-${selectedActivity.value.idActividad}.pdf`;
            downloadLink.click();
            alertStore.push({ type: 'warning', message: 'El navegador bloqueo la ventana de impresion. Se descargo el PDF.' });
            return;
        }
        printWindow.addEventListener('load', () => {
            printWindow.focus();
            printWindow.print();
        }, { once: true });
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo imprimir el reporte.'
        });
    }
    finally {
        printingReport.value = false;
    }
};
const loadSelectedActivityInscritos = async () => {
    if (!selectedActivity.value)
        return;
    loadingInscritos.value = true;
    try {
        courseEnrolled.value = [];
        eventEnrolled.value = [];
        if (selectedActivity.value.tipo === 'CURSO') {
            const paralelo = selectedActivity.value.paralelos.find(item => item.codigo === selectedParallelCode.value)
                ?? selectedActivity.value.paralelos[0];
            if (!paralelo)
                return;
            selectedParallelCode.value = paralelo.codigo;
            // Try to fetch inscripciones (which include participant info) and evaluaciones, then merge.
            try {
                const [inscripcionesResp, evaluacionesResp] = await Promise.all([
                    api.get(`/inscripciones/curso/${selectedActivity.value.idActividad}`),
                    api.get(`/evaluaciones/paralelo/${selectedActivity.value.idActividad}/${paralelo.codigo}`)
                ]);
                const inscripciones = inscripcionesResp;
                const evaluaciones = evaluacionesResp;
                console.debug('inscripciones/curso response', { activity: selectedActivity.value, paralelo, inscripciones });
                console.debug('evaluaciones/paralelo response', { activity: selectedActivity.value, paralelo, evaluaciones });
                const evalMap = new Map();
                evaluaciones.forEach(ev => {
                    const idIns = Number(pick(ev, 'idInscripcion', 'id_inscripcion', 'idInscripcion') ?? 0);
                    if (idIns)
                        evalMap.set(idIns, ev);
                });
                courseEnrolled.value = inscripciones
                    .filter(item => String(pick(item, 'codigoParalelo', 'codigo_paralelo', 'codigo') ?? '') === String(paralelo.codigo))
                    .filter(item => String(pick(item, 'estado', 'estado_inscripcion') ?? 'CONFIRMADA') === 'CONFIRMADA')
                    .map(item => {
                    const usuario = item.usuario ?? null;
                    const rawNombre = String(pick(item, 'nombreParticipante', 'nombre_participante', 'nombre') ?? (usuario ? (usuario.nombres || `${usuario.nombres || ''} ${usuario.apellidos || ''}`) : ''));
                    const { nombres, apellidos } = splitNombreCompleto(rawNombre);
                    const idInscripcion = Number(pick(item, 'idInscripcion', 'id_inscripcion') ?? 0);
                    const ev = evalMap.get(idInscripcion);
                    return {
                        idEvaluacion: Number(pick(ev, 'idEvaluacion', 'id_evaluacion') ?? 0),
                        idInscripcion,
                        nombres,
                        apellidos,
                        email: String(pick(item, 'emailParticipante', 'email_participante', 'email') ?? (usuario ? (usuario.email ?? '') : '')),
                        username: String(pick(item, 'usernameParticipante', 'username_participante', 'username') ?? (usuario ? (usuario.username ?? '') : '')),
                        notaFinal: (() => {
                            const v = ev ? pick(ev, 'notaFinal', 'nota_final', 'nota') : undefined;
                            return v !== undefined && v !== null ? Number(v) : null;
                        })(),
                        estado: (() => {
                            const v = ev ? pick(ev, 'estado', 'estadoEvaluacion', 'estado_evaluacion') : pick(item, 'estado', 'estado_inscripcion');
                            return v ? String(v) : null;
                        })(),
                        fechaRegistro: String(pick(item, 'fechaInscripcion', 'fecha_inscripcion', 'fechaRegistro', 'fecha_registro') ?? '')
                    };
                });
                return;
            }
            catch (error) {
                // Fall back to previous behavior if secondary endpoint not available
                const response = await api.get(`/evaluaciones/paralelo/${selectedActivity.value.idActividad}/${paralelo.codigo}`);
                const items = response;
                console.debug('evaluaciones/paralelo response (fallback)', { activity: selectedActivity.value, paralelo, items });
                courseEnrolled.value = items.map(item => {
                    const nombreParticipante = String(pick(item, 'nombreParticipante', 'nombre_participante', 'nombre') ?? '');
                    const { nombres, apellidos } = splitNombreCompleto(nombreParticipante);
                    return {
                        idEvaluacion: Number(pick(item, 'idEvaluacion', 'id_evaluacion', 'idEvaluacion') ?? 0),
                        idInscripcion: Number(pick(item, 'idInscripcion', 'id_inscripcion', 'idInscripcion') ?? 0),
                        nombres,
                        apellidos,
                        email: String(pick(item, 'email', 'correo', 'email_participante') ?? ''),
                        username: String(pick(item, 'username', 'userName', 'ru', 'username_participante') ?? ''),
                        notaFinal: (() => {
                            const v = pick(item, 'notaFinal', 'nota_final', 'nota');
                            return v !== undefined && v !== null ? Number(v) : null;
                        })(),
                        estado: (() => {
                            const v = pick(item, 'estado', 'estadoEvaluacion', 'estado_evaluacion');
                            return v ? String(v) : null;
                        })(),
                        fechaRegistro: String(pick(item, 'fechaRegistro', 'fecha_registro', 'createdAt') ?? '')
                    };
                });
                return;
            }
        }
        const response = await api.get(`/asistencias/evento/${selectedActivity.value.idActividad}/detalle`);
        const items = response;
        console.debug('asistencias/evento response', { activity: selectedActivity.value, items });
        eventEnrolled.value = items.map(item => {
            const nombreParticipante = String(pick(item, 'nombreParticipante', 'nombre_participante', 'nombre') ?? '');
            const { nombres, apellidos } = splitNombreCompleto(nombreParticipante);
            return {
                idInscripcion: Number(pick(item, 'idInscripcion', 'id_inscripcion') ?? 0),
                nombres,
                apellidos,
                email: String(pick(item, 'email', 'correo', 'email_participante') ?? ''),
                username: String(pick(item, 'username', 'userName', 'ru', 'username_participante') ?? ''),
                asistio: Boolean(pick(item, 'asistio', 'asistio_flag', 'present')),
                fechaRegistro: String(pick(item, 'fechaRegistro', 'fecha_registro', 'createdAt') ?? '')
            };
        });
    }
    finally {
        loadingInscritos.value = false;
    }
};
const selectActivity = async (activity) => {
    selectedActivityKey.value = activity.key;
    selectedParallelCode.value = activity.tipo === 'CURSO'
        ? activity.paralelos[0]?.codigo ?? ''
        : '';
    await loadSelectedActivityInscritos();
};
const resetFilters = () => {
    searchTerm.value = '';
    selectedCarreraId.value = '';
    tipoFiltro.value = '';
    estadoFiltro.value = '';
    clearSelectedActivity();
};
const applyRouteSelection = async () => {
    const tipo = normalizeQueryValue(route.query.tipo);
    const idActividad = Number(normalizeQueryValue(route.query.idActividad));
    if (!tipo || !idActividad || activities.value.length === 0)
        return;
    const activity = activities.value.find(item => item.tipo === tipo && item.idActividad === idActividad);
    if (!activity)
        return;
    if (tipoFiltro.value !== tipo) {
        tipoFiltro.value = tipo;
    }
    await selectActivity(activity);
};
const loadAll = async () => {
    loadingActivities.value = true;
    try {
        await Promise.all([loadCarreras(), loadCursos(), loadEventos()]);
        buildActivities();
        await applyRouteSelection();
    }
    finally {
        loadingActivities.value = false;
    }
};
watch([() => route.query.tipo, () => route.query.idActividad], () => {
    void applyRouteSelection();
});
onMounted(() => {
    void loadAll();
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
    ...{ class: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
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
    { onClick: (__VLS_ctx.resetFilters) });
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[resetFilters,];
var __VLS_3;
var __VLS_4;
const __VLS_8 = Button || Button;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loadingActivities),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loadingActivities),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_13;
const __VLS_14 = ({ click: {} },
    { onClick: (__VLS_ctx.loadAll) });
const { default: __VLS_15 } = __VLS_11.slots;
// @ts-ignore
[loadingActivities, loadAll,];
var __VLS_11;
var __VLS_12;
const __VLS_16 = Card || Card;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({}));
const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const { default: __VLS_21 } = __VLS_19.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 lg:grid-cols-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
    placeholder: "Actividad, carrera, tipo o fecha",
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
    value: "",
});
for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (carrera.idCarrera),
        value: (carrera.idCarrera),
    });
    (carrera.nombre);
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
    value: "ABIERTO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "LLENO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "FINALIZADO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_22 = Badge || Badge;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    variant: "primary",
    size: "sm",
}));
const __VLS_24 = __VLS_23({
    variant: "primary",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
const { default: __VLS_27 } = __VLS_25.slots;
(__VLS_ctx.activitiesFiltered.length);
// @ts-ignore
[tipoFiltro, estadoFiltro, activitiesFiltered,];
var __VLS_25;
const __VLS_28 = Badge || Badge;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    variant: "secondary",
    size: "sm",
}));
const __VLS_30 = __VLS_29({
    variant: "secondary",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const { default: __VLS_33 } = __VLS_31.slots;
(__VLS_ctx.cursosFiltrados);
// @ts-ignore
[cursosFiltrados,];
var __VLS_31;
const __VLS_34 = Badge || Badge;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
    variant: "info",
    size: "sm",
}));
const __VLS_36 = __VLS_35({
    variant: "info",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
const { default: __VLS_39 } = __VLS_37.slots;
(__VLS_ctx.eventosFiltrados);
// @ts-ignore
[eventosFiltrados,];
var __VLS_37;
if (__VLS_ctx.selectedActivity) {
    const __VLS_40 = Badge || Badge;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        variant: "gray",
        size: "sm",
    }));
    const __VLS_42 = __VLS_41({
        variant: "gray",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    const { default: __VLS_45 } = __VLS_43.slots;
    (__VLS_ctx.selectedActivity.nombre);
    // @ts-ignore
    [selectedActivity, selectedActivity,];
    var __VLS_43;
}
// @ts-ignore
[];
var __VLS_19;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]']} */ ;
const __VLS_46 = Card || Card;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({}));
const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
const { default: __VLS_51 } = __VLS_49.slots;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
if (__VLS_ctx.loadingActivities) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-10 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.activitiesOrdered.length === 0) {
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
    for (const [activity] of __VLS_vFor((__VLS_ctx.activitiesOrdered))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (activity.key),
            ...{ class: "transition" },
            ...{ class: (__VLS_ctx.selectedActivity?.key === activity.key ? 'bg-emerald-50/70' : 'hover:bg-slate-50') },
        });
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 align-top" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-top']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-1" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-semibold text-slate-900" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
        (activity.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (activity.tipo === 'CURSO' ? `${activity.paralelos.length} paralelos` : 'Evento unico');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 align-top text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-top']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (activity.carreraNombre || 'Sin carrera');
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (__VLS_ctx.formatDate(activity.fecha));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 align-top" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-top']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center justify-between gap-4 text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCupo(activity.inscritos, activity.cupoMaximo));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-2 overflow-hidden rounded-full bg-slate-100" },
        });
        /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-slate-100']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-full rounded-full bg-emerald-500" },
            ...{ style: ({ width: `${__VLS_ctx.getCupoPorcentaje(activity.inscritos, activity.cupoMaximo)}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-emerald-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 align-top" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-top']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_52 = Badge || Badge;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            variant: (activity.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_54 = __VLS_53({
            variant: (activity.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        const { default: __VLS_57 } = __VLS_55.slots;
        (activity.tipo);
        // @ts-ignore
        [loadingActivities, selectedActivity, activitiesOrdered, activitiesOrdered, formatDate, formatCupo, getCupoPorcentaje,];
        var __VLS_55;
        const __VLS_58 = Badge || Badge;
        // @ts-ignore
        const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
            variant: (__VLS_ctx.estadoActividadVariant(activity.estado)),
            size: "sm",
        }));
        const __VLS_60 = __VLS_59({
            variant: (__VLS_ctx.estadoActividadVariant(activity.estado)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_59));
        const { default: __VLS_63 } = __VLS_61.slots;
        (activity.estado);
        // @ts-ignore
        [estadoActividadVariant,];
        var __VLS_61;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 align-top text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-top']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        const __VLS_64 = Button || Button;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }));
        const __VLS_66 = __VLS_65({
            ...{ 'onClick': {} },
            variant: "outline",
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        let __VLS_69;
        const __VLS_70 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingActivities))
                        return;
                    if (!!(__VLS_ctx.activitiesOrdered.length === 0))
                        return;
                    __VLS_ctx.selectActivity(activity);
                    // @ts-ignore
                    [selectActivity,];
                } });
        const { default: __VLS_71 } = __VLS_67.slots;
        // @ts-ignore
        [];
        var __VLS_67;
        var __VLS_68;
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
var __VLS_49;
const __VLS_72 = Card || Card;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
    ...{ class: "h-fit xl:sticky xl:top-6" },
}));
const __VLS_74 = __VLS_73({
    ...{ class: "h-fit xl:sticky xl:top-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
/** @type {__VLS_StyleScopedClasses['h-fit']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:top-6']} */ ;
const { default: __VLS_77 } = __VLS_75.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
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
if (__VLS_ctx.selectedActivity) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-2xl border border-slate-200 bg-slate-50 p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-start justify-between gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_78 = Badge || Badge;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        variant: (__VLS_ctx.selectedActivity.tipo === 'CURSO' ? 'primary' : 'secondary'),
        size: "sm",
    }));
    const __VLS_80 = __VLS_79({
        variant: (__VLS_ctx.selectedActivity.tipo === 'CURSO' ? 'primary' : 'secondary'),
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    const { default: __VLS_83 } = __VLS_81.slots;
    (__VLS_ctx.selectedActivity.tipo);
    // @ts-ignore
    [selectedActivity, selectedActivity, selectedActivity,];
    var __VLS_81;
    const __VLS_84 = Badge || Badge;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
        variant: (__VLS_ctx.estadoActividadVariant(__VLS_ctx.selectedActivity.estado)),
        size: "sm",
    }));
    const __VLS_86 = __VLS_85({
        variant: (__VLS_ctx.estadoActividadVariant(__VLS_ctx.selectedActivity.estado)),
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    const { default: __VLS_89 } = __VLS_87.slots;
    (__VLS_ctx.selectedActivity.estado);
    // @ts-ignore
    [selectedActivity, selectedActivity, estadoActividadVariant,];
    var __VLS_87;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-base font-semibold text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.selectedActivity.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-slate-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    (__VLS_ctx.selectedActivity.carreraNombre || 'Sin carrera');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_90 = Button || Button;
    // @ts-ignore
    const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        loading: (__VLS_ctx.printingReport),
    }));
    const __VLS_92 = __VLS_91({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        loading: (__VLS_ctx.printingReport),
    }, ...__VLS_functionalComponentArgsRest(__VLS_91));
    let __VLS_95;
    const __VLS_96 = ({ click: {} },
        { onClick: (__VLS_ctx.printSelectedActivityReport) });
    const { default: __VLS_97 } = __VLS_93.slots;
    // @ts-ignore
    [selectedActivity, selectedActivity, printingReport, printSelectedActivityReport,];
    var __VLS_93;
    var __VLS_94;
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
        { onClick: (__VLS_ctx.clearSelectedActivity) });
    const { default: __VLS_105 } = __VLS_101.slots;
    // @ts-ignore
    [clearSelectedActivity,];
    var __VLS_101;
    var __VLS_102;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 grid gap-3 sm:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-medium text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.selectedActivity.fecha));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-medium text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.formatCupo(__VLS_ctx.selectedActivity.inscritos, __VLS_ctx.selectedActivity.cupoMaximo));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-medium text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.selectedActivity.inscritos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm font-medium text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.cupoRestante(__VLS_ctx.selectedActivity.inscritos, __VLS_ctx.selectedActivity.cupoMaximo));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 h-2 overflow-hidden rounded-full bg-white" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "h-full rounded-full bg-emerald-500 transition-all" },
        ...{ style: ({ width: `${__VLS_ctx.getCupoPorcentaje(__VLS_ctx.selectedActivity.inscritos, __VLS_ctx.selectedActivity.cupoMaximo)}%` }) },
    });
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-emerald-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    if (__VLS_ctx.selectedActivity.tipo === 'CURSO' && __VLS_ctx.selectedActivity.paralelos.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs font-semibold uppercase tracking-wide text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.loadSelectedActivityInscritos) },
            value: (__VLS_ctx.selectedParallelCode),
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
        for (const [paralelo] of __VLS_vFor((__VLS_ctx.selectedActivity.paralelos))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (paralelo.codigo),
                value: (paralelo.codigo),
            });
            (paralelo.codigo);
            (__VLS_ctx.formatCupo(paralelo.inscritos, paralelo.cupoMaximo));
            // @ts-ignore
            [selectedActivity, selectedActivity, selectedActivity, selectedActivity, selectedActivity, selectedActivity, selectedActivity, selectedActivity, selectedActivity, selectedActivity, selectedActivity, formatDate, formatCupo, formatCupo, getCupoPorcentaje, cupoRestante, loadSelectedActivityInscritos, selectedParallelCode,];
        }
    }
    else if (__VLS_ctx.selectedActivity.tipo === 'CURSO') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        (__VLS_ctx.selectedParallelCode || '-');
    }
    if (__VLS_ctx.loadingInscritos) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "py-10 text-center text-sm text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    else if (__VLS_ctx.selectedActivity.tipo === 'CURSO') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        if (__VLS_ctx.courseEnrolled.length === 0) {
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
            for (const [item, index] of __VLS_vFor((__VLS_ctx.courseEnrolled))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (item.idEvaluacion),
                    ...{ class: "hover:bg-slate-50" },
                });
                /** @type {__VLS_StyleScopedClasses['hover:bg-slate-50']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-slate-500" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
                (index + 1);
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
                (item.nombres);
                (item.apellidos);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-slate-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
                (item.email || '-');
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-slate-600" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
                (item.username);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-center" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                if (item.notaFinal !== null) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: (__VLS_ctx.getNotaColor(item.notaFinal, __VLS_ctx.selectedCourseMinGrade)) },
                    });
                    (item.notaFinal);
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "text-slate-400" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-center" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                const __VLS_106 = Badge || Badge;
                // @ts-ignore
                const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
                    variant: (__VLS_ctx.estadoEvaluacionVariant(item.estado)),
                    size: "sm",
                }));
                const __VLS_108 = __VLS_107({
                    variant: (__VLS_ctx.estadoEvaluacionVariant(item.estado)),
                    size: "sm",
                }, ...__VLS_functionalComponentArgsRest(__VLS_107));
                const { default: __VLS_111 } = __VLS_109.slots;
                (item.estado || 'PENDIENTE');
                // @ts-ignore
                [selectedActivity, selectedActivity, selectedParallelCode, loadingInscritos, courseEnrolled, courseEnrolled, getNotaColor, selectedCourseMinGrade, estadoEvaluacionVariant,];
                var __VLS_109;
                // @ts-ignore
                [];
            }
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        if (__VLS_ctx.eventEnrolled.length === 0) {
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
            for (const [item, index] of __VLS_vFor((__VLS_ctx.eventEnrolled))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (item.idInscripcion),
                    ...{ class: "hover:bg-slate-50" },
                });
                /** @type {__VLS_StyleScopedClasses['hover:bg-slate-50']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-slate-500" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
                (index + 1);
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
                (item.nombres);
                (item.apellidos);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-slate-600" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
                (item.username);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-slate-600" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
                (item.email);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-4 py-3 text-center" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                const __VLS_112 = Badge || Badge;
                // @ts-ignore
                const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
                    variant: (item.asistio ? 'success' : 'danger'),
                    size: "sm",
                }));
                const __VLS_114 = __VLS_113({
                    variant: (item.asistio ? 'success' : 'danger'),
                    size: "sm",
                }, ...__VLS_functionalComponentArgsRest(__VLS_113));
                const { default: __VLS_117 } = __VLS_115.slots;
                (item.asistio ? 'ASISTIO' : 'NO ASISTIO');
                // @ts-ignore
                [eventEnrolled, eventEnrolled,];
                var __VLS_115;
                // @ts-ignore
                [];
            }
        }
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
// @ts-ignore
[];
var __VLS_75;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Inscritos.vue.js.map