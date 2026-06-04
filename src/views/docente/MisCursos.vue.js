import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/utils/api';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const paralelosDocente = ref([]);
const normalizeName = (value) => {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
};
const loadCursos = async () => {
    loading.value = true;
    try {
        const docenteNombre = normalizeName(authStore.fullName || '');
        const cursos = await api.get('/cursos');
        const paralelos = [];
        cursos.forEach(curso => {
            const nombreCurso = String(curso.nombre ?? '');
            const nombreCarrera = String(curso.nombreCarrera ?? '');
            const idCurso = Number(curso.idCurso ?? 0);
            const paralelosCurso = Array.isArray(curso.paralelos)
                ? curso.paralelos
                : [];
            paralelosCurso.forEach(paralelo => {
                const nombreDocente = normalizeName(String(paralelo.nombreDocente ?? ''));
                if (!docenteNombre || nombreDocente !== docenteNombre)
                    return;
                paralelos.push({
                    idCurso,
                    codigo: String(paralelo.codigo ?? ''),
                    nombreCurso,
                    nombreCarrera,
                    modalidad: String(paralelo.modalidad ?? 'PRESENCIAL'),
                    horarioDescripcion: String(paralelo.horarioDescripcion ?? ''),
                    inscritos: Number(paralelo.inscritos ?? 0),
                    link: String(paralelo.link ?? '')
                });
            });
        });
        paralelosDocente.value = paralelos;
    }
    catch (error) {
        console.error('Error al cargar cursos del docente:', error);
    }
    finally {
        loading.value = false;
    }
};
const goToCalificaciones = (paralelo) => {
    router.push({
        name: 'teacher-grades',
        query: { curso: String(paralelo.idCurso), paralelo: paralelo.codigo }
    });
};
onMounted(() => {
    loadCursos();
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
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
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
const __VLS_6 = Button || Button;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}));
const __VLS_8 = __VLS_7({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
let __VLS_11;
const __VLS_12 = ({ click: {} },
    { onClick: (__VLS_ctx.loadCursos) });
const { default: __VLS_13 } = __VLS_9.slots;
// @ts-ignore
[loadCursos,];
var __VLS_9;
var __VLS_10;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-10 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 space-y-5" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-5']} */ ;
    if (__VLS_ctx.paralelosDocente.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rounded-lg border border-dashed border-slate-200 p-6 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4 lg:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
        for (const [paralelo] of __VLS_vFor((__VLS_ctx.paralelosDocente))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (`${paralelo.idCurso}-${paralelo.codigo}`),
                ...{ class: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-start justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs uppercase tracking-wide text-slate-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
            (paralelo.nombreCarrera);
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
                ...{ class: "text-lg font-semibold text-slate-900" },
            });
            /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
            (paralelo.nombreCurso);
            (paralelo.codigo);
            const __VLS_14 = Badge || Badge;
            // @ts-ignore
            const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
                variant: "info",
                size: "sm",
            }));
            const __VLS_16 = __VLS_15({
                variant: "info",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_15));
            const { default: __VLS_19 } = __VLS_17.slots;
            (paralelo.modalidad);
            // @ts-ignore
            [loading, paralelosDocente, paralelosDocente,];
            var __VLS_17;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-3 space-y-1 text-sm text-slate-600" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (paralelo.horarioDescripcion || 'Horario por confirmar');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (paralelo.inscritos);
            if (paralelo.link) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-emerald-700" },
                });
                /** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4 flex items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_20 = Button || Button;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                ...{ 'onClick': {} },
                size: "sm",
            }));
            const __VLS_22 = __VLS_21({
                ...{ 'onClick': {} },
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            let __VLS_25;
            const __VLS_26 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.paralelosDocente.length === 0))
                            return;
                        __VLS_ctx.goToCalificaciones(paralelo);
                        // @ts-ignore
                        [goToCalificaciones,];
                    } });
            const { default: __VLS_27 } = __VLS_23.slots;
            // @ts-ignore
            [];
            var __VLS_23;
            var __VLS_24;
            if (paralelo.link) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                    href: (paralelo.link),
                    target: "_blank",
                    rel: "noreferrer",
                    ...{ class: "text-xs font-semibold text-emerald-700 hover:text-emerald-800" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-emerald-700']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-emerald-800']} */ ;
            }
            // @ts-ignore
            [];
        }
    }
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=MisCursos.vue.js.map