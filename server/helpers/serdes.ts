import { fromUint8Array, toUint8Array } from 'js-base64';
import { deflate, inflate } from 'pako';

const serdes: {
  [key: string]: {
    encode: (value: string) => string;
    decode: (value: string) => string;
  };
} = {
  base64: {
    encode: (value: string) => {
      return Utilities.base64EncodeWebSafe(value);
    },
    decode: (value: string) => {
      return Utilities.newBlob(
        Utilities.base64DecodeWebSafe(value)
      ).getDataAsString();
    },
  },
  pako: {
    encode: (value: string) => {
      const data = Uint8Array.from(
        value.split('').map((char) => char.charCodeAt(0))
      );
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
