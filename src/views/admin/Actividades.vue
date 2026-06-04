<template>
  <!--
    Vista de Gestión de Actividades - Administrador
    Permite gestionar todos los cursos y eventos del sistema sin filtro de carrera
  -->
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Actividades</h1>
        <p class="text-gray-600">Administrar todos los cursos y eventos del sistema</p>
      </div>
      <Button @click="openCreateModal">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva Actividad
      </Button>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.total }}</p>
          <p class="text-sm text-gray-600">Total</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-600">{{ estadisticas.cursos }}</p>
          <p class="text-sm text-gray-600">Cursos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.eventos }}</p>
          <p class="text-sm text-gray-600">Eventos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.abiertos }}</p>
          <p class="text-sm text-gray-600">Abiertos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-600">{{ estadisticas.finalizados }}</p>
          <p class="text-sm text-gray-600">Finalizados</p>
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
            placeholder="Nombre de la actividad..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Tipo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            v-model="filtros.tipo"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="CURSO">Cursos</option>
            <option value="EVENTO">Eventos</option>
          </select>
        </div>

        <!-- Estado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="filtros.estado"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="ABIERTO">Abiertos</option>
            <option value="LLENO">Llenos</option>
            <option value="FINALIZADO">Finalizados</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <!-- Carrera -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
          <select
            v-model="filtros.carrera"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las carreras</option>
            <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>

        <!-- Modalidad -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
          <select
            v-model="filtros.modalidad"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
            <option value="MIXTO">Mixto</option>
          </select>
        </div>

        <!-- Rango de fechas -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            v-model="filtros.fechaDesde"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="flex items-end">
          <Button variant="outline" class="w-full" @click="limpiarFiltros">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Limpiar
          </Button>
        </div>
      </div>
    </Card>

    <!-- Tabla de actividades -->
    <Card>
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Cargando actividades...</p>
      </div>

      <div v-else-if="actividadesPaginadas.length > 0" class="overflow-x-auto"> <!-- era actividadesFiltradas -->
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actividad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Carrera</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fechas</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Modalidad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Inscritos</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precio</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="actividad in actividadesPaginadas" :key="actividad.idActividad" class="hover:bg-gray-50">
              <!-- Nombre -->
              <td class="px-4 py-3">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ actividad.nombre }}</p>
                  <p class="text-xs text-gray-500">{{ actividad.cargaHoraria }} horas</p>
                </div>
              </td>

              <!-- Tipo -->
              <td class="px-4 py-3">
                <Badge :variant="actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ actividad.tipo }}
                </Badge>
              </td>

              <!-- Carrera -->
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ actividad.carrera }}
              </td>

              <!-- Fechas -->
              <td class="px-4 py-3 text-sm text-gray-600">
                <div class="text-xs">
                  <template v-if="actividad.tipo === 'EVENTO'">
                    <p>{{ formatDateTime(actividad.fechaInicio) }}</p>
                  </template>
                  <template v-else>
                    <p>{{ formatDate(actividad.fechaInicio) }}</p>
                    <p v-if="actividad.fechaFin && actividad.fechaFin !== actividad.fechaInicio" class="text-gray-500">
                      {{ formatDate(actividad.fechaFin) }}
                    </p>
                  </template>
                </div>
              </td>

              <!-- Modalidad -->
              <td class="px-4 py-3">
                <Badge :variant="getModalidadBadge(actividad.modalidad)" size="sm">
                  {{ actividad.modalidad }}
                </Badge>
              </td>

              <!-- Inscritos -->
              <td class="px-4 py-3 text-sm">
                <div class="flex items-center space-x-2">
                  <span class="font-medium">{{ actividad.inscritos }}</span>
                  <span class="text-gray-500">/ {{ actividad.cupoMaximo }}</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="getCupoColor(actividad.inscritos, actividad.cupoMaximo)"
                      :style="{ width: `${getCupoPorcentaje(actividad.inscritos, actividad.cupoMaximo)}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- Precio -->
              <td class="px-4 py-3 text-sm">
                <div v-if="actividad.esGratuito" class="text-green-600 font-medium">
                  GRATUITO
                </div>
                <div v-else class="text-xs">
                  <p class="text-gray-800">Bs. {{ actividad.costoExterno }}</p>
                  <p class="text-gray-500">Bs. {{ actividad.costoUmsa }} (UMSA)</p>
                </div>
              </td>

              <!-- Estado -->
              <td class="px-4 py-3">
                <Badge :variant="getEstadoBadge(getEstadoMostrado(actividad))" size="sm">
                  {{ getEstadoMostrado(actividad) }}
                </Badge>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-3">
                <div class="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" @click="verDetalle(actividad)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="sm" @click="openEditModal(actividad)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-red-600 hover:text-red-800"
                    @click="openDeleteModal(actividad)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="totalItems > 0"
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        :show-page-size-selector="true"
        @update:current-page="goToPage"
        @update:page-size="setPageSize"
      />

      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-600">No se encontraron actividades</p>
      </div>
    </Card>

    <!-- Modal Crear/Editar Actividad -->
    <Modal
      :modelValue="showActividadModal"
      @close="closeActividadModal"
      :title="modoEdicion ? 'Editar Actividad' : 'Nueva Actividad'"
      size="lg"
    >
      <form @submit.prevent="submitActividad" class="space-y-4">
        <!-- Tipo de actividad -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Actividad <span class="text-red-600">*</span>
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formActividad.tipo === 'CURSO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formActividad.tipo"
                value="CURSO"
                class="w-4 h-4 text-blue-600"
              />
              <div class="ml-3">
                <p class="font-medium text-gray-800">Curso Complementario</p>
                <p class="text-xs text-gray-600">Requiere calificación</p>
              </div>
            </label>
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formActividad.tipo === 'EVENTO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formActividad.tipo"
                value="EVENTO"
                class="w-4 h-4 text-blue-600"
              />
              <div class="ml-3">
                <p class="font-medium text-gray-800">Evento Facultativo</p>
                <p class="text-xs text-gray-600">Solo asistencia</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Información básica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Nombre -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span class="text-red-600">*</span>
            </label>
            <input
              v-model="formActividad.nombre"
              type="text"
              required
              placeholder="Ej: Introducción a la Psicología Clínica"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Carrera -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Carrera <span class="text-red-600">*</span>
            </label>
            <select
              v-model="formActividad.idCarrera"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar carrera</option>
              <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>

          <!-- Carga horaria -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Carga Horaria <span class="text-red-600">*</span>
            </label>
            <input
              v-model.number="formActividad.cargaHoraria"
              type="number"
              required
              min="1"
              placeholder="Horas académicas"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Modalidad (solo evento) -->
          <div v-if="formActividad.tipo === 'EVENTO'">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Modalidad <span class="text-red-600">*</span>
            </label>
            <select
              v-model="formActividad.modalidad"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>

          <!-- Cupo máximo (solo evento) -->
          <div v-if="formActividad.tipo === 'EVENTO'">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Cupo Máximo
            </label>
            <input
              v-model.number="formActividad.cupoMaximo"
              type="number"
              min="1"
              placeholder="Número de participantes"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            v-model="formActividad.descripcion"
            rows="3"
            placeholder="Describe los objetivos, contenidos y requisitos de la actividad..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Lugar e imagen -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="formActividad.tipo === 'EVENTO'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
            <input
              v-model="formActividad.lugar"
              type="text"
              placeholder="Ej: Auditorio principal"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Imagen <span class="text-red-600">*</span>
            </label>
            <input
              ref="imageInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleImageChange"
            />
            <button
              type="button"
              class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              @click="triggerImagePicker"
            >
              Seleccionar imagen
            </button>
            <p class="mt-2 text-xs text-gray-500">
              Formatos: JPG, PNG o WebP. Maximo 5MB.
            </p>
            <div v-if="imagenPreview" class="mt-3">
              <img
                :src="imagenPreview"
                alt="Vista previa"
                class="h-32 w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>

        <!-- Fechas / Fecha y hora -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="formActividad.tipo === 'CURSO'">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inicio <span class="text-red-600">*</span>
            </label>
            <input
              v-model="formActividad.fechaInicio"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora <span class="text-red-600">*</span>
            </label>
            <input
              v-model="formActividad.fechaHora"
              type="datetime-local"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div v-if="formActividad.tipo === 'EVENTO'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Link</label>
            <input
              v-model="formActividad.link"
              type="text"
              placeholder="https://..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Precios -->
        <div>
          <label class="flex items-center mb-3">
            <input
              type="checkbox"
              v-model="formActividad.esGratuito"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm font-medium text-gray-700">Actividad Gratuita</span>
          </label>

          <div v-if="!formActividad.esGratuito" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Precio Externo (Bs.) <span class="text-red-600">*</span>
              </label>
              <input
                v-model.number="formActividad.costoExterno"
                type="number"
                :required="!formActividad.esGratuito"
                :disabled="formActividad.esGratuito"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Precio UMSA (Bs.) <span class="text-red-600">*</span>
              </label>
              <input
                v-model.number="formActividad.costoUmsa"
                type="number"
                :required="!formActividad.esGratuito"
                :disabled="formActividad.esGratuito"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Nota mínima (solo para cursos) -->
        <div v-if="formActividad.tipo === 'CURSO'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nota Mínima de Aprobación <span class="text-red-600">*</span>
          </label>
          <input
            v-model.number="formActividad.notaMinimaAprobacion"
            type="number"
            :required="formActividad.tipo === 'CURSO'"
            min="0"
            max="100"
            placeholder="Sobre 100 puntos"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">Sobre 100 puntos</p>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeActividadModal">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear') }}
          </Button>
        </div>
      </form>
    </Modal>

    <Modal
      :modelValue="showDeleteModal"
      title="Eliminar actividad"
      size="md"
      @close="closeDeleteModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Esta accion eliminara la actividad seleccionada. Esta seguro de continuar?
        </p>
        <div class="flex justify-end space-x-3">
          <Button type="button" variant="outline" @click="closeDeleteModal">Cancelar</Button>
          <Button type="button" variant="danger" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
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
import Pagination from '@/components/common/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { api } from '@/utils/api'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, parseLocalDate } from '@/utils/dateFormatter'
import { useAlertStore } from '@/stores/alert.store'
// ============================================
// TIPOS
// ============================================

