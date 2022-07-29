<script setup lang="ts">
import flowchart from '../assets/flowchart.svg?raw';
import { inject } from 'vue';
import FontAwesomeSolid from 'shared/components/FontAwesomeSolid.vue';
import CustomTemplate from '../types/CustomTemplate';

const img = `data:image/svg+xml;base64,${btoa(flowchart)}`;

const props = defineProps<{
  title: string;
  description: string;
  type: string | CustomTemplate;
}>();

const emit = defineEmits<{
  (event: 'delete', what: string): void;
}>();

const inserting = inject<boolean>('inserting');
const insertType = inject<string>('insertType');
const select = inject<(type: string | CustomTemplate) => void>('select');

function deleteTemplate() {
  google.script.run.deleteTemplate(props.title);
  emit('delete', props.title);
}
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
    <div class="px-6 pb-2 absolute bottom-0 flex gap-4">
      <button
        class="btn btn-large btn-blue mt-0 w-max"
        @click="select?.(props.type)"
        :disabled="inserting"
      >
        <FontAwesomeSolid
          class="mr-1"
          icon="circle-notch"
          spin
          v-if="
            inserting &&
            (insertType == props.type ||
              (typeof props.type !== 'string' && insertType == props.type.code))
          "
        />
        Select
      </button>
      <button
        v-if="typeof props.type !== 'string' && 'special' in props.type"
        class="btn btn-large btn-blue mt-0 w-max"
        @click="deleteTemplate"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<style></style>
