// Each diagram type has its own folder with a file index.ts
// The index.ts file contains the commands for the diagram type

import * as flowchart from './flowchart';
import * as sequence from './sequence';
import * as default1 from './default';

const commands: {
  [key: string]: {
    [key: string]: {
      /**
       * Pre-validation before regex match
       */
      validate?: (input: string) => boolean;
      /**
       * Manipulation to the regex match
       */
      manipulate: (answer: RegExpExecArray) => string;
      /**
       * Clean the regex match before insertion
       */
      cleanMatch?: (match: RegExpExecArray) => RegExpExecArray;
      /**
       * Regex to match the command
       */
      match: RegExp;
    };
  };
} = { flowchart, sequence, default: default1 };

export default commands;
