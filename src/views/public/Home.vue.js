import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ActivityCard from '@/components/activities/ActivityCard.vue';
import ActivityFilters from '@/components/activities/ActivityFilters.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import { filterActivities } from '@/utils/mockData';
import { api } from '@/utils/api';
import { parseLocalDate } from '@/utils/dateFormatter';
import bannerImage from '@/assets/images/banner.jpg';
import defaultActivityImage from '@/assets/images/defecto.jpg';
// ============================================
// COMPOSABLES
// ============================================
const router = useRouter();
// ============================================
// ESTADO
// ============================================
/** Actividades disponibles */
const activities = ref([]);
/** Carreras disponibles */
const careers = ref([]);
const loading = ref(false);
/** Filtros activos */
const filters = ref({
    tipo: undefined,
    modalidad: undefined,
    carrera_id: undefined,
    busqueda: '',
    solo_gratuitos: false,
    solo_disponibles: false
});
/** Ordenamiento seleccionado */
const sortBy = ref('fecha_inicio');
/** Control del modal mobile de filtros */
const showMobileFilters = ref(false);
// ============================================
// COMPUTED
// ============================================
/**
 * Actividades filtradas según los filtros activos
 */
const filteredActivities = computed(() => {
    return filterActivities(activities.value, filters.value);
});
/**
 * Actividades filtradas y ordenadas
 */
const sortedActivities = computed(() => {
    const filtered = [...filteredActivities.value];
    switch (sortBy.value) {
        case 'nombre':
            return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        case 'precio':
            return filtered.sort((a, b) => {
                const precioA = a.es_gratuito ? 0 : a.costo_externo;
                const precioB = b.es_gratuito ? 0 : b.costo_externo;
                return precioA - precioB;
            });
        case 'cupos':
            return filtered.sort((a, b) => b.cupos_disponibles - a.cupos_disponibles);
        case 'fecha_inicio':
        default:
            return filtered.sort((a, b) => {
                return parseLocalDate(a.fecha_inicio).getTime() - parseLocalDate(b.fecha_inicio).getTime();
            });
    }
});
const activityNames = computed(() => activities.value.map(activity => activity.nombre).filter(Boolean));
/**
 * Verifica si hay filtros activos
 */
const hasActiveFilters = computed(() => {
    return (filters.value.tipo !== undefined ||
        filters.value.modalidad !== undefined ||
        filters.value.carrera_id !== undefined ||
        (filters.value.busqueda && filters.value.busqueda.length > 0) ||
        filters.value.solo_gratuitos === true ||
        filters.value.solo_disponibles === true);
});
/**
 * Cuenta los filtros activos
 */
const activeFiltersCount = computed(() => {
    let count = 0;
    if (filters.value.tipo)
        count++;
    if (filters.value.modalidad)
        count++;
    if (filters.value.carrera_id)
        count++;
    if (filters.value.busqueda && filters.value.busqueda.length > 0)
        count++;
    if (filters.value.solo_gratuitos)
        count++;
    if (filters.value.solo_disponibles)
        count++;
    return count;
});
// ============================================
// MÉTODOS
// ============================================
/**
 * Maneja el click en "Ver detalle"
 */
const handleViewDetail = (activityId, tipo) => {
    router.push({
        name: 'activity-detail',
        params: { id: activityId },
        query: { tipo }
    });
};
/**
 * Limpia todos los filtros
 */
const clearFilters = () => {
    filters.value = {
        tipo: undefined,
        modalidad: undefined,
        carrera_id: undefined,
        busqueda: '',
        solo_gratuitos: false,
        solo_disponibles: false
    };
};
/**
 * Aplica filtros y cierra modal mobile
 */
