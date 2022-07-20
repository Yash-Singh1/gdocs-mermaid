import { createApp } from 'vue';
import './styles/index.css';
import App from './App.vue';

const attachTo = document.getElementById('attachTo')!.innerText !== 'false';

createApp(App, { attachTo }).mount('#app');
