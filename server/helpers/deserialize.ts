import serdes from './serdes';

function deserialize(input: string) {
  let split = input.split(':');
  if (split.length > 1) {
    return serdes[split[0]].decode(split[1]);
  } else {
    return serdes.base64.decode(input);
  }
}

export default deserialize;
