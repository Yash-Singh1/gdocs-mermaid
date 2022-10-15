import type { Plugin } from 'esbuild';
import { build, transformSync } from 'esbuild';
import { type ExportSpecifier, init, parse } from 'es-module-lexer';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  await init;

  let unwrapTopLevel: Plugin = {
    name: 'unwrapTopLevel',
    setup(build) {
      let storedExports: readonly ExportSpecifier[] | undefined;

      build.onLoad({ filter: /.*\.ts$/ }, async (args) => {
        if (path.resolve(args.path) === path.resolve(__dirname, 'Code.ts')) {
          let { code } = transformSync(fs.readFileSync(args.path, 'utf8'), {
            loader: 'ts',
          });
          const [_imports, exports] = parse(code);
          storedExports = exports;
          return { contents: code, loader: 'js' };
        }
        return undefined;
      });

      build.onEnd((result) => {
        result.outputFiles = result.outputFiles!.map((file) => {
          if (file.path.endsWith('.js') || file.path === '<stdout>') {
            const [_imports, exports] = parse(file.text);
            file.contents = Buffer.from(
              `${file.text}\n${storedExports!
                .map(
                  (e) => `function ${e.n}(...args) {Module.${e.n}(...args);}`
                )
                .join('\n')}`
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
    plugins: [unwrapTopLevel],
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    write: false,
    logLevel: 'info',
    globalName: 'Module',
  }).then(
    (a) => console.log(new TextDecoder().decode(a.outputFiles[0].contents)),
    () => process.exit(1)
  );
}

run();
