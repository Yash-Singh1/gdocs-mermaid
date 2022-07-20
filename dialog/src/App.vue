<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import CodemirrorEditor from './components/CodemirrorEditor.vue';
import mermaid from 'mermaid';
import type { Diagnostic } from '@codemirror/lint';
import { Text } from '@codemirror/state';
import FontAwesomeSolid from 'shared/components/FontAwesomeSolid.vue';
import svgPanZoom from 'svg-pan-zoom';
import Modal from './components/Modal.vue';
import calculateIndexForPosition from './helpers/calculateIndexForPosition';
import Output from './components/Output.vue';
import SpeechRecognition from './helpers/vendoredSpeechRecognition';
import commands from './commands';
import findDiagramType from './helpers/findDiagramType';
import findAliasDiagram from './helpers/findAliasDiagram';
import resetPanZoomInstance from './helpers/resetPanZoomInstance';
import type { EditorView } from 'codemirror';
import FontAwesomeSolid1 from 'shared/components/FontAwesomeSolid.vue';

const props = defineProps<{
  code: string;
  mermaid?: any;
}>();

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
    let from = calculateIndexForPosition(
      hash.loc.first_line,
      hash.loc.first_column,
      json.value!
    );
    diagnostics.value = {
      severity: 'error',
      source: 'mermaid.parse',
      message: str,
      from,
      to: Math.max(
        calculateIndexForPosition(
          hash.loc.last_line,
          hash.loc.last_column,
          json.value!
        ),
        from
      ),
    };
  }
);

const panZoomInstance = ref<null | typeof svgPanZoom>(null);

