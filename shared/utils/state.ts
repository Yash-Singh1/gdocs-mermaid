/// <reference types="vite/client" />

declare global {
  interface Window {
    __GAS_STATE: any;
  }
}

export async function getState<T>(
  fallback: T
): Promise<T> {
  // In development we fetch the state from the parent iframe
  if (import.meta.hot) {
    return '__GAS_STATE' in window ? window.__GAS_STATE ?? fallback : fallback;
  }

  // In production we serve the HTML with the state inlined
  const stateElement = document.getElementById('__state');
  if (!stateElement) {
    return fallback;
  }

  try {
    return JSON.parse(stateElement.innerText);
  } catch {
    console.warn('[GAS] Invalid state detected, falling back to default state');
    return fallback;
  }
}
