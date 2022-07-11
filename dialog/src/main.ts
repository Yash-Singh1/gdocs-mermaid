import { createApp } from 'vue';
import App from './App.vue';
import './styles/index.css';

interface State {
  mermaid: any;
  code: string;
}

let state: State;

try {
  state = JSON.parse(document.getElementById('state')!.innerText);
} catch {
  state = {
    code: document.getElementById('state')!.innerText,
    mermaid: { theme: 'default' },
  };
}

// google.script.host.setHeight(window.innerHeight * 2.25);
// google.script.host.setWidth(window.innerWidth * 2.25);

createApp(App, state as unknown as Record<string, unknown>).mount('#app');
