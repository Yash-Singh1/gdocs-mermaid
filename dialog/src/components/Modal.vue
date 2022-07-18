<template>
  <div id="modal-content">
    <p>{{ recognitionFailure }}</p>
    <button @click="emit('close')" class="btn btn-blue btn-large">Close</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ recognitionFailure: string }>();
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
}
</style>
