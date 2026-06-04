import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    title: '',
    variant: 'default',
    noPadding: false,
    hoverable: false,
    fullWidth: false
});
/**
 * Clases CSS para la tarjeta
 */
const cardClasses = computed(() => {
    const classes = [
        'bg-white rounded-lg overflow-hidden',
        props.fullWidth ? 'w-full' : ''
    ];
    // Variantes
    const variants = {
        default: 'shadow-md',
        bordered: 'border-2 border-gray-200',
        elevated: 'shadow-xl',
        flat: 'shadow-none'
    };
    classes.push(variants[props.variant]);
    // Efecto hover
    if (props.hoverable) {
        classes.push('transition-all duration-200 hover:shadow-2xl hover:scale-105 cursor-pointer');
    }
    return classes.join(' ');
});
/**
 * Clases CSS para el body
 */
const bodyClasses = computed(() => {
    return props.noPadding ? '' : 'p-6';
});
const __VLS_defaults = {
    title: '',
    variant: 'default',
    noPadding: false,
    hoverable: false,
    fullWidth: false
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (__VLS_ctx.cardClasses) },
});
if (__VLS_ctx.$slots.header || __VLS_ctx.title) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "px-6 py-4 border-b border-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    var __VLS_0 = {};
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.title);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (__VLS_ctx.bodyClasses) },
});
var __VLS_2 = {};
if (__VLS_ctx.$slots.footer) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "px-6 py-4 border-t border-gray-200 bg-gray-50" },
    });
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    var __VLS_4 = {};
}
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2, __VLS_5 = __VLS_4;
// @ts-ignore
[cardClasses, $slots, $slots, title, title, bodyClasses,];
const __VLS_base = (await import('vue')).defineComponent({
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
//# sourceMappingURL=Card.vue.js.map