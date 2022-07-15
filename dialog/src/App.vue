<script setup lang="ts">
import { inject, nextTick, onMounted, ref } from 'vue';
import unraw from './helpers/unraw';
import CodemirrorEditor from './components/CodemirrorEditor.vue';
import mermaid from 'mermaid';
import type { Diagnostic } from '@codemirror/lint';
import type { Text } from '@codemirror/state';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCircle,
  faCircleNotch,
  faMaximize,
  faMicrophone,
  faMinimize,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import svgPanZoom from 'svg-pan-zoom';
import { MenuButton, MenuItems, MenuItem, Menu } from '@headlessui/vue';
import annyang from 'annyang';
import type { EditorView } from 'codemirror';

library.add(
  faCircleNotch,
  faMaximize,
  faMinimize,
  faXmark,
  faMicrophone,
  faCircle
);

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
const voiceTyping = ref(false);
const voiceTyped = ref(false);

const view = inject<null | EditorView>('view');

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

function voiceType() {
  if (!annyang) {
    throw new Error(
      'Speech to text is not supported on your browser or device.'
    );
  }
  annyang.addCommands({
    // @ts-ignore -- TODO: Contribute to @types/annyang string parameters and parsing keys
    '*entity1 connects to *entity2': (entity1: string, entity2: string) => {
      if (view) {
        const transaction = view.state.replaceSelection(
          `${entity1} --> ${entity2}`
        );
        const update = view.state.update(transaction);
        view.update([update]);
      }
    },
  });
  annyang.start();
  voiceTyping.value = true;
  voiceTyped.value = true;
}

function closeVoiceType() {
  voiceTyped.value = false;
  voiceTyping.value = false;
  annyang.abort();
}

onMounted(() => {
  nextTick(() => {
    refresh(code.value);
  });
});
</script>

<template>
  <div class="row flex flex-wrap">
    <div class="col-6 flex flex-col">
      <div class="toolbar text-sm h-9">
        <div class="position-relative h-4/5 mb-[1.6rem]">
          <Menu as="div" class="relative">
            <MenuButton
              class="btn mb-0 px-2 py-1 border border-gray-400"
              type="button"
            >
              Tools
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
                    @click="voiceType"
                  >
                    Voice Typing
                  </button>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
      <CodemirrorEditor
        @change="onChange"
        :initialValue="code"
        :diagnostics="diagnostics"
      />
    </div>
    <div class="col-5.5 mt-8">
      <font-awesome-icon
        :icon="`fa-solid ${fullscreen ? 'fa-minimize' : 'fa-maximize'}`"
        @click="toggleFullscreen"
        id="fullscreen"
        :class="fullscreen && 'less-top'"
      />
      <div id="output" ref="container"></div>
      <div class="grid save-btn">
        <button
          id="save"
          @click="save"
          class="btn btn-large btn-blue"
          type="button"
        >
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
  <div class="row h-max relative border-2 border-gray-400 mt-2" v-if="voiceTyped" v-show="!fullscreen">
    <font-awesome-icon
      :icon="`fa-solid ${voiceTyping ? 'fa-circle' : 'fa-microphone'}`"
      :class="voiceTyping && 'record-pulse text-red-500 p-0'"
      class="icon-voice-toolbar"
    />
    <font-awesome-icon
      icon="fa-solid fa-xmark"
      class="close-voice"
      @click="closeVoiceType"
    />
  </div>
</template>

<style>
#container {
  max-width: none !important;
}

svg {
  width: 100% !important;
  height: 100% !important;
}

.row {
  height: 100%;
}

.col-6 {
  width: 50%;
}

.col-5\.5 {
  margin-left: 4.166667%;
  width: 45.83333%;
}

.hidden {
  display: none;
}

#output {
  overflow: hidden;
  border: 2px solid silver;
  max-height: 90%;
  height: 90%;
  max-width: 100%;
  width: 100%;
  /* padding: 2rem 0; */
  left: 50%;
  top: 0;
  cursor: move;
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
  transition: height 0.5s, width 0.5s, top 0.5s, left 0.5s;
}

#output.fullscreen + .save-btn {
  display: none !important;
}

#save {
  width: 100%;
}

#fullscreen {
  position: absolute;
  right: 0.25rem;
  cursor: pointer;
  top: 2.25rem;
  width: 1.75rem !important;
  height: 1.75rem !important;
  z-index: 10;
}

.loader {
  max-width: 1rem;
}

.less-top {
  top: 0.25rem !important;
}

.close-voice {
  position: absolute;
  right: 0.25rem;
  cursor: pointer;
  width: 1.25rem !important;
  height: 1.25rem !important;
  margin: 8px;
}

.icon-voice-toolbar {
  width: 1.25rem !important;
  height: 1.25rem !important;
}

.record-pulse {
  animation: pulse 1s infinite ease-in-out;
  border-radius: 50%;
}

@keyframes pulse {
  0% {
    border: 1px solid #ff000055;
    margin: 7px;
  }
  50% {
    border: 5px solid #ff000055;
    margin: 3px;
  }
  100% {
    border: 1px solid #ff000055;
    margin: 7px;
  }
}
</style>
