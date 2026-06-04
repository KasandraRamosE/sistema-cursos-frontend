<template>
  <!--
    Vista de Gestión de Usuarios - Administrador
    Permite ver, crear, editar y gestionar roles de todos los usuarios del sistema
  -->
  <div class="space-y-6">
    <!-- Encabezado con botón de crear -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Usuarios</h1>
        <p class="text-gray-600">Administrar usuarios y asignar roles</p>
      </div>
      <div>
        <Button @click="openCreateModal">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Crear Usuario Externo
        </Button>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.total }}</p>
          <p class="text-sm text-gray-600">Total Usuarios</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.internos }}</p>
          <p class="text-sm text-gray-600">UMSA</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-600">{{ estadisticas.externos }}</p>
          <p class="text-sm text-gray-600">Externos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.activos }}</p>
          <p class="text-sm text-gray-600">Activos</p>
        </div>
      </Card>
    </div>

    <!-- Filtros -->
    <Card>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Búsqueda -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input
            v-model="filtros.busqueda"
            type="text"
            placeholder="Nombre, apellido, email o RU..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Filtro por tipo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
          <select
            v-model="filtros.tipoUsuario"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="INTERNO">UMSA</option>
            <option value="EXTERNO">Externos</option>
          </select>
        </div>

        <!-- Filtro por rol -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select
            v-model="filtros.rol"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los roles</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="COORDINADOR">Coordinador</option>
            <option value="DOCENTE">Docente</option>
            <option value="PARTICIPANTE">Participante</option>
            <option value="AUXILIAR">Auxiliar</option>
            <option value="DISENADOR">Diseñador</option>
          </select>
        </div>
      </div>

      <!-- Filtros adicionales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <!-- Estado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="filtros.estado"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>

        <!-- Email verificado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Verificado</label>
          <select
            v-model="filtros.emailVerificado"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="true">Verificados</option>
            <option value="false">No verificados</option>
          </select>
        </div>

        <!-- Botón limpiar filtros -->
        <div class="flex items-end">
          <Button variant="outline" class="w-full" @click="limpiarFiltros">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Limpiar Filtros
          </Button>
        </div>
      </div>
    </Card>

    <!-- Tabla de usuarios -->
    <Card>
      <!-- Estado de carga -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Cargando usuarios...</p>
      </div>

      <!-- Tabla -->
      <div v-else-if="usuariosPaginados.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">RU/Username</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Roles</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="usuario in usuariosPaginados" :key="usuario.idUsuario" class="hover:bg-gray-50">
              <!-- Nombre completo -->
              <td class="px-4 py-3">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {{ getInitials(usuario.nombres, usuario.apellidos) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ usuario.nombres }} {{ usuario.apellidos }}</p>
                    <p class="text-xs text-gray-500">ID: {{ usuario.idUsuario }}</p>
                  </div>
                </div>
              </td>

              
              <!-- Username/RU -->
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ usuario.username }}
              </td>

              <!-- Email -->
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ usuario.email }}
              </td>

              <!-- Tipo de usuario -->
              <td class="px-4 py-3 text-sm">
                <Badge :variant="usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'" size="sm">
                  {{ usuario.tipoUsuario }}
                </Badge>
              </td>

              <!-- Roles -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <Badge
                    v-for="rol in usuario.roles"
                    :key="rol"
                    :variant="getRolBadgeVariant(rol)"
                    size="sm"
                  >
                    {{ formatRolName(rol) }}
                  </Badge>
                  <button
                    @click="openRolesModal(usuario)"
                    class="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Editar
                  </button>
                </div>
              </td>

              <!-- Estado -->
              <td class="px-4 py-3 text-sm">
                <Badge :variant="usuario.estado === 'ACTIVO' ? 'success' : 'gray'" size="sm">
                  {{ usuario.estado }}
                </Badge>
              </td>

              <!-- Email verificado -->
              <td class="px-4 py-3 text-sm text-center">
                <span v-if="usuario.emailVerificado" class="text-green-600">
                  <svg class="w-5 h-5 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </span>
                <span v-else class="text-gray-400">
                  <svg class="w-5 h-5 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="openAccionesModal(usuario)"
                  title="Acciones"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                  </svg>
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- NUEVO: Componente de Paginación -->
      <!-- Solo se muestra si hay resultados -->
      <Pagination
        v-if="totalItems > 0"
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        :show-page-size-selector="true"
        @update:current-page="goToPage"
        @update:page-size="setPageSize"
      />

      <!-- Sin resultados -->
      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-gray-600">No se encontraron usuarios con los filtros aplicados</p>
      </div>
    </Card>

    <Modal :modelValue="showAccionesModal" @close="closeAccionesModal" title="Acciones">
      <div v-if="usuarioSeleccionado" class="space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">Usuario:</p>
          <p class="font-semibold text-gray-800">
            {{ usuarioSeleccionado.nombres }} {{ usuarioSeleccionado.apellidos }}
          </p>
          <p class="text-xs text-gray-500">{{ usuarioSeleccionado.username }}</p>
        </div>

        <div class="grid grid-cols-1 gap-2">
          <Button variant="primary" @click="ejecutarAccionUsuario(openEditModal)">
            Editar usuario
          </Button>

          <Button
            v-if="usuarioSeleccionado.roles.includes('COORDINADOR')"
            variant="secondary"
            @click="ejecutarAccionUsuario(openCarrerasModal)"
          >
            Gestionar carreras
          </Button>

          <Button
            v-if="usuarioSeleccionado.roles.includes('DOCENTE')"
            variant="outline"
            @click="ejecutarAccionUsuario((u) => openActividadesModal(u, 'DOCENTE'))"
          >
            Gestionar paralelos
          </Button>

          <Button
            v-if="usuarioSeleccionado.roles.includes('AUXILIAR')"
            variant="outline"
            @click="ejecutarAccionUsuario((u) => openActividadesModal(u, 'AUXILIAR'))"
          >
            Gestionar eventos
          </Button>

          <Button
            v-if="canAssignDesigners"
            variant="ghost"
            @click="irAAsignacionDisenador"
          >
            Asignar diseñador a cursos/eventos
          </Button>

          <Button
            v-if="usuarioSeleccionado.tipoUsuario === 'EXTERNO'"
            variant="ghost"
            @click="ejecutarAccionUsuario(openPasswordModal)"
          >
            Cambiar contrasena
          </Button>

          <Button
            :variant="usuarioSeleccionado.estado === 'ACTIVO' ? 'danger' : 'success'"
            @click="ejecutarAccionUsuario(toggleEstadoUsuario)"
          >
            {{ usuarioSeleccionado.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario' }}
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Modal Crear/Editar Usuario -->
    <Modal :modelValue="showUsuarioModal" @close="closeUsuarioModal" :title="modoEdicion ? 'Editar Usuario' : 'Crear Usuario Externo'">
      <form @submit.prevent="submitUsuario" class="space-y-4">
        <!-- Info según tipo -->
        <div v-if="!modoEdicion" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <strong>Nota:</strong> Los usuarios UMSA se sincronizan automáticamente desde el sistema de Usuarios Umsa.
          </p>
        </div>
        
        <div v-else-if="modoEdicion && formUsuario.tipoUsuario === 'INTERNO'" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p class="text-sm text-amber-800">
            <strong>Usuario UMSA:</strong> Solo puedes editar nombres y apellidos. Los demás datos provienen de Usuarios Umsa.
          </p>
        </div>

        <!-- CI -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            CI <span class="text-red-600">*</span>
          </label>
          <input
            v-model="formUsuario.ci"
            type="text"
            required
            :readonly="modoEdicion && formUsuario.tipoUsuario === 'INTERNO'"
            placeholder="Ej: 1234567 LP"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'bg-gray-100': modoEdicion && formUsuario.tipoUsuario === 'INTERNO' }"
          />
        </div>

        <!-- Username -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ formUsuario.tipoUsuario === 'INTERNO' ? 'RU' : 'Username' }} <span class="text-red-600">*</span>
          </label>
          <input
            v-model="formUsuario.username"
            type="text"
            required
            :readonly="modoEdicion"
            :placeholder="formUsuario.tipoUsuario === 'INTERNO' ? 'Ej: 202012345' : 'Ej: jperez'"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
          />
        </div>

        <!-- Nombres -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nombres <span class="text-red-600">*</span>
          </label>
          <input
            v-model="formUsuario.nombres"
            type="text"
            required
            placeholder="Ej: Juan Carlos"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Apellidos -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Apellidos <span class="text-red-600">*</span>
          </label>
          <input
            v-model="formUsuario.apellidos"
            type="text"
            required
            placeholder="Ej: Pérez López"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Email - Solo editable para externos -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email <span class="text-red-600">*</span>
          </label>
          <input
            v-model="formUsuario.email"
            type="email"
            required
            :readonly="modoEdicion && formUsuario.tipoUsuario === 'INTERNO'"
            placeholder="Ej: juan.perez@ejemplo.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'bg-gray-100': modoEdicion && formUsuario.tipoUsuario === 'INTERNO' }"
          />
        </div>

        <!-- Contraseña - Solo para externos al crear -->
        <div v-if="!modoEdicion && formUsuario.tipoUsuario === 'EXTERNO'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Contraseña <span class="text-red-600">*</span>
          </label>
          <input
            v-model="formUsuario.password"
            type="password"
            required
            placeholder="Mínimo 6 caracteres"
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Estado - Solo editable para externos -->
        <div v-if="modoEdicion && formUsuario.tipoUsuario === 'EXTERNO'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="formUsuario.estado"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeUsuarioModal">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear') }}
          </Button>
        </div>
      </form>
    </Modal>
    
    <!-- Modal Gestión de Carreras -->
    <Modal :modelValue="showCarrerasModal" @close="closeCarrerasModal" title="Gestionar Carreras">
      <div v-if="usuarioSeleccionado" class="space-y-4">
        <!-- Info del usuario -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">Usuario:</p>
          <p class="font-semibold text-gray-800">
            {{ usuarioSeleccionado.nombres }} {{ usuarioSeleccionado.apellidos }}
          </p>
          <div class="flex gap-2 mt-2">
            <Badge
              v-for="rol in usuarioSeleccionado.roles.filter(r => ['COORDINADOR', 'DOCENTE', 'DISENADOR'].includes(r))"
              :key="rol"
              :variant="getRolBadgeVariant(rol)"
              size="sm"
            >
              {{ formatRolName(rol) }}
            </Badge>
          </div>
        </div>

        <!-- Lista de carreras -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Carreras Asignadas
          </label>
          <div class="space-y-2">
            <label
              v-for="carrera in carreras"
              :key="carrera.idCarrera"
              class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="carrerasSeleccionadas"
                :value="carrera.idCarrera"
                class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">{{ carrera.nombre }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Info adicional -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <strong v-if="usuarioSeleccionado.roles.includes('COORDINADOR')">Coordinadores:</strong>
            <strong v-else>Docentes:</strong>
            {{ usuarioSeleccionado.roles.includes('COORDINADOR') 
              ? 'Solo podrán gestionar actividades de las carreras seleccionadas.' 
              : 'Podrán dar clases en cursos/eventos de las carreras seleccionadas.' }}
          </p>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeCarrerasModal">
            Cancelar
          </Button>
          <Button @click="guardarCarreras" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Carreras' }}
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Modal Asignar Actividades (Docentes y Auxiliares) -->
    <Modal 
      :modelValue="showActividadesModal" 
      @close="closeActividadesModal" 
      :title="tipoGestionActividades === 'DOCENTE' 
        ? 'Asignar Cursos/Paralelos a Docente' 
        : 'Asignar Eventos a Auxiliar'"
    >
      <div v-if="usuarioSeleccionado" class="space-y-4">
        <!-- Info del usuario -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">
                {{ tipoGestionActividades === 'DOCENTE' ? 'Docente:' : 'Auxiliar:' }}
              </p>
              <p class="font-semibold text-gray-800">
                {{ usuarioSeleccionado.nombres }} {{ usuarioSeleccionado.apellidos }}
              </p>
            </div>
            <!-- Badge del rol que estamos gestionando -->
            <Badge 
              :variant="tipoGestionActividades === 'DOCENTE' ? 'info' : 'secondary'" 
              size="lg"
            >
              {{ tipoGestionActividades }}
            </Badge>
          </div>
        </div>

        <!-- Filtros -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
          <!-- Filtro por carrera -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Filtrar por Carrera</label>
            <select
              v-model="filtroCarreraActividades"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las carreras</option>
              <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>

          <!-- Búsqueda -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              v-model="filtroBusquedaActividades"
              type="text"
              :placeholder="tipoGestionActividades === 'DOCENTE' ? 'Nombre de curso...' : 'Nombre de evento...'"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Lista de actividades/paralelos -->
        <div class="max-h-96 overflow-y-auto">
          <!-- Para DOCENTES: Mostrar paralelos -->
          <div v-if="tipoGestionActividades === 'DOCENTE'" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Paralelos de Cursos Disponibles
            </label>
            
            <div v-if="paralelosFiltrados.length === 0" class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No se encontraron paralelos con los filtros aplicados</p>
            </div>
            
            <label
              v-for="paralelo in paralelosFiltrados"
              :key="paralelo.idParalelo"
              class="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                v-model="paralelosSeleccionados"
                :value="paralelo.idParalelo"
                class="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">
                  {{ paralelo.actividadNombre }} <span class="text-gray-600">- Paralelo {{ paralelo.codigo }}</span>
                </p>
                <div class="flex gap-2 mt-1">
                  <Badge variant="primary" size="sm">CURSO</Badge>
                  <Badge :variant="paralelo.estadoCurso === 'ABIERTO' ? 'success' : 'gray'" size="sm">
                    {{ paralelo.estadoCurso }}
                  </Badge>
                  <Badge variant="info" size="sm">{{ paralelo.carreraNombre }}</Badge>
                </div>
              </div>
            </label>
          </div>

          <!-- Para AUXILIARES: Mostrar eventos -->
          <div v-else class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Eventos Disponibles
            </label>
            
            <div v-if="actividadesFiltradas.length === 0" class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No se encontraron eventos con los filtros aplicados</p>
            </div>
            
            <label
              v-for="actividad in actividadesFiltradas"
              :key="actividad.idActividad"
              class="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                v-model="actividadesSeleccionadas"
                :value="actividad.idActividad"
                class="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">{{ actividad.nombre }}</p>
                <div class="flex gap-2 mt-1">
                  <Badge variant="secondary" size="sm">{{ actividad.tipo }}</Badge>
                  <Badge :variant="actividad.estado === 'ABIERTO' ? 'success' : 'gray'" size="sm">
                    {{ actividad.estado }}
                  </Badge>
                  <Badge variant="info" size="sm">{{ actividad.carreraNombre }}</Badge>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatDateTime(actividad.fechaHora) }}
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Info adicional -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <strong v-if="tipoGestionActividades === 'DOCENTE'">💡 Docentes:</strong>
            <strong v-else>💡 Auxiliares:</strong>
            {{ tipoGestionActividades === 'DOCENTE' 
              ? 'Podrán registrar calificaciones solo en los paralelos seleccionados.' 
              : 'Solo podrán registrar asistencia en los eventos seleccionados.' }}
          </p>
        </div>

        <!-- Contador de seleccionados -->
        <div class="text-sm text-gray-600 text-center">
          <span v-if="tipoGestionActividades === 'DOCENTE'">
            {{ paralelosSeleccionados.length }} paralelo(s) seleccionado(s)
          </span>
          <span v-else>
            {{ actividadesSeleccionadas.length }} evento(s) seleccionado(s)
          </span>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeActividadesModal">
            Cancelar
          </Button>
          <Button @click="guardarActividades" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Asignaciones' }}
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Modal Gestión de Roles -->
    <Modal :modelValue="showRolesModal" @close="closeRolesModal" title="Gestionar Roles de Usuario">
      <div v-if="usuarioSeleccionado" class="space-y-4">
        <!-- Info del usuario -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">Usuario:</p>
          <p class="font-semibold text-gray-800">
            {{ usuarioSeleccionado.nombres }} {{ usuarioSeleccionado.apellidos }}
          </p>
          <p class="text-sm text-gray-500">{{ usuarioSeleccionado.email }}</p>
        </div>

        <!-- Lista de roles disponibles -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Roles Asignados
          </label>
          <div class="space-y-2">
            <!-- Rol Administrador -->
            <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                v-model="rolesSeleccionados"
                value="ADMINISTRADOR"
                class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">Administrador</p>
                <p class="text-xs text-gray-600">Acceso completo al sistema</p>
              </div>
              <Badge variant="danger" size="sm">ADMIN</Badge>
            </label>

            <!-- Rol Coordinador -->
            <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                v-model="rolesSeleccionados"
                value="COORDINADOR"
                class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">Coordinador Académico</p>
                <p class="text-xs text-gray-600">Gestión de cursos y eventos de su carrera</p>
              </div>
              <Badge variant="primary" size="sm">COORD</Badge>
            </label>

            <!-- Rol Docente -->
            <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                v-model="rolesSeleccionados"
                value="DOCENTE"
                class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">Docente</p>
                <p class="text-xs text-gray-600">Registro de calificaciones</p>
              </div>
              <Badge variant="info" size="sm">DOC</Badge>
            </label>

            <!-- Rol Participante (siempre activo) -->
            <label class="flex items-center p-3 border rounded-lg bg-gray-50 cursor-not-allowed">
              <input
                type="checkbox"
                checked
                disabled
                class="w-4 h-4 text-gray-400 rounded"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-500">Participante</p>
                <p class="text-xs text-gray-500">Rol base para todos los usuarios</p>
              </div>
              <Badge variant="gray" size="sm">BASE</Badge>
            </label>

            <!-- Rol Auxiliar -->
            <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                v-model="rolesSeleccionados"
                value="AUXILIAR"
                class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">Auxiliar</p>
                <p class="text-xs text-gray-600">Registro de asistencia en eventos</p>
              </div>
              <Badge variant="secondary" size="sm">AUX</Badge>
            </label>

            <!-- Rol Diseñador -->
            <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                v-model="rolesSeleccionados"
                value="DISENADOR"
                class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-800">Diseñador Gráfico</p>
                <p class="text-xs text-gray-600">Gestión de plantillas de certificados</p>
              </div>
              <Badge variant="warning" size="sm">DIS</Badge>
            </label>
          </div>
        </div>

        <div v-if="rolesSeleccionados.includes('DOCENTE')" class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Titulo academico para Docente <span class="text-red-600">*</span>
          </label>
          <input
            v-model="tituloDocente"
            type="text"
            placeholder="Ej: Lic., MSc., PhD."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Nota si es Coordinador -->
        <div v-if="rolesSeleccionados.includes('COORDINADOR')" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <strong>Nota:</strong> Después de guardar, deberás asignar las carreras a este coordinador.
          </p>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeRolesModal()">
            Cancelar
          </Button>
          <Button @click="guardarRoles" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Roles' }}
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Modal Cambiar Contraseña -->
    <Modal :modelValue="showPasswordModal" @close="closePasswordModal" title="Cambiar Contraseña">
      <div v-if="usuarioSeleccionado" class="space-y-4">
        <!-- Info del usuario -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">Usuario:</p>
          <p class="font-semibold text-gray-800">
            {{ usuarioSeleccionado.nombres }} {{ usuarioSeleccionado.apellidos }}
          </p>
          <p class="text-sm text-gray-500">{{ usuarioSeleccionado.username }}</p>
        </div>

        <!-- Nueva contraseña -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nueva Contraseña <span class="text-red-600">*</span>
          </label>
          <input
            v-model="nuevaPassword"
            type="password"
            required
            placeholder="Mínimo 6 caracteres"
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Confirmar contraseña -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Contraseña <span class="text-red-600">*</span>
          </label>
          <input
            v-model="confirmarPassword"
            type="password"
            required
            placeholder="Repetir contraseña"
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Advertencia -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-sm text-red-800">
            <strong>⚠️ Advertencia:</strong> El usuario deberá usar la nueva contraseña en su próximo inicio de sesión.
          </p>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closePasswordModal">
            Cancelar
          </Button>
          <Button @click="guardarPassword" :disabled="saving" variant="danger">
            {{ saving ? 'Guardando...' : 'Cambiar Contraseña' }}
          </Button>
        </div>
      </div>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import Pagination from '@/components/common/Pagination.vue' // ← NUEVO: Importar componente de paginación
