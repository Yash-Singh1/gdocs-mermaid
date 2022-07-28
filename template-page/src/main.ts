import { createApp } from 'vue';
import './styles/index.css';
import App from './App.vue';

const attachTo = document.getElementById('attachTo')!.innerText !== 'false';
const templates = document
  .getElementById('templates')!
  .innerText.split(',')
  .map((template) => {
    return JSON.parse(atob(template));
  });

createApp(App, { attachTo, templates }).mount('#app');
