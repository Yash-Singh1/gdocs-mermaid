// const purgecss = require('@fullhuman/postcss-purgecss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    // purgecss({
    //   content: [`./**/*.html`, `./**/*.vue`],
    //   defaultExtractor(content: string) {
    //     const contentWithoutStyleBlocks = content.replace(
    //       /<style[^]+?<\/style>/gi,
    //       ''
    //     );
    //     return (
    //       contentWithoutStyleBlocks
    //         .match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g)
    //         ?.concat([]) || []
    //     );
    //   },
    //   safelist: [
    //     /-(leave|enter|appear)(|-(to|from|active))$/,
    //     /^(?!(|.*?:)cursor-move).+-move$/,
    //     /^router-link(|-exact)-active$/,
    //     /data-v-.*/,
    //   ],
    // }),
    tailwindcss('./tailwind.config.js'),
    autoprefixer(),
  ],
};
