import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const containerWidthClass = computed(() => {
    if (route.name === 'register')
        return 'max-w-5xl';
    return 'max-w-md';
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-h-screen relative overflow-hidden bg-slate-950 text-slate-900 flex items-center justify-center px-4 py-12" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-950']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_20%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(16,185,129,0.16),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]" },
});
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[radial-gradient(900px_circle_at_10%_20%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(16,185,129,0.16),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "absolute -top-24 -left-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" },
});
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-top-24']} */ ;
/** @type {__VLS_StyleScopedClasses['-left-20']} */ ;
/** @type {__VLS_StyleScopedClasses['h-72']} */ ;
/** @type {__VLS_StyleScopedClasses['w-72']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-amber-400/20']} */ ;
/** @type {__VLS_StyleScopedClasses['blur-3xl']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" },
});
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-bottom-24']} */ ;
/** @type {__VLS_StyleScopedClasses['-right-16']} */ ;
/** @type {__VLS_StyleScopedClasses['h-80']} */ ;
/** @type {__VLS_StyleScopedClasses['w-80']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-emerald-400/20']} */ ;
/** @type {__VLS_StyleScopedClasses['blur-3xl']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "relative w-full text-left" },
    ...{ class: (__VLS_ctx.containerWidthClass) },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
routerView;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
// @ts-ignore
[containerWidthClass,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=AuthLayout.vue.js.map