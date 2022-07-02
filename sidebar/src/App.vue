<script setup lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faPencil,
  faArrowsRotate,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, defineProps } from 'vue';

const props = defineProps({
  reduced: {
    type: Boolean,
    required: true,
  },
});

library.add(faPlus, faPencil, faArrowsRotate, faCircleNotch);

let inserting = ref(false);
let editing = ref(false);
let refreshing = ref(false);

function insert() {
  if (!props.reduced) {
    inserting.value = true;
  }
  google.script.run
    .withSuccessHandler(() => {
      inserting.value = false;
    })
    .newDiagram();
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
  <div class="d-grid gap-2">
    <button class="btn btn-primary" type="button" @click="insert">
      <font-awesome-icon
        :icon="inserting ? 'fa-solid fa-circle-notch' : 'fa-solid fa-plus'"
        :spin="inserting"
      />
      Insert
    </button>
    <button class="btn btn-primary" type="button" @click="edit">
      <font-awesome-icon
        :icon="editing ? 'fa-solid fa-circle-notch' : 'fa-solid fa-pencil'"
        :spin="editing"
      />
      Edit
    </button>
    <button class="btn btn-primary" type="button" @click="refresh">
      <font-awesome-icon
        :icon="
          refreshing ? 'fa-solid fa-circle-notch' : 'fa-solid fa-arrows-rotate'
        "
        :spin="refreshing"
      />
      Refresh
    </button>
  </div>
</template>

<style>
@import url('bootstrap/dist/css/bootstrap.min.css');

#app {
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
