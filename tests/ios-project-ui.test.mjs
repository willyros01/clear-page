import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

test('iOS Basic/Advanced preferences preserve work; project UI creates, saves, exports and removes membership without deleting files',async()=>{
 const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://ate.test/',pretendToBeVisual:true}),{window}=dom;
 for(const name of ['window','Window','document','HTMLElement','MutationObserver','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])Object.defineProperty(globalThis,name,{configurable:true,value:['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(name)?window[name].bind(window):window[name]});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});globalThis.webkit=window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true};window.HTMLDialogElement.prototype.close=function(){this.open=false};window.Range.prototype.getClientRects=()=>[];window.Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0});
 const files=new Map(),dirs=new Set();let shares=0;
 globalThis.Capacitor={PluginHeaders:[{name:'Filesystem',methods:['readFile','writeFile','mkdir','readdir'].map(name=>({name,rtype:'promise'}))},{name:'Share',methods:[{name:'share',rtype:'promise'}]}],nativePromise:async(plugin,method,o)=>{
  if(plugin==='Share'){shares++;return {activityType:'SaveToFiles'}}
  if(method==='mkdir'){dirs.add(o.path);return {}}
  if(method==='writeFile'){const parts=o.path.split('/');for(let i=1;i<parts.length;i++)dirs.add(parts.slice(0,i).join('/'));files.set(o.path,o.data);return {uri:'file:///'+o.path}}
  if(method==='readFile'){if(!files.has(o.path))throw Error('Missing file');return {data:files.get(o.path)}}
  if(method==='readdir'){const result=new Map();for(const path of [...dirs,...files.keys()])if(path.startsWith(o.path+'/')){const name=path.slice(o.path.length+1).split('/')[0];if(name)result.set(name,{name,type:dirs.has(o.path+'/'+name)?'directory':'file'})}return {files:[...result.values()]}}
 }};
 await import('../src/app.js');const {EditorView}=await import('@codemirror/view');const {language}=await import('@codemirror/language');const {undoDepth}=await import('@codemirror/commands');const view=EditorView.findFromDOM(document.querySelector('.cm-editor')),$=id=>document.getElementById(id),settle=()=>new Promise(r=>setTimeout(r,20));
 try{
  assert.ok(document.body.classList.contains('basic-mode'));assert.equal(JSON.parse(localStorage.getItem('clear-page-preferences-v1')).experienceMode,'basic');
  assert.equal(getComputedStyle($('projectsButton')).display,'none');$('autoCheck').checked=false;
  view.dispatch({changes:{from:0,insert:'int main(void) { return 0; }'}});$('name').value='main.c';$('name').onchange();const depth=undoDepth(view.state);
  assert.equal(view.state.facet(language),null);$('advancedMode').click();assert.ok(view.state.facet(language));assert.equal(view.state.doc.toString(),'int main(void) { return 0; }');assert.equal(undoDepth(view.state),depth);$('basicMode').click();assert.equal(view.state.facet(language),null);assert.equal($('name').value,'main.c');
  $('advancedMode').click();$('projectsButton').click();await settle();$('projectName').value='C Test';await $('createProject').onclick();const id=localStorage.getItem('ate-current-project-v1');assert.ok(id);
  $('projectFileName').value='src/run.sh';await $('newProjectFile').onclick();assert.equal($('name').value,'src/run.sh');assert.equal($('language').value,'shell');view.dispatch({changes:{from:0,insert:'#!/bin/sh\necho hello\n'}});
  const key='ATEProjects/'+id+'/src/run.sh';assert.equal(files.get(key),'');await $('save').onclick();assert.equal(files.get(key),'#!/bin/sh\necho hello\n');
  $('basicMode').click();view.dispatch({changes:{from:view.state.doc.length,insert:'# basic edits\n'}});await $('exportCopy').onclick();assert.equal(shares,1);assert.match(document.querySelector('[role=tab][aria-selected=true]').textContent,/•/,'Export copy must not falsely mark project changes saved');
  await $('save').onclick();assert.ok(files.get(key).endsWith('# basic edits\n'));assert.ok(document.body.classList.contains('basic-mode'));
  $('advancedMode').click();$('projectsButton').click();await settle();await $('exportProject').onclick();assert.equal(shares,2);
  view.dispatch({changes:{from:0,insert:'# dirty\n'}});await $('exportProject').onclick();assert.equal(shares,2);assert.match($('projectStatus').textContent,/Save the unsaved/);
  await $('save').onclick();const remove=[...$('projectTree').querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Remove src/run.sh from project');await remove.onclick();assert.ok(files.get(key).includes('# dirty'));const manifest=JSON.parse(files.get('ATEProjects/'+id+'/project.ateproj'));assert.ok(!manifest.files.includes('src/run.sh'));
  assert.equal(view.state.doc.toString(),files.get(key));assert.equal(JSON.parse(localStorage.getItem('clear-page-workspace-v1')).tabs.find(t=>t.name==='src/run.sh').projectRef.id,id);
 }finally{view.destroy();dom.window.close()}
});
