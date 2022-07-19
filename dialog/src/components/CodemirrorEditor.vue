<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { Diagnostic, setDiagnostics } from '@codemirror/lint';
import { EditorState, StateField, Text } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';

const props = defineProps<{
  initialValue?: string;
  diagnostics?: Diagnostic;
  replaceSelection?: string;
}>();

const emit = defineEmits<{
  (event: 'change', view: Text): void;
}>();

let container = ref<null | HTMLElement>(null);
let view = ref<null | EditorView>(null);

watch(
  () => props.replaceSelection,
  () => {
    if (view && props.replaceSelection && props.replaceSelection.length > 0) {
      view.value!.dispatch(
        view.value!.state.replaceSelection(props.replaceSelection)
      );
    }
  }
);

watch(
  () => props.diagnostics,
  () => {
    if (props.diagnostics) {
      view.value!.dispatch(
        setDiagnostics(view.value!.state as unknown as EditorState, [
          props.diagnostics,
        ])
      );
    } else if (view.value) {
      view.value.dispatch(
        setDiagnostics(view.value!.state as unknown as EditorState, [])
      );
    }
  }
);

defineExpose({
  view,
});

onMounted(() => {
  nextTick(() => {
    const listenChangesExtension = StateField.define({
      create: () => null,
      update: (_, transaction) => {
        if (transaction.docChanged) {
          emit('change', transaction.newDoc);
        }
        return null;
      },
    });
    view.value = new EditorView({
      state: EditorState.create({
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          listenChangesExtension,
        ],
        doc: props.initialValue,
      }),
      parent: container.value!,
    });
    view.value.focus();
  });
});
</script>

<template>
  <div id="container" ref="container"></div>
</template>

<style>
#container {
  height: 100%;
}

.cm-editor {
  height: 100%;
  border: 1px solid silver;
  font-size: 14px;
}

.cm-scroller {
  overflow: auto;
}
</style>
