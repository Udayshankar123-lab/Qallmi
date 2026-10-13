const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/app/globals.src.css');
const outPath = path.join(__dirname, '../src/app/globals.css');

const css = fs.readFileSync(srcPath, 'utf8');

postcss([tailwindcss()])
  .process(css, { from: srcPath })
  .then(result => {
    fs.writeFileSync(outPath, result.css);
    console.log(`[CSS] Tailwind compiled successfully: ${result.css.length} bytes`);
  })
  .catch(err => {
    console.error('[CSS] Compilation error:', err);
    process.exit(1);
  });
