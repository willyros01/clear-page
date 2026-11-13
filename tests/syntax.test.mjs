import test from 'node:test';
import assert from 'node:assert/strict';
import {checkSyntax} from '../src/syntax.js';
import {MAX_CHECK_LENGTH,clangDiagnostics} from '../src/syntax-common.js';
import {createCheckRunner} from '../src/check-runner.js';
import {languageForName} from '../src/languages.js';
const check=(language,text,name)=>checkSyntax({language,text,name});
test('all planned extensions detect a language, including uppercase C headers',()=>{
 for(const [name,id] of Object.entries({'test.C':'c','test.H':'c','x.json':'json','x.YML':'yaml','x.yaml':'yaml','x.ts':'typescript','x.tsx':'typescript','x.jsx':'javascript','x.mjs':'javascript','x.cjs':'javascript','x.sql':'sql','x.md':'markdown','README':'plain'}))assert.equal(languageForName(name),id);
});
for(const [language,valid,invalid] of [
 ['javascript','export const f = async () => ({value: await Promise.resolve(1)});','const = 1;'],
 ['typescript','const count: number = 1;','const count: = 1;'],
 ['json','{"a":[1,true,null]}','{"a":}'],
 ['yaml','name: hello\nitems: [one, two]\n','items: [one, two'],
 ['html','<!doctype html><p>Hello</p>','<p title="unfinished'],
 ['css','@media (width > 10px) { a { color: red; } }','a { color red; }']
])test(`${language} accepts valid text and reports malformed text with bounded positions`,()=>{
 assert.deepEqual(check(language,valid).diagnostics,[]);
 const result=check(language,invalid);assert.equal(result.status,'checked');assert.ok(result.diagnostics.length);
 for(const d of result.diagnostics){assert.ok(d.from>=0&&d.to<=invalid.length&&d.to>=d.from);assert.ok(d.line>=1&&d.column>=1)}
});
test('strict JSON rejects comments, trailing commas and an empty document',()=>{
 for(const text of ['// comment\n{}','{"x":1,}',''])assert.ok(check('json',text).diagnostics.length);
});
test('JSX and TSX use the file extension; JavaScript does not silently accept TypeScript',()=>{
 assert.deepEqual(check('javascript','export const App = () => <main/>;','app.jsx').diagnostics,[]);
 assert.deepEqual(check('typescript','const App = (x: number) => <p>{x}</p>;','app.tsx').diagnostics,[]);
 assert.ok(check('javascript','const x: number = 1;','x.js').diagnostics.length);
});
test('checking never evaluates JavaScript',()=>{
 globalThis.__ateExecuted=false;
 check('javascript','globalThis.__ateExecuted = true; throw Error("must not run");');
 assert.equal(globalThis.__ateExecuted,false);delete globalThis.__ateExecuted;
});
test('HTML maps inline JavaScript, JSON and CSS errors back to the document',()=>{
 for(const text of ['<h1>Title</h1>\n<script>const = 1;</script>','<p>ok</p>\r\n<script>\r\nconst = 1;</script>','<script type="application/json">{"a":}</script>','<style>a { color red; }</style>']){
  const result=check('html',text);assert.ok(result.diagnostics.length,text);
  assert.ok(result.diagnostics.some(d=>/script:|style:/.test(d.message)),text);
 }
 assert.deepEqual(check('html','<script type="text/template">{{ anything }}</script>').diagnostics,[]);
});
test('CSS detects missing delimiters without treating strings/comments as braces',()=>{
 assert.ok(check('css','a { color: red;').diagnostics.some(d=>d.message==='Missing closing }'));
 assert.deepEqual(check('css','a { content: "}"; /* { */ color: var(--color); }').diagnostics,[]);
 assert.ok(check('css','/* unfinished').diagnostics.some(d=>/Unclosed/.test(d.message)));
});
test('YAML supports multiple documents and reports duplicate keys',()=>{
 assert.deepEqual(check('yaml','---\na: 1\n---\nb: 2').diagnostics,[]);
 assert.ok(check('yaml','a: 1\na: 2').diagnostics.length);
});
test('unsupported languages and large documents cannot produce a false success',()=>{
 for(const language of ['python','plain','c'])assert.equal(check(language,'hello').status,'unavailable');
 assert.equal(check('javascript',' '.repeat(MAX_CHECK_LENGTH+1)).status,'skipped');
 assert.equal(check('typescript','const x: string = 123;').diagnostics.length,0,'Type checking is explicitly outside syntax checking');
});
test('Clang maps UTF-8 columns and Windows header paths without pointing at wrong document lines',()=>{
 const text='// hello\nchar *s = "é"; int x = ;';
 const column=new TextEncoder().encode('char *s = "é"; int x = ').length+1;
 const result=clangDiagnostics(text,`<stdin>:2:${column}: error: expected expression\nC:\\SDK\\header.h:3:4: error: header issue`);
 assert.equal(text[result.diagnostics[0].from],';');assert.equal(result.diagnostics[0].line,2);assert.equal(result.external.length,1);
});
test('worker cancellation resolves obsolete requests and terminates the old worker',async()=>{
 const workers=[];
 const runner=createCheckRunner({workerFactory:()=>{const w={postMessage(data){this.data=data},terminate(){this.stopped=true}};workers.push(w);return w},nativeCheck:async()=>({status:'checked',diagnostics:[]})});
 const old=runner.run({language:'javascript'}),fresh=runner.run({language:'json'});
 assert.equal((await old).status,'cancelled');assert.equal(workers[0].stopped,true);
 workers[0].onmessage({data:{id:workers[0].data.id,result:{status:'wrong'}}});
 workers[1].onmessage({data:{id:workers[1].data.id,result:{status:'checked',diagnostics:[]}}});
 assert.equal((await fresh).status,'checked');runner.cancel();
});
test('native checks are serialized and intermediate obsolete requests are skipped',async()=>{
 let release;const calls=[];
 const runner=createCheckRunner({workerFactory:()=>{},nativeCheck:request=>{calls.push(request.text);return request.text==='first'?new Promise(r=>release=r):Promise.resolve({status:'checked'})}});
 const first=runner.run({language:'c',cChecker:'clang',text:'first'});await Promise.resolve();
 const obsolete=runner.run({language:'c',cChecker:'clang',text:'obsolete'}),last=runner.run({language:'c',cChecker:'clang',text:'last'});
 release({status:'checked'});await first;assert.equal((await obsolete).status,'cancelled');await last;
 assert.deepEqual(calls,['first','last']);runner.cancel();
});

