// ============================================
// TIPOS DE ENUMS Y CONSTANTES
// ============================================

/**
 * Tipo de usuario en el sistema
 * INTERNO: Usuarios de la UMSA (autenticación con SIA)
 * EXTERNO: Usuarios externos que se registran en el sistema
 */
export type TipoUsuario = 'INTERNO' | 'EXTERNO';

/**
 * Roles disponibles en el sistema
 * - ADMINISTRADOR: Acceso total al sistema
 * - COORDINADOR: Gestión de cursos de su carrera
 * - DOCENTE: Registro de calificaciones y confirmación
 * - PARTICIPANTE: Inscripción y descarga de certificados
 * - AUXILIAR: Solo registro de asistencia en eventos asignados
 * - DISENADOR: Solo gestión de plantillas (ROL FIJO)
 */
export type Rol = 
  | 'ADMINISTRADOR' 
  | 'COORDINADOR' 
  | 'DOCENTE' 
  | 'PARTICIPANTE' 
  | 'AUXILIAR' 
  | 'DISENADOR';

/**
 * Tipo de actividad académica
 * CURSO: Curso complementario con calificaciones
 * EVENTO: Evento facultativo con asistencia
 */
export type TipoActividad = 'CURSO' | 'EVENTO';

/**
 * Modalidad de la actividad
 */
export type Modalidad = 'PRESENCIAL' | 'VIRTUAL' | 'MIXTO';

/**
 * Estado de la actividad
 */
export type EstadoActividad = 'ABIERTO' | 'LLENO' | 'FINALIZADO';

/**
 * Unidad de duración de un curso
 */
export type UnidadDuracion = 'días' | 'semanas' | 'meses';

/**
 * Estado de inscripción
 */
export type EstadoInscripcion = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';

// ============================================
// INTERFACES DE USUARIO Y AUTENTICACIÓN
// ============================================

/**
 * Interface del usuario en el sistema
 */
export interface Usuario {
  id_usuario: number;
  username: string; // RU para UMSA, username para externos
  nombres: string;
  apellidos: string;
  email: string;
  tipo_usuario: TipoUsuario;
  email_verificado: boolean;
  estado: 'ACTIVO' | 'INACTIVO';
  roles: Rol[]; // Un usuario puede tener múltiples roles (excepto DISENADOR)
  fecha_registro: string;
}

/**
 * Interface para el login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Interface para registro de usuarios externos
 */
export interface RegisterData {
  username: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  password_confirmacion: string;
}

/**
 * Interface para la respuesta de autenticación
 */
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

// ============================================
// INTERFACES DE ACTIVIDADES (CURSOS/EVENTOS)
// ============================================

/**
 * Interface de Carrera
 */
export interface Carrera {
  id_carrera: number;
  nombre: string;
  descripcion?: string;
  estado: 'ACTIVA' | 'INACTIVA';
}

/**
 * Interface de Actividad (Curso o Evento)
 * Esta es la información que se mostrará en el catálogo público
 */
export interface Actividad {
  id_actividad: number;
  tipo: TipoActividad;
  nombre: string;
  descripcion: string;
  carga_horaria: number; // Horas académicas
  duracion?: number | null; // Duración en horas (nullable)
  unidad?: UnidadDuracion | null; // Unidad de duración
  modalidad: Modalidad;
  fecha_inicio: string; // Formato ISO: "2024-01-15"
  fecha_fin: string;
  cupo_maximo: number;
  cupos_disponibles: number; // Calculado: cupo_maximo - inscritos
  
  // Precios diferenciados
  costo_externo: number; // Precio para usuarios externos
  costo_umsa: number; // Precio preferencial para UMSA
  es_gratuito: boolean;
  
  nota_minima_aprobacion?: number; // Solo para cursos
  estado: EstadoActividad;
  carrera?: Carrera; // Información de la carrera
  
  // Imagen y ubicación
  imagen?: string; // URL de la imagen (por defecto si no está disponible)
  lugar?: string | null; // Ubicación del curso/evento
  
  fecha_creacion: string;
}

/**
 * Interface para mostrar el precio según el tipo de usuario
 * Útil para el frontend
 */
export interface PrecioActividad {
  actividad_id: number;
  precio_a_pagar: number; // El precio que le corresponde al usuario actual
  tipo_precio: 'EXTERNO' | 'UMSA';
  es_gratuito: boolean;
}

// ============================================
// INTERFACES DE INSCRIPCIÓN
// ============================================

/**
 * Interface de Inscripción
 */
export interface Inscripcion {
  id_inscripcion: number;
  usuario: Usuario;
  actividad: Actividad;
  tipo_precio: 'EXTERNO' | 'UMSA';
  monto_pagado: number;
  fecha_inscripcion: string;
  estado: EstadoInscripcion;
}

// ============================================
// INTERFACES PARA FILTROS Y BÚSQUEDA
// ============================================

/**
 * Interface para filtros del catálogo
 */
export interface FiltrosActividad {
  tipo?: TipoActividad;
  modalidad?: Modalidad;
  carrera_id?: number;
  busqueda?: string; // Búsqueda por nombre
  solo_gratuitos?: boolean;
  solo_disponibles?: boolean; // Solo con cupos disponibles
}

// ============================================
// INTERFACES DE ESTADO DE LA APLICACIÓN
// ============================================

/**
 * Interface para el estado de autenticación
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: Usuario | null;
  token: string | null;
  currentRole: Rol | null; // Rol activo actual (para cambio de rol)
}

/**
 * Interface para mensajes de alerta/notificación
 */
export interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // milisegundos
}