function refresh(newValue: string) {
  code.value = newValue;
  // TODO: Contribute boolean return value to @types/mermaid
  if (!mermaid.parse(code.value)) {
    return;
  }
  mermaid.initialize(props.mermaid || { theme: 'default' });
  try {
    mermaid.render('diagram', code.value, (svg) => {
      if (svg.length > 0) {
        let alreadyLoaded = false;
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
          resetPanZoomInstance(panZoomInstance.value);
          const interval = setInterval(() => {
            if (width !== document.getElementById('output')!.offsetWidth) {
              resetPanZoomInstance(panZoomInstance.value);
              clearInterval(interval);
            }
          }, 50);
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
    resetPanZoomInstance(panZoomInstance.value);
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

const SPEECH_RECOGNITION_ALTERNATIVES = 10;
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
    recognition.value.abort();
    recognition.value = null;
  }
  recognition.value = new SpeechRecognition();
  recognition.value.lang = 'en-US';
  recognition.value.interimResults = false;
  recognition.value.maxAlternatives = SPEECH_RECOGNITION_ALTERNATIVES;
  recognition.value.continuous = true;

  let voiceBuffer = '';
  const newlineReg = /(k?ne?[wu][\s-]*lio?ne?\.?)/gi;
  recognition.value.onresult = async (event) => {
    if (voiceTyping.value === true) {
      recognitionFailure.value = '';
      const results = event.results[event.resultIndex];
      let answer: SpeechRecognitionAlternative | null = null;
      let answerConfidence = -1;
      let newlineAns = false;
      let newlineStr: string | undefined;
      let newlineConf = 0.5;
      for (let i = 0; i < results.length; i++) {
        let result = results[i];
        if (!result) {
          continue;
        }
        result = {
          confidence: result.confidence,
          transcript: result.transcript.trim(),
        };
        console.log(result.confidence, result.transcript, voiceBuffer);
        if (
          result.confidence > newlineConf &&
          newlineReg.test(result.transcript)
        ) {
          newlineAns = true;
          newlineStr = result.transcript;
          newlineConf = result.confidence;
        }
        if (result.confidence > answerConfidence) {
          answer = result;
          answerConfidence = result.confidence;
        }
      }
      if (answer && (newlineAns || newlineReg.test(answer.transcript))) {
        if (!newlineReg.test(answer.transcript)) {
          answer = { transcript: newlineStr!, confidence: NaN };
        }
        let partsToProcess = [
          voiceBuffer + ' ' + answer.transcript.split(newlineReg)[0],
          ...answer.transcript.split(newlineReg).slice(1),
        ];
        processLoop: for (let processingPart of partsToProcess) {
          processingPart = processingPart.trim();
          if (newlineReg.test(processingPart) || processingPart.length === 0) {
            continue processLoop;
          }
          // Wait for the next tick to prevent batch updates
          await nextTick();
          const diagramType = findAliasDiagram(
            findDiagramType(json.value || [])
          );
          if (diagramType && typeof commands[diagramType] !== 'undefined') {
            const diagramCommands = commands[diagramType];
            for (const command in diagramCommands) {
              if (
                !diagramCommands[command].validate ||
                diagramCommands[command].validate!(processingPart)
              ) {
                let match = diagramCommands[command].match.exec(processingPart);
                if (match) {
                  if (diagramCommands[command].cleanMatch) {
                    match = diagramCommands[command].cleanMatch!(match);
                  }
                  replaceSelection.value =
                    diagramCommands[command].manipulate(match) + '\n';
                  continue processLoop;
                }
              }
            }
            replaceSelection.value = `%% ${processingPart}\n`;
          } else {
            for (const command in commands['default']) {
              if (
                !commands['default'][command].validate ||
                commands['default'][command].validate!(processingPart)
              ) {
                let match =
                  commands['default'][command].match.exec(processingPart);
                if (match) {
                  if (commands['default'][command].cleanMatch)
                    match = commands['default'][command].cleanMatch!(match);
                  replaceSelection.value =
                    commands['default'][command].manipulate(match) + '\n';
                  continue processLoop;
                }
              }
            }
            replaceSelection.value = processingPart + '\n';
          }
        }
        voiceBuffer = '';
      } else if (answer) {
        voiceBuffer += answer.transcript;
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

  // TODO: Figure out why can't focus when voice typing is initialized (probably due to rerender?).
  nextTick(() => {
    if (codemirrorEditor.value) {
      codemirrorEditor.value.view.focus();
    }
  });
}

function closeVoiceType() {
  voiceTyped.value = false;
  voiceTyping.value = false;
  recognition.value!.abort();
}

function pauseVoiceType() {
  voiceTyping.value = false;
  recognition.value!.abort();
}

function replaceWithTemplate() {
  google.script.run.showTemplating(/* attachTo */ true);
}

const codemirrorEditor = ref<{ view: EditorView } | null>(null);

onMounted(() => {
  nextTick(() => {
    refresh(code.value);
    const interval = setInterval(() => {
      if (codemirrorEditor.value) {
        clearInterval(interval);
        json.value = codemirrorEditor.value.view.state.doc.toJSON();
      }
    }, 100);
  });
});
</script>

<template>
  <div class="row flex flex-wrap">
    <div class="col-6 flex flex-col">
      <div class="toolbar text-sm h-9">
        <div class="position-relative h-full border border-silver border-b-0">
          <FontAwesomeSolid
            :icon="voiceTyping ? 'circle' : 'microphone'"
            :class="voiceTyping && 'record-pulse text-red-500 p-0'"
            class="icon-toolbar cursor-pointer"
            @click="voiceTyping ? pauseVoiceType() : voiceType()"
          />
          <FontAwesomeSolid
            icon="file-import"
            class="p-0 cursor-pointer icon-toolbar"
            @click="replaceWithTemplate()"
          />
        </div>
      </div>
      <CodemirrorEditor
        @change="onChange"
        :initialValue="code"
        :diagnostics="diagnostics"
        :replaceSelection="replaceSelection"
        ref="codemirrorEditor"
      />
    </div>
    <Output
      :fullscreen="fullscreen"
      :saving="saving"
      @save="save"
      @toggleFullscreen="toggleFullscreen"
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

.icon-toolbar {
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