import { usePagination } from '@/composables/usePagination' // ← NUEVO: Importar composable
import { api } from '@/utils/api'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '@/utils/dateFormatter'
import { useAlertStore } from '@/stores/alert.store'
import { useAuthStore } from '@/stores/auth.store'

// ============================================
// TIPOS CORREGIDOS
// ============================================

interface Carrera {
  idCarrera: number
  nombre: string
}

interface Actividad {
  idActividad: number
  nombre: string
  tipo: 'CURSO' | 'EVENTO'
  idCarrera: number | null
  carreraNombre: string
  estado: 'ABIERTO' | 'LLENO' | 'FINALIZADO'
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'MIXTO'
  fechaHora: string
}

interface Paralelo {
  idParalelo: string
  codigo: string
  idCurso: number
  idCarrera: number | null
  estadoCurso: 'ABIERTO' | 'LLENO' | 'FINALIZADO'
  actividadNombre: string
  actividadTipo: 'CURSO' | 'EVENTO'
  carreraNombre: string
}

interface Usuario {
  idUsuario: number
  username: string
  ci?: string
  nombres: string
  apellidos: string
  email: string
  tipoUsuario: 'INTERNO' | 'EXTERNO'
  emailVerificado: boolean
  estado: 'ACTIVO' | 'INACTIVO'
  roles: string[]
  carreras: Carrera[]  // ← Solo para COORDINADORES
  fechaRegistro: string
}

