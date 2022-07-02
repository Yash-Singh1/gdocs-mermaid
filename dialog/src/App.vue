<script setup lang="ts">
import { defineProps, ref } from 'vue';
import unraw from './helpers/unraw';

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  mermaid: Object,
  // idx: {
  //   type: Number,
  //   required: true,
  // },
});

const code = ref(unraw(props.code));
const error = ref('');

function save() {
  google.script.run
    .withFailureHandler((err) => {
      error.value = err.message;
    })
    .withSuccessHandler(() => {
      error.value = '';
      google.script.host.close();
    })
    .save(code.value);
}
</script>

<template>
  <textarea v-model="code"></textarea>
  <button @click="save">Save</button>
  <span id="error" v-show="error">{{ error }}</span>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

button {
  display: block;
}

#error {
  color: red;
}
</style>
