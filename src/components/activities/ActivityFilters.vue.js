import { ref, computed, watch } from 'vue';
import Card from '@/components/common/Card.vue';
const props = defineProps();
const emit = defineEmits();
// ============================================
// ESTADO LOCAL
// ============================================
/**
 * Copia local de los filtros para v-model
 */
const localFilters = ref({ ...props.modelValue });
const showSuggestions = ref(false);
// Timer para debounce en búsqueda
let searchTimeout = null;
// ============================================
// COMPUTED
// ============================================
/**
 * Verifica si hay filtros activos
 */
const hasActiveFilters = computed(() => {
    return (localFilters.value.tipo !== undefined ||
        localFilters.value.modalidad !== undefined ||
        localFilters.value.carrera_id !== undefined ||
        (localFilters.value.busqueda && localFilters.value.busqueda.length > 0) ||
        localFilters.value.solo_gratuitos === true ||
        localFilters.value.solo_disponibles === true);
});
const matchingSuggestions = computed(() => {
    const query = (localFilters.value.busqueda || '').trim().toLowerCase();
    if (!query || !props.activityNames || props.activityNames.length === 0)
        return [];
    const unique = Array.from(new Set(props.activityNames));
    return unique
        .filter(name => name.toLowerCase().includes(query))
        .slice(0, 6);
});
// ============================================
// MÉTODOS
// ============================================
/**
 * Emite los filtros actualizados
 */
const emitFilters = () => {
    emit('update:modelValue', { ...localFilters.value });
};
/**
 * Emite con debounce (para búsqueda por texto)
 */
const debouncedEmit = () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    showSuggestions.value = true;
    searchTimeout = window.setTimeout(() => {
        emitFilters();
    }, 500); // Espera 500ms después de que el usuario deje de escribir
};
const selectSuggestion = (value) => {
    localFilters.value.busqueda = value;
    showSuggestions.value = false;
    emitFilters();
};
/**
 * Limpia todos los filtros
 */
const clearFilters = () => {
    localFilters.value = {
        tipo: undefined,
        modalidad: undefined,
        carrera_id: undefined,
        busqueda: '',
        solo_gratuitos: false,
        solo_disponibles: false
    };
    emitFilters();
};
// ============================================
// WATCHERS
// ============================================
/**
 * Sincroniza los filtros externos con los locales
 */
watch(() => props.modelValue, (newFilters) => {
    localFilters.value = { ...newFilters };
}, { deep: true });
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
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
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
if (__VLS_ctx.hasActiveFilters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "text-sm text-purple-600 hover:text-purple-700 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-purple-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "relative" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.debouncedEmit) },
    ...{ onFocus: (...[$event]) => {
            __VLS_ctx.showSuggestions = true;
            // @ts-ignore
            [hasActiveFilters, clearFilters, debouncedEmit, showSuggestions,];
        } },
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.showSuggestions = false;
            // @ts-ignore
            [showSuggestions,];
        } },
    value: (__VLS_ctx.localFilters.busqueda),
    type: "text",
    placeholder: "Buscar por nombre o descripción...",
    ...{ class: "w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-10']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
});
if (__VLS_ctx.showSuggestions && __VLS_ctx.matchingSuggestions.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    for (const [option] of __VLS_vFor((__VLS_ctx.matchingSuggestions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.showSuggestions && __VLS_ctx.matchingSuggestions.length > 0))
                        return;
                    __VLS_ctx.selectSuggestion(option);
                    // @ts-ignore
                    [showSuggestions, localFilters, matchingSuggestions, matchingSuggestions, selectSuggestion,];
                } },
            key: (option),
            type: "button",
            ...{ class: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-purple-50']} */ ;
        (option);
        // @ts-ignore
        [];
    }
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-2" },
});
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center space-x-2 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.emitFilters) },
    type: "radio",
    value: (undefined),
    ...{ class: "w-4 h-4 text-purple-600 focus:ring-purple-500" },
});
(__VLS_ctx.localFilters.tipo);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-700" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center space-x-2 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.emitFilters) },
    type: "radio",
    value: "CURSO",
    ...{ class: "w-4 h-4 text-purple-600 focus:ring-purple-500" },
});
(__VLS_ctx.localFilters.tipo);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-700" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center space-x-2 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.emitFilters) },
    type: "radio",
    value: "EVENTO",
    ...{ class: "w-4 h-4 text-purple-600 focus:ring-purple-500" },
});
(__VLS_ctx.localFilters.tipo);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-700" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.emitFilters) },
    value: (__VLS_ctx.localFilters.modalidad),
    ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (undefined),
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
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.emitFilters) },
    value: (__VLS_ctx.localFilters.carrera_id),
    ...{ class: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (undefined),
});
for (const [career] of __VLS_vFor((__VLS_ctx.careers))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (career.id_carrera),
        value: (career.id_carrera),
        ...{ class: "py-2" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    (career.nombre);
    // @ts-ignore
    [localFilters, localFilters, localFilters, localFilters, localFilters, emitFilters, emitFilters, emitFilters, emitFilters, emitFilters, careers,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-2 pt-2 border-t border-gray-200" },
});
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center space-x-2 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.emitFilters) },
    type: "checkbox",
    ...{ class: "w-4 h-4 text-purple-600 rounded focus:ring-purple-500" },
});
(__VLS_ctx.localFilters.solo_gratuitos);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-700" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "flex items-center space-x-2 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.emitFilters) },
    type: "checkbox",
    ...{ class: "w-4 h-4 text-purple-600 rounded focus:ring-purple-500" },
});
(__VLS_ctx.localFilters.solo_disponibles);
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-purple-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm text-gray-700" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
// @ts-ignore
[localFilters, localFilters, emitFilters, emitFilters,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
//# sourceMappingURL=ActivityFilters.vue.js.map