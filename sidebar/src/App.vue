<script setup lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faPencil,
  faArrowsRotate,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { ref, provide } from 'vue';
import FontAwesomeSolid from 'shared/components/FontAwesomeSolid.vue';

const props = defineProps<{ reduced: boolean }>();

library.add(faPlus, faPencil, faArrowsRotate, faCircleNotch);

let inserting = ref(false);
let insertType = ref('');
let editing = ref(false);
let refreshing = ref(false);

provide('inserting', inserting);
provide('insertType', insertType);

function insert() {
  if (!props.reduced) {
    inserting.value = true;
    insertType.value = 'blank';
  }
  google.script.run
    .withSuccessHandler(() => {
      inserting.value = false;
      insertType.value = '';
    })
    .newDiagram('blank');
}

function edit() {
  if (!props.reduced) {
    editing.value = true;
  }
  google.script.run
    .withSuccessHandler(() => {
      editing.value = false;
    })
    .editSelectedDiagram();
}

function refresh() {
  if (!props.reduced) {
    refreshing.value = true;
  }
  google.script.run
    .withSuccessHandler(() => {
      refreshing.value = false;
    })
    .showSidebar();
}
</script>

<template>
  <div class="d-grid gap-2" id="container">
    <button
      class="btn btn-large btn-blue"
      type="button"
      @click="insert()"
      :disabled="inserting"
    >
      <FontAwesomeSolid
        class="mr-1"
        :icon="inserting && insertType == 'blank' ? 'circle-notch' : 'plus'"
        :spin="inserting && insertType == 'blank'"
      />
      Insert
    </button>
    <button
      class="btn btn-large btn-blue"
      type="button"
      @click="edit"
      :disabled="editing"
    >
      <FontAwesomeSolid
        class="mr-1"
        :icon="editing ? 'circle-notch' : 'pencil'"
        :spin="editing"
      />
      Edit
    </button>
    <button
      class="btn btn-large btn-blue"
      type="button"
      @click="refresh"
      :disabled="refreshing"
    >
      <FontAwesomeSolid
        class="mr-1"
        :icon="refreshing ? 'circle-notch' : 'arrows-rotate'"
        :spin="refreshing"
      />
      Refresh
    </button>
  </div>
</template>

<style>
#container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  padding: 0 2rem;
  --fa-animation-duration: 1s;
}
</style>