interface UsuarioApi {
  idUsuario: number
  username: string
  ci?: string
  nombres: string
  apellidos: string
  email: string
  tipoUsuario?: 'INTERNO' | 'EXTERNO'
  emailVerificado: boolean
  estado: 'ACTIVO' | 'INACTIVO'
  roles: string[]
  fechaRegistro: string
}

interface CarreraApi {
  idCarrera: number
  nombre: string
  estado: string
}

interface EventoApi {
  idEvento: number
  idCarrera: number
  nombreCarrera: string
  nombre: string
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'MIXTO'
  estado: 'ABIERTO' | 'LLENO' | 'FINALIZADO'
  fechaHora: string
}

interface CursoApi {
  idCurso: number
  idCarrera: number
  nombreCarrera: string
  nombre: string
  estado: 'ABIERTO' | 'LLENO' | 'FINALIZADO'
  paralelos?: ParaleloApi[]
}

interface ParaleloApi {
  codigo: string
  idCurso: number
}

interface FormUsuario {
  username: string
  ci: string
  nombres: string
  apellidos: string
  email: string
  password: string
  tipoParticipante: 'UMSA' | 'EXTERNO'
  tipoUsuario: 'INTERNO' | 'EXTERNO' | ''
  estado: 'ACTIVO' | 'INACTIVO'
}

