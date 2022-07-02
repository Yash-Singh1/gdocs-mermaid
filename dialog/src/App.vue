<script setup lang="ts">
import { defineProps, ref } from 'vue';
import unraw from './helpers/unraw';
import CodemirrorEditor from './components/CodemirrorEditor.vue';

const props = defineProps<{
  code: string;
  mermaid?: any;
}>();

const code = ref(unraw(props.code));

function save() {
  google.script.run
    .withSuccessHandler(() => {
      google.script.host.close();
    })
    .save(code.value);
}

function onChange(newValue: string) {
  code.value = newValue;
}
</script>

<template>
  <CodemirrorEditor :onChange="onChange" :initialValue="code" />
  <button @click="save">Save</button>
</template>

<style>
@import url('bootstrap/dist/css/bootstrap.min.css');
</style>
