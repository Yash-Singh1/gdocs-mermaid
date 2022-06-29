import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'node:path';
import legacy from './vitePluginLegacy/index.js';
import { viteSingleFile } from 'vite-plugin-singlefile';
import * as fs from 'node:fs';
import systemJSLoader from 'rollup-plugin-systemjs-loader';

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

export function vitePluginUseGsImport() {
  return {
    name: 'use-gs-import',
    enforce: 'post' as const,
    generateBundle(_, bundle) {
      const htmlFiles = Object.keys(bundle).filter((i) => i.endsWith('.html'));
      const srcReg = /(src="[^"\s]+?)(\.js")/gm;
      for (const htmlFile of htmlFiles) {
        const htmlChunk = bundle[htmlFile];
        let replacedHtml = htmlChunk.source;
        replacedHtml = replacedHtml.replaceAll(srcReg, '$1.gs"');
        htmlChunk.source = replacedHtml;
      }
    },
  };
}

function configBuilder(input) {
  defineConfig({
    root: __dirname,
    plugins: [
      vue(),
      // legacy({
      //   polyfills: false,
      //   // renderLegacyChunks: false,
      // }),
      systemJSLoader({
        include: [require.resolve('systemjs/dist/s.js')],
      }),
      vitePluginInlineCSS(),
      // viteSingleFile({
      //   inlinePattern: ['*.js'],
      //   useRecommendedBuildConfig: false,
      // }),
      // vitePluginInlinejs(),
      //   vitePluginUseGsImport(),
    ],
    build: {
      outDir: path.resolve(__dirname, 'dist/'),
      emptyOutDir: true,
      target: 'es2015',
      rollupOptions: {
        // input: {
        //   sidebar: path.resolve(__dirname, 'sidebar/index.html'),
        //   dialog: path.resolve(__dirname, 'dialog/index.html'),
        //   // Code: path.resolve(__dirname, 'server/Code.ts'),
        // },
        input: [
          path.resolve(__dirname, 'sidebar/index.html'),
          path.resolve(__dirname, 'dialog/index.html'),
        ],
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
          inlineDynamicImports: false,
          format: 'system',
        },
      },
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
      chunkSizeWarningLimit: 100_000_000,
      assetsDir: '.',
      reportCompressedSize: false,
    },
  });
}

export default configBuilder;
