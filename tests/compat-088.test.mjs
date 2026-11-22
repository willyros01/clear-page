import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

// Android 11 / older Fire WebViews lack Array/String.prototype.at, which marked (Preview) uses.
test('app and worker load the .at() compatibility layer before Preview and the new checkers',()=>{
 for(const f of ['../src/app.js','../src/syntax-worker.js']){
  const s=readFileSync(new URL(f,import.meta.url),'utf8');
  for(const m of ["import 'core-js/actual/array/at.js';","import 'core-js/actual/string/at.js';"])assert.ok(s.includes(m),f+' '+m);
 }
});
test('Markdown Preview renders on an engine without native .at() once the layer is loaded',()=>{
 const code=`delete Array.prototype.at;delete String.prototype.at;
await import('core-js/actual/array/at.js');await import('core-js/actual/string/at.js');
const {previewDocument}=await import(${JSON.stringify(new URL('../src/preview.js',import.meta.url).href)});
const html=previewDocument('# T\\n\\n- a\\n- b\\n\\n| x |\\n|---|\\n| 1 |\\n','markdown');
if(!/<h1[^>]*>T<\\/h1>/.test(html)||!/<li>a<\\/li>/.test(html))throw Error('render failed');`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
});
