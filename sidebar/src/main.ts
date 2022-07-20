import { createApp } from 'vue';
import App from './App.vue';
import './styles/index.css';

createApp(App, {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
}).mount('#app');
