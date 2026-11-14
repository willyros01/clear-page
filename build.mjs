import {build} from 'esbuild';
import {mkdir,copyFile,readFile} from 'node:fs/promises';
const release=JSON.parse(await readFile('release.json','utf8'));
for(const file of ['package.json','src-tauri/tauri.conf.json'])if(JSON.parse(await readFile(file,'utf8')).version!==release.version)throw Error('Release version mismatch: '+file);
if(process.env.ATE_BUILD_NUMBER&&Number(process.env.ATE_BUILD_NUMBER)!==release.build)throw Error('Release build number mismatch');
await mkdir('dist',{recursive:true});
const appEntry=(process.env.ATE_IOS_VERIFICATION==='1'||process.env.ATE_ANDROID_VERIFICATION==='1')?{stdin:{contents:"import './src/app.js'; import './tests/ios-native.js';",resolveDir:process.cwd()}}:{entryPoints:['src/app.js']};
await build({...appEntry,bundle:true,minify:true,format:'iife',outfile:'dist/app.js',target:['safari15','chrome80'],legalComments:'linked'});
await build({entryPoints:['src/syntax-worker.js'],bundle:true,minify:true,format:'iife',outfile:'dist/syntax-worker.js',target:['safari15','chrome80'],legalComments:'linked',external:['fs/promises','module','fs','path','url'],define:{'import.meta.url':'""',__ATE_WORKER_VERIFICATION__:JSON.stringify(process.env.ATE_ANDROID_VERIFICATION==='1')}});
await copyFile('node_modules/web-tree-sitter/web-tree-sitter.wasm','dist/web-tree-sitter.wasm');
await copyFile('node_modules/tree-sitter-c/tree-sitter-c.wasm','dist/tree-sitter-c.wasm');
await copyFile('node_modules/tree-sitter-bash/tree-sitter-bash.wasm','dist/tree-sitter-bash.wasm');
await copyFile('node_modules/@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm','dist/ruff_wasm_bg.wasm');
await copyFile('index.html','dist/index.html');

await copyFile('THIRD-PARTY-NOTICES.txt','dist/THIRD-PARTY-NOTICES.txt');
