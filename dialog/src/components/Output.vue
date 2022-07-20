<script setup lang="ts">
import FontAwesomeSolid from 'shared/components/FontAwesomeSolid.vue';

defineProps<{ fullscreen: boolean; saving: boolean }>();
const emit = defineEmits<{
  (e: 'toggleFullscreen'): void;
  (e: 'save'): void;
}>();
</script>

<template>
  <div class="col-5.5 mt-8">
    <FontAwesomeSolid
      :icon="fullscreen ? 'minimize' : 'maximize'"
      @click="emit('toggleFullscreen')"
      id="fullscreen"
      :class="fullscreen && 'less-top'"
    />
    <div id="output" ref="container"></div>
    <div class="grid save-btn">
      <button
        id="save"
        @click="emit('save')"
        class="btn btn-large btn-blue"
        type="button"
      >
        <FontAwesomeSolid
          class="mr-1 loader"
          icon="circle-notch"
          spin
          v-if="saving"
        />
        Save
      </button>
    </div>
  </div>
</template>

<style scoped>
.col-5\.5 {
  margin-left: 4.166667%;
  width: 45.83333%;
}

#output {
  overflow: hidden;
  border: 2px solid silver;
  max-height: 90%;
  height: 90%;
  max-width: 100%;
  width: 100%;
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
</style>