interface Actividad {
  idActividad: number
  tipo: 'CURSO' | 'EVENTO'
  nombre: string
  descripcion: string
  lugar?: string
  imagen?: string
  cargaHoraria: number
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'MIXTO'
  fechaInicio: string
  fechaFin: string
  cupoMaximo: number
  costoExterno: number
  costoUmsa: number
  esGratuito: boolean
  notaMinimaAprobacion: number | null
  link?: string
  estado: 'ABIERTO' | 'LLENO' | 'FINALIZADO'
  idCarrera: number | null
  carrera: string
  inscritos: number
}

interface Carrera {
  id: number
  nombre: string
}

// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const saving = ref(false)

const router = useRouter()
const alertStore = useAlertStore()

const actividades = ref<Actividad[]>([])
const carreras = ref<Carrera[]>([])

const estadisticas = ref({
  total: 0,
  cursos: 0,
  eventos: 0,
  abiertos: 0,
  finalizados: 0
})

const filtros = ref({
  busqueda: '',
  tipo: '',
  estado: '',
  carrera: '',
  modalidad: '',
  fechaDesde: ''
})

const showActividadModal = ref(false)
const modoEdicion = ref(false)
const actividadEditando = ref<Actividad | null>(null)

const showDeleteModal = ref(false)
const actividadAEliminar = ref<Actividad | null>(null)
const deleting = ref(false)

