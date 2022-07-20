<script setup lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faPencil,
  faArrowsRotate,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import Template from './components/Template.vue';
import { ref, provide } from 'vue';

let inserting = ref(false);
let insertType = ref('');

const props = defineProps<{ reduced: boolean; attachTo: boolean }>();

library.add(faPlus, faPencil, faArrowsRotate, faCircleNotch);

function insert(type: string) {
  if (!props.reduced) {
    inserting.value = true;
    insertType.value = type;
  }
  google.script.run
    .withSuccessHandler(() => {
      inserting.value = false;
      insertType.value = '';
      google.script.host.close();
    })
    [props.attachTo ? 'applyTemplate' : 'newDiagram'](type);
}

provide('inserting', inserting);
provide('insertType', insertType);
provide('select', insert);
</script>

<template>
  <h2 class="text-left pl-8 text-3xl">Templates</h2>
  <div class="px-8 pb-8 grid grid-cols-4 gap-4 max-w-[100vw]">
    <Template
      title="Sequence Diagram"
      description="Show sequential flow in a diagram."
      type="sequenceDiagram"
    />
    <Template
      title="Flowchart"
      description="Describes a process or flow."
      type="flowchart"
    />
    <Template
      title="Pie Chart"
      description="Show relative categorization numbers."
      type="pie"
    />
    <Template
      title="Git Graph"
      description="Present a git version control workflow."
      type="gitGraph"
    />
  </div>
</template>