interface FormCarreras {
  carrerasSeleccionadas: number[]
}

interface FormEventos {
  eventosSeleccionados: number[]
}

// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const saving = ref(false)
const alertStore = useAlertStore()
const authStore = useAuthStore()
const router = useRouter()

// Datos
const usuarios = ref<Usuario[]>([])
const carreras = ref<Carrera[]>([])
const actividadesDisponibles = ref<Actividad[]>([])  // ← Para docentes/auxiliares
const paralelosDisponibles = ref<Paralelo[]>([])     // ← Para docentes

// Estadísticas
const estadisticas = ref({
  total: 0,
  internos: 0,
  externos: 0,
  activos: 0
})

// Filtros
const filtros = ref({
  busqueda: '',
  tipoUsuario: '',
  rol: '',
  estado: '',
  emailVerificado: ''
})

// Modales
const showUsuarioModal = ref(false)
const showRolesModal = ref(false)
const showCarrerasModal = ref(false)        // Solo coordinadores
const showActividadesModal = ref(false)     // ← NUEVO: Para docentes y auxiliares
const showPasswordModal = ref(false)
const showAccionesModal = ref(false)
const modoEdicion = ref(false)
const usuarioSeleccionado = ref<Usuario | null>(null)

// Formularios
const formUsuario = ref<FormUsuario>({
  username: '',
  ci: '',
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  tipoParticipante: 'EXTERNO',
  tipoUsuario: '',
  estado: 'ACTIVO'
})

