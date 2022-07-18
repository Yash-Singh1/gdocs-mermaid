/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare var mozSpeechRecognition: undefined | SpeechRecognitionStatic;
declare var msSpeechRecognition: undefined | SpeechRecognitionStatic;
declare var oSpeechRecognition: undefined | SpeechRecognitionStatic;

declare global {
  interface Window {
    mozSpeechRecognition: typeof mozSpeechRecognition;
    msSpeechRecognition: typeof msSpeechRecognition;
    oSpeechRecognition: typeof oSpeechRecognition;
  }
}
