/**
 * Utilidades para formateo de fechas
 * Maneja correctamente las fechas ISO sin zona horaria
 */
/**
 * Parsea una fecha ISO string como si fuera en la zona horaria local
 * en lugar de UTC. Esto evita el desplazamiento de un día.
 * @param dateString - Fecha en formato ISO (ej: "2026-06-13" o "2026-06-13T14:30:00")
 * @returns Date object interpretado en zona horaria local
 */
export const parseLocalDate = (dateString) => {
    // Si no tiene hora, es solo una fecha
    if (dateString.length === 10) {
        // "2026-06-13" -> crear date sin zona horaria
        const [year, month, day] = dateString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Si tiene "T" es un datetime ISO
    // Reemplazar "T" con espacio y parsear como local
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours = '0', minutes = '0', seconds = '0'] = (timePart?.split(':') || []);
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
};
/**
 * Formatea una fecha para mostrar solo la fecha (sin hora)
 * @param dateString - Fecha en formato ISO
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Fecha formateada (ej: "13 jun. 2026")
 */
export const formatDate = (dateString, locale = 'es-ES') => {
    if (!dateString)
        return '-';
    try {
        const date = parseLocalDate(dateString);
        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
    catch {
        return '-';
    }
};
/**
 * Formatea una fecha y hora completa
 * @param dateString - Fecha en formato ISO
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Fecha y hora formateadas (ej: "13 jun. 2026, 14:30")
 */
export const formatDateTime = (dateString, locale = 'es-ES') => {
    if (!dateString)
        return '-';
    try {
        const date = parseLocalDate(dateString);
        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    catch {
        return '-';
    }
};
/**
 * Formatea un rango de fechas
 * Si inicio y fin están en el mismo día, solo muestra ese día
 * Si están en diferentes días, muestra "inicio - fin"
 * @param startDateString - Fecha inicio en formato ISO
 * @param endDateString - Fecha fin en formato ISO
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Rango de fechas formateado
 */
export const formatDateRange = (startDateString, endDateString, locale = 'es-ES') => {
    if (!startDateString || !endDateString)
        return '-';
    try {
        const startDate = parseLocalDate(startDateString);
        const endDate = parseLocalDate(endDateString);
        const formatSingleDate = (date) => {
            return date.toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        };
        // Comparar solo la fecha, ignorando hora
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        if (startDateOnly.getTime() === endDateOnly.getTime()) {
            return formatSingleDate(startDate);
        }
        return `${formatSingleDate(startDate)} - ${formatSingleDate(endDate)}`;
    }
    catch {
        return '-';
    }
};
/**
 * Formatea solo la hora de una fecha
 * @param dateString - Fecha en formato ISO
 * @returns Hora formateada (ej: "14:30")
 */
export const formatTime = (dateString) => {
    if (!dateString)
        return '-';
    try {
        const date = parseLocalDate(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    catch {
        return '-';
    }
};
//# sourceMappingURL=dateFormatter.js.map