const rolesSeleccionados = ref<string[]>([])
const carrerasSeleccionadas = ref<number[]>([])     // Solo coordinadores
const actividadesSeleccionadas = ref<number[]>([])  // ← NUEVO: Para auxiliares (eventos)
const paralelosSeleccionados = ref<string[]>([])    // ← NUEVO: Para docentes (paralelos)

// Filtros del modal de actividades
const filtroCarreraActividades = ref<number | ''>('')  // ← NUEVO
const filtroBusquedaActividades = ref('')              // ← NUEVO

const nuevaPassword = ref('')
const confirmarPassword = ref('')
const tituloDocente = ref('')

const canAssignDesigners = computed(() => {
  return authStore.hasRole('ADMINISTRADOR') || authStore.hasRole('COORDINADOR')
})

// ============================================
// COMPUTED
// ============================================

const usuariosFiltrados = computed(() => {
  let resultado = [...usuarios.value]

  if (filtros.value.busqueda) {
    const busqueda = filtros.value.busqueda.toLowerCase()
    resultado = resultado.filter(u =>
      u.nombres.toLowerCase().includes(busqueda) ||
      u.apellidos.toLowerCase().includes(busqueda) ||
      u.email.toLowerCase().includes(busqueda) ||
      u.username.toLowerCase().includes(busqueda)
    )
  }

  if (filtros.value.tipoUsuario) {
    resultado = resultado.filter(u => u.tipoUsuario === filtros.value.tipoUsuario)
  }

  if (filtros.value.rol) {
    resultado = resultado.filter(u => u.roles.includes(filtros.value.rol))
  }

  if (filtros.value.estado) {
    resultado = resultado.filter(u => u.estado === filtros.value.estado)
  }

  if (filtros.value.emailVerificado) {
    const verificado = filtros.value.emailVerificado === 'true'
    resultado = resultado.filter(u => u.emailVerificado === verificado)
  }

  return resultado
})

// ============================================
// PAGINACIÓN
// ============================================

const {
  paginatedData: usuariosPaginados, // ← Los datos que mostraremos en la tabla (10 items por defecto)
  currentPage,                       // ← Página actual (reactivo)
  pageSize,                          // ← Tamaño de página (reactivo)
  totalPages,                        // ← Total de páginas (calculado automáticamente)
  totalItems,                        // ← Total de items después de filtrar
  goToPage,                          // ← Método para ir a una página específica
  setPageSize                        // ← Método para cambiar el tamaño de página
} = usePagination(usuariosFiltrados, {
  pageSize: 10,      // ← 10 usuarios por página
  initialPage: 1     // ← Empezar en la página 1
})

// ============================================
// MÉTODOS - CRUD
// ============================================
const cargarUsuarios = async () => {
  loading.value = true
  try {
    const [usuariosResponse, carrerasResponse, eventosResponse, cursosResponse] = await Promise.all([
      api.get('/usuarios') as Promise<UsuarioApi[]>,
      api.get('/carreras/todas') as Promise<CarreraApi[]>,
      api.get('/eventos') as Promise<EventoApi[]>,
      api.get('/cursos') as Promise<CursoApi[]>
    ])

    usuarios.value = usuariosResponse.map((u) => ({
      idUsuario: u.idUsuario,
      username: u.username,
      ci: u.ci ?? '',
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: u.email,
      tipoUsuario: u.tipoUsuario || 'EXTERNO',
      emailVerificado: u.emailVerificado,
      estado: u.estado,
      roles: normalizarRoles(u.roles),
      carreras: [],
      fechaRegistro: u.fechaRegistro
    }))

    carreras.value = carrerasResponse.map((c) => ({
      idCarrera: c.idCarrera,
      nombre: c.nombre
    }))

    actividadesDisponibles.value = eventosResponse.map((e) => ({
      idActividad: e.idEvento,
      nombre: e.nombre,
      tipo: 'EVENTO',
      idCarrera: e.idCarrera,
      carreraNombre: e.nombreCarrera,
      estado: e.estado,
      modalidad: e.modalidad,
      fechaHora: e.fechaHora
    }))

    const paralelos: Paralelo[] = []
    for (const curso of cursosResponse) {
      if (curso.estado !== 'ABIERTO') continue
      for (const paralelo of curso.paralelos || []) {
        paralelos.push({
          idParalelo: buildParaleloKey(paralelo.idCurso, paralelo.codigo),
          codigo: paralelo.codigo,
          idCurso: paralelo.idCurso,
          idCarrera: curso.idCarrera,
          estadoCurso: curso.estado,
          actividadNombre: curso.nombre,
          actividadTipo: 'CURSO',
          carreraNombre: curso.nombreCarrera
        })
      }
    }
    paralelosDisponibles.value = paralelos

    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    alertStore.push({ type: 'error', message: 'No se pudieron cargar los datos de usuarios.' })
  } finally {
    loading.value = false
  }
}

const calcularEstadisticas = () => {
  estadisticas.value = {
    total: usuarios.value.length,
    internos: usuarios.value.filter(u => u.tipoUsuario === 'INTERNO').length,
    externos: usuarios.value.filter(u => u.tipoUsuario === 'EXTERNO').length,
    activos: usuarios.value.filter(u => u.estado === 'ACTIVO').length
  }
}

const submitUsuario = async () => {
  saving.value = true
  try {
    if (modoEdicion.value) {
      if (!usuarioSeleccionado.value) {
        alertStore.push({ type: 'warning', message: 'Selecciona un usuario para editar.' })
        saving.value = false
        return
      }

      const payload: Record<string, string> = {
        ci: formUsuario.value.ci,
        nombres: formUsuario.value.nombres,
        apellidos: formUsuario.value.apellidos
      }

      if (formUsuario.value.tipoUsuario === 'EXTERNO') {
        payload.email = formUsuario.value.email
        payload.estado = formUsuario.value.estado
      }

      await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}`, payload)
      alertStore.push({ type: 'success', message: 'Usuario actualizado correctamente.' })
    } else {
      // Solo se pueden crear usuarios EXTERNOS
      await api.post('/auth/registro', {
        username: formUsuario.value.username,
        ci: formUsuario.value.ci,
        nombres: formUsuario.value.nombres,
        apellidos: formUsuario.value.apellidos,
        email: formUsuario.value.email,
        password: formUsuario.value.password,
        tipoParticipante: formUsuario.value.tipoParticipante
      })
      alertStore.push({ type: 'success', message: 'Usuario creado. Debe verificar su email.' })
    }

    closeUsuarioModal()
    await cargarUsuarios()
  } catch (error) {
    console.error('Error al guardar usuario:', error)
    alertStore.push({ type: 'error', message: 'No se pudo guardar el usuario.' })
  } finally {
    saving.value = false
  }
}

const toggleEstadoUsuario = async (usuario: Usuario) => {
  const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
  const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar'

  if (confirm(`¿Estás seguro de ${accion} a ${usuario.nombres} ${usuario.apellidos}?`)) {
    try {
      await api.patch(`/usuarios/${usuario.idUsuario}/estado`, { estado: nuevoEstado })
      usuario.estado = nuevoEstado
      calcularEstadisticas()
      alertStore.push({ type: 'success', message: `Usuario ${accion}ado correctamente.` })
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alertStore.push({ type: 'error', message: 'No se pudo cambiar el estado.' })
    }
  }
}

// ============================================
// MÉTODOS - ROLES
// ============================================

const guardarRoles = async () => {
  if (!usuarioSeleccionado.value) return

  const usuarioId = usuarioSeleccionado.value.idUsuario

  saving.value = true
  try {
    const currentRoles = usuarioSeleccionado.value.roles.filter((rol) => rol !== 'PARTICIPANTE')
    const rolesToAdd = rolesSeleccionados.value.filter((rol) => !currentRoles.includes(rol))
    const rolesToRemove = currentRoles.filter((rol) => !rolesSeleccionados.value.includes(rol))

    for (const rol of rolesToAdd) {
      if (rol === 'DOCENTE' && !tituloDocente.value.trim()) {
        alertStore.push({ type: 'warning', message: 'El titulo es obligatorio para DOCENTE.' })
        saving.value = false
        return
      }

      await api.post(`/usuarios/${usuarioId}/roles`, {
        nombreRol: rol,
        titulo: rol === 'DOCENTE' ? tituloDocente.value.trim() : undefined
      })
    }

    for (const rol of rolesToRemove) {
      await api.delete(`/usuarios/${usuarioId}/roles/${rol}`)
    }

    await cargarUsuarios()

    const usuarioActualizado = usuarios.value.find((u) => u.idUsuario === usuarioId) || usuarioSeleccionado.value

    if (rolesToAdd.includes('COORDINADOR') && usuarioActualizado) {
      closeRolesModal({ keepSelected: true })
      openCarrerasModal(usuarioActualizado)
      return
    }

    if (rolesToAdd.includes('DOCENTE') && usuarioActualizado) {
      closeRolesModal({ keepSelected: true })
      openActividadesModal(usuarioActualizado, 'DOCENTE')
      return
    }

    if (rolesToAdd.includes('AUXILIAR') && usuarioActualizado) {
      closeRolesModal({ keepSelected: true })
      openActividadesModal(usuarioActualizado, 'AUXILIAR')
      return
    }

    if (rolesToAdd.includes('DISENADOR')) {
      alertStore.push({ type: 'success', message: 'Rol de diseñador asignado correctamente.' })
    } else {
      alertStore.push({ type: 'success', message: 'Roles actualizados correctamente.' })
    }

    closeRolesModal()
  } catch (error) {
    console.error('Error al guardar roles:', error)
    alertStore.push({ type: 'error', message: 'No se pudieron actualizar los roles.' })
  } finally {
    saving.value = false
  }
}

// ============================================
// MÉTODOS - CARRERAS (Solo COORDINADORES)
// ============================================

const openCarrerasModal = (usuario: Usuario) => {
  if (!hasRole(usuario.roles, 'COORDINADOR')) {
    alert('Solo los coordinadores tienen carreras asignadas')
    return
  }
  
  usuarioSeleccionado.value = usuario
  carrerasSeleccionadas.value = []
  api.get(`/usuarios/${usuario.idUsuario}/carreras`)
    .then((response) => {
      carrerasSeleccionadas.value = response as number[]
    })
    .catch(() => {
      alertStore.push({ type: 'error', message: 'No se pudieron cargar las carreras.' })
    })
  showCarrerasModal.value = true
}

const closeCarrerasModal = () => {
  showCarrerasModal.value = false
  usuarioSeleccionado.value = null
  carrerasSeleccionadas.value = []
}

const guardarCarreras = async () => {
  if (!usuarioSeleccionado.value) return

  saving.value = true
  try {
    await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}/carreras`, {
      carreraIds: carrerasSeleccionadas.value
    })

    usuarioSeleccionado.value.carreras = carreras.value.filter((c) =>
      carrerasSeleccionadas.value.includes(c.idCarrera)
    )

    alertStore.push({ type: 'success', message: 'Carreras actualizadas.' })
    closeCarrerasModal()
  } catch (error) {
    console.error('Error al guardar carreras:', error)
    alertStore.push({ type: 'error', message: 'No se pudieron guardar las carreras.' })
  } finally {
    saving.value = false
  }
}

// ============================================
// MÉTODOS - ACTIVIDADES (Docentes y Auxiliares)
// ============================================

const tipoGestionActividades = ref<'DOCENTE' | 'AUXILIAR'>('DOCENTE')  // ← NUEVO: Guardar el tipo

const openActividadesModal = (usuario: Usuario, tipo: 'DOCENTE' | 'AUXILIAR') => {
  usuarioSeleccionado.value = usuario
  tipoGestionActividades.value = tipo  // ← Guardar qué tipo estamos gestionando
  
  // Resetear filtros
  filtroCarreraActividades.value = ''
  filtroBusquedaActividades.value = ''
  
  // Cargar datos según el tipo
  if (tipo === 'DOCENTE') {
    paralelosSeleccionados.value = []
    api.get(`/usuarios/${usuario.idUsuario}/paralelos`)
      .then((response) => {
        const asignados = response as { idCurso: number; codigo: string }[]
        paralelosSeleccionados.value = asignados.map((p) =>
          buildParaleloKey(p.idCurso, p.codigo)
        )
      })
      .catch(() => {
        alertStore.push({ type: 'error', message: 'No se pudieron cargar los paralelos.' })
      })
  } else {
    actividadesSeleccionadas.value = []
    api.get(`/usuarios/${usuario.idUsuario}/eventos`)
      .then((response) => {
        actividadesSeleccionadas.value = response as number[]
      })
      .catch(() => {
        alertStore.push({ type: 'error', message: 'No se pudieron cargar los eventos.' })
      })
  }
  
  showActividadesModal.value = true
}

const closeActividadesModal = () => {
  showActividadesModal.value = false
  usuarioSeleccionado.value = null
  tipoGestionActividades.value = 'DOCENTE'
  actividadesSeleccionadas.value = []
  paralelosSeleccionados.value = []
  filtroCarreraActividades.value = ''
  filtroBusquedaActividades.value = ''
}

// Computed: Filtrar actividades por carrera y búsqueda
const actividadesFiltradas = computed(() => {
  let resultado = [...actividadesDisponibles.value]

  // Filtrar por carrera
  if (filtroCarreraActividades.value) {
    resultado = resultado.filter(a => 
      a.idCarrera === Number(filtroCarreraActividades.value)
    )
  }

  // Filtrar por búsqueda
  if (filtroBusquedaActividades.value) {
    const busqueda = filtroBusquedaActividades.value.toLowerCase()
    resultado = resultado.filter(a =>
      a.nombre.toLowerCase().includes(busqueda)
    )
  }

  resultado = resultado.filter(a => a.estado === 'ABIERTO')

  // Si estamos gestionando AUXILIAR, mostrar solo EVENTOS
  if (tipoGestionActividades.value === 'AUXILIAR') {
    resultado = resultado.filter(a => a.tipo === 'EVENTO')
  }

  return resultado
})

// Computed: Filtrar paralelos por carrera y búsqueda
const paralelosFiltrados = computed(() => {
  let resultado = [...paralelosDisponibles.value]

  // Filtrar por carrera
  if (filtroCarreraActividades.value) {
    resultado = resultado.filter(p =>
      p.idCarrera === Number(filtroCarreraActividades.value)
    )
  }

  // Filtrar por búsqueda
  if (filtroBusquedaActividades.value) {
    const busqueda = filtroBusquedaActividades.value.toLowerCase()
    resultado = resultado.filter(p =>
      p.actividadNombre.toLowerCase().includes(busqueda) ||
      p.codigo.toLowerCase().includes(busqueda)
    )
  }

  resultado = resultado.filter(p => p.estadoCurso === 'ABIERTO')

  return resultado
})

const guardarActividades = async () => {
  if (!usuarioSeleccionado.value) return

  saving.value = true
  try {
    if (tipoGestionActividades.value === 'DOCENTE') {
      const paralelos = paralelosSeleccionados.value.map(parseParaleloKey)
      await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}/paralelos`, { paralelos })
      alertStore.push({ type: 'success', message: 'Paralelos actualizados.' })
      
    } else if (tipoGestionActividades.value === 'AUXILIAR') {
      await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}/eventos`, {
        eventoIds: actividadesSeleccionadas.value
      })
      alertStore.push({ type: 'success', message: 'Eventos actualizados.' })
    }
    
    closeActividadesModal()
  } catch (error) {
    console.error('Error al guardar actividades:', error)
    alertStore.push({ type: 'error', message: 'Error al guardar las asignaciones.' })
  } finally {
    saving.value = false
  }
}

// ============================================
// MÉTODOS - CONTRASEÑA (NUEVO)
// ============================================

const openPasswordModal = (usuario: Usuario) => {
  if (usuario.tipoUsuario === 'INTERNO') {
    alert('No se puede cambiar la contraseña de usuarios UMSA. La autenticación es mediante el sistema de Usuarios Umsa.')
    return
  }
  
  usuarioSeleccionado.value = usuario
  nuevaPassword.value = ''
  confirmarPassword.value = ''
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  usuarioSeleccionado.value = null
  nuevaPassword.value = ''
  confirmarPassword.value = ''
}

const guardarPassword = async () => {
  if (!usuarioSeleccionado.value) return

  // Validaciones
  if (nuevaPassword.value.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres')
    return
  }

  if (nuevaPassword.value !== confirmarPassword.value) {
    alert('Las contraseñas no coinciden')
    return
  }

  saving.value = true
  try {
    console.log('Cambiando contraseña para:', usuarioSeleccionado.value.username)
    // TODO: API call - PUT /api/usuarios/:id/password
    // Body: { password: nuevaPassword.value }
    
    alert('Contraseña actualizada exitosamente')
    closePasswordModal()
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    alert('Error al cambiar la contraseña')
  } finally {
    saving.value = false
  }
}

// ============================================
// MÉTODOS - MODALES
// ============================================

const openCreateModal = () => {
  modoEdicion.value = false
  formUsuario.value = {
    username: '',
    ci: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    tipoParticipante: 'EXTERNO',
    tipoUsuario: 'EXTERNO',
    estado: 'ACTIVO'
  }
  showUsuarioModal.value = true
}

const openEditModal = (usuario: Usuario) => {
  modoEdicion.value = true
  
  // USUARIOS INTERNOS: Solo editar nombres y apellidos
  // USUARIOS EXTERNOS: Editar todo excepto username
  formUsuario.value = {
    username: usuario.username,
    ci: usuario.ci ?? '',
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    password: '',
    tipoParticipante: 'EXTERNO',
    tipoUsuario: usuario.tipoUsuario,
    estado: usuario.estado
  }
  usuarioSeleccionado.value = usuario
  showUsuarioModal.value = true
}

const closeUsuarioModal = () => {
  showUsuarioModal.value = false
  usuarioSeleccionado.value = null
}

const openRolesModal = (usuario: Usuario) => {
  usuarioSeleccionado.value = usuario
  rolesSeleccionados.value = usuario.roles.filter(r => r !== 'PARTICIPANTE')
  tituloDocente.value = ''
  showRolesModal.value = true
}

const closeRolesModal = (options?: { keepSelected?: boolean }) => {
  showRolesModal.value = false
  if (!options?.keepSelected) {
    usuarioSeleccionado.value = null
  }
  rolesSeleccionados.value = []
  tituloDocente.value = ''
}

const openAccionesModal = (usuario: Usuario) => {
  usuarioSeleccionado.value = usuario
  showAccionesModal.value = true
}

const closeAccionesModal = () => {
  showAccionesModal.value = false
}

const ejecutarAccionUsuario = (callback: (usuario: Usuario) => void) => {
  if (!usuarioSeleccionado.value) return
  callback(usuarioSeleccionado.value)
  showAccionesModal.value = false
}

// ============================================
// MÉTODOS - UTILIDADES
// ============================================

const limpiarFiltros = () => {
  filtros.value = {
    busqueda: '',
    tipoUsuario: '',
    rol: '',
    estado: '',
    emailVerificado: ''
  }
}

const getInitials = (nombres: string, apellidos: string) => {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
}

const normalizarRol = (rol: string) => rol.replace(/Ñ/g, 'N').replace(/ñ/g, 'n').toUpperCase()

const normalizarRoles = (roles: string[]) => roles.map(normalizarRol)

const hasRole = (roles: string[], rol: string) => normalizarRoles(roles).includes(normalizarRol(rol))

const getRolBadgeVariant = (rol: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'ADMINISTRADOR': 'danger',
    'COORDINADOR': 'primary',
    'DOCENTE': 'info',
    'PARTICIPANTE': 'gray',
    'AUXILIAR': 'secondary',
    'DISENADOR': 'warning'
  }
  return variants[normalizarRol(rol)] || 'gray'
}

const formatRolName = (rol: string) => {
  const nombres: Record<string, string> = {
    'ADMINISTRADOR': 'Admin',
    'COORDINADOR': 'Coord.',
    'DOCENTE': 'Docente',
    'PARTICIPANTE': 'Part.',
    'AUXILIAR': 'Aux.',
    'DISENADOR': 'Diseñador'
  }
  return nombres[normalizarRol(rol)] || rol
}

const formatDate = (date: string) => {
  return formatDateUtil(date, 'es-BO')
}

const formatDateTime = (date: string) => {
  return formatDateTimeUtil(date, 'es-BO')
}

const irAAsignacionDisenador = () => {
  showAccionesModal.value = false
  router.push({ name: 'coordinator-designers' })
}

const buildParaleloKey = (idCurso: number, codigo: string) => {
  return `${idCurso}:${codigo}`
}

const parseParaleloKey = (key: string) => {
  const [idCurso, codigo] = key.split(':')
  return { idCurso: Number(idCurso), codigo }
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  cargarUsuarios()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>