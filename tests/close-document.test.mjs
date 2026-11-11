import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

test('closing discards the document, undo history and panels without a closing page; the next draft still saves', async()=>{
 const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://ate.test/',pretendToBeVisual:true});
 const {window}=dom;
 for(const name of ['window','document','HTMLElement','MutationObserver','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']){
  Object.defineProperty(globalThis,name,{configurable:true,value:typeof window[name]==='function'&&['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(name)?window[name].bind(window):window[name]});
 }
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 window.HTMLDialogElement.prototype.close=function(){this.open=false};
 window.Range.prototype.getClientRects=()=>[];
 window.Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0});
 const {EditorView}=await import('@codemirror/view');
 const {undoDepth}=await import('@codemirror/commands');
 const {openSearchPanel}=await import('@codemirror/search');
 await import('../src/app.js');
 const view=EditorView.findFromDOM(document.querySelector('.cm-editor'));
 try{
  view.dispatch({changes:{from:0,insert:'Private unsaved document'}});
  assert.ok(undoDepth(view.state)>0);
  assert.match(localStorage.getItem('clear-page-draft-v1'),/Private unsaved document/);
  openSearchPanel(view);
  document.getElementById('exit').click();
  document.getElementById('exitCancel').click();
  assert.equal(view.state.doc.toString(),'Private unsaved document');
  document.getElementById('exit').click();
  document.getElementById('discardExit').click();
  assert.equal(view.state.doc.toString(),'');
  assert.equal(undoDepth(view.state),0);
  assert.equal(localStorage.getItem('clear-page-draft-v1'),null);
  assert.equal(document.querySelectorAll('dialog[open]').length,0);
  assert.equal(document.querySelector('.cm-search'),null);
  assert.equal(document.getElementById('closed'),null);
  assert.notEqual(document.activeElement,view.contentDOM);
  view.dispatch({changes:{from:0,insert:'Next document'}});
  assert.match(localStorage.getItem('clear-page-draft-v1'),/Next document/);
 }finally{view.destroy();dom.window.close()}
});
