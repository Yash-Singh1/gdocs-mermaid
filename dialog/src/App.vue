<script setup lang="ts">
import { defineProps, nextTick, onMounted, ref } from 'vue';
import unraw from './helpers/unraw';
import CodemirrorEditor from './components/CodemirrorEditor.vue';
import mermaid from 'mermaid';
import { v4 as uuidv4 } from 'uuid';
import type { Diagnostic } from '@codemirror/lint';
import type { Text } from '@codemirror/state';

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
  json.value!.slice(0, lineNumber).forEach((line) => {
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
    mermaid.render(`graph-${uuidv4()}`, code.value, (svg) => {
      if (svg.length > 0) {
        container.value!.innerHTML = svg;
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
        <button @click="save" class="btn btn-primary" type="button">
          <span :class="saving ? 'loader' : 'hidden'"></span> Save
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
  height: 100%;
}

.col-0\.5 {
  width: 4.166667%;
}

.col-5\.5 {
  width: 45.83333%;
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
