<script setup lang="ts">
import { nextTick, onMounted, ref, defineProps } from 'vue';
import { EditorView } from '@codemirror/view';

const props = defineProps<{
  onChange: (value: string) => any;
  initialValue?: string;
}>();

const container = ref<null | HTMLElement>(null);

onMounted(() => {
  nextTick(() => {
    EditorView.updateListener.of(({ view }) => {
      props.onChange(view.state.doc.toString());
    });
    new EditorView({ parent: container.value!, doc: props.initialValue });
  });
});
</script>

<template>
  <div id="container" ref="container" style="height: 100%;"></div>
</template>

<style></style>
