<script setup lang="ts">
import { defineProps, nextTick, onMounted, ref } from 'vue';
import unraw from './helpers/unraw';
import CodemirrorEditor from './components/CodemirrorEditor.vue';
import mermaid from 'mermaid';
import type { Diagnostic } from '@codemirror/lint';
import type { Text } from '@codemirror/state';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faCircleNotch);

const props = defineProps<{
  code: string;
  mermaid?: any;
}>();

const code = ref(unraw(props.code));
const container = ref<HTMLElement | null>(null);
const saving = ref(false);
const diagnostics = ref<Diagnostic | undefined>(undefined);
const json = ref<string[] | null>(null);

function save() {
  saving.value = true;
  google.script.run
    .withSuccessHandler(() => {
      saving.value = false;
      google.script.host.close();
    })
    .save(code.value);
}

function calculate(lineNumber: number, columnNumber: number): number {
  let number = 0;
  json.value!.slice(0, lineNumber - 1).forEach((line) => {
    number += line.length + 1;
  });
  number += columnNumber;
  return number;
}

interface MermaidError {
  str: string;
  hash: {
    expected: string[];
    line: number;
    loc: {
      first_line: number;
      last_line: number;
      first_column: number;
      last_column: number;
    };
    text: string;
    token: string;
  };
}

function typeGuardMermaidError(error: unknown): error is MermaidError {
  return true;
}

function refresh(newValue: string) {
  code.value = newValue;
  try {
    mermaid.parse(code.value);
  } catch (mermaidError) {
    if (typeGuardMermaidError(mermaidError)) {
      console.log(mermaidError);
      diagnostics.value = {
        severity: 'error',
        source: 'mermaid.parse',
        message: mermaidError.str,
        from: calculate(
          mermaidError.hash.loc.first_line,
          mermaidError.hash.loc.first_column
        ),
        to: calculate(
          mermaidError.hash.loc.last_line,
          mermaidError.hash.loc.last_column
        ),
      };
      return;
    }
  }
  mermaid.initialize(props.mermaid || { theme: 'default' });
  try {
    mermaid.render('diagram', code.value, (svg) => {
      if (svg.length > 0) {
        svg = svg.replace('<svg', '<svg preserveAspectRatio="xMinYMin"');
        container.value!.innerHTML = svg;
        container.value!.querySelector('svg')!.style.minWidth =
          container.value!.querySelector('svg')!.style.maxWidth;
        container.value!.querySelector('svg')!.style.maxWidth = 'none';
        diagnostics.value = undefined;
      }
    });
  } catch (mermaidError) {
    console.log(mermaidError);
  }
}

function onChange(doc: Text) {
  json.value = doc.toJSON();
  refresh(doc.toString());
}

onMounted(() => {
  nextTick(() => {
    refresh(code.value);
  });
});
</script>

<template>
  <div class="row">
    <CodemirrorEditor
      @change="onChange"
      :initialValue="code"
      :diagnostics="diagnostics"
      class="col-6"
    />
    <div class="col-0.5"></div>
    <div class="col-5.5">
      <div id="output" ref="container"></div>
      <div class="d-grid">
        <button id="save" @click="save" class="btn btn-primary" type="button">
          <font-awesome-icon
            class="mr-1"
            icon="fa-solid fa-circle-notch"
            spin
            v-if="saving"
          />
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@import url('bootstrap/dist/css/bootstrap.min.css');

:root {
  --bs-gutter-x: 0;
  --bs-gutter-y: 0;
}

.row {
  --bs-gutter-x: 0;
  --bs-gutter-y: 0;
}

.row {
  height: 100%;
}

.col-0\.5 {
  width: 4.166667%;
}

.col-5\.5 {
  width: 45.83333%;
}

.hidden {
  display: none;
}

#output {
  overflow: auto;
  max-height: 90vh;
}

#save {
  position: absolute;
  bottom: 0;
  width: 45.83333%;
}
</style>
