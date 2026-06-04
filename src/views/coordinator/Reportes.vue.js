import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Pagination from '@/components/common/Pagination.vue';
import { usePagination } from '@/composables/usePagination';
import { api } from '@/utils/api';
import { formatDate as formatDateUtil } from '@/utils/dateFormatter';
const loading = ref(false);
const errorMessage = ref('');
const carreras = ref([]);
const academicosCursos = ref([]);
const academicosEventos = ref([]);
const totalUmsa = ref(0);
const finanzasResumen = ref([]);
const router = useRouter();
const detalleActividad = ref(null);
const detalleLoading = ref(false);
const detalleError = ref('');
const showDetalleModal = ref(false);
const filters = ref({
    desde: '',
    hasta: '',
    tipo: '',
    estado: '',
    carreraId: null,
    buscar: ''
});
const clearFilters = () => {
    filters.value = {
        desde: '',
        hasta: '',
        tipo: '',
        estado: '',
        carreraId: null,
        buscar: ''
    };
};
const loadCarreras = async () => {
    const response = await api.get('/coordinador/carreras');
    carreras.value = response;
};
const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.value.desde)
        params.set('desde', filters.value.desde);
    if (filters.value.hasta)
        params.set('hasta', filters.value.hasta);
    if (filters.value.carreraId)
        params.set('idCarrera', String(filters.value.carreraId));
    if (filters.value.tipo)
        params.set('tipo', String(filters.value.tipo));
    if (filters.value.buscar)
        params.set('buscar', String(filters.value.buscar));
    return params;
};
const downloadingAcademicos = ref(false);
const downloadingFinancieros = ref(false);
const downloadBlob = async (url, fileName, setLoading) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(url, { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok)
            throw new Error(res.statusText || 'Error al generar PDF');
        const contentType = res.headers.get('content-type') || '';
        const arrayBuffer = await res.arrayBuffer();
        const signature = new TextDecoder().decode(arrayBuffer.slice(0, 5));
        if (!contentType.toLowerCase().includes('application/pdf') || signature !== '%PDF-') {
            const preview = new TextDecoder().decode(arrayBuffer.slice(0, 300)).trim();
            throw new Error(`La respuesta no es un PDF válido. ${contentType ? `Content-Type: ${contentType}.` : ''} `
                + `${preview ? `Respuesta: ${preview}` : 'Verifica tu sesión o la configuración del endpoint.'}`);
        }
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        if (pdfBlob.size === 0)
            throw new Error('El PDF generado está vacío.');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            a.click();
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }
    catch (err) {
        errorMessage.value = err.message || 'No se pudo descargar el PDF.';
    }
    finally {
        setLoading(false);
    }
};
const downloadAcademicosPdf = async () => {
    const params = buildQueryParams().toString();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const resolvedBaseUrl = baseUrl.startsWith('http')
        ? baseUrl
        : `http://localhost:8080${baseUrl.startsWith('/') ? '' : '/'}${baseUrl}`;
    const url = `${resolvedBaseUrl}/reportes/academicos/pdf${params ? `?${params}` : ''}`;
    await downloadBlob(url, `reporte-academico.pdf`, (v) => (downloadingAcademicos.value = v));
};
const downloadFinancierosPdf = async () => {
    const params = buildQueryParams().toString();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const resolvedBaseUrl = baseUrl.startsWith('http')
        ? baseUrl
        : `http://localhost:8080${baseUrl.startsWith('/') ? '' : '/'}${baseUrl}`;
    const url = `${resolvedBaseUrl}/reportes/financieros/coordinador/pdf${params ? `?${params}` : ''}`;
    await downloadBlob(url, `reporte-financiero.pdf`, (v) => (downloadingFinancieros.value = v));
};
const academicosFiltrados = computed(() => {
    const entries = [];
    academicosCursos.value.forEach((curso) => {
        entries.push({
            key: `CURSO-${curso.idCurso}`,
            tipo: 'CURSO',
            nombre: curso.nombre,
            carrera: curso.carrera,
            fecha: curso.fechaInicio,
            estado: curso.estado,
            inscritos: curso.inscritosConfirmados,
            cupoMaximo: curso.cupoMaximo ?? 0,
            idActividad: curso.idCurso
        });
    });
    academicosEventos.value.forEach((evento) => {
        entries.push({
            key: `EVENTO-${evento.idEvento}`,
            tipo: 'EVENTO',
            nombre: evento.nombre,
            carrera: evento.carrera,
            fecha: evento.fechaHora,
            estado: evento.estado,
            inscritos: evento.inscritosConfirmados,
            cupoMaximo: evento.cupoMaximo ?? 0,
            idActividad: evento.idEvento
        });
    });
    return entries.filter((item) => {
        if (filters.value.tipo && item.tipo !== filters.value.tipo)
            return false;
        if (filters.value.estado && item.estado !== filters.value.estado)
            return false;
        if (filters.value.buscar) {
            const term = filters.value.buscar.trim().toLowerCase();
            if (term && !item.nombre.toLowerCase().includes(term))
                return false;
        }
        return true;
    });
});
const academicosPagination = usePagination(academicosFiltrados, { pageSize: 10 });
const academicosPaginados = computed(() => academicosPagination.paginatedData.value);
const academicosCurrentPage = academicosPagination.currentPage;
const academicosPageSize = academicosPagination.pageSize;
const academicosTotalItems = academicosPagination.totalItems;
const goToAcademicosPage = academicosPagination.goToPage;
const setAcademicosPageSize = academicosPagination.setPageSize;
const totalActividades = computed(() => academicosFiltrados.value.length);
const totalInscritos = computed(() => academicosFiltrados.value.reduce((sum, item) => sum + item.inscritos, 0));
const finanzasFiltradas = computed(() => {
    return finanzasResumen.value.filter((row) => {
        if (filters.value.tipo && row.tipo !== filters.value.tipo)
            return false;
        return true;
    });
});
const totalIngresosFiltrados = computed(() => {
    return finanzasFiltradas.value.reduce((sum, row) => sum + row.ingresosTotal, 0);
});
const finanzasPagination = usePagination(finanzasFiltradas, { pageSize: 10 });
const finanzasPaginadas = computed(() => finanzasPagination.paginatedData.value);
const finanzasCurrentPage = finanzasPagination.currentPage;
const finanzasPageSize = finanzasPagination.pageSize;
const finanzasTotalItems = finanzasPagination.totalItems;
const goToFinanzasPage = finanzasPagination.goToPage;
const setFinanzasPageSize = finanzasPagination.setPageSize;
const formatDate = (value) => {
    if (!value)
        return '-';
    return formatDateUtil(value, 'es-BO');
};
const formatCupo = (inscritos, cupoMaximo) => {
    const cupo = cupoMaximo && cupoMaximo > 0 ? String(cupoMaximo) : '-';
    return `${inscritos}/${cupo}`;
};
const goToInscritos = (detalle) => {
    router.push(`/coordinador/inscritos?tipo=${detalle.tipo}&idActividad=${detalle.idActividad}`);
};
const closeDetalleModal = () => {
    showDetalleModal.value = false;
    detalleActividad.value = null;
    detalleError.value = '';
};
const openDetalleModal = async (item) => {
    showDetalleModal.value = true;
    detalleLoading.value = true;
    detalleError.value = '';
    try {
        const params = new URLSearchParams();
        params.set('tipo', item.tipo);
        params.set('idActividad', String(item.idActividad));
        const response = await api.get(`/reportes/actividad?${params.toString()}`);
        detalleActividad.value = response;
    }
    catch (error) {
        detalleError.value = error.message || 'No se pudo cargar el detalle.';
    }
    finally {
        detalleLoading.value = false;
    }
};
const loadReportes = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        const params = buildQueryParams();
        const query = params.toString() ? `?${params.toString()}` : '';
        const [academicosResponse, participacionResponse, financieroResponse] = await Promise.all([
            api.get(`/reportes/academicos${query}`),
            api.get(`/reportes/participacion${query}`),
            api.get(`/reportes/financieros/coordinador${query}`)
        ]);
        academicosCursos.value = academicosResponse.cursos || [];
        academicosEventos.value = academicosResponse.eventos || [];
        totalUmsa.value = participacionResponse.totalUmsa ?? 0;
        const financieros = [...(financieroResponse.cursos || []), ...(financieroResponse.eventos || [])];
        finanzasResumen.value = financieros;
    }
    catch (error) {
        errorMessage.value = error.message || 'No se pudo cargar el reporte.';
    }
    finally {
        loading.value = false;
    }
};
onMounted(async () => {
    await loadCarreras();
    await loadReportes();
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
    size: "sm",
    loading: (__VLS_ctx.loading),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.loadReportes) });
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[loading, loadReportes,];
var __VLS_3;
var __VLS_4;
const __VLS_8 = Card || Card;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 md:grid-cols-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
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
    type: "date",
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.filters.desde);
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
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "date",
    ...{ class: "w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
(__VLS_ctx.filters.hasta);
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
    value: (__VLS_ctx.filters.tipo),
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
    value: "CURSO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "EVENTO",
});
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
    value: (__VLS_ctx.filters.estado),
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
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
    value: (__VLS_ctx.filters.carreraId),
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
for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (carrera.idCarrera),
        value: (carrera.idCarrera),
    });
    (carrera.nombre);
    // @ts-ignore
    [filters, filters, filters, filters, filters, carreras,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
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
    value: (__VLS_ctx.filters.buscar),
    type: "text",
    placeholder: "Buscar por nombre",
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_14 = Button || Button;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}));
const __VLS_16 = __VLS_15({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
let __VLS_19;
const __VLS_20 = ({ click: {} },
    { onClick: (__VLS_ctx.clearFilters) });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_21 } = __VLS_17.slots;
// @ts-ignore
[filters, clearFilters,];
var __VLS_17;
var __VLS_18;
const __VLS_22 = Button || Button;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    ...{ 'onClick': {} },
    ...{ class: "w-full" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_24 = __VLS_23({
    ...{ 'onClick': {} },
    ...{ class: "w-full" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
let __VLS_27;
const __VLS_28 = ({ click: {} },
    { onClick: (__VLS_ctx.loadReportes) });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_29 } = __VLS_25.slots;
// @ts-ignore
[loading, loadReportes,];
var __VLS_25;
var __VLS_26;
// @ts-ignore
[];
var __VLS_11;
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-rose-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-rose-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-700']} */ ;
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 md:grid-cols-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
const __VLS_30 = Card || Card;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
const __VLS_32 = __VLS_31({}, ...__VLS_functionalComponentArgsRest(__VLS_31));
const { default: __VLS_35 } = __VLS_33.slots;
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
(__VLS_ctx.totalActividades);
// @ts-ignore
[errorMessage, errorMessage, totalActividades,];
var __VLS_33;
const __VLS_36 = Card || Card;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({}));
const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const { default: __VLS_41 } = __VLS_39.slots;
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
(__VLS_ctx.totalInscritos);
// @ts-ignore
[totalInscritos,];
var __VLS_39;
const __VLS_42 = Card || Card;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({}));
const __VLS_44 = __VLS_43({}, ...__VLS_functionalComponentArgsRest(__VLS_43));
const { default: __VLS_47 } = __VLS_45.slots;
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
(__VLS_ctx.totalUmsa);
// @ts-ignore
[totalUmsa,];
var __VLS_45;
const __VLS_48 = Card || Card;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({}));
const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const { default: __VLS_53 } = __VLS_51.slots;
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
(__VLS_ctx.totalIngresosFiltrados.toFixed(2));
// @ts-ignore
[totalIngresosFiltrados,];
var __VLS_51;
const __VLS_54 = Card || Card;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({}));
const __VLS_56 = __VLS_55({}, ...__VLS_functionalComponentArgsRest(__VLS_55));
const { default: __VLS_59 } = __VLS_57.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
const __VLS_60 = Button || Button;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
    ...{ 'onClick': {} },
    size: "sm",
    variant: "outline",
    loading: (__VLS_ctx.downloadingAcademicos),
}));
const __VLS_62 = __VLS_61({
    ...{ 'onClick': {} },
    size: "sm",
    variant: "outline",
    loading: (__VLS_ctx.downloadingAcademicos),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_65;
const __VLS_66 = ({ click: {} },
    { onClick: (__VLS_ctx.downloadAcademicosPdf) });
const { default: __VLS_67 } = __VLS_63.slots;
// @ts-ignore
[downloadingAcademicos, downloadAcademicosPdf,];
var __VLS_63;
var __VLS_64;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.academicosFiltrados.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
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
        ...{ class: "w-full text-left text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-slate-100" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-slate-100']} */ ;
    for (const [item] of __VLS_vFor((__VLS_ctx.academicosPaginados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.key),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 font-medium text-slate-800" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
        (item.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (item.tipo);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (item.carrera);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (__VLS_ctx.formatDate(item.fecha));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (item.estado);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (__VLS_ctx.formatCupo(item.inscritos, item.cupoMaximo));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_68 = Button || Button;
        // @ts-ignore
        const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
            ...{ 'onClick': {} },
            size: "sm",
            variant: "outline",
        }));
        const __VLS_70 = __VLS_69({
            ...{ 'onClick': {} },
            size: "sm",
            variant: "outline",
        }, ...__VLS_functionalComponentArgsRest(__VLS_69));
        let __VLS_73;
        const __VLS_74 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.academicosFiltrados.length === 0))
                        return;
                    __VLS_ctx.openDetalleModal(item);
                    // @ts-ignore
                    [loading, academicosFiltrados, academicosPaginados, formatDate, formatCupo, openDetalleModal,];
                } });
        const { default: __VLS_75 } = __VLS_71.slots;
        // @ts-ignore
        [];
        var __VLS_71;
        var __VLS_72;
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.academicosTotalItems > __VLS_ctx.academicosPageSize) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    const __VLS_76 = Pagination;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.academicosCurrentPage),
        totalItems: (__VLS_ctx.academicosTotalItems),
        pageSize: (__VLS_ctx.academicosPageSize),
        showPageSizeSelector: (true),
        pageSizeOptions: ([10, 25, 50, 100]),
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.academicosCurrentPage),
        totalItems: (__VLS_ctx.academicosTotalItems),
        pageSize: (__VLS_ctx.academicosPageSize),
        showPageSizeSelector: (true),
        pageSizeOptions: ([10, 25, 50, 100]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_81;
    const __VLS_82 = ({ 'update:currentPage': {} },
        { 'onUpdate:currentPage': (__VLS_ctx.goToAcademicosPage) });
    const __VLS_83 = ({ 'update:pageSize': {} },
        { 'onUpdate:pageSize': (__VLS_ctx.setAcademicosPageSize) });
    var __VLS_79;
    var __VLS_80;
}
// @ts-ignore
[academicosTotalItems, academicosTotalItems, academicosPageSize, academicosPageSize, academicosCurrentPage, goToAcademicosPage, setAcademicosPageSize,];
var __VLS_57;
const __VLS_84 = Modal || Modal;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDetalleModal),
    title: "Detalle de actividad",
    size: "lg",
}));
const __VLS_86 = __VLS_85({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showDetalleModal),
    title: "Detalle de actividad",
    size: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
let __VLS_89;
const __VLS_90 = ({ close: {} },
    { onClose: (__VLS_ctx.closeDetalleModal) });
const { default: __VLS_91 } = __VLS_87.slots;
if (__VLS_ctx.detalleLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-6 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.detalleError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-4 text-sm text-rose-600" },
    });
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
    (__VLS_ctx.detalleError);
}
else if (!__VLS_ctx.detalleActividad) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-6 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-1" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-lg font-semibold text-slate-900" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
    (__VLS_ctx.detalleActividad.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.detalleActividad.carrera);
    (__VLS_ctx.detalleActividad.tipo);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.detalleActividad.estado);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.inscritosConfirmados);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.cupoMaximo);
    (__VLS_ctx.detalleActividad.cuposDisponibles);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.participantesUmsa);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.participantesExterno);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.aprobados);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.asistidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.ingresosUmsa.toFixed(2));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.ingresosExterno.toFixed(2));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.detalleActividad.ingresosTotal.toFixed(2));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_92 = Button || Button;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
    }));
    const __VLS_94 = __VLS_93({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    let __VLS_97;
    const __VLS_98 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!!(__VLS_ctx.detalleLoading))
                    return;
                if (!!(__VLS_ctx.detalleError))
                    return;
                if (!!(!__VLS_ctx.detalleActividad))
                    return;
                __VLS_ctx.goToInscritos(__VLS_ctx.detalleActividad);
                // @ts-ignore
                [showDetalleModal, closeDetalleModal, detalleLoading, detalleError, detalleError, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, detalleActividad, goToInscritos,];
            } });
    const { default: __VLS_99 } = __VLS_95.slots;
    // @ts-ignore
    [];
    var __VLS_95;
    var __VLS_96;
}
// @ts-ignore
[];
var __VLS_87;
var __VLS_88;
const __VLS_100 = Card || Card;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({}));
const __VLS_102 = __VLS_101({}, ...__VLS_functionalComponentArgsRest(__VLS_101));
const { default: __VLS_105 } = __VLS_103.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
const __VLS_106 = Button || Button;
// @ts-ignore
const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
    ...{ 'onClick': {} },
    size: "sm",
    variant: "outline",
    loading: (__VLS_ctx.downloadingFinancieros),
}));
const __VLS_108 = __VLS_107({
    ...{ 'onClick': {} },
    size: "sm",
    variant: "outline",
    loading: (__VLS_ctx.downloadingFinancieros),
}, ...__VLS_functionalComponentArgsRest(__VLS_107));
let __VLS_111;
const __VLS_112 = ({ click: {} },
    { onClick: (__VLS_ctx.downloadFinancierosPdf) });
