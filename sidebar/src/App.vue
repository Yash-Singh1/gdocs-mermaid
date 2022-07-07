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
import { ref, defineProps, provide } from 'vue';
import { MenuButton, MenuItems, MenuItem, Menu } from '@headlessui/vue';
import Template from './components/Template.vue';

const props = defineProps<{ reduced: boolean }>();

library.add(faPlus, faPencil, faArrowsRotate, faCircleNotch, faTrashCan);

let inserting = ref(false);
let insertType = ref('');
let editing = ref(false);
let refreshing = ref(false);
let deleting = ref(false);
let templatePage = ref(false);

provide('inserting', inserting);
provide('insertType', insertType);

function insert(type: string) {
  if (!props.reduced) {
    inserting.value = true;
    insertType.value = type;
  }
  google.script.run
    .withSuccessHandler(() => {
      inserting.value = false;
      insertType.value = '';
    })
    .newDiagram(type);
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
  <div class="d-grid gap-2" id="container" v-show="!templatePage">
    <Menu as="div" class="relative">
      <MenuButton class="btn btn-blue mb-0" type="button" :disabled="inserting">
        <font-awesome-icon
          class="mr-1"
          :icon="
            inserting && insertType == 'blank'
              ? 'fa-solid fa-circle-notch'
              : 'fa-solid fa-plus'
          "
          :spin="inserting && insertType == 'blank'"
        />
        Insert
      </MenuButton>
      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems
          class="absolute left-0 mt-1 ml-1 w-max box-content origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
        >
          <MenuItem>
            <button
              class="btn m-0 rounded-none text-left justify-start font-semibold pr-5"
              @click="insert('blank')"
            >
              Blank
            </button>
          </MenuItem>
          <MenuItem>
            <button
              class="btn m-0 rounded-none text-left justify-start font-semibold pr-5"
              @click="templatePage = true"
            >
              Template
            </button>
          </MenuItem>
        </MenuItems>
      </transition>
    </Menu>
    <button
      class="btn btn-blue"
      type="button"
      @click="edit"
      :disabled="editing"
    >
      <font-awesome-icon
        class="mr-1"
        :icon="editing ? 'fa-solid fa-circle-notch' : 'fa-solid fa-pencil'"
        :spin="editing"
      />
      Edit
    </button>
    <button
      class="btn btn-blue"
      type="button"
      @click="deleteDiagram"
      :disabled="deleting"
    >
      <font-awesome-icon
        class="mr-1"
        :icon="deleting ? 'fa-solid fa-circle-notch' : 'fa-solid fa-trash-can'"
        :spin="deleting"
      />
      Delete
    </button>
    <button
      class="btn btn-blue"
      type="button"
      @click="refresh"
      :disabled="refreshing"
    >
      <font-awesome-icon
        class="mr-1"
        :icon="
          refreshing ? 'fa-solid fa-circle-notch' : 'fa-solid fa-arrows-rotate'
        "
        :spin="refreshing"
      />
      Refresh
    </button>
  </div>
  <div v-if="templatePage" class="p-8 grid grid-cols-1 max-w-[100vw]">
    <h2 class="text-left">
      <span
        class="text-blue-500 cursor-pointer hover:text-blue-600 focus:text-blue-600 active:text-blue-700"
        @click="templatePage = false"
        >Home</span
      >
      /
      <span
        class="text-blue-500 cursor-pointer hover:text-blue-600 focus:text-blue-600 active:text-blue-700"
        >Templates</span
      >
    </h2>
    <Template
      title="Sequence Diagram"
      description="Show sequential flow in a diagram."
      type="sequenceDiagram"
      @select="insert"
    />
    <Template
      title="Flowchart"
      description="Describes a process or flow."
      type="flowchart"
      @select="insert"
    />
    <Template
      title="Pie Chart"
      description="Show relative categorization numbers."
      type="pie"
      @select="insert"
    />
    <Template
      title="Git Graph"
      description="Present a git version control workflow."
      type="gitGraph"
      @select="insert"
    />
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
