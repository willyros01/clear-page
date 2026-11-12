import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'iife',outfile:'dist/app.js',target:['safari15','chrome100'],legalComments:'linked'});
await build({entryPoints:['src/syntax-worker.js'],bundle:true,minify:true,format:'iife',outfile:'dist/syntax-worker.js',target:['safari15','chrome100'],legalComments:'linked'});
await copyFile('index.html','dist/index.html');

await copyFile('THIRD-PARTY-NOTICES.txt','dist/THIRD-PARTY-NOTICES.txt');
