const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
  plugins: [
    purgecss({
      content: [`./**/*.html`, `./**/*.vue`],
      defaultExtractor(content: string) {
        const contentWithoutStyleBlocks = content.replace(
          /<style[^]+?<\/style>/gi,
          ''
        );
        return (
          contentWithoutStyleBlocks
            .match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g)
            ?.concat(['cm-editor', 'cm-scroller', 'col-0.5', 'col-5.5']) || []
        );
      },
      safelist: [
        /-(leave|enter|appear)(|-(to|from|active))$/,
        /^(?!(|.*?:)cursor-move).+-move$/,
        /^router-link(|-exact)-active$/,
        /data-v-.*/,
      ],
    }),
  ],
};
