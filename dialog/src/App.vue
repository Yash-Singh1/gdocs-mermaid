<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
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
import regenRecordCanvas from './helpers/regenRecordCanvas';
import eatUnneededLines from './helpers/eatUnneededLines';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';

const props = defineProps<{
  code: string;
  mermaid?: any;
}>();

const code = ref(props.code);
const config = ref(
  JSON.stringify(props.mermaid) || JSON.stringify({ theme: 'default' })
);
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
  (str: MermaidError['str'], hash: MermaidError['hash'] | undefined) => {
    if (!hash || !hash.loc) {
      return console.error(str);
    }
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
    console.error(str, hash);
  }
);

const panZoomInstance = ref<null | typeof svgPanZoom>(null);

function refresh(newValue: string, config: any) {
  code.value = newValue;
  // TODO: Contribute boolean return value to @types/mermaid
  if (!mermaid.parse(code.value)) {
    return;
  }
  mermaid.initialize(config || { theme: 'default' });
  try {
    mermaid.render('diagram', code.value, (svg) => {
      if (svg.length > 0) {
        if (panZoomInstance.value) {
          panZoomInstance.value.destroy();
        }
        document.getElementById('output')!.innerHTML = svg;
        const svgEl = document.getElementById('output')!.querySelector('svg')!;
        svgEl.style.maxWidth = 'none';
        svgEl.style.height = '100%';
        const storedSvg = svgEl.outerHTML;
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
          regenRecordCanvas(storedSvg);
          const interval = setInterval(() => {
            if (width !== document.getElementById('output')!.offsetWidth) {
              resetPanZoomInstance(panZoomInstance.value);
              regenRecordCanvas(storedSvg);
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
  refresh(doc.toString(), JSON.parse(config.value));
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

const SPEECH_RECOGNITION_ALTERNATIVES = 10;
const replaceSelection = ref<string>('');
const replaceAll = ref<string>('');
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
                  let manipulation = diagramCommands[command].manipulate(
                    match,
                    (json.value || []).join('\n')
                  );
                  let replaceIt =
                    typeof manipulation === 'string'
                      ? false
                      : manipulation.replace;
                  let replaceString =
                    typeof manipulation === 'string'
                      ? manipulation
                      : manipulation.text;
                  if (replaceIt) {
                    replaceAll.value = replaceString + '\n';
                  } else {
                    replaceSelection.value = replaceString + '\n';
                  }
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
                  let manipulation = commands['default'][command].manipulate(
                    match,
                    (json.value || []).join('\n')
                  );
                  let replaceIt =
                    typeof manipulation === 'string'
                      ? false
                      : manipulation.replace;
                  let replaceString =
                    typeof manipulation === 'string'
                      ? manipulation
                      : manipulation.text;
                  if (replaceIt) {
                    replaceAll.value = replaceString + '\n';
                  } else {
                    replaceSelection.value = replaceString + '\n';
                  }
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

const codemirrorEditor = ref<{
  view: EditorView;
  breakpoints: number[];
} | null>(null);

onMounted(() => {
  nextTick(() => {
    refresh(code.value, JSON.parse(config.value));
    const interval = setInterval(() => {
      if (codemirrorEditor.value) {
        clearInterval(interval);
        json.value = codemirrorEditor.value.view.state.doc.toJSON();
      }
    }, 100);
  });
});

const creatingTemplate = ref(false);
const templateName = ref('');
const templateDescription = ref('');

function templateCreation() {
  creatingTemplate.value = true;
  templateName.value = '';
  templateDescription.value = '';
}

function createTemplate() {
  creatingTemplate.value = false;
  if (templateName.value.length === 0) {
    return;
  }
  const template = {
    name: templateName.value,
    description: templateDescription.value,
    code: btoa((json.value || []).join('\n')),
  };
  google.script.run.createPersonalTemplate(template);
}

const recording = ref<boolean>(false);
const stream = ref<MediaStream | null>(null);
const recorder = ref<MediaRecorder | null>(null);
const data = ref<Blob[]>([]);
const download = ref<boolean>(false);
const recorded = ref<string | null>(null);

function startRecording() {
  data.value = [];
  recording.value = true;
  stream.value = (
    document.getElementById('record') as HTMLCanvasElement
  ).captureStream(30);
  const mediaRecorder = new MediaRecorder(stream.value, {
    mimeType: 'video/webm',
  });
  mediaRecorder.ondataavailable = (event) => {
    console.log(event);
    data.value.push(event.data);
  };
  mediaRecorder.onstop = prepDownload;
  mediaRecorder!.start();
  hideAll();
  recorder.value = mediaRecorder;
}

function prepDownload() {
  nextTick(() => {
    const blob = new Blob(data.value);
    recorded.value = URL.createObjectURL(blob);
    download.value = true;
    stream.value!.getTracks().forEach((track) => track.stop());
  });
}

function stopRecording() {
  if (!recording) {
    return;
  }
  activeLine.value = null;
  recorder.value!.stop();
  recording.value = false;
}

const activeLine = ref<number | null>(null);

function hideAll() {
  activeLine.value = 1;
  showNext();
}

function showNext() {
  if (!activeLine.value) {
    activeLine.value = 1;
  }
  if (codemirrorEditor.value) {
    activeLine.value++;
    activeLine.value = eatUnneededLines(
      json.value || [],
      activeLine.value,
      codemirrorEditor.value.breakpoints
    );
    refresh(
      (json.value || []).slice(0, activeLine.value).join('\n'),
      JSON.parse(config.value)
    );
  }
}

function configChange(newConfig: Text) {
  config.value = newConfig.toJSON().join('\n');
  refresh(json.value!.join('\n'), JSON.parse(config.value));
}

const activeTab = ref(false);

function watchCallback() {
  nextTick(() => {
    if (document.getElementById('container')) {
      document.getElementById('container')!.style.maxHeight = `${
        window.innerHeight -
        (document.querySelector('div[role="tablist"]') as HTMLDivElement)
          .offsetHeight -
        (document.querySelector('.tab-panel-code')
          ? (document.querySelector('.toolbar') as HTMLDivElement).offsetHeight
          : 0)
      }px`;
      document.getElementById('container')!.style.minHeight =
        document.getElementById('container')!.style.maxHeight;
    }
  });
}

watch(() => activeTab.value, watchCallback, { immediate: true });

onMounted(() => {
  nextTick(() => {
    const interval = setInterval(() => {
      if (!document.getElementById('container')) return;
      watchCallback();
      clearInterval(interval);
    }, 20);
  });
});
</script>

<template>
  <div class="row flex flex-wrap">
    <div class="col-6 flex flex-col">
      <TabGroup @change="activeTab = !activeTab">
        <TabList
          class="pt-[2px] pl-1 rounded-t-md bg-gray-200 flex gap-x-2"
        >
          <Tab class="py-1 px-2 text-sm text-white rounded-t-lg bg-blue-500" :class="activeTab ? '' : 'border-2 border-blue-500'"
            >Markup</Tab
          >
          <Tab class="pt-1 px-2 text-sm text-white rounded-t-lg bg-blue-500" :class="activeTab ? 'border-2 border-blue-500' : ''"
            >Config</Tab
          >
        </TabList>
        <TabPanels class="basis-full">
          <TabPanel class="grid grid-rows-[max-content_1fr] tab-panel-code">
            <div class="toolbar text-sm h-9">
              <div
                class="position-relative h-full border border-silver border-b-0"
              >
                <FontAwesomeSolid
                  :icon="voiceTyping ? 'circle' : 'microphone'"
                  :class="voiceTyping && 'record-pulse text-red-500 p-0'"
                  class="icon-toolbar cursor-pointer"
                  v-tooltip="`Voice Typing`"
                  @click="voiceTyping ? pauseVoiceType() : voiceType()"
                />
                <FontAwesomeSolid
                  icon="file-import"
                  class="p-0 cursor-pointer icon-toolbar"
                  v-tooltip="`Import Template`"
                  @click="replaceWithTemplate()"
                />
                <FontAwesomeSolid
                  icon="rocket"
                  v-tooltip="`Save as Template`"
                  class="p-0 cursor-pointer icon-toolbar"
                  @click="templateCreation()"
                />
                <FontAwesomeSolid
                  :icon="recording ? 'hand' : 'camera'"
                  v-tooltip="recording ? `Stop Recording` : `Start Recording`"
                  class="p-0 cursor-pointer icon-toolbar"
                  @click="recording ? stopRecording() : startRecording()"
                />
                <FontAwesomeSolid
                  icon="eye-slash"
                  v-tooltip="`Hide All`"
                  class="p-0 cursor-pointer icon-toolbar"
                  @click="hideAll()"
                />
                <FontAwesomeSolid
                  icon="angles-right"
                  v-tooltip="`Show Next`"
                  class="p-0 cursor-pointer icon-toolbar"
                  @click="showNext()"
                />
              </div>
            </div>
            <CodemirrorEditor
              @change="onChange"
              :initialValue="code"
              :diagnostics="diagnostics"
              :replaceSelection="replaceSelection"
              :replaceAll="replaceAll"
              :activeLine="activeLine"
              :codeFeatures="true"
              ref="codemirrorEditor"
            />
          </TabPanel>
          <TabPanel class="grid">
            <CodemirrorEditor
              @change="configChange"
              :codeFeatures="false"
              initialValue="{}"
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
    <Output
      :fullscreen="fullscreen"
      :saving="saving"
      @save="save"
      @toggleFullscreen="toggleFullscreen"
    />
  </div>
  <Teleport v-if="recognitionFailure != ''" to="#modal">
    <Modal @close="recognitionFailure = ''" @cancel="recognitionFailure = ''">{{
      recognitionFailure
    }}</Modal>
  </Teleport>
  <Teleport v-if="creatingTemplate" to="#modal">
    <Modal
      closeBtn="Apply"
      @close="createTemplate()"
      @cancel="creatingTemplate = false"
    >
      <input
        class="block w-full mx-auto border-gray-500 border p-1 text-lg m-2 rounded-md pl-2 focus:outline-2 focus:outline-emerald-400 focus:transition-all shadow"
        type="text"
        placeholder="Name"
        v-model="templateName"
      />
      <input
        class="block w-full mx-auto border-gray-500 border p-1 text-lg m-2 rounded-md pl-2 focus:outline-2 focus:outline-emerald-400 focus:transition-all shadow"
        type="text"
        placeholder="Description"
        v-model="templateDescription"
      />
    </Modal>
  </Teleport>
  <Teleport v-if="download" to="#modal">
    <Modal :closeBtn="false" @cancel="download = false">
      <a
        download="diagram.webm"
        class="btn btn-blue btn-large"
        :href="recorded!"
        @click="download = false"
      >
        Download
      </a>
    </Modal>
  </Teleport>
  <div class="hidden">
    <canvas id="record"></canvas>
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
