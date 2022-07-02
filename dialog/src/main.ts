import { createApp } from 'vue';
import App from './App.vue';

interface State {
  mermaid: any;
  code: string;
  idx?: number;
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

createApp(App, state as unknown as Record<string, unknown>).mount('#app');
