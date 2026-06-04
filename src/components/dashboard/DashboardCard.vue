<template>
  <div class="bg-white shadow rounded p-4">
    <p class="text-gray-500">{{ title }}</p>
    <p class="text-3xl font-bold">{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: number
}>()
</script>
