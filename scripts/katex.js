// Build-time KaTeX rendering for hexo-renderer-marked v7.
// Butterfly 5.x only ships the KaTeX CSS; the TeX -> HTML conversion
// happens here via marked-katex-extension (standard mode: $x$ needs
// whitespace/punctuation after the closing $, keeps shell snippets
// and $A$005$... password hashes in prose safe).
'use strict';

const markedKatex = require('marked-katex-extension');

hexo.extend.filter.register('marked:extensions', extensions => {
  extensions.push(...markedKatex({ throwOnError: false }).extensions);
});
