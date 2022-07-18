<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import CodemirrorEditor from './components/CodemirrorEditor.vue';
import mermaid from 'mermaid';
import type { Diagnostic } from '@codemirror/lint';
import { Text } from '@codemirror/state';
import FontAwesomeSolid from './components/FontAwesomeSolid.vue';
import svgPanZoom from 'svg-pan-zoom';
import Menu from './components/Menu.vue';
import Modal from './components/Modal.vue';
import calculateIndexForPosition from './helpers/calculateIndexForPosition';
import Output from './components/Output.vue';

const props = defineProps<{
  code: string;
  mermaid?: any;
}>();

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  window.mozSpeechRecognition ||
  window.msSpeechRecognition ||
  window.oSpeechRecognition;

const code = ref(props.code);
const saving = ref(false);

function save() {
  saving.value = true;
  google.script.run
    .withSuccessHandler(() => {
      saving.value = false;
      google.script.host.close();
    })
    .save(code.value);
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

const diagnostics = ref<Diagnostic | undefined>(undefined);
const json = ref<string[] | null>(null);

// @ts-ignore - TODO: Contribute this to @types/mermaid
mermaid.setParseErrorHandler(
  (str: MermaidError['str'], hash: MermaidError['hash']) => {
    diagnostics.value = {
      severity: 'error',
      source: 'mermaid.parse',
      message: str,
      from: calculateIndexForPosition(
        hash.loc.first_line,
        hash.loc.first_column,
        json.value!
      ),
      to: calculateIndexForPosition(
        hash.loc.last_line,
        hash.loc.last_column,
        json.value!
      ),
    };
  }
);

const panZoomInstance = ref<null | typeof svgPanZoom>(null);

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
        document.getElementById('output')!.innerHTML = svg;
        const svgEl = document.getElementById('output')!.querySelector('svg')!;
        svgEl.style.maxWidth = 'none';
        svgEl.style.height = '100%';
        const width = document.getElementById('output')!.offsetWidth;
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
              if (width !== document.getElementById('output')!.offsetWidth) {
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

const fullscreen = ref(false);

function toggleFullscreen() {
  if (fullscreen.value) {
    document.getElementById('output')!.classList.remove('fullscreen');
  } else {
    document.getElementById('output')!.classList.add('fullscreen');
  }
  if (panZoomInstance.value) {
    panZoomInstance.value!.resize();
    panZoomInstance.value!.center();
    panZoomInstance.value!.fit();
  }
  fullscreen.value = !fullscreen.value;
  closeVoiceType();
  recognitionFailure.value = '';
}

function tool(tool: string) {
  if (tool === 'voiceType') {
    voiceType();
  }
}

const SPEECH_RECOGNITION_ALTERNATIVES = 5;
const replaceSelection = ref<string>('');
const voiceTyping = ref(false);
const voiceTyped = ref(false);
const recognition = ref<SpeechRecognition | null>(null);
const recognitionFailure = ref('');

function voiceType() {
  if (!SpeechRecognition) {
    throw new Error(
      'Speech to text is not supported on your browser or device.'
    );
  }
  recognitionFailure.value = '';
  if (recognition.value) {
    voiceTyping.value = true;
    return;
  }
  recognition.value = new SpeechRecognition();
  recognition.value.continuous = false;
  recognition.value.lang = 'en-US';
  recognition.value.interimResults = false;
  recognition.value.maxAlternatives = SPEECH_RECOGNITION_ALTERNATIVES;
  recognition.value.continuous = true;
  recognition.value.onerror = (event) => {
    throw event;
  };
  recognition.value.onresult = (event) => {
    if (voiceTyping.value === true) {
      recognitionFailure.value = '';
      const results = event.results[event.resultIndex];
      let answer: RegExpExecArray | undefined;
      let answerConfidence = -1;
      for (let i = 0; i < SPEECH_RECOGNITION_ALTERNATIVES; ++i) {
        const result = results[i];
        if (!result) {
          continue;
        }
        console.log(result.confidence, result.transcript);
        const connectable = /^\s*(.*?)\s+connects(\s+to)?\s+(.*?)\s*$/;
        let currentAns = connectable.exec(result.transcript);
        if (currentAns && result.confidence > answerConfidence) {
          answer = currentAns;
          answerConfidence = result.confidence;
        }
      }
      if (answer && answer.length > 3) {
        replaceSelection.value = `${answer![1]} --> ${answer![3]}`;
      }
    }
  };
  recognition.value.onend = (event) => {
    if (voiceTyping.value === true) {
      event.preventDefault();
    }
  };
  recognition.value.onerror = (error) => {
    console.error(error);
    pauseVoiceType();
    recognitionFailure.value = error.message;
  };
  recognition.value.start();
  voiceTyping.value = true;
  voiceTyped.value = true;
}

function closeVoiceType() {
  voiceTyped.value = false;
  voiceTyping.value = false;
}

function startVoiceType() {
  voiceTyping.value = true;
  if (recognition.value) {
    recognition.value.start();
  }
}

function pauseVoiceType() {
  voiceTyping.value = false;
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
          <Menu
            name="Tools"
            :items="[{ name: 'Voice Typing', id: 'voiceType' }]"
            @click="tool"
          />
        </div>
      </div>
      <CodemirrorEditor
        @change="onChange"
        :initialValue="code"
        :diagnostics="diagnostics"
        :replaceSelection="replaceSelection"
      />
    </div>
    <Output
      :fullscreen="fullscreen"
      :saving="saving"
      @save="save"
      @toggleFullscreen="toggleFullscreen"
    />
  </div>
  <div
    class="row h-max relative border-2 border-gray-400 mt-2"
    v-if="voiceTyped"
    v-show="!fullscreen"
  >
    <FontAwesomeSolid
      :icon="voiceTyping ? 'circle' : 'microphone'"
      :class="voiceTyping && 'record-pulse text-red-500 p-0'"
      class="icon-voice-toolbar cursor-pointer"
      @click="voiceTyping ? pauseVoiceType() : startVoiceType()"
    />
    <FontAwesomeSolid
      icon="xmark"
      class="close-voice"
      @click="closeVoiceType"
    />
  </div>
  <Teleport v-if="recognitionFailure != ''" to="#modal">
    <Modal
      @close="recognitionFailure = ''"
      :recognitionFailure="recognitionFailure"
    />
  </Teleport>
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
  margin: 8px;
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
