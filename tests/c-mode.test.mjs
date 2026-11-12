import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {setupSyntax} from '../src/syntax-ui.js';

test('desktop C defaults to the offline worker, persists explicit Clang selection and restores Basic without compiler setup',async()=>{
 const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test'});
 const saved={document:globalThis.document,localStorage:globalThis.localStorage,Worker:globalThis.Worker};
 globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;
 localStorage.setItem('ate-syntax-preferences-v1',JSON.stringify({automatic:false,standard:'c17'}));
 const requests=[];let native=0,info=0,install=0;
 globalThis.Worker=class{postMessage(data){requests.push(data.request);queueMicrotask(()=>this.onmessage({data:{id:data.id,result:{status:'checked',diagnostics:[],message:'Basic C syntax check only'}}}))}terminate(){}};
 const $=id=>document.getElementById(id),settle=()=>new Promise(r=>setTimeout(r,0));
 try{
  const api=setupSyntax({desktop:true,editor:{diagnostics(){},focus(){},jumpTo(){}},getDocument:()=>({language:'c',text:'int x;',name:'test.c'}),nativeCheck:async()=>{native++;return {status:'unavailable',setupNeeded:true,diagnostics:[],message:'Clang unavailable'}},compilerSetupInfo:async()=>{info++;return {supported:true,bytes:191037046,destination:'test',ready:false}},installCCompiler:()=>{install++}});
  await settle();assert.equal($('cChecker').value,'basic');assert.equal($('cAdvanced').hidden,true);assert.equal(info,0);
  await api.check();assert.equal(requests.length,1);assert.equal(native,0);assert.equal($('getCompiler').hidden,true);
  $('cChecker').value='clang';$('cChecker').dispatchEvent(new dom.window.Event('change'));await settle();
  assert.equal($('cAdvanced').hidden,false);assert.equal(JSON.parse(localStorage.getItem('ate-syntax-preferences-v1')).cChecker,'clang');
  await api.check();assert.equal(native,1);assert.equal($('syntaxGetCompiler').hidden,false);assert.equal(install,0);
  $('cChecker').value='basic';$('cChecker').dispatchEvent(new dom.window.Event('change'));await settle();
  await api.check();assert.equal(native,1);assert.equal(requests.length,2);assert.equal($('getCompiler').hidden,true);assert.equal($('syntaxGetCompiler').hidden,true);assert.equal(install,0);
  assert.equal(JSON.parse(localStorage.getItem('ate-syntax-preferences-v1')).cChecker,'basic');
 }finally{dom.window.close();for(const [key,value]of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
});
