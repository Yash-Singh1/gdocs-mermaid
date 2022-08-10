<template>
  <div id="modal-content">
    <span
      class="close-it absolute right-1 -top-1 text-2xl cursor-pointer"
      @click="emit('cancel')"
      >&times;</span
    >
    <slot />
    <button
      v-if="closeBtn !== false"
      @click="emit('close')"
      class="btn btn-blue btn-large"
    >
      {{ closeBtn || 'Close' }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ closeBtn?: string | false }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'cancel'): void }>();
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

.close-it {
  line-height: 1.5rem;
}
</style>
