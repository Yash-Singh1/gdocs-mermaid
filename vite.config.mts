import { type Plugin, defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import rollupPluginAlias from '@rollup/plugin-alias';
import { readdirSync } from 'node:fs';

function replaceCss(
  html: string,
  cssFilename: string,
  cssCode: string
): string {
  const reCss = new RegExp(`<link[^>]*? href="[./]*${cssFilename}"[^>]*?>`);
  const inlined = html.replace(
    reCss,
    `<style type="text/css">\n${cssCode}\n</style>`
  );
  return inlined;
}

function vitePluginInlineCSS() {
  return {
    name: 'inline-css',
    enforce: 'post' as const,
    generateBundle: (_, bundle) => {
      const htmlFiles = Object.keys(bundle).filter((i) => i.endsWith('.html'));
      const cssAssets = Object.keys(bundle).filter((i) => i.endsWith('.css'));
      for (const htmlFile of htmlFiles) {
        const htmlChunk = bundle[htmlFile];
        let replacedHtml = htmlChunk.source;

        for (const cssName of cssAssets) {
          const cssChunk = bundle[cssName];
          replacedHtml = replaceCss(
            replacedHtml,
            cssChunk.fileName,
            cssChunk.source
          );
        }
        htmlChunk.source = replacedHtml;
      }
      for (const cssAsset of cssAssets) {
        delete bundle[cssAsset];
      }
    },
  };
}

function vitePluginInlinejs() {
  return {
    name: 'inline-js',
    enforce: 'post' as const,
    generateBundle: (_, bundle) => {
      const htmlFiles = Object.keys(bundle).filter((i) => i.endsWith('.html'));
      const jsAssets = Object.keys(bundle).filter((i) => i.endsWith('.js'));
      for (const htmlFile of htmlFiles) {
        const htmlChunk = bundle[htmlFile];
        let replacedHtml = htmlChunk.source;

        for (const jsName of jsAssets) {
          const jsChunk = bundle[jsName];
          const reScript = new RegExp(
            `<script([^>]*?)src="[./]*${jsChunk.fileName}"([^>]*)></script>`
          );
          const inlined = replacedHtml.replace(reScript, () => {
            return `<?!= include('${jsChunk.fileName}'); ?>`;
          });
          replacedHtml = inlined;
        }
        htmlChunk.source = replacedHtml;
      }
      for (const jsName of jsAssets) {
        bundle[
          jsName
        ].code = `<script type=module crossorigin>\n//${bundle[jsName].fileName}\n${bundle[jsName].code}\n</script>`;
      }
    },
  };
}

function rewriteFiles() {
  // Rewrites files in preparation for GAS deployment and better HMR
  return {
    name: 'rewrite-files',
    enforce: 'post' as const,
    generateBundle(_, bundle) {
      for (const bundleKey in bundle) {
        if (bundleKey.endsWith('.html')) {
          bundle[bundleKey].fileName = bundleKey.replace(
            /^routes\/(.*?)\/index(.html)/,
            '$1$2'
          );
        }
      }
    },
  } satisfies Plugin;
}

// const state = new Map<string, string>();

// function htmlState() {
//   return {
//     name: 'html-state',
//     enforce: 'post' as const,
//     configureServer: (server) => {
//       server.middlewares.use((req, res, next) => {
//         if (req.method === 'GET' && req.url === '/__rscongas/state') {
//           res.setHeader('Content-Type', 'application/json');
//           res.end(state.get(new URL(req.url).searchParams.get('id')!));
//           return;
//         } else if (req.method === 'POST' && req.url === '/__rscongas/state') {
//           let jsonString = '';
//           req.on('data', (chunk) => {
//             jsonString += chunk;
//           });
//           req.on('end', () => {
//             state.set(new URL(req.url).searchParams.get('id')!, jsonString);
//             res.setHeader('Content-Type', 'application/json');
//             res.end('{}');
//           });
//           return;
//         }
//         next();
//       });
//     },
//   } satisfies Plugin;
// }

const config = defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    ...(mode === 'production'
      ? [vitePluginInlinejs(), vitePluginInlineCSS()]
      : []),
    rollupPluginAlias({
      entries: {
        '@': resolve(__dirname, '.'),
      },
    }),
    // htmlState(),
    rewriteFiles(),
  ],
  build: {
    emptyOutDir: true,
    target: 'es2015',
    rollupOptions: {
      input: Object.fromEntries(
        readdirSync(resolve(__dirname, './routes')).map((route) => [
          route,
          resolve(__dirname, './routes', route, './index.html'),
        ])
      ),
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
        inlineDynamicImports: false,
        format: 'amd',
        // Disable code-splitting to allow iife (immediately invoked function expression)
        manualChunks: (id) => {
          // No code splitting code below
          // if (id.endsWith('.html')) {
          //   return `${id.split('/').at(-2)}.html`;
          // }
          return undefined;
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
      },
    },
    cssCodeSplit: true,
    assetsInlineLimit: 100_000_000_000,
    chunkSizeWarningLimit: 100_000_000_000,
    reportCompressedSize: false,
    minify: mode === 'production',
  },
}));

export default config;
