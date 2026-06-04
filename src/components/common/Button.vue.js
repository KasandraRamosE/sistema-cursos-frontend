import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    fullWidth: false,
    iconLeft: false,
    iconRight: false
});
const emit = defineEmits();
/**
 * Maneja el click del botón
 */
const handleClick = (event) => {
    if (!props.disabled && !props.loading) {
        emit('click', event);
    }
};
/**
 * Clases CSS computadas según las props
 */
const buttonClasses = computed(() => {
    const classes = [
        // Clases base
        'inline-flex items-center justify-center',
        'font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        // Ancho completo
        props.fullWidth ? 'w-full' : '',
        // Estado deshabilitado o cargando
        (props.disabled || props.loading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
    ];
    // Tamaños
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };
    classes.push(sizeClasses[props.size]);
    // Variantes
    const variantClasses = {
        primary: [
            'bg-slate-900',
            'text-white',
            'hover:bg-slate-800',
            'focus:ring-slate-600'
        ],
        secondary: [
            'bg-gray-600 text-white',
            'hover:bg-gray-700',
            'focus:ring-gray-500'
        ],
        success: [
            'bg-green-600 text-white',
            'hover:bg-green-700',
            'focus:ring-green-500'
        ],
        danger: [
            'bg-red-600 text-white',
            'hover:bg-red-700',
            'focus:ring-red-500'
        ],
        warning: [
            'bg-yellow-500 text-white',
            'hover:bg-yellow-600',
            'focus:ring-yellow-500'
        ],
        outline: [
            'border-2 border-purple-600 text-purple-600',
            'hover:bg-purple-50',
            'focus:ring-purple-500'
        ],
        ghost: [
            'text-gray-700',
            'hover:bg-gray-100',
            'focus:ring-gray-400'
        ]
    };
    classes.push(...variantClasses[props.variant]);
    return classes.join(' ');
});
const __VLS_defaults = {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    fullWidth: false,
    iconLeft: false,
    iconRight: false
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
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleClick) },
    type: (__VLS_ctx.type),
    disabled: (__VLS_ctx.disabled || __VLS_ctx.loading),
    ...{ class: (__VLS_ctx.buttonClasses) },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "mr-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "animate-spin h-4 w-4" },
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle, __VLS_intrinsics.circle)({
        ...{ class: "opacity-25" },
        cx: "12",
        cy: "12",
        r: "10",
        stroke: "currentColor",
        'stroke-width': "4",
    });
    /** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path, __VLS_intrinsics.path)({
        ...{ class: "opacity-75" },
        fill: "currentColor",
        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
    });
    /** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
}
if (__VLS_ctx.iconLeft && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "mr-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
    var __VLS_0 = {};
}
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
var __VLS_2 = {};
if (__VLS_ctx.iconRight && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ml-2" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
    var __VLS_4 = {};
}
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2, __VLS_5 = __VLS_4;
// @ts-ignore
[handleClick, type, disabled, loading, loading, loading, loading, buttonClasses, iconLeft, iconRight,];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
//# sourceMappingURL=Button.vue.js.map