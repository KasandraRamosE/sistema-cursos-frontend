import { useAlertStore } from '@/stores/alert.store';
const alertStore = useAlertStore();
const alerts = alertStore.alerts;
const { remove } = alertStore;
const typeClass = (type) => {
    switch (type) {
        case 'success':
            return 'border-green-200 bg-green-50 text-green-900';
        case 'error':
            return 'border-red-200 bg-red-50 text-red-900';
        case 'warning':
            return 'border-yellow-200 bg-yellow-50 text-yellow-900';
        default:
            return 'border-blue-200 bg-blue-50 text-blue-900';
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2" },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['top-4']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.transitionGroup | typeof __VLS_components.TransitionGroup | typeof __VLS_components.transitionGroup | typeof __VLS_components.TransitionGroup} */
transitionGroup;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "toast",
    tag: "div",
    ...{ class: "flex flex-col gap-2" },
}));
const __VLS_2 = __VLS_1({
    name: "toast",
    tag: "div",
    ...{ class: "flex flex-col gap-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
for (const [alert] of __VLS_vFor((__VLS_ctx.alerts))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (alert.id),
        ...{ class: "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg" },
        ...{ class: (__VLS_ctx.typeClass(alert.type)) },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "leading-5" },
    });
    /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
    (alert.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.remove(alert.id);
                // @ts-ignore
                [alerts, typeClass, remove,];
            } },
        ...{ class: "rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-80 hover:opacity-100" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:opacity-100']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=ToastHost.vue.js.map