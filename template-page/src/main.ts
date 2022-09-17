import { createApp } from 'vue';
import './styles/index.css';
import App from './App.vue';
import { fromBase64 } from 'js-base64';

const attachTo = document.getElementById('attachTo')!.innerText !== 'false';
const templates = document
  .getElementById('templates')!
  .innerText.split(',')
  .filter((template) => template !== '')
  .map((template) => {
    return JSON.parse(fromBase64(template));
  });

createApp(App, { attachTo, templates }).mount('#app');