test('Android keeps isolated engines warm, serializes cancelled Python work and ignores stale results',async()=>{
 const workers=[];const runner=createCheckRunner({keepIdleWorker:true,workerFactory:()=>{const w={postMessage(data){this.data=data},terminate(){this.stopped=true}};workers.push(w);return w}});
 const first=runner.run({language:'python'});assert.equal(workers.length,2);const old=workers[0].data;
 const second=runner.run({language:'python'});assert.equal((await first).status,'cancelled');assert.equal(workers[0].data.id,old.id,'Do not queue obsolete requests inside the Wasm worker');
 workers[0].onmessage({data:{id:old.id,result:{status:'checked',diagnostics:[{message:'obsolete'}]}}});
 assert.notEqual(workers[0].data.id,old.id);workers[0].onmessage({data:{id:workers[0].data.id,result:{status:'checked',diagnostics:[]}}});assert.deepEqual((await second).diagnostics,[]);
 const c=runner.run({language:'c'});assert.equal(workers.length,2);workers[1].onmessage({data:{id:workers[1].data.id,result:{status:'checked',diagnostics:[]}}});await c;
 assert.ok(workers.every(w=>!w.stopped),'Switching engines must not force-destroy initialized Wasm');
 const third=runner.run({language:'python'});const current=workers[0].data.id;runner.dispose();assert.equal((await third).status,'cancelled');workers[0].onmessage({data:{id:current,result:{status:'checked',diagnostics:[]}}});
});
test('Android terminates a genuinely stuck parser at the watchdog limit',async()=>{
 const {createAndroidCheckRunner}=await import('../src/android-check-runner.js');
 const workers=[];const runner=createAndroidCheckRunner({timeoutMs:20,bootstrapTimeoutMs:20,workerFactory:()=>{const w={postMessage(){},terminate(){this.stopped=true}};workers.push(w);return w}});
 assert.equal((await runner.run({language:'python'})).status,'skipped');assert.equal(workers[0].stopped,true);runner.dispose();
});
