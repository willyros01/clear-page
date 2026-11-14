import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

test('iOS workspace recovery re-detects automatic modes but preserves explicit overrides',async()=>{
 const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://ate.test/',pretendToBeVisual:true});
 const {window}=dom;
 for(const name of ['window','Window','document','HTMLElement','MutationObserver','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])Object.defineProperty(globalThis,name,{configurable:true,value:['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(name)?window[name].bind(window):window[name]});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});
 globalThis.webkit=window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true};window.HTMLDialogElement.prototype.close=function(){this.open=false};
 window.Range.prototype.getClientRects=()=>[];window.Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0});
 localStorage.setItem('clear-page-workspace-v1',JSON.stringify({version:1,active:1,tabs:[
  {id:1,text:'int main(void) { return 0; }',name:'Untitled',language:'plain',manual:false,dirty:true},
  {id:2,text:'print(42)',name:'script.py',language:'plain',manual:true,dirty:false}
 ]}));
 await import('../src/app.js');
 const {EditorView}=await import('@codemirror/view');const view=EditorView.findFromDOM(document.querySelector('.cm-editor'));
 try{
  assert.equal(document.getElementById('language').value,'c');
  assert.equal(view.state.doc.toString(),'int main(void) { return 0; }');
  assert.equal(document.getElementById('name').value,'Untitled','Detection must not append or alter the filename');
  document.querySelectorAll('[role=tab]')[1].click();
  assert.equal(document.getElementById('language').value,'plain');
  assert.equal(view.state.doc.toString(),'print(42)');
 }finally{view.destroy();dom.window.close()}
});