const { default: __VLS_113 } = __VLS_109.slots;
// @ts-ignore
[downloadingFinancieros, downloadFinancierosPdf,];
var __VLS_109;
var __VLS_110;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.finanzasFiltradas.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
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
        ...{ class: "w-full text-left text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
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
        ...{ class: "px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-slate-100" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-slate-100']} */ ;
    for (const [item] of __VLS_vFor((__VLS_ctx.finanzasPaginadas))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.idActividad),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 font-medium text-slate-800" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
        (item.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (item.tipo);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (item.ingresosUmsa.toFixed(2));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (item.ingresosExterno.toFixed(2));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (item.ingresosTotal.toFixed(2));
        // @ts-ignore
        [loading, finanzasFiltradas, finanzasPaginadas,];
    }
}
if (__VLS_ctx.finanzasFiltradas.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-3 flex justify-end text-sm text-slate-700" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.totalIngresosFiltrados.toFixed(2));
}
if (__VLS_ctx.finanzasTotalItems > __VLS_ctx.finanzasPageSize) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    const __VLS_114 = Pagination;
    // @ts-ignore
    const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.finanzasCurrentPage),
        totalItems: (__VLS_ctx.finanzasTotalItems),
        pageSize: (__VLS_ctx.finanzasPageSize),
        showPageSizeSelector: (true),
        pageSizeOptions: ([10, 25, 50, 100]),
    }));
    const __VLS_116 = __VLS_115({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.finanzasCurrentPage),
        totalItems: (__VLS_ctx.finanzasTotalItems),
        pageSize: (__VLS_ctx.finanzasPageSize),
        showPageSizeSelector: (true),
        pageSizeOptions: ([10, 25, 50, 100]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_115));
    let __VLS_119;
    const __VLS_120 = ({ 'update:currentPage': {} },
        { 'onUpdate:currentPage': (__VLS_ctx.goToFinanzasPage) });
    const __VLS_121 = ({ 'update:pageSize': {} },
        { 'onUpdate:pageSize': (__VLS_ctx.setFinanzasPageSize) });
    var __VLS_117;
    var __VLS_118;
}
// @ts-ignore
[totalIngresosFiltrados, finanzasFiltradas, finanzasTotalItems, finanzasTotalItems, finanzasPageSize, finanzasPageSize, finanzasCurrentPage, goToFinanzasPage, setFinanzasPageSize,];
var __VLS_103;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Reportes.vue.js.map