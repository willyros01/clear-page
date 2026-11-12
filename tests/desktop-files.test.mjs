import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

test('desktop Save cancellation/error preserves text and recovery; Save and Exit closes only after native success',async()=>{
 const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'http://tauri.localhost/',pretendToBeVisual:true});
 const {window}=dom;
 for(const name of ['window','Window','document','HTMLElement','MutationObserver','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])Object.defineProperty(globalThis,name,{configurable:true,value:typeof window[name]==='function'&&['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(name)?window[name].bind(window):window[name]});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});
 globalThis.isTauri=true;
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 window.HTMLDialogElement.prototype.close=function(){this.open=false};
 window.Range.prototype.getClientRects=()=>[];
 window.Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0});
 const {mockIPC,clearMocks}=await import('@tauri-apps/api/mocks');
 let destination=null,fail=false,exits=0;const requests=[];
 mockIPC((cmd,payload)=>{requests.push({cmd,payload});if(cmd==='save_document'){if(fail)throw Error('disk full');return destination}if(cmd==='exit_editor')exits++},{shouldMockEvents:true});
 localStorage.setItem('clear-page-draft-v1',JSON.stringify({name:'Recovered.C',text:'int main(void) { return 0; }',language:'plain',languageManual:false}));
 await import('../src/app.js');
 const {EditorView}=await import('@codemirror/view');
 const view=EditorView.findFromDOM(document.querySelector('.cm-editor'));
 const settle=()=>new Promise(r=>setTimeout(r,30));
 try{
  assert.equal(document.getElementById('language').value,'c','Recovery must re-detect an automatic language');
  const input=document.getElementById('file');
  const open=async(name,text)=>input.onchange({target:{files:[{name,size:text.length,text:async()=>text}],value:name}});
  for(const [name,text,language] of [['program.c.txt','int main(void){return 0;}','c'],['source','SELECT name FROM people;','sql'],['script.py','Hello','python']]){
   await open(name,text);
   assert.equal(document.getElementById('name').value,name,'Detection must not rename a document');
   assert.equal(document.getElementById('language').value,language);
  }
  assert.equal(requests.filter(x=>x.cmd==='save_document').length,0,'Opening must not save');
  view.dispatch({changes:{from:0,to:view.state.doc.length,insert:'Keep my unsaved work'}});
  document.getElementById('exit').click();
  document.getElementById('saveExit').click();await settle();
  assert.equal(exits,0);assert.equal(view.state.doc.toString(),'Keep my unsaved work');
  assert.match(localStorage.getItem('clear-page-draft-v1'),/Keep my unsaved work/);
  assert.equal(document.getElementById('exitDialog').open,true);
  fail=true;document.getElementById('saveExit').click();await settle();
  assert.equal(exits,0);assert.equal(view.state.doc.toString(),'Keep my unsaved work');
  // Save As updates automatic language detection, while a manual override stays chosen.
  fail=false;destination='code.json';document.getElementById('save').click();await settle();
  assert.equal(document.getElementById('name').value,'code.json');
  assert.equal(document.getElementById('language').value,'json');
  document.getElementById('language').value='javascript';document.getElementById('language').dispatchEvent(new window.Event('change'));
  document.getElementById('name').value='manual.py';document.getElementById('name').dispatchEvent(new window.Event('change'));
  assert.equal(document.getElementById('language').value,'javascript','Manual language survives filename edits');
  destination='custom.txt';document.getElementById('save').click();await settle();
  assert.equal(document.getElementById('language').value,'javascript');
  destination='Notes.txt';document.getElementById('saveExit').click();await settle();
  assert.equal(exits,1);assert.equal(view.state.doc.toString(),'');
  assert.match(localStorage.getItem('clear-page-draft-v1'),/Keep my unsaved work/);
  assert.deepEqual(Object.keys(requests.find(x=>x.cmd==='save_document').payload).sort(),['name','text']);
 }finally{view.destroy();clearMocks();delete globalThis.isTauri;dom.window.close()}
});
