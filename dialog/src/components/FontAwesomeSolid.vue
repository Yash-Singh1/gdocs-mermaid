<template>
  <FontAwesomeIcon :icon="`fa-solid fa-${icon}`" />
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

defineProps<{ icon: string }>();
</script>

<style scoped></style>
