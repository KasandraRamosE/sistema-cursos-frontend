/**
 * Configuración del Router de Vue
 * Define todas las rutas de la aplicación organizadas por módulo
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

// ============================================
// IMPORTAR LAYOUTS
// ============================================
import PublicLayout from '@/layouts/PublicLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ParticipantLayout from '@/layouts/ParticipantLayout.vue'

// ============================================
// IMPORTAR VISTAS
// ============================================

// Vistas públicas
import Home from '@/views/public/Home.vue'

// Vistas de autenticación
import Login from '@/views/auth/Login.vue'

// Vistas de admin
import DashboardAdmin from '@/views/admin/DashboardAdmin.vue'

// Vistas de participante
import ParticipantDashboard from '@/views/participant/Dashboard.vue'

// ============================================
// DEFINICIÓN DE RUTAS
// ============================================

const routes: RouteRecordRaw[] = [
  // ==========================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ==========================================
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: Home,
        meta: {
          title: 'Inicio - FHCE Cursos y Eventos',
          requiresAuth: false
        }
      },
      {
        path: 'cursos',
        name: 'courses',
        component: Home,
        meta: {
          title: 'Cursos Complementarios',
          requiresAuth: false,
          defaultFilter: { tipo: 'CURSO' as const }
        }
      },
      {
        path: 'eventos',
        name: 'events',
        component: Home,
        meta: {
          title: 'Eventos Facultativos',
          requiresAuth: false,
          defaultFilter: { tipo: 'EVENTO' as const }
        }
      },
      {
        path: 'actividad/:id',
        name: 'activity-detail',
        component: () => import('@/views/public/ActivityDetail.vue'),
        meta: {
          title: 'Detalle de Actividad',
          requiresAuth: false
        }
      },
      {
        path: 'pago/:idInscripcion',
        name: 'payment-simulacion',
        component: () => import('@/views/public/PaymentSimulacion.vue'),
        meta: {
          title: 'Pago Simulado',
          requiresAuth: true,
          roles: ['PARTICIPANTE']
        }
      },
      {
        path: 'verificar/:codigo',
        name: 'verify-certificate',
        component: () => import('@/views/public/VerifyCertificate.vue'),
        meta: {
          title: 'Verificar Certificado',
          requiresAuth: false
        }
      },
      {
        path: 'verificar-certificado/:codigo',
        redirect: { name: 'verify-certificate' }
      }
    ]
  },

  // ==========================================
  // RUTAS DE AUTENTICACIÓN
  // ==========================================
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: Login,
        meta: {
          title: 'Iniciar Sesión',
          requiresAuth: false,
          requiresGuest: true
        }
      },
      {
        path: 'registro',
        name: 'register',
        component: () => import('@/views/auth/Register.vue'),
        meta: {
          title: 'Registrarse',
          requiresAuth: false,
          requiresGuest: true
        }
      },
      {
        path: 'verificar-email',
        name: 'verify-email',
        component: () => import('@/views/auth/VerifyEmail.vue'),
        meta: {
          title: 'Verificar Email',
          requiresAuth: false
        }
      }
      ,
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('@/views/auth/ResetPassword.vue'),
        meta: {
          title: 'Recuperar Contraseña',
          requiresAuth: false,
          requiresGuest: true
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE PARTICIPANTE (sin sidebar)
  // ==========================================
  {
    path: '/participante',
    component: ParticipantLayout,
    meta: {
      requiresAuth: true,
      roles: ['PARTICIPANTE']
    },
    children: [
      {
        path: '',
        name: 'participant-home',
        component: Home, // ← Catálogo de actividades
        meta: {
          title: 'Catálogo de Actividades',
          breadcrumb: false
        }
      },
      {
        path: 'cursos',
        name: 'participant-courses',
        component: Home,
        meta: {
          title: 'Cursos Disponibles',
          breadcrumb: 'Cursos',
          defaultFilter: { tipo: 'CURSO' as const }
        }
      },
      {
        path: 'eventos',
        name: 'participant-events',
        component: Home,
        meta: {
          title: 'Eventos Disponibles',
          breadcrumb: 'Eventos',
          defaultFilter: { tipo: 'EVENTO' as const }
        }
      },
      {
        path: 'inscripciones',
        name: 'participant-enrollments',
        component: () => import('@/views/participant/MisInscripciones.vue'),
        meta: {
          title: 'Mis Inscripciones',
          breadcrumb: 'Mis Inscripciones'
        }
      },
      {
        path: 'certificados',
        name: 'participant-certificates',
        component: () => import('@/views/participant/MisCertificados.vue'),
        meta: {
          title: 'Mis Certificados',
          breadcrumb: 'Mis Certificados'
        }
      },
      {
        path: 'perfil',
        name: 'participant-profile',
        component: () => import('@/views/participant/Perfil.vue'),
        meta: {
          title: 'Mi Perfil',
          breadcrumb: 'Mi Perfil'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE ADMINISTRADOR (con sidebar)
  // ==========================================
  {
    path: '/admin',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['ADMINISTRADOR'] // Usa "roles" en array
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: DashboardAdmin,
        meta: {
          title: 'Panel de Administrador',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'usuarios',
        name: 'admin-users',
        component: () => import('@/views/admin/Usuarios.vue'),
        meta: {
          title: 'Gestión de Usuarios',
          breadcrumb: 'Usuarios'
        }
      },
      {
        path: 'carreras',
        name: 'admin-careers',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear CareersView
        meta: {
          title: 'Gestión de Carreras',
          breadcrumb: 'Carreras'
        }
      },
      {
        path: 'actividades',
        name: 'admin-activities',
        component: () => import('@/views/admin/Actividades.vue'),
        meta: {
          title: 'Gestión de Actividades',
          breadcrumb: 'Actividades'
        }
      },
      {
        path: 'inscripciones',
        name: 'admin-enrollments',
        component: () => import('@/views/admin/Inscripciones.vue'),
        meta: {
          title: 'Gestión de Inscripciones',
          breadcrumb: 'Inscripciones'
        }
      },
      {
        path: 'calificaciones',
        name: 'admin-grades',
        component: () => import('@/views/admin/Calificaciones.vue'),
        meta: {
          title: 'Gestión de Calificaciones',
          breadcrumb: 'Calificaciones'
        }
      },
      {
        path: '/admin/asistencias',
        name: 'AdminAsistencias',
        component: () => import('@/views/admin/Asistencias.vue')
      },
      {
        path: 'certificados',
        name: 'admin-certificates',
        component: () => import('@/views/admin/Certificados.vue'),
        meta: {
          title: 'Gestión de Certificados',
          breadcrumb: 'Certificados'
        }
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear RolesView
        meta: {
          title: 'Gestión de Roles',
          breadcrumb: 'Roles'
        }
      },
      {
        path: 'reportes',
        name: 'admin-reports',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear ReportsView
        meta: {
          title: 'Reportes',
          breadcrumb: 'Reportes'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE COORDINADOR (con sidebar)
  // ==========================================
  {
    path: '/coordinador',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['ADMINISTRADOR', 'COORDINADOR']
    },
    children: [
      {
        path: '',
        name: 'coordinator-dashboard',
        component: () => import('@/views/coordinator/Dashboard.vue'),
        meta: {
          title: 'Panel de Coordinador',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'actividades',
        name: 'coordinator-activities',
        component: () => import('@/views/coordinator/Cursos.vue'),
        meta: {
          title: 'Gestión de Actividades',
          breadcrumb: 'Actividades'
        }
      },
      {
        path: 'eventos',
        name: 'coordinator-events',
        component: () => import('@/views/coordinator/Eventos.vue'),
        meta: {
          title: 'Gestión de Eventos',
          breadcrumb: 'Eventos'
        }
      },
      {
        path: 'inscritos',
        name: 'coordinator-enrolled',
        component: () => import('@/views/coordinator/Inscritos.vue'),
        meta: {
          title: 'Inscritos',
          breadcrumb: 'Inscritos'
        }
      },
      {
        path: 'bandeja',
        name: 'coordinator-inbox',
        component: () => import('@/views/coordinator/Bandeja.vue'),
        meta: {
          title: 'Solicitudes de Certificados',
          breadcrumb: 'Bandeja'
        }
      },
      {
        path: 'emitir',
        name: 'coordinator-emit',
        component: () => import('@/views/coordinator/EmitirCertificados.vue'),
        meta: {
          title: 'Emitir Certificados',
          breadcrumb: 'Emitir'
        }
      },
      {
        path: 'disenadores',
        name: 'coordinator-designers',
        component: () => import('@/views/coordinator/AsignarDisenador.vue'),
        meta: {
          title: 'Asignar Disenador',
          breadcrumb: 'Disenadores'
        }
      },
      {
        path: 'reportes',
        name: 'coordinator-reports',
        component: () => import('@/views/coordinator/Reportes.vue'),
        meta: {
          title: 'Reportes',
          breadcrumb: 'Reportes'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE DOCENTE (con sidebar)
  // ==========================================
  {
    path: '/docente',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['DOCENTE']
    },
    children: [
      {
        path: '',
        name: 'teacher-dashboard',
        component: () => import('@/views/docente/Dashboard.vue'),
        meta: {
          title: 'Panel de Docente',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'mis-cursos',
        name: 'teacher-courses',
        component: () => import('@/views/docente/MisCursos.vue'),
        meta: {
          title: 'Mis Cursos',
          breadcrumb: 'Mis Cursos'
        }
      },
      {
        path: 'calificaciones',
        name: 'teacher-grades',
        component: () => import('@/views/docente/Calificaciones.vue'),
        meta: {
          title: 'Calificaciones',
          breadcrumb: 'Calificaciones'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE AUXILIAR (con sidebar)
  // ==========================================
  {
    path: '/auxiliar',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['AUXILIAR']
    },
    children: [
      {
        path: '',
        redirect: { name: 'auxiliary-events' }
      },
      {
        path: 'eventos',
        name: 'auxiliary-events',
        component: () => import('@/views/auxiliar/Eventos.vue'),
        meta: {
          title: 'Mis Eventos',
          breadcrumb: 'Mis Eventos'
        }
      },
      {
        path: 'asistencia',
        name: 'auxiliary-attendance',
        component: () => import('@/views/auxiliar/Asistencia.vue'),
        meta: {
          title: 'Registrar Asistencia',
          breadcrumb: 'Asistencia'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE DISEÑADOR (con sidebar)
  // ==========================================
  {
    path: '/disenador',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['DISENADOR']
    },
    children: [
      {
        path: '',
        name: 'designer-dashboard',
        redirect: { name: 'designer-templates' },
        meta: {
          title: 'Plantillas',
          breadcrumb: 'Plantillas'
        }
      },
      {
        path: 'plantillas',
        name: 'designer-templates',
        component: () => import('@/views/disenador/Plantillas.vue'),
        meta: {
          title: 'Gestión de Plantillas',
          breadcrumb: 'Plantillas'
        }
      }
      ,
      {
        path: 'mis-plantillas',
        name: 'designer-mis-plantillas',
        component: () => import('@/views/disenador/MisPlantillas.vue'),
        meta: {
          title: 'Mis Plantillas',
          breadcrumb: 'Mis Plantillas'
        }
      }
    ]
  },

  // ==========================================
  // RUTA 404 (No encontrada)
  // ==========================================
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/public/Home.vue'), // TODO: Crear NotFoundView
    meta: {
      title: 'Página no encontrada'
    }
  }
]

// ============================================
// CREAR INSTANCIA DEL ROUTER
// ============================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  
  // Scroll al inicio de la página al cambiar de ruta
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// ============================================
// CONFIGURAR GUARDS (protección de rutas)
// ============================================
setupRouterGuards(router)

// ============================================
// ACTUALIZAR TÍTULO DE LA PÁGINA
// ============================================
router.afterEach((to) => {
  const title = to.meta.title as string || 'FHCE - Cursos y Eventos'
  document.title = title
})

export default router