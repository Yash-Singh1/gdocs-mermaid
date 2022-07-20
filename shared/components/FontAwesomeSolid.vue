<template>
  <FontAwesomeIcon :icon="`fa-solid fa-${icon}`" :spin="spin ? true : false" />
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

defineProps<{ icon: string; spin?: boolean }>();
</script>

<style scoped></style>
