import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'node:path';
import rollupPluginAlias from '@rollup/plugin-alias';

// TODO: Remove this when vite-plugin-singlefile merges PRs and releases
// Need to rewrite vite-plugin-singlefile due to edge case accounting and bugs

export function replaceCss(
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

export function vitePluginInlineCSS() {
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

export function vitePluginInlinejs() {
  return {
    name: 'inline-js',
    enforce: 'post' as const,
    generateBundle: (_, bundle) => {
      const htmlFiles = Object.keys(bundle).filter((i) => i.endsWith('.html'));
      const jsAssets = Object.keys(bundle).filter((i) => i.endsWith('.js'));
      for (const htmlFile of htmlFiles) {
        const htmlChunk = bundle[htmlFile];
        let replacedHtml = htmlChunk.source;
        console.log(replacedHtml)

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
        ].code = `<script>\n//${bundle[jsName].fileName}\n${bundle[jsName].code}\n</script>`;
      }
    },
  };
}

function configBuilder() {
  return defineConfig(({ mode }) => ({
    optimizeDeps: {
      disabled: mode === 'production',
      include: ['shared'],
    },
    plugins: [
      vue(),
      vitePluginInlinejs(),
      vitePluginInlineCSS(),
      rollupPluginAlias({
        entries: {
          '@': path.resolve(__dirname, '.'),
        },
      }),
    ],
    build: {
      emptyOutDir: true,
      target: 'es2015',
      rollupOptions: {
        input: {
          'template-page': './template-page/index.html',
          'dialog': './dialog/index.html',
          'sidebar': './sidebar/index.html',
        },
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
          inlineDynamicImports: false,
          format: 'amd',
          // Disable code-splitting to allow iife (immediately invoked function expression)
          manualChunks: () => {
            return undefined;
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000_000,
      chunkSizeWarningLimit: 100_000_000_000,
      reportCompressedSize: false,
      minify: mode === 'production',
    },
  }));
}

export default configBuilder();
