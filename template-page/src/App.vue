<script setup lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faPencil,
  faArrowsRotate,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import Template from './components/Template.vue';
import { ref, provide, toRef } from 'vue';
import CustomTemplate from './types/CustomTemplate';

let inserting = ref(false);
let insertType = ref('');

interface Template {
  name: string;
  description: string;
  code: string;
}

const props = defineProps<{
  reduced: boolean;
  attachTo: boolean;
  templates: Template[];
}>();

const templates = ref(props.templates);

library.add(faPlus, faPencil, faArrowsRotate, faCircleNotch);

function insert(type: string | CustomTemplate) {
  if (!props.reduced) {
    inserting.value = true;
    insertType.value = typeof type === 'string' ? type : type.code;
  }
  google.script.run
    .withSuccessHandler(() => {
      inserting.value = false;
      insertType.value = '';
      google.script.host.close();
    })
    [props.attachTo ? 'applyTemplate' : 'newDiagram'](
      typeof type === 'string' ? type : type.code,
      typeof type !== 'string'
    );
}

function goToEditor() {
  google.script.run.editSelectedDiagram();
}

function deleteTemplate(what: string) {
  templates.value = templates.value.filter(
    (template) => template.name !== what
  );
}

provide('inserting', inserting);
provide('insertType', insertType);
provide('select', insert);
</script>

<template>
  <h2 class="text-left pl-8 text-3xl" v-once>
    <a href="#" @click="goToEditor" class="text-blue-500" v-if="attachTo"
      >Editor</a
    ><span v-if="attachTo" class="mx-2">/</span>Templates
  </h2>
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
    <Template
      :title="template.name"
      :description="template.description"
      :type="{ special: true, code: template.code }"
      @delete="deleteTemplate"
      v-for="template in templates"
    />
  </div>
</template>
