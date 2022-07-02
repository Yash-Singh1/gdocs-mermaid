import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

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

export function replacejs(
  html: string,
  scriptFilename: string,
  scriptCode: string
): string {
  const reScript = new RegExp(
    `<script([^>]*?)src="[./]*${scriptFilename}"([^>]*)></script>`
  );
  const inlined = html.replace(
    reScript,
    (_, beforeSrc, afterSrc) =>
      `<script${beforeSrc}${afterSrc}>\n//${scriptFilename}\n${scriptCode}\n</script>`
  );
  return inlined;
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

        for (const jsName of jsAssets) {
          const cssChunk = bundle[jsName];
          replacedHtml = replacejs(
            replacedHtml,
            cssChunk.fileName,
            cssChunk.code
          );
        }
        htmlChunk.source = replacedHtml;
      }
      for (const jsName of jsAssets) {
        delete bundle[jsName];
      }
    },
  };
}

function configBuilder(input) {
  return defineConfig({
    plugins: [vue(), vitePluginInlineCSS(), vitePluginInlinejs()],
    build: {
      emptyOutDir: true,
      target: 'es2015',
      rollupOptions: {
        input,
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
          inlineDynamicImports: false,
          format: 'iife',
          // Disable code-splitting to allow iife (immediately invoked function expression)
          manualChunks: () => {
            return 'index';
          },
        },
      },
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000_000,
      chunkSizeWarningLimit: 100_000_000_000,
      assetsDir: '.',
      reportCompressedSize: false,
    },
  });
}

export default configBuilder;
