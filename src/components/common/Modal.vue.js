import { computed, watch } from 'vue';
const props = withDefaults(defineProps(), {
    title: '',
    size: 'md',
    showClose: true,
    closeOnOverlay: true,
    noPadding: false
});
const emit = defineEmits();
/**
 * Cierra el modal
 */
const close = () => {
    emit('update:modelValue', false);
    emit('close');
};
/**
 * Clases del modal según el tamaño
 */
const modalClasses = computed(() => {
    const base = 'relative bg-white rounded-lg shadow-2xl w-full transform transition-all';
    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-7xl'
    };
    return `${base} ${sizes[props.size]}`;
});
/**
 * Clases del body
 */
const bodyClasses = computed(() => {
    return props.noPadding ? '' : 'p-6';
});
/**
 * Bloquear scroll del body cuando el modal está abierto
 */
watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    }
    else {
        document.body.style.overflow = '';
    }
});
const __VLS_defaults = {
    title: '',
    size: 'md',
    showClose: true,
    closeOnOverlay: true,
    noPadding: false
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
/** @type {__VLS_StyleScopedClasses['modal-enter-active']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-leave-active']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-leave-to']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    name: "modal",
}));
const __VLS_8 = __VLS_7({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.closeOnOverlay && __VLS_ctx.close();
                // @ts-ignore
                [modelValue, closeOnOverlay, close,];
            } },
        ...{ class: "fixed inset-0 z-50 overflow-y-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "fixed inset-0 bg-black/50 backdrop-blur-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-h-full items-center justify-center p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: (__VLS_ctx.modalClasses) },
    });
    if (__VLS_ctx.$slots.header || __VLS_ctx.title) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center justify-between px-6 py-4 border-b border-gray-200" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        var __VLS_12 = {};
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-xl font-semibold text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (__VLS_ctx.title);
        if (__VLS_ctx.showClose) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.close) },
                ...{ class: "text-gray-400 hover:text-gray-600 transition-colors" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                ...{ class: "w-6 h-6" },
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
            });
            /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M6 18L18 6M6 6l12 12",
            });
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (__VLS_ctx.bodyClasses) },
    });
    var __VLS_14 = {};
    if (__VLS_ctx.$slots.footer) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "px-6 py-4 border-t border-gray-200 bg-gray-50" },
        });
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
        var __VLS_16 = {};
    }
}
// @ts-ignore
[close, modalClasses, $slots, $slots, title, title, showClose, bodyClasses,];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_13 = __VLS_12, __VLS_15 = __VLS_14, __VLS_17 = __VLS_16;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
//# sourceMappingURL=Modal.vue.js.map