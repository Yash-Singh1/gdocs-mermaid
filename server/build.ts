import type { Plugin } from 'esbuild';
import { build } from 'esbuild';

let stripWrapper: Plugin = {
  name: 'env',
  setup(build) {
    build.onEnd((result) => {
      result.outputFiles = result.outputFiles!.map((file) => {
        if (file.path.endsWith('.js') || file.path === '<stdout>') {
          file.contents = Buffer.from(
            file.text.replace('(() => {', '').replace('})();', '')
          );
        }
        return file;
      });
    });
  },
};

build({
  entryPoints: ['server/Code.ts'],
  bundle: true,
  plugins: [stripWrapper],
  minify: false,
  write: false,
}).then(
  (a) => console.log(new TextDecoder().decode(a.outputFiles[0].contents)),
  () => process.exit(1)
);
