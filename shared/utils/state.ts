/// <reference types="vite/client" />

export async function getState() {
  // In development we fetch the state from the parent iframe
  if (import.meta.hot) {
    return '__GAS_STATE' in window ? window.__GAS_STATE ?? null : null;
  }

  // In production we serve the HTML with the state inlined
  const stateElement = document.getElementById('__state');
  if (!stateElement) {
    return null;
  }

  const state = JSON.parse(stateElement.innerText);
  return state;
}
