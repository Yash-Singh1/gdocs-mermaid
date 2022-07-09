<script setup lang="ts">
import { defineProps, nextTick, onMounted, ref } from 'vue';
import unraw from './helpers/unraw';
import CodemirrorEditor from './components/CodemirrorEditor.vue';
import mermaid from 'mermaid';
import type { Diagnostic } from '@codemirror/lint';
import type { Text } from '@codemirror/state';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleNotch, faMaximize, faMinimize } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import svgPanZoom from 'svg-pan-zoom';

library.add(faCircleNotch, faMaximize, faMinimize);

const props = defineProps<{
  code: string;
  mermaid?: any;
}>();

const code = ref(unraw(props.code));
const container = ref<HTMLElement | null>(null);
const saving = ref(false);
const diagnostics = ref<Diagnostic | undefined>(undefined);
const json = ref<string[] | null>(null);
const panZoomInstance = ref<null | typeof svgPanZoom>(null);
const fullscreen = ref(false);

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
    line: number | string;
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

// @ts-ignore - TODO: Contribute this to @types/mermaid
mermaid.setParseErrorHandler(
  (str: MermaidError['str'], hash: MermaidError['hash']) => {
    diagnostics.value = {
      severity: 'error',
      source: 'mermaid.parse',
      message: str,
      from: calculate(hash.loc.first_line, hash.loc.first_column),
      to: calculate(hash.loc.last_line, hash.loc.last_column),
    };
  }
);

function fixControlsPositioning() {
  // A bunch of magic math to fix the positioning of the controls.
  const containerWidth = container.value!.offsetWidth;
  console.log(containerWidth);
  document.getElementById('svg-pan-zoom-controls')!.setAttribute(
    'transform',
    document
      .getElementById('svg-pan-zoom-controls')!
      .getAttribute('transform')!
      .replace(/(translate\()(\d+)(\s)/, function (_match, p1, _p2, p3) {
        return [
          p1,
          containerWidth -
            182 *
              0.75 *
              0.4 /* Use internal scaling to find out exact width */ -
            5 /* X Offset of control reset button */ -
            8 /* Extra padding between border and controls */,
          p3,
        ].join('');
      })
  );
}

function refresh(newValue: string) {
  code.value = newValue;
  try {
    mermaid.parse(code.value);
  } catch (mermaidError) {
    return;
  }
  mermaid.initialize(props.mermaid || { theme: 'default' });
  try {
    mermaid.render('diagram', code.value, (svg) => {
      if (svg.length > 0) {
        let alreadyLoaded = true;
        if (panZoomInstance.value) {
          panZoomInstance.value.destroy();
        } else {
          alreadyLoaded = false;
        }
        container.value!.innerHTML = svg;
        const svgEl = container.value!.querySelector('svg')!;
        svgEl.style.maxWidth = 'none';
        svgEl.style.height = '100%';
        const width = container.value!.offsetWidth;
        diagnostics.value = undefined;
        panZoomInstance.value = svgPanZoom(svgEl, {
          zoomEnabled: true,
          minZoom: 0.1,
          maxZoom: 10,
          controlIconsEnabled: true,
          fit: true,
          contain: false,
          center: true,
        });
        nextTick(() => {
          svgEl.style.width = '100%';
          // fixControlsPositioning();
          if (!alreadyLoaded) {
            const interval = setInterval(() => {
              if (width !== container.value!.offsetWidth) {
                panZoomInstance.value!.resize();
                panZoomInstance.value!.center();
                panZoomInstance.value!.fit();
                clearInterval(interval);
              }
            }, 50);
          }
        });
      }
    });
  } catch (mermaidError) {}
}

function onChange(doc: Text) {
  json.value = doc.toJSON();
  refresh(doc.toString());
}

function toggleFullscreen() {
  if (fullscreen.value) {
    container.value!.classList.remove('fullscreen');
  } else {
    container.value!.classList.add('fullscreen');
  }
  if (panZoomInstance.value) {
    panZoomInstance.value!.resize();
    panZoomInstance.value!.center();
    panZoomInstance.value!.fit();
  }
  fullscreen.value = !fullscreen.value;
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
      <font-awesome-icon
        :icon="`fa-solid ${fullscreen ? 'fa-minimize' : 'fa-maximize'}`"
        @click="toggleFullscreen"
        id="fullscreen"
      />
      <div id="output" ref="container"></div>
      <div class="d-grid save-btn">
        <button id="save" @click="save" class="btn btn-primary" type="button">
          <font-awesome-icon
            class="mr-1 loader"
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

#container {
  max-width: none !important;
}

svg {
  width: 100% !important;
  height: 100% !important;
}

:root,
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
  overflow: hidden;
  border: 2px solid silver;
  max-height: 90vh;
  height: 90vh;
  max-width: 100%;
  width: 100%;
  padding: 2rem 0;
}

#output.fullscreen {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
  background-color: white;
  z-index: 5;
}

#output.fullscreen + .save-btn {
  display: none !important;
}

#save {
  position: absolute;
  bottom: 0;
  width: 45.83333%;
}

#fullscreen {
  position: absolute;
  right: 0.25rem;
  cursor: pointer;
  top: 0.25rem;
  width: 1.75rem !important;
  height: 1.75rem !important;
  z-index: 10;
}

.loader {
  max-width: 1rem;
}
</style>
