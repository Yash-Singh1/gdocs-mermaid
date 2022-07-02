import { createApp } from 'vue';
import App from './App.vue';

createApp(App, {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
}).mount('#app');
