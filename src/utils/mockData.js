/**
 * Datos mock para desarrollo
 * Simulan cursos y eventos de la base de datos
 */
// ============================================
// CARRERAS MOCK
// ============================================
export const mockCareers = [
    {
        id_carrera: 1,
        nombre: 'Psicología',
        descripcion: 'Carrera de Psicología',
        estado: 'ACTIVA'
    },
    {
        id_carrera: 2,
        nombre: 'Ciencias de la Educación',
        descripcion: 'Carrera de Ciencias de la Educación',
        estado: 'ACTIVA'
    },
    {
        id_carrera: 3,
        nombre: 'Filosofía',
        descripcion: 'Carrera de Filosofía',
        estado: 'ACTIVA'
    },
    {
        id_carrera: 4,
        nombre: 'Lingüística e Idiomas',
        descripcion: 'Carrera de Lingüística e Idiomas',
        estado: 'ACTIVA'
    },
    {
        id_carrera: 5,
        nombre: 'Trabajo Social',
        descripcion: 'Carrera de Trabajo Social',
        estado: 'ACTIVA'
    }
];
// ============================================
// ACTIVIDADES MOCK (CURSOS Y EVENTOS)
// ============================================
export const mockActivities = [
    // CURSOS COMPLEMENTARIOS
    {
        id_actividad: 1,
        tipo: 'CURSO',
        nombre: 'Introducción a la Psicología Clínica',
        descripcion: 'Curso básico sobre fundamentos de psicología clínica, técnicas de evaluación y principios de intervención terapéutica.',
        carga_horaria: 40,
        modalidad: 'PRESENCIAL',
        fecha_inicio: '2025-02-10',
        fecha_fin: '2025-03-15',
        cupo_maximo: 30,
        cupos_disponibles: 12,
        costo_externo: 350,
        costo_umsa: 200,
        es_gratuito: false,
        nota_minima_aprobacion: 51,
        estado: 'ABIERTO',
        carrera: mockCareers[0],
        fecha_creacion: '2025-01-15T10:00:00'
    },
    {
        id_actividad: 2,
        tipo: 'CURSO',
        nombre: 'Metodología de la Investigación Cualitativa',
        descripcion: 'Aprende técnicas y herramientas para realizar investigación cualitativa en ciencias sociales.',
        carga_horaria: 32,
        modalidad: 'VIRTUAL',
        fecha_inicio: '2025-02-20',
        fecha_fin: '2025-03-20',
        cupo_maximo: 50,
        cupos_disponibles: 35,
        costo_externo: 400,
        costo_umsa: 250,
        es_gratuito: false,
        nota_minima_aprobacion: 51,
        estado: 'ABIERTO',
        carrera: mockCareers[1],
        fecha_creacion: '2025-01-18T14:30:00'
    },
    {
        id_actividad: 3,
        tipo: 'CURSO',
        nombre: 'Filosofía Contemporánea',
        descripcion: 'Análisis de las principales corrientes filosóficas del siglo XX y XXI.',
        carga_horaria: 48,
        modalidad: 'MIXTO',
        fecha_inicio: '2025-02-15',
        fecha_fin: '2025-04-10',
        cupo_maximo: 25,
        cupos_disponibles: 8,
        costo_externo: 450,
        costo_umsa: 300,
        es_gratuito: false,
        nota_minima_aprobacion: 51,
        estado: 'ABIERTO',
        carrera: mockCareers[2],
        fecha_creacion: '2025-01-20T09:15:00'
    },
    {
        id_actividad: 4,
        tipo: 'CURSO',
        nombre: 'Inglés Académico - Nivel Intermedio',
        descripcion: 'Curso de inglés enfocado en la comprensión de textos académicos y redacción científica.',
        carga_horaria: 60,
        modalidad: 'PRESENCIAL',
        fecha_inicio: '2025-03-01',
        fecha_fin: '2025-05-15',
        cupo_maximo: 20,
        cupos_disponibles: 20,
        costo_externo: 500,
        costo_umsa: 350,
        es_gratuito: false,
        nota_minima_aprobacion: 61,
        estado: 'ABIERTO',
        carrera: mockCareers[3],
        fecha_creacion: '2025-01-22T11:00:00'
    },
    {
        id_actividad: 5,
        tipo: 'CURSO',
        nombre: 'Intervención Comunitaria',
        descripcion: 'Estrategias y técnicas para el trabajo social en comunidades vulnerables.',
        carga_horaria: 36,
        modalidad: 'PRESENCIAL',
        fecha_inicio: '2025-02-25',
        fecha_fin: '2025-03-30',
        cupo_maximo: 15,
        cupos_disponibles: 0,
        costo_externo: 380,
        costo_umsa: 220,
        es_gratuito: false,
        nota_minima_aprobacion: 51,
        estado: 'LLENO',
        carrera: mockCareers[4],
        fecha_creacion: '2025-01-25T15:45:00'
    },
    // EVENTOS FACULTATIVOS
    {
        id_actividad: 6,
        tipo: 'EVENTO',
        nombre: 'Congreso Internacional de Psicología',
        descripcion: 'Tres días de conferencias magistrales, talleres y presentaciones de investigaciones en el campo de la psicología.',
        carga_horaria: 24,
        modalidad: 'PRESENCIAL',
        fecha_inicio: '2025-04-15',
        fecha_fin: '2025-04-17',
        cupo_maximo: 200,
        cupos_disponibles: 145,
        costo_externo: 150,
        costo_umsa: 50,
        es_gratuito: false,
        estado: 'ABIERTO',
        carrera: mockCareers[0],
        fecha_creacion: '2025-01-10T08:00:00'
    },
    {
        id_actividad: 7,
        tipo: 'EVENTO',
        nombre: 'Seminario: Innovación Educativa Post-Pandemia',
        descripcion: 'Análisis de las transformaciones en educación y nuevas metodologías de enseñanza.',
        carga_horaria: 8,
        modalidad: 'VIRTUAL',
        fecha_inicio: '2025-03-10',
        fecha_fin: '2025-03-10',
        cupo_maximo: 100,
        cupos_disponibles: 72,
        costo_externo: 0,
        costo_umsa: 0,
        es_gratuito: true,
        estado: 'ABIERTO',
        carrera: mockCareers[1],
        fecha_creacion: '2025-01-28T10:30:00'
    },
    {
        id_actividad: 8,
        tipo: 'EVENTO',
        nombre: 'Taller: Escritura Creativa y Narrativa',
        descripcion: 'Taller práctico de escritura con ejercicios de narrativa, poesía y ensayo.',
        carga_horaria: 12,
        modalidad: 'PRESENCIAL',
        fecha_inicio: '2025-03-05',
        fecha_fin: '2025-03-07',
        cupo_maximo: 30,
        cupos_disponibles: 18,
        costo_externo: 100,
        costo_umsa: 50,
        es_gratuito: false,
        estado: 'ABIERTO',
        carrera: mockCareers[2],
        fecha_creacion: '2025-01-26T13:20:00'
    },
    {
        id_actividad: 9,
        tipo: 'EVENTO',
        nombre: 'Conferencia: Derechos Humanos en América Latina',
        descripcion: 'Expertos internacionales analizan la situación actual de los derechos humanos en la región.',
        carga_horaria: 4,
        modalidad: 'MIXTO',
        fecha_inicio: '2025-02-28',
        fecha_fin: '2025-02-28',
        cupo_maximo: 150,
        cupos_disponibles: 150,
        costo_externo: 0,
        costo_umsa: 0,
        es_gratuito: true,
        estado: 'ABIERTO',
        carrera: mockCareers[4],
        fecha_creacion: '2025-01-27T16:00:00'
    },
    {
        id_actividad: 10,
        tipo: 'EVENTO',
        nombre: 'Jornadas de Investigación Estudiantil',
        descripcion: 'Presentación de proyectos de investigación realizados por estudiantes de la facultad.',
        carga_horaria: 16,
        modalidad: 'PRESENCIAL',
        fecha_inicio: '2025-05-20',
        fecha_fin: '2025-05-22',
        cupo_maximo: 80,
        cupos_disponibles: 65,
        costo_externo: 50,
        costo_umsa: 0,
        es_gratuito: false,
        estado: 'ABIERTO',
        fecha_creacion: '2025-01-29T09:45:00'
    }
];
/**
 * Función helper para filtrar actividades
 */
export const filterActivities = (activities, filters) => {
    return activities.filter(activity => {
        // Filtrar por tipo
        if (filters.tipo && activity.tipo !== filters.tipo)
            return false;
        // Filtrar por modalidad
        if (filters.modalidad && activity.modalidad !== filters.modalidad)
            return false;
        // Filtrar por carrera
        if (filters.carrera_id && activity.carrera?.id_carrera !== filters.carrera_id)
            return false;
        // Filtrar por búsqueda (nombre o descripción)
        if (filters.busqueda) {
            const searchLower = filters.busqueda.toLowerCase();
            const matchesSearch = activity.nombre.toLowerCase().includes(searchLower) ||
                activity.descripcion.toLowerCase().includes(searchLower);
            if (!matchesSearch)
                return false;
        }
        // Filtrar solo gratuitos
        if (filters.solo_gratuitos && !activity.es_gratuito)
            return false;
        // Filtrar solo con cupos disponibles
        if (filters.solo_disponibles && activity.cupos_disponibles === 0)
            return false;
        return true;
    });
};
//# sourceMappingURL=mockData.js.map