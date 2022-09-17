import { fromBase64, fromUint8Array, toBase64, toUint8Array } from 'js-base64';
import { deflate, inflate } from 'pako';

const serdes: {
  [key: string]: {
    encode: (value: string) => string;
    decode: (value: string) => string;
  };
} = {
  base64: {
    encode: (value: string) => {
      return toBase64(value, true);
    },
    decode: (value: string) => {
      return fromBase64(value);
    },
  },
  pako: {
    encode: (value: string) => {
      const data = new TextEncoder().encode(value);
      const compressed = deflate(data, { level: 9 });
      return fromUint8Array(compressed, true);
    },
    decode: (value: string) => {
      const data = toUint8Array(value);
      return inflate(data, { to: 'string' });
    },
  },
};

export default serdes;
