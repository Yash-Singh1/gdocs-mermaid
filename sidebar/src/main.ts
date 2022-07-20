import { createApp } from 'vue';
import App from './App.vue';
import './styles/index.css';

const templatePage =
  document.getElementById('template-state')!.innerText !== 'false';

createApp(App, {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  templatePage,
}).mount('#app');
