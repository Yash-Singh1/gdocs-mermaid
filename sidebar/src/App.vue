<script setup lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faPencil,
  faArrowsRotate,
  faCircleNotch,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, defineProps } from 'vue';

const props = defineProps<{ reduced: boolean }>();

library.add(faPlus, faPencil, faArrowsRotate, faCircleNotch, faTrashCan);

let inserting = ref(false);
let editing = ref(false);
let refreshing = ref(false);
let deleting = ref(false);

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

function deleteDiagram() {
  if (!props.reduced) {
    deleting.value = true;
  }
  google.script.run
    .withSuccessHandler(() => {
      deleting.value = false;
    })
    .deleteDiagram();
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
    <button class="btn btn-primary" type="button" @click="deleteDiagram">
      <font-awesome-icon
        :icon="deleting ? 'fa-solid fa-circle-notch' : 'fa-solid fa-trash-can'"
        :spin="deleting"
      />
      Delete
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

.loader {
  box-sizing: content-box;
  width: 14px;
  height: 14px;
  display: inline-block;
  vertical-align: middle;
  border: 5px solid #fff;
  border-top-color: #ff1e1e;
  border-radius: 50%;
  animation-name: rotate;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes rotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(100);
  }
}

.hidden {
  display: none;
}
</style>
