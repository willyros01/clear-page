import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
const appEntry=(process.env.ATE_IOS_VERIFICATION==='1'||process.env.ATE_ANDROID_VERIFICATION==='1')?{stdin:{contents:"import './src/app.js'; import './tests/ios-native.js';",resolveDir:process.cwd()}}:{entryPoints:['src/app.js']};
await build({...appEntry,bundle:true,minify:true,format:'iife',outfile:'dist/app.js',target:['safari15','chrome80'],legalComments:'linked'});
await build({entryPoints:['src/syntax-worker.js'],bundle:true,minify:true,format:'iife',outfile:'dist/syntax-worker.js',target:['safari15','chrome80'],legalComments:'linked',external:['fs/promises','module','fs','path','url'],define:{'import.meta.url':'""'}});
await copyFile('node_modules/web-tree-sitter/web-tree-sitter.wasm','dist/web-tree-sitter.wasm');
await copyFile('node_modules/tree-sitter-c/tree-sitter-c.wasm','dist/tree-sitter-c.wasm');
await copyFile('index.html','dist/index.html');

await copyFile('THIRD-PARTY-NOTICES.txt','dist/THIRD-PARTY-NOTICES.txt');