const applyMobileFilters = () => {
    showMobileFilters.value = false;
};
// ============================================
// LIFECYCLE
// ============================================
const buildCarrera = (idCarrera, nombreCarrera) => {
    const encontrada = careers.value.find((c) => !!c && c.id_carrera === idCarrera);
    if (encontrada)
        return encontrada;
    return {
        id_carrera: idCarrera,
        nombre: nombreCarrera,
        estado: 'ACTIVA'
    };
};
const loadActivities = async () => {
    loading.value = true;
    try {
        const [carrerasResponse, cursosResponse, eventosResponse] = await Promise.all([
            api.get('/carreras'),
            api.get('/cursos'),
            api.get('/eventos')
        ]);
        careers.value = carrerasResponse.map(carrera => ({
            id_carrera: Number(carrera.idCarrera ?? carrera.id ?? 0),
            nombre: String(carrera.nombre ?? ''),
            estado: String(carrera.estado ?? 'ACTIVA')
        }));
        const cursos = cursosResponse.map(curso => {
            const paralelos = Array.isArray(curso.paralelos)
                ? curso.paralelos
                : [];
            const cuposDisponibles = paralelos.reduce((sum, p) => {
                if (p.cuposDisponibles !== undefined && p.cuposDisponibles !== null) {
                    return sum + Math.max(0, Number(p.cuposDisponibles));
                }
                if (p.cupoMaximo !== undefined && p.cupoMaximo !== null) {
                    const disponibles = Number(p.cupoMaximo) - Number(p.inscritos ?? 0);
                    return sum + Math.max(0, disponibles);
                }
                return sum;
            }, 0);
            const cupoMaximo = paralelos.reduce((sum, p) => {
                if (p.cupoMaximo !== undefined && p.cupoMaximo !== null) {
                    return sum + Number(p.cupoMaximo);
                }
                const inscritos = Number(p.inscritos ?? 0);
                const disponibles = p.cuposDisponibles !== undefined && p.cuposDisponibles !== null
                    ? Number(p.cuposDisponibles)
                    : 0;
                return sum + inscritos + disponibles;
            }, 0);
            const modalidades = Array.from(new Set(paralelos
                .map(p => String(p.modalidad ?? ''))
                .filter(Boolean)));
            const modalidad = modalidades.length === 1
                ? modalidades[0]
                : modalidades.length > 1
                    ? 'MIXTO'
                    : 'PRESENCIAL';
            const idCarrera = Number(curso.idCarrera ?? 0);
            const nombreCarrera = String(curso.nombreCarrera ?? '');
            return {
                id_actividad: Number(curso.idCurso),
                tipo: 'CURSO',
                nombre: String(curso.nombre ?? ''),
                descripcion: String(curso.descripcion ?? ''),
                duracion: curso.duracion !== undefined && curso.duracion !== null ? Number(curso.duracion) : null,
                unidad: curso.unidad ? String(curso.unidad) : null,
                carga_horaria: Number(curso.cargaHoraria ?? 0),
                modalidad: modalidad,
                fecha_inicio: String(curso.fechaInicio ?? ''),
                fecha_fin: String(curso.fechaInicio ?? ''),
                cupo_maximo: cupoMaximo,
                cupos_disponibles: cuposDisponibles,
                costo_externo: Number(curso.costoExterno ?? 0),
                costo_umsa: Number(curso.costoUmsa ?? 0),
                es_gratuito: Number(curso.costoExterno ?? 0) === 0 && Number(curso.costoUmsa ?? 0) === 0,
                nota_minima_aprobacion: curso.notaAprobacion !== undefined ? Number(curso.notaAprobacion) : undefined,
                estado: String(curso.estado ?? 'ABIERTO'),
                carrera: idCarrera ? buildCarrera(idCarrera, nombreCarrera) : undefined,
                imagen: String(curso.imagen ?? '').trim() ? String(curso.imagen ?? '') : defaultActivityImage,
                lugar: paralelos.length > 0 ? String(paralelos[0].lugar ?? '') || null : null,
                fecha_creacion: String(curso.fechaCreacion ?? '')
            };
        });
        const eventos = eventosResponse.map(evento => {
            const cupoMaximo = Number(evento.cupoMaximo ?? 0);
            const cuposDisponibles = evento.cuposDisponibles !== undefined && evento.cuposDisponibles !== null
                ? Number(evento.cuposDisponibles)
                : Math.max(0, cupoMaximo - Number(evento.inscritos ?? 0));
            const idCarrera = Number(evento.idCarrera ?? 0);
            const nombreCarrera = String(evento.nombreCarrera ?? '');
            const fechaHora = String(evento.fechaHora ?? '');
            return {
                id_actividad: Number(evento.idEvento),
                tipo: 'EVENTO',
                nombre: String(evento.nombre ?? ''),
                descripcion: String(evento.descripcion ?? ''),
                duracion: evento.duracion !== undefined && evento.duracion !== null ? Number(evento.duracion) : null,
                unidad: evento.unidad ? String(evento.unidad) : null,
                carga_horaria: Number(evento.cargaHoraria ?? 0),
                modalidad: String(evento.modalidad ?? 'PRESENCIAL'),
                fecha_inicio: fechaHora,
                fecha_fin: fechaHora,
                cupo_maximo: cupoMaximo,
                cupos_disponibles: cuposDisponibles,
                costo_externo: Number(evento.costoExterno ?? 0),
                costo_umsa: Number(evento.costoUmsa ?? 0),
                es_gratuito: Number(evento.costoExterno ?? 0) === 0 && Number(evento.costoUmsa ?? 0) === 0,
                estado: String(evento.estado ?? 'ABIERTO'),
                carrera: idCarrera ? buildCarrera(idCarrera, nombreCarrera) : undefined,
                imagen: String(evento.imagen ?? '').trim() ? String(evento.imagen ?? '') : defaultActivityImage,
                lugar: String(evento.lugar ?? '') || null,
                fecha_creacion: String(evento.fechaCreacion ?? '')
            };
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFechaValida = (value) => {
            if (!value)
                return false;
            const date = parseLocalDate(value);
            date.setHours(0, 0, 0, 0);
            return date >= today;
        };
        const filtradas = [...cursos, ...eventos].filter((actividad) => {
            if (actividad.estado !== 'ABIERTO')
                return false;
            if (!isFechaValida(actividad.fecha_inicio))
                return false;
            if (actividad.tipo === 'CURSO') {
                return actividad.cupos_disponibles > 0;
            }
            return actividad.cupos_disponibles > 0;
        });
        activities.value = filtradas;
    }
    catch (error) {
        console.error('Error al cargar actividades:', error);
        activities.value = [];
        careers.value = [];
    }
    finally {
        loading.value = false;
    }
};
onMounted(() => {
    const defaultFilter = router.currentRoute.value.meta.defaultFilter;
    if (defaultFilter) {
        filters.value = { ...filters.value, ...defaultFilter };
    }
    loadActivities();
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
    ...{ class: "relative overflow-hidden text-white" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "absolute inset-0" },
});
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "h-full w-full bg-cover bg-center" },
    ...{ style: ({ backgroundImage: `url(${__VLS_ctx.bannerImage})` }) },
});
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-slate-900/75 to-amber-900/70" },
});
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
/** @type {__VLS_StyleScopedClasses['from-emerald-900/80']} */ ;
/** @type {__VLS_StyleScopedClasses['via-slate-900/75']} */ ;
/** @type {__VLS_StyleScopedClasses['to-amber-900/70']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "relative container mx-auto px-4 py-20" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-20']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "max-w-3xl" },
});
/** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm uppercase tracking-[0.25em] text-emerald-100/80 mb-4" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-[0.25em]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-emerald-100/80']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-4xl md:text-6xl font-bold leading-tight mb-5" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['text-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['md:text-6xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-lg md:text-xl text-emerald-50/90" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['md:text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['text-emerald-50/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "container mx-auto px-4 py-8" },
});
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 lg:grid-cols-4 gap-6" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "hidden lg:block lg:col-span-1" },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:block']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:col-span-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sticky top-24" },
});
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-24']} */ ;
const __VLS_0 = ActivityFilters;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.filters),
    careers: (__VLS_ctx.careers),
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.filters),
    careers: (__VLS_ctx.careers),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "lg:col-span-3" },
});
/** @type {__VLS_StyleScopedClasses['lg:col-span-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "lg:hidden mb-4" },
});
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
const __VLS_5 = Button || Button;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}));
const __VLS_7 = __VLS_6({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_10;
const __VLS_11 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.showMobileFilters = true;
            // @ts-ignore
            [bannerImage, filters, careers, showMobileFilters,];
        } });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_12 } = __VLS_8.slots;
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
    d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
});
if (__VLS_ctx.hasActiveFilters) {
    const __VLS_13 = Badge || Badge;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        variant: "primary",
        size: "sm",
        ...{ class: "ml-2" },
    }));
    const __VLS_15 = __VLS_14({
        variant: "primary",
        size: "sm",
        ...{ class: "ml-2" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
    const { default: __VLS_18 } = __VLS_16.slots;
    (__VLS_ctx.activeFiltersCount);
    // @ts-ignore
    [hasActiveFilters, activeFiltersCount,];
    var __VLS_16;
}
// @ts-ignore
[];
var __VLS_8;
var __VLS_9;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-6 flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-semibold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.filteredActivities.length);
(__VLS_ctx.filteredActivities.length === 1 ? 'actividad' : 'actividades');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center space-x-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.sortBy),
    ...{ class: "text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "fecha_inicio",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "nombre",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "precio",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "cupos",
});
if (__VLS_ctx.sortedActivities.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    for (const [activity] of __VLS_vFor((__VLS_ctx.sortedActivities))) {
        const __VLS_19 = ActivityCard;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            ...{ 'onViewDetail': {} },
            key: (`${activity.tipo}-${activity.id_actividad}`),
            activity: (activity),
        }));
        const __VLS_21 = __VLS_20({
            ...{ 'onViewDetail': {} },
            key: (`${activity.tipo}-${activity.id_actividad}`),
            activity: (activity),
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        let __VLS_24;
        const __VLS_25 = ({ viewDetail: {} },
            { onViewDetail: (__VLS_ctx.handleViewDetail) });
        var __VLS_22;
        var __VLS_23;
        // @ts-ignore
        [filteredActivities, filteredActivities, sortBy, sortedActivities, sortedActivities, handleViewDetail,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-16" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-16']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-24 h-24 mx-auto text-gray-300 mb-4" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-xl font-semibold text-gray-800 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-600 mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    const __VLS_26 = Button || Button;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        ...{ 'onClick': {} },
        variant: "outline",
    }));
    const __VLS_28 = __VLS_27({
        ...{ 'onClick': {} },
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    let __VLS_31;
    const __VLS_32 = ({ click: {} },
        { onClick: (__VLS_ctx.clearFilters) });
    const { default: __VLS_33 } = __VLS_29.slots;
    // @ts-ignore
    [clearFilters,];
    var __VLS_29;
    var __VLS_30;
}
const __VLS_34 = Modal || Modal;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
    modelValue: (__VLS_ctx.showMobileFilters),
    title: "Filtros",
    size: "md",
}));
const __VLS_36 = __VLS_35({
    modelValue: (__VLS_ctx.showMobileFilters),
    title: "Filtros",
    size: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
const { default: __VLS_39 } = __VLS_37.slots;
const __VLS_40 = ActivityFilters;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.filters),
    careers: (__VLS_ctx.careers),
}));
const __VLS_42 = __VLS_41({
    modelValue: (__VLS_ctx.filters),
    careers: (__VLS_ctx.careers),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
{
    const { footer: __VLS_45 } = __VLS_37.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex space-x-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
    const __VLS_46 = Button || Button;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        ...{ 'onClick': {} },
        variant: "outline",
        ...{ class: "flex-1" },
    }));
    const __VLS_48 = __VLS_47({
        ...{ 'onClick': {} },
        variant: "outline",
        ...{ class: "flex-1" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    let __VLS_51;
    const __VLS_52 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.showMobileFilters = false;
                // @ts-ignore
                [filters, careers, showMobileFilters, showMobileFilters,];
            } });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    const { default: __VLS_53 } = __VLS_49.slots;
    // @ts-ignore
    [];
    var __VLS_49;
    var __VLS_50;
    const __VLS_54 = Button || Button;
    // @ts-ignore
    const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
        ...{ 'onClick': {} },
        variant: "primary",
        ...{ class: "flex-1" },
    }));
    const __VLS_56 = __VLS_55({
        ...{ 'onClick': {} },
        variant: "primary",
        ...{ class: "flex-1" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_55));
    let __VLS_59;
    const __VLS_60 = ({ click: {} },
        { onClick: (__VLS_ctx.applyMobileFilters) });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    const { default: __VLS_61 } = __VLS_57.slots;
    // @ts-ignore
    [applyMobileFilters,];
    var __VLS_57;
    var __VLS_58;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_37;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Home.vue.js.map