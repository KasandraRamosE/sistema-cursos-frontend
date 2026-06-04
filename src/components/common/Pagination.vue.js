import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    pageSize: 10,
    maxVisiblePages: 7,
    showPageSizeSelector: false,
    pageSizeOptions: () => [10, 25, 50, 100]
});
const emit = defineEmits();
// ============================================
// COMPUTED
// ============================================
/**
 * Calcula el número total de páginas
 */
const totalPages = computed(() => {
    return Math.ceil(props.totalItems / props.pageSize);
});
/**
 * Calcula el índice del primer item en la página actual
 */
const startItem = computed(() => {
    if (props.totalItems === 0)
        return 0;
    return (props.currentPage - 1) * props.pageSize + 1;
});
/**
 * Calcula el índice del último item en la página actual
 */
const endItem = computed(() => {
    const end = props.currentPage * props.pageSize;
    return end > props.totalItems ? props.totalItems : end;
});
/**
 * Calcula qué páginas deben ser visibles en la paginación
 * Ejemplo: [1, 2, 3, '...', 10, 11, 12]
 */
const visiblePages = computed(() => {
    const pages = [];
    const total = totalPages.value;
    const current = props.currentPage;
    const max = props.maxVisiblePages;
    if (total <= max) {
        // Si hay pocas páginas, mostrar todas
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    }
    else {
        // Siempre mostrar la primera página
        pages.push(1);
        // Calcular el rango de páginas alrededor de la actual
        const halfMax = Math.floor(max / 2);
        let start = Math.max(2, current - halfMax);
        let end = Math.min(total - 1, current + halfMax);
        // Ajustar si estamos cerca del inicio
        if (current <= halfMax) {
            end = max - 1;
        }
        // Ajustar si estamos cerca del final
        if (current >= total - halfMax) {
            start = total - max + 2;
        }
        // Agregar elipsis al inicio si es necesario
        if (start > 2) {
            pages.push('...');
        }
        // Agregar páginas del medio
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        // Agregar elipsis al final si es necesario
        if (end < total - 1) {
            pages.push('...');
        }
        // Siempre mostrar la última página
        pages.push(total);
    }
    return pages;
});
// ============================================
// MÉTODOS
// ============================================
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
        emit('update:currentPage', page);
    }
};
const goToPreviousPage = () => {
    if (props.currentPage > 1) {
        emit('update:currentPage', props.currentPage - 1);
    }
};
const goToNextPage = () => {
    if (props.currentPage < totalPages.value) {
        emit('update:currentPage', props.currentPage + 1);
    }
};
const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value);
    emit('update:pageSize', newSize);
    // Resetear a la primera página cuando cambia el tamaño
    emit('update:currentPage', 1);
};
const __VLS_defaults = {
    pageSize: 10,
    maxVisiblePages: 7,
    showPageSizeSelector: false,
    pageSizeOptions: () => [10, 25, 50, 100]
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-1 justify-between sm:hidden" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:hidden']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goToPreviousPage) },
    disabled: (__VLS_ctx.currentPage === 1),
    ...{ class: ([
            'relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium',
            __VLS_ctx.currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
        ]) },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goToNextPage) },
    disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    ...{ class: ([
            'relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium',
            __VLS_ctx.currentPage === __VLS_ctx.totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
        ]) },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "hidden sm:flex sm:flex-1 sm:items-center sm:justify-between" },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-700" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-medium" },
});
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
(__VLS_ctx.startItem);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-medium" },
});
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
(__VLS_ctx.endItem);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-medium" },
});
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
(__VLS_ctx.totalItems);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "isolate inline-flex -space-x-px rounded-md shadow-sm" },
    'aria-label': "Pagination",
});
/** @type {__VLS_StyleScopedClasses['isolate']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['-space-x-px']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goToPreviousPage) },
    disabled: (__VLS_ctx.currentPage === 1),
    ...{ class: ([
            'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
            __VLS_ctx.currentPage === 1 ? 'cursor-not-allowed' : 'hover:text-gray-500'
        ]) },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-l-md']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-inset']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:z-20']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-offset-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "sr-only" },
});
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "h-5 w-5" },
    viewBox: "0 0 20 20",
    fill: "currentColor",
    'aria-hidden': "true",
});
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'fill-rule': "evenodd",
    d: "M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z",
    'clip-rule': "evenodd",
});
for (const [page] of __VLS_vFor((__VLS_ctx.visiblePages))) {
    (page);
    if (page === '...') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['ring-inset']} */ ;
        /** @type {__VLS_StyleScopedClasses['ring-gray-300']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(page === '...'))
                        return;
                    __VLS_ctx.goToPage(page);
                    // @ts-ignore
                    [goToPreviousPage, goToPreviousPage, currentPage, currentPage, currentPage, currentPage, currentPage, currentPage, goToNextPage, totalPages, totalPages, startItem, endItem, totalItems, visiblePages, goToPage,];
                } },
            ...{ class: ([
                    'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0',
                    __VLS_ctx.currentPage === page
                        ? 'z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600'
                        : 'text-gray-900 hover:bg-gray-50'
                ]) },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['ring-inset']} */ ;
        /** @type {__VLS_StyleScopedClasses['ring-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:z-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:outline-offset-0']} */ ;
        (page);
    }
    // @ts-ignore
    [currentPage,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goToNextPage) },
    disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    ...{ class: ([
            'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
            __VLS_ctx.currentPage === __VLS_ctx.totalPages ? 'cursor-not-allowed' : 'hover:text-gray-500'
        ]) },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-r-md']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-inset']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:z-20']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-offset-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "sr-only" },
});
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "h-5 w-5" },
    viewBox: "0 0 20 20",
    fill: "currentColor",
    'aria-hidden': "true",
});
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'fill-rule': "evenodd",
    d: "M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z",
    'clip-rule': "evenodd",
});
if (__VLS_ctx.showPageSizeSelector) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-4" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handlePageSizeChange) },
        value: (__VLS_ctx.pageSize),
        ...{ class: "rounded-md border-gray-300 text-sm focus:border-purple-500 focus:ring-purple-500" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-purple-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
    for (const [size] of __VLS_vFor((__VLS_ctx.pageSizeOptions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (size),
            value: (size),
        });
        (size);
        // @ts-ignore
        [currentPage, currentPage, goToNextPage, totalPages, totalPages, showPageSizeSelector, handlePageSizeChange, pageSize, pageSizeOptions,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default {};
//# sourceMappingURL=Pagination.vue.js.map