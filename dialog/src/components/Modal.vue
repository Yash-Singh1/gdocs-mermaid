<template>
  <div id="modal-content">
    <slot />
    <button @click="emit('close')" class="btn btn-blue btn-large">
      {{ closeBtn || 'Close' }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ closeBtn?: string }>();
const emit = defineEmits<{ (e: 'close'): void }>();
</script>

<style>
#modal-content {
  width: 50vw;
  height: 50vh;
  position: absolute;
  top: 25vh;
  left: 25vw;
  z-index: 100;
  @apply rounded-md bg-gray-300 border-gray-900 border-2 p-5;
}
</style>
