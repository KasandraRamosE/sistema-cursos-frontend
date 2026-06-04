import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import { api } from '@/utils/api';
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const idInscripcion = computed(() => Number(route.params.idInscripcion));
const monto = computed(() => Number(route.query.monto ?? 0));
const actividad = computed(() => {
    const nombre = route.query.actividad;
    return typeof nombre === 'string' ? nombre : '';
});
const verificarPago = async () => {
    if (!idInscripcion.value) {
        errorMessage.value = 'No se encontro la inscripcion.';
        return;
    }
    loading.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    try {
        const response = await api.post('/inscripciones/pago/confirmar', { idInscripcion: idInscripcion.value });
        const estadoPago = String(response.estado ?? 'APROBADO').toUpperCase();
        successMessage.value = 'Pago verificado. Redirigiendo...';
        setTimeout(() => {
            if (window.opener) {
                window.opener.postMessage({
                    type: 'payment:confirmed',
                    idInscripcion: idInscripcion.value,
                    estadoPago
                }, window.location.origin);
            }
            router.push('/participante/inscripciones');
            if (window.opener) {
                window.close();
            }
        }, 1200);
    }
    catch (error) {
        errorMessage.value = error.message || 'No se pudo verificar el pago.';
    }
    finally {
        loading.value = false;
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
    ...{ class: "min-h-screen bg-slate-50" },
});
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "container mx-auto px-4 py-10" },
});
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-10']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mx-auto max-w-lg space-y-6" },
});
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-3" },
});
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-2xl font-bold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rounded-lg border border-slate-200 bg-white p-4" },
});
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs uppercase text-slate-400" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-3xl font-bold text-emerald-700" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
(__VLS_ctx.monto);
if (__VLS_ctx.actividad) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    (__VLS_ctx.actividad);
}
// @ts-ignore
[monto, actividad, actividad,];
var __VLS_3;
const __VLS_6 = Card || Card;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-3" },
});
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
const __VLS_12 = Button || Button;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
    ...{ class: "w-full" },
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_17;
const __VLS_18 = ({ click: {} },
    { onClick: (__VLS_ctx.verificarPago) });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_19 } = __VLS_15.slots;
// @ts-ignore
[loading, verificarPago,];
var __VLS_15;
var __VLS_16;
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-rose-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-600']} */ ;
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-emerald-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-emerald-600']} */ ;
    (__VLS_ctx.successMessage);
}
// @ts-ignore
[errorMessage, errorMessage, successMessage, successMessage,];
var __VLS_9;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=PaymentSimulacion.vue.js.map