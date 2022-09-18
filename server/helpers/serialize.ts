import serdes from './serdes';

function serialize(input: string, type: string | undefined) {
  return `${
    type === 'pako' ? `pako:` : type === 'base64' ? 'base64:' : ''
  }${serdes[type || 'base64'].encode(input)}`;
}

export default serialize;
