<template>
  <div
    class="min-h-screen relative overflow-hidden bg-slate-950 text-slate-900 flex items-center justify-center px-4 py-12"
    style="font-family: 'Space Grotesk', 'Segoe UI', Tahoma, sans-serif;"
  >
    <div class="absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_20%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(16,185,129,0.16),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]"></div>
    <div class="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"></div>
    <div class="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"></div>

    <div class="relative w-full text-left" :class="containerWidthClass">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const containerWidthClass = computed(() => {
  if (route.name === 'register') return 'max-w-5xl'
  return 'max-w-md'
})
</script>
