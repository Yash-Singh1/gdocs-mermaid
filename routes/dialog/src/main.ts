import { createApp } from 'vue';
import './helpers/initializeFontAwesome';
import App from './App.vue';
import './styles/index.css';
import 'floating-vue/dist/style.css'
import FloatingVue from 'floating-vue';

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

// Currently statically resizing on server.
// google.script.host.setHeight(window.innerHeight * 2.25);
// google.script.host.setWidth(window.innerWidth * 2.25);

const app = createApp(App, state as unknown as Record<string, unknown>);

app.use(FloatingVue);

app.mount('#app');
