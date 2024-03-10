<script setup lang="ts">
import { nextTick, onMounted, ref, watch, type Ref } from 'vue';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { Diagnostic, setDiagnostics, linter } from '@codemirror/lint';
import { EditorState, StateField, Text } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import breakpointGutter, { breakpointState } from '../helpers/breakpoints';
import activeShownLine, {
  activeShownLineEffect,
} from '../helpers/activeShownLine';
import { json, jsonParseLinter } from '@codemirror/lang-json';

const props = defineProps<{
  initialValue?: string;
  diagnostics?: Diagnostic;
  replaceSelection?: string;
  replaceAll?: string;
  activeLine?: number | null;
  codeFeatures?: boolean;
}>();

const emit = defineEmits<{
  (event: 'change', view: Text): void;
}>();

let container = ref<null | HTMLElement>(null);
let view = ref<null | EditorView>(null);

// TODO: Figure out why we need to use watch and can't use refs, tried it out but doesn't work

watch(
  () => props.replaceSelection,
  () => {
    if (
      view.value &&
      props.replaceSelection &&
      props.replaceSelection.length > 0
    ) {
      view.value.dispatch(
        view.value.state.replaceSelection(props.replaceSelection)
      );
    }
  }
);

watch(
  () => props.replaceAll,
  () => {
    if (view.value && props.replaceAll && props.replaceAll.length > 0) {
      view.value.update([
        view.value.state.update({
          changes: {
            from: 0,
            to: view.value.state.doc.length - 1,
            insert: props.replaceAll,
          },
        }),
      ]);
    }
  }
);

watch(
  () => props.diagnostics,
  () => {
    if (props.diagnostics && view.value) {
      view.value.dispatch(
        setDiagnostics(view.value!.state as unknown as EditorState, [
          props.diagnostics,
        ])
      );
    } else if (view.value && !props.diagnostics) {
      view.value.dispatch(
        setDiagnostics(view.value!.state as unknown as EditorState, [])
      );
    }
  }
);

watch(
  () => props.activeLine,
  () => {
    if (view.value && typeof props.activeLine !== 'undefined') {
      view.value.dispatch({
        effects: activeShownLineEffect.of(props.activeLine),
      });
    }
  }
);

const breakpoints = ref<number[]>([]);

defineExpose({
  view,
  breakpoints,
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
          props.codeFeatures
            ? breakpointGutter({
                callback: (updatedView) => {
                  const state = updatedView.state.field(breakpointState);
                  breakpoints.value = [];
                  // @ts-expect-error -- RangeSet.length is an internal field, but we need it
                  state.between(0, state.length, (from) => {
                    breakpoints.value.push(
                      updatedView.state.doc.lineAt(from).number
                    );
                  });
                },
              })
            : [],
          basicSetup,
          keymap.of([indentWithTab]),
          listenChangesExtension,
          props.codeFeatures ? activeShownLine() : [],
          props.codeFeatures ? [] : [json(), linter(jsonParseLinter())],
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
  overflow-x: auto;
}

.cm-editor {
  height: 100%;
  border: 1px solid silver;
  border-bottom-width: 2px;
  font-size: 14px;
}

.cm-scroller {
  overflow: auto;
}
</style>
