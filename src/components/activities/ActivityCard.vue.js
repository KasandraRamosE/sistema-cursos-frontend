import { computed } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import { formatDateRange } from '@/utils/dateFormatter';
const props = defineProps();
const __VLS_emit = defineEmits();
// ============================================
// MÉTODOS
// ============================================
/**
 * Obtiene la variante del badge según el estado
 */
const getEstadoBadgeVariant = () => {
    switch (props.activity.estado) {
        case 'ABIERTO':
            return 'success';
        case 'LLENO':
            return 'warning';
        case 'FINALIZADO':
            return 'gray';
        default:
            return 'gray';
    }
};
/**
 * Obtiene la etiqueta del estado
 */
const getEstadoLabel = () => {
    switch (props.activity.estado) {
        case 'ABIERTO':
            return 'Abierto';
        case 'LLENO':
            return 'Lleno';
        case 'FINALIZADO':
            return 'Finalizado';
        default:
            return props.activity.estado;
    }
};
/**
 * Obtiene la etiqueta de la modalidad
 */
const getModalidadLabel = () => {
    switch (props.activity.modalidad) {
        case 'PRESENCIAL':
            return 'Presencial';
        case 'VIRTUAL':
            return 'Virtual';
        case 'MIXTO':
            return 'Mixto';
        default:
            return props.activity.modalidad;
    }
};
/**
 * Formatea el rango de fechas
 */
const formatDateRangeDisplay = () => {
    return formatDateRange(props.activity.fecha_inicio, props.activity.fecha_fin);
};
const formatDurationUnit = (unidad) => {
    switch (unidad) {
        case 'días':
            return 'días';
        case 'semanas':
            return 'semanas';
        case 'meses':
            return 'meses';
        default:
            return 'horas';
    }
};
const hasDurationInfo = computed(() => props.activity.duracion != null && Boolean(props.activity.unidad));
/**
 * Obtiene el color según los cupos disponibles
 */
const getCuposColor = () => {
    const porcentaje = (props.activity.cupos_disponibles / props.activity.cupo_maximo) * 100;
    if (porcentaje === 0)
        return 'text-red-600';
    if (porcentaje < 20)
        return 'text-orange-600';
    if (porcentaje < 50)
        return 'text-yellow-600';
    return 'text-green-600';
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
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    hoverable: (true),
    ...{ class: "h-full flex flex-col overflow-hidden" },
}));
const __VLS_2 = __VLS_1({
    hoverable: (true),
    ...{ class: "h-full flex flex-col overflow-hidden" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
{
    const { header: __VLS_7 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-full h-40 -mx-4 -mt-4 mb-2 overflow-hidden bg-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['-mx-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['-mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.activity.imagen),
        alt: (__VLS_ctx.activity.nombre),
        ...{ class: "w-full h-full object-cover" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
    // @ts-ignore
    [activity, activity,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex-1 space-y-3" },
});
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_8 = Badge || Badge;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    variant: (__VLS_ctx.activity.tipo === 'CURSO' ? 'primary' : 'secondary'),
    size: "sm",
}));
const __VLS_10 = __VLS_9({
    variant: (__VLS_ctx.activity.tipo === 'CURSO' ? 'primary' : 'secondary'),
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
(__VLS_ctx.activity.tipo);
// @ts-ignore
[activity, activity,];
var __VLS_11;
const __VLS_14 = Badge || Badge;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
    variant: (__VLS_ctx.getEstadoBadgeVariant()),
    size: "sm",
    dot: (true),
}));
const __VLS_16 = __VLS_15({
    variant: (__VLS_ctx.getEstadoBadgeVariant()),
    size: "sm",
    dot: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_19 } = __VLS_17.slots;
(__VLS_ctx.getEstadoLabel());
// @ts-ignore
[getEstadoBadgeVariant, getEstadoLabel,];
var __VLS_17;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-bold text-gray-800 line-clamp-2" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
(__VLS_ctx.activity.nombre);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-2 text-sm" },
});
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
if (__VLS_ctx.activity.carrera) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center space-x-2 text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-4 h-4 flex-shrink-0" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "line-clamp-1" },
    });
    /** @type {__VLS_StyleScopedClasses['line-clamp-1']} */ ;
    (__VLS_ctx.activity.carrera.nombre);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center space-x-2 text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-4 h-4 flex-shrink-0" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.getModalidadLabel());
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center space-x-2 text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-4 h-4 flex-shrink-0" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.activity.carga_horaria);
if (__VLS_ctx.hasDurationInfo) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xs text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.activity.duracion);
    (__VLS_ctx.formatDurationUnit(__VLS_ctx.activity.unidad));
}
if (__VLS_ctx.activity.lugar) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center space-x-2 text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-4 h-4 flex-shrink-0" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "line-clamp-1" },
    });
    /** @type {__VLS_StyleScopedClasses['line-clamp-1']} */ ;
    (__VLS_ctx.activity.lugar);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center space-x-2 text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-4 h-4 flex-shrink-0" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.formatDateRangeDisplay());
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center space-x-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-4 h-4 flex-shrink-0" },
    ...{ class: (__VLS_ctx.getCuposColor()) },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: (__VLS_ctx.getCuposColor()) },
});
(__VLS_ctx.activity.cupos_disponibles);
(__VLS_ctx.activity.cupo_maximo);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "pt-2 border-t border-gray-200" },
});
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
if (__VLS_ctx.activity.es_gratuito) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_20 = Badge || Badge;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        variant: "success",
        ...{ class: "w-full justify-center" },
    }));
    const __VLS_22 = __VLS_21({
        variant: "success",
        ...{ class: "w-full justify-center" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    const { default: __VLS_25 } = __VLS_23.slots;
    // @ts-ignore
    [activity, activity, activity, activity, activity, activity, activity, activity, activity, activity, activity, getModalidadLabel, hasDurationInfo, formatDurationUnit, formatDateRangeDisplay, getCuposColor, getCuposColor,];
    var __VLS_23;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-2 gap-2 text-xs" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "font-bold text-purple-600" },
    });
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
    (__VLS_ctx.activity.costo_umsa);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "font-bold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.activity.costo_externo);
}
{
    const { footer: __VLS_26 } = __VLS_3.slots;
    const __VLS_27 = Button || Button;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        ...{ class: "w-full" },
    }));
    const __VLS_29 = __VLS_28({
        ...{ 'onClick': {} },
        variant: "outline",
        size: "sm",
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    let __VLS_32;
    const __VLS_33 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.$emit('view-detail', __VLS_ctx.activity.id_actividad, __VLS_ctx.activity.tipo);
                // @ts-ignore
                [activity, activity, activity, activity, $emit,];
            } });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    const { default: __VLS_34 } = __VLS_30.slots;
    // @ts-ignore
    [];
    var __VLS_30;
    var __VLS_31;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
//# sourceMappingURL=ActivityCard.vue.js.map