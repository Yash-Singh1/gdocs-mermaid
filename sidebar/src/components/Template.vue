<template>
  <div class="shadow-lg rounded text-left my-3 pt-2">
    <img :src="img" class="w-full" alt="Flowchart" />
    <div class="px-6 py-4">
      <h2 class="text-xl font-bold mb-2">{{ title }}</h2>
      <p class="text-gray-700 text-base">{{ description }}</p>
    </div>
    <div class="px-6 pb-2">
      <button
        class="btn btn-large btn-blue mt-0 w-max"
        @click="select"
        :disabled="inserting"
      >
        <font-awesome-icon
          class="mr-1"
          icon="fa-solid fa-circle-notch"
          spin
          v-if="inserting && insertType == type"
        />
        Select
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import flowchart from '../assets/flowchart.svg?raw';
import { inject } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const img = `data:image/svg+xml;base64,${btoa(flowchart)}`;

const props = defineProps<{
  title: string;
  description: string;
  type: string;
}>();

const inserting = inject<boolean>('inserting');
const insertType = inject<string>('insertType');

const emit = defineEmits<{
  (event: 'select', type: string): void;
}>();

function select() {
  emit('select', props.type);
}
</script>

<style></style>
