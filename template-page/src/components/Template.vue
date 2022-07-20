<script setup lang="ts">
import flowchart from '../assets/flowchart.svg?raw';
import { inject } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import FontAwesomeSolid from 'shared/components/FontAwesomeSolid.vue';

const img = `data:image/svg+xml;base64,${btoa(flowchart)}`;

const props = defineProps<{
  title: string;
  description: string;
  type: string;
}>();

const inserting = inject<boolean>('inserting');
const insertType = inject<string>('insertType');
const select = inject<(type: string) => void>('select');
</script>

<template>
  <div
    class="shadow-lg rounded text-left my-3 pt-2 pb-16 bg-slate-100/50 relative"
  >
    <img :src="img" class="w-full" alt="Flowchart" />
    <div class="px-6 py-4">
      <h2 class="text-xl font-bold mb-2">{{ props.title }}</h2>
      <p class="text-gray-700 text-base">{{ props.description }}</p>
    </div>
    <div class="px-6 pb-2 absolute bottom-0">
      <button
        class="btn btn-large btn-blue mt-0 w-max"
        @click="select?.(props.type)"
        :disabled="inserting"
      >
        <FontAwesomeSolid
          class="mr-1"
          icon="circle-notch"
          spin
          v-if="inserting && insertType == props.type"
        />
        Select
      </button>
    </div>
  </div>
</template>

<style></style>