const imageInputRef = ref<HTMLInputElement | null>(null)
const imagenFile = ref<File | null>(null)
const imagenPreview = ref('')

const formActividad = ref({
  tipo: 'CURSO',
  nombre: '',
  descripcion: '',
  lugar: '',
  imagen: '',
  cargaHoraria: 0,
  modalidad: '',
  fechaInicio: '',
  fechaHora: '',
  cupoMaximo: 0,
  costoExterno: 0,
  costoUmsa: 0,
  esGratuito: false,
  notaMinimaAprobacion: 51,
  idCarrera: '',
  link: ''
})

// ============================================
// COMPUTED
// ============================================

const actividadesFiltradas = computed(() => {
  let resultado = [...actividades.value]

  if (filtros.value.busqueda) {
    const busqueda = filtros.value.busqueda.toLowerCase()
    resultado = resultado.filter(a =>
      a.nombre.toLowerCase().includes(busqueda)
    )
  }

  if (filtros.value.tipo) {
    resultado = resultado.filter(a => a.tipo === filtros.value.tipo)
  }

  if (filtros.value.estado) {
    resultado = resultado.filter(a => getEstadoMostrado(a) === filtros.value.estado)
  }

  if (filtros.value.carrera) {
    resultado = resultado.filter(a => a.idCarrera === Number(filtros.value.carrera))
  }

  if (filtros.value.modalidad) {
    resultado = resultado.filter(a => a.modalidad === filtros.value.modalidad)
  }

  return resultado
})

