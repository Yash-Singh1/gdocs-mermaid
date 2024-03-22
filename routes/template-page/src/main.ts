import { createApp } from 'vue';
import './styles/index.css';
import App from './App.vue';
import { fromBase64 } from 'js-base64';
import { getState } from '@/shared/utils/state';

(async function () {
  const state = (await getState()) as { attachTo: string; templates: string };

  const attachTo = state.attachTo !== 'false' && state.attachTo;
  const templates = state.templates
    .split(',')
    .filter(Boolean)
    .map((template) => {
      return JSON.parse(fromBase64(template));
    });

  createApp(App, { attachTo, templates }).mount('#app');
})();
