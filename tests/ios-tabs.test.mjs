import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

test('iOS tabs preserve independent documents, undo, overrides, close cancellation and recovery',async()=>{
 const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://ate.test/',pretendToBeVisual:true});
 const {window}=dom;
 for(const name of ['window','Window','document','HTMLElement','MutationObserver','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])Object.defineProperty(globalThis,name,{configurable:true,value:['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(name)?window[name].bind(window):window[name]});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});
 globalThis.webkit=window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
 let shareCancelled=false,finishShare=null,holdShare=false;const exports=[];
 globalThis.Capacitor={PluginHeaders:[{name:'Filesystem',methods:[{name:'writeFile',rtype:'promise'}]},{name:'Share',methods:[{name:'share',rtype:'promise'}]}],nativePromise:async(plugin,method,options)=>{
  if(plugin==='Filesystem'){exports.push(options);return {uri:'file:///cache/export'}}
  if(holdShare)await new Promise(resolve=>finishShare=resolve);
  if(shareCancelled)throw Error('Share canceled');return {activityType:'com.apple.DocumentManagerUICore.SaveToFiles'};
 }};
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true};window.HTMLDialogElement.prototype.close=function(){this.open=false};
 window.Range.prototype.getClientRects=()=>[];window.Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0});
 localStorage.setItem('clear-page-draft-v1',JSON.stringify({text:'legacy content',name:'legacy.c',language:'c'}));
 const {EditorView}=await import('@codemirror/view');const {undo}=await import('@codemirror/commands');
 await import('../src/app.js');
 const view=EditorView.findFromDOM(document.querySelector('.cm-editor')),$=id=>document.getElementById(id);
 const tabs=()=>[...document.querySelectorAll('[role=tab]')];
 const open=async(name,text)=>$('file').onchange({target:{files:[{name,size:text.length,text:async()=>text}],value:name}});
 try{
  assert.equal($('tabs').hidden,false);assert.equal(tabs().length,1);assert.match(tabs()[0].textContent,/legacy.c •/);assert.equal(localStorage.getItem('clear-page-draft-v1'),null);
  view.dispatch({changes:{from:view.state.doc.length,insert:' edited'}});
  await open('script.py','print("hello")');assert.equal(tabs().length,2);assert.equal($('language').value,'python');
  $('language').value='plain';$('language').onchange();
  view.dispatch({changes:{from:view.state.doc.length,insert:'\n# second'}});
  tabs()[0].click();assert.equal(view.state.doc.toString(),'legacy content edited');assert.equal($('language').value,'c');
  undo(view);assert.equal(view.state.doc.toString(),'legacy content');
  tabs()[1].click();assert.equal(view.state.doc.toString(),'print("hello")\n# second');assert.equal($('language').value,'plain');
  undo(view);assert.equal(view.state.doc.toString(),'print("hello")');
  // A manual language choice changes the recovery metadata, not document bytes.
  assert.equal(tabs()[1].textContent,'script.py');
  view.dispatch({changes:{from:0,insert:'# unsaved\n'}});
  $('exit').click();assert.equal($('exitDialog').open,true);$('exitCancel').click();assert.equal(tabs().length,2);
  const snapshot=JSON.parse(localStorage.getItem('clear-page-workspace-v1'));assert.equal(snapshot.tabs.length,2);assert.equal(snapshot.tabs[1].manual,true);assert.equal(snapshot.tabs[1].dirty,true);
  $('exit').click();$('discardExit').click();assert.equal(tabs().length,1);assert.equal(view.state.doc.toString(),'legacy content');
  await open('program','int main(void) { return 0; }');assert.equal($('name').value,'program');assert.equal($('language').value,'c');
  view.dispatch({changes:{from:0,insert:'// change\n'}});
  shareCancelled=true;await $('save').onclick();assert.match(tabs().at(-1).textContent,/•/);assert.equal(exports.at(-1).path,'exports/program');
  shareCancelled=false;await $('save').onclick();assert.equal(tabs().at(-1).textContent,'program');
  holdShare=true;const saving=$('saveExit').onclick();await new Promise(r=>setTimeout(r,20));
  const before=tabs().length;$('new').click();assert.equal(tabs().length,before);
  view.dispatch({changes:{from:0,insert:'// during save\n'}});finishShare();await saving;
  assert.equal(tabs().length,before,'Save and close must not discard edits made while sharing');assert.match(tabs().at(-1).textContent,/•/);holdShare=false;
  for(let i=0;i<10;i++)$('new').click();assert.equal(tabs().length,12);$('new').click();assert.equal(tabs().length,12);assert.match($('notice').textContent,/12 tabs/);
  // Failed recovery writes must be visible, and must not erase the previous workspace.
  const original=window.Storage.prototype.setItem;window.Storage.prototype.setItem=function(){throw Error('quota')};
  view.dispatch({changes:{from:0,insert:'keep me'}});assert.equal($('recoveryWarning').hidden,false);assert.match($('status').textContent,/Draft not saved/);
  window.Storage.prototype.setItem=original;view.dispatch({changes:{from:0,insert:'!'}});assert.equal($('recoveryWarning').hidden,true);
  const {createDocumentTabs,workspaceKey}=await import('../src/document-tabs.js');
  const saved=localStorage.getItem(workspaceKey);let meta={},healthy=true;
  const restored=createDocumentTabs({editor:{view,get value(){return view.state.doc.toString()},set value(text){view.setState((view.state.constructor).create({doc:text}))},focus(){}},storage:localStorage,getMeta:()=>meta,setMeta:t=>meta={name:t.name,language:t.language,manual:t.manual},changed(){},render(){},status:ok=>healthy=ok});
  restored.init({text:'',name:'Untitled',language:'plain'});assert.equal(restored.list().length,12);assert.equal(restored.current.text,'!keep me');assert.equal(restored.current.dirty,true);
  localStorage.setItem(workspaceKey,'unreadable original');
  const corrupt=createDocumentTabs({editor:{view,get value(){return view.state.doc.toString()}},storage:localStorage,getMeta:()=>meta,setMeta(){},changed(){},render(){},status:ok=>healthy=ok});
  corrupt.init({text:'fallback',name:'Untitled',language:'plain'});assert.equal(corrupt.persist(),false);assert.equal(healthy,false);assert.equal(localStorage.getItem(workspaceKey),'unreadable original','Corrupt recovery must never be overwritten silently');
  localStorage.setItem(workspaceKey,saved);
 }finally{view.destroy();dom.window.close()}
});
