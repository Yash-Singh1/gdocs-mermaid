/// <reference types="vite/client" />

export async function getState() {
  if (import.meta.hot) {
    return await fetch(`/__rscongas/state?id=${globalThis.__RSCONGAS_ID}`).then((res) => res.json());
  }

  const stateElement = document.getElementById('__state');
  if (!stateElement) {
    return null;
  }

  const state = JSON.parse(stateElement.innerText);
  return state;
}
