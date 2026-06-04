<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Panel de auxiliar</h1>
      <p class="text-sm text-slate-500">Gestiona la asistencia de eventos asignados.</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <div class="space-y-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Eventos</p>
            <p class="text-lg font-semibold text-slate-900">Revisa tus eventos</p>
          </div>
          <router-link to="/auxiliar/eventos">
            <Button variant="outline">Ver eventos</Button>
          </router-link>
        </div>
      </Card>

      <Card>
        <div class="space-y-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Asistencia</p>
            <p class="text-lg font-semibold text-slate-900">Registrar asistencia</p>
          </div>
          <router-link to="/auxiliar/asistencia">
            <Button>Registrar asistencia</Button>
          </router-link>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
</script>