const {
  paginatedData: actividadesPaginadas, // ← Los datos que mostraremos en la tabla (10 items por defecto)
  currentPage,                       // ← Página actual (reactivo)
  pageSize,                          // ← Tamaño de página (reactivo)
  totalPages,                        // ← Total de páginas (calculado automáticamente)
  totalItems,                        // ← Total de items después de filtrar
  goToPage,                          // ← Método para ir a una página específica
  setPageSize                        // ← Método para cambiar el tamaño de página
} = usePagination(actividadesFiltradas, {
  pageSize: 10,      
  initialPage: 1     
})

// ============================================
// MÉTODOS
// ============================================

const cargarDatos = async () => {
  loading.value = true
  try {
    const [carrerasResponse, cursosResponse, eventosResponse] = await Promise.all([
      api.get('/carreras/todas'),
      api.get('/cursos/todos'),
      api.get('/eventos/todos')
    ])

    carreras.value = (carrerasResponse as Array<Record<string, unknown>>).map(carrera => ({
      id: Number(carrera.idCarrera ?? carrera.id ?? 0),
      nombre: String(carrera.nombre ?? '')
    }))

    const cursos = (cursosResponse as Array<Record<string, unknown>>).map(curso => {
      const costoExterno = Number(curso.costoExterno ?? 0)
      const costoUmsa = Number(curso.costoUmsa ?? 0)
      const paralelos = Array.isArray(curso.paralelos)
        ? (curso.paralelos as Array<Record<string, unknown>>)
        : []
      const inscritos = paralelos.reduce((sum, p) => sum + Number(p.inscritos ?? 0), 0)
      const cupoMaximo = paralelos.reduce((sum, p) => sum + Number(p.cupoMaximo ?? 0), 0)

      return {
        idActividad: Number(curso.idCurso),
        tipo: 'CURSO' as const,
        nombre: String(curso.nombre ?? ''),
        descripcion: String(curso.descripcion ?? ''),
        imagen: String(curso.imagen ?? ''),
        cargaHoraria: Number(curso.cargaHoraria ?? 0),
        modalidad: 'PRESENCIAL' as const,
        fechaInicio: String(curso.fechaInicio ?? ''),
        fechaFin: String(curso.fechaInicio ?? ''),
        cupoMaximo,
        costoExterno,
        costoUmsa,
        esGratuito: costoExterno === 0 && costoUmsa === 0,
        notaMinimaAprobacion: curso.notaAprobacion !== undefined ? Number(curso.notaAprobacion) : null,
        estado: String(curso.estado ?? 'ABIERTO') as Actividad['estado'],
        idCarrera: curso.idCarrera !== undefined ? Number(curso.idCarrera) : null,
        carrera: String(curso.nombreCarrera ?? ''),
        inscritos
      }
    })

    const eventos = (eventosResponse as Array<Record<string, unknown>>).map(evento => {
      const costoExterno = Number(evento.costoExterno ?? 0)
      const costoUmsa = Number(evento.costoUmsa ?? 0)
      const fechaHora = evento.fechaHora ? String(evento.fechaHora) : ''

      return {
        idActividad: Number(evento.idEvento),
        tipo: 'EVENTO' as const,
        nombre: String(evento.nombre ?? ''),
        descripcion: String(evento.descripcion ?? ''),
        lugar: String(evento.lugar ?? ''),
        imagen: String(evento.imagen ?? ''),
        cargaHoraria: Number(evento.cargaHoraria ?? 0),
        modalidad: String(evento.modalidad ?? 'PRESENCIAL') as Actividad['modalidad'],
        fechaInicio: fechaHora,
        fechaFin: fechaHora,
        cupoMaximo: Number(evento.cupoMaximo ?? 0),
        costoExterno,
        costoUmsa,
        esGratuito: costoExterno === 0 && costoUmsa === 0,
        notaMinimaAprobacion: null,
        link: String(evento.link ?? ''),
        estado: String(evento.estado ?? 'ABIERTO') as Actividad['estado'],
        idCarrera: evento.idCarrera !== undefined ? Number(evento.idCarrera) : null,
        carrera: String(evento.nombreCarrera ?? ''),
        inscritos: Number(evento.inscritos ?? 0)
      }
    })

    actividades.value = [...cursos, ...eventos]

    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const calcularEstadisticas = () => {
  const estadosMostrados = actividades.value.map(actividad => getEstadoMostrado(actividad))
  estadisticas.value = {
    total: actividades.value.length,
    cursos: actividades.value.filter(a => a.tipo === 'CURSO').length,
    eventos: actividades.value.filter(a => a.tipo === 'EVENTO').length,
    abiertos: estadosMostrados.filter(estado => estado === 'ABIERTO').length,
    finalizados: estadosMostrados.filter(estado => estado === 'FINALIZADO').length
  }
}

const submitActividad = async () => {
  saving.value = true
  try {
    if (!formActividad.value.imagen && !imagenFile.value) {
      alertStore.push({ type: 'warning', message: 'Debes subir una imagen para la actividad.' })
      saving.value = false
      return
    }

    const imagenUrl = await uploadImagen()
    formActividad.value.imagen = imagenUrl

    const costoExterno = formActividad.value.esGratuito ? 0 : Number(formActividad.value.costoExterno)
    const costoUmsa = formActividad.value.esGratuito ? 0 : Number(formActividad.value.costoUmsa)

    if (formActividad.value.tipo === 'CURSO') {
      const payload = {
        idCarrera: Number(formActividad.value.idCarrera),
        nombre: formActividad.value.nombre.trim(),
        descripcion: formActividad.value.descripcion?.trim() || null,
        imagen: imagenUrl,
        cargaHoraria: Number(formActividad.value.cargaHoraria),
        fechaInicio: formActividad.value.fechaInicio,
        costoExterno,
        costoUmsa,
        notaAprobacion: Number(formActividad.value.notaMinimaAprobacion)
      }

      if (modoEdicion.value && actividadEditando.value) {
        await api.put(`/cursos/${actividadEditando.value.idActividad}`, payload)
      } else {
        await api.post('/cursos', payload)
      }
    } else {
      const payload = {
        idCarrera: Number(formActividad.value.idCarrera),
        nombre: formActividad.value.nombre.trim(),
        descripcion: formActividad.value.descripcion?.trim() || null,
        lugar: formActividad.value.lugar?.trim() || null,
        imagen: imagenUrl,
        cargaHoraria: Number(formActividad.value.cargaHoraria),
        modalidad: formActividad.value.modalidad,
        fechaHora: formActividad.value.fechaHora,
        cupoMaximo: formActividad.value.cupoMaximo ? Number(formActividad.value.cupoMaximo) : null,
        costoExterno,
        costoUmsa,
        link: formActividad.value.link?.trim() || null
      }

      if (modoEdicion.value && actividadEditando.value) {
        await api.put(`/eventos/${actividadEditando.value.idActividad}`, payload)
      } else {
        await api.post('/eventos', payload)
      }
    }

    closeActividadModal()
    await cargarDatos()
  } catch (error) {
    console.error('Error al guardar actividad:', error)
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo guardar la actividad.' })
  } finally {
    saving.value = false
  }
}

const openDeleteModal = (actividad: Actividad) => {
  actividadAEliminar.value = actividad
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  actividadAEliminar.value = null
}

const confirmDelete = async () => {
  if (!actividadAEliminar.value) return
  deleting.value = true
  try {
    if (actividadAEliminar.value.tipo === 'CURSO') {
      await api.delete(`/cursos/${actividadAEliminar.value.idActividad}`)
    } else {
      await api.delete(`/eventos/${actividadAEliminar.value.idActividad}`)
    }
    alertStore.push({ type: 'success', message: 'Actividad eliminada.' })
    closeDeleteModal()
    await cargarDatos()
  } catch (error) {
    console.error('Error al eliminar:', error)
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo eliminar la actividad.' })
  } finally {
    deleting.value = false
  }
}

const openCreateModal = () => {
  modoEdicion.value = false
  actividadEditando.value = null
  formActividad.value = {
    tipo: 'CURSO',
    nombre: '',
    descripcion: '',
    lugar: '',
    imagen: '',
    cargaHoraria: 0,
    modalidad: '',
    fechaInicio: '',
    fechaHora: '',
    cupoMaximo: 0,
    costoExterno: 0,
    costoUmsa: 0,
    esGratuito: false,
    notaMinimaAprobacion: 51,
    idCarrera: '',
    link: ''
  }
  clearImagePreview()
  imagenFile.value = null
  showActividadModal.value = true
}

const openEditModal = (actividad: Actividad) => {
  modoEdicion.value = true
  actividadEditando.value = actividad
  formActividad.value = {
    tipo: actividad.tipo,
    nombre: actividad.nombre,
    descripcion: actividad.descripcion,
    lugar: actividad.tipo === 'EVENTO' ? (actividad.lugar ?? '') : '',
    imagen: actividad.imagen ?? '',
    cargaHoraria: actividad.cargaHoraria,
    modalidad: actividad.modalidad || 'PRESENCIAL',
    fechaInicio: actividad.tipo === 'CURSO' ? toDateInput(actividad.fechaInicio) : '',
    fechaHora: actividad.tipo === 'EVENTO' ? toDateTimeInput(actividad.fechaInicio) : '',
    cupoMaximo: actividad.cupoMaximo,
    costoExterno: actividad.costoExterno,
    costoUmsa: actividad.costoUmsa,
    esGratuito: actividad.esGratuito,
    notaMinimaAprobacion: actividad.notaMinimaAprobacion ?? 51,
    idCarrera: actividad.idCarrera ? String(actividad.idCarrera) : '',
    link: actividad.link ?? ''
  }
  imagenFile.value = null
  if (actividad.imagen) {
    imagenPreview.value = actividad.imagen
  } else {
    clearImagePreview()
  }
  showActividadModal.value = true
}

const closeActividadModal = () => {
  showActividadModal.value = false
  actividadEditando.value = null
  clearImagePreview()
  imagenFile.value = null
}

const verDetalle = (actividad: Actividad) => {
  router.push({
    name: 'activity-detail',
    params: { id: String(actividad.idActividad) },
    query: { tipo: actividad.tipo }
  })
}

const limpiarFiltros = () => {
  filtros.value = {
    busqueda: '',
    tipo: '',
    estado: '',
    carrera: '',
    modalidad: '',
    fechaDesde: ''
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return formatDateUtil(date, 'es-BO')
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  return formatDateTimeUtil(date, 'es-BO')
}

const isEventoFinalizadoPorFecha = (actividad: Actividad) => {
  if (actividad.tipo !== 'EVENTO' || !actividad.fechaInicio) return false
  return parseLocalDate(actividad.fechaInicio).getTime() < Date.now()
}

const getEstadoMostrado = (actividad: Actividad): Actividad['estado'] => {
  if (isEventoFinalizadoPorFecha(actividad)) return 'FINALIZADO'
  return actividad.estado
}

const toDateInput = (value: string) => {
  if (!value) return ''
  if (value.includes('T')) return value.split('T')[0]
  if (value.includes(' ')) return value.split(' ')[0]
  return value
}

const toDateTimeInput = (value: string) => {
  if (!value) return ''
  if (value.includes('T')) return value.slice(0, 16)
  if (value.includes(' ')) return value.replace(' ', 'T').slice(0, 16)
  return value
}

const getEstadoBadge = (estado: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'ABIERTO': 'success',
    'LLENO': 'warning',
    'FINALIZADO': 'gray'
  }
  return variants[estado] || 'info'
}

const getModalidadBadge = (modalidad: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'PRESENCIAL': 'info',
    'VIRTUAL': 'secondary',
    'MIXTO': 'primary'
  }
  return variants[modalidad] || 'gray'
}

const getCupoColor = (inscritos: number, maximo: number) => {
  if (!maximo || maximo <= 0) return 'bg-gray-400'
  const porcentaje = (inscritos / maximo) * 100
  if (porcentaje >= 90) return 'bg-red-600'
  if (porcentaje >= 70) return 'bg-yellow-600'
  return 'bg-green-600'
}

const getCupoPorcentaje = (inscritos: number, maximo: number) => {
  if (!maximo || maximo <= 0) return 0
  return Math.min(100, (inscritos / maximo) * 100)
}

const clearImagePreview = () => {
  if (imagenPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagenPreview.value)
  }
  imagenPreview.value = ''
}

const handleImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files && input.files.length > 0 ? input.files[0] : null
  if (!file) {
    imagenFile.value = null
    clearImagePreview()
    return
  }

  imagenFile.value = file
  clearImagePreview()
  imagenPreview.value = URL.createObjectURL(file)
}

const triggerImagePicker = () => {
  imageInputRef.value?.click()
}

const uploadImagen = async () => {
  if (!imagenFile.value) return formActividad.value.imagen || ''

  const formData = new FormData()
  formData.append('archivo', imagenFile.value)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const token = localStorage.getItem('token')

  const response = await fetch(`${baseUrl}/archivos/imagenes`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = data?.message || response.statusText || 'No se pudo subir la imagen.'
    throw new Error(message)
  }

  const data = await response.json().catch(() => null)
  return String(data?.url ?? '')
}

onMounted(() => {
  cargarDatos()
})
</script>