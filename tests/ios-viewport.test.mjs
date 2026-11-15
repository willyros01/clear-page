import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {setupIOSViewport} from '../src/ios-viewport.js';

test('iOS keyboard pan, resize and menu return follow visible viewport without changing document preferences',async()=>{
 const {window}=new JSDOM('<meta name="viewport" content="width=device-width,initial-scale=1"><main style="font-size:36px">protected document</main>',{pretendToBeVisual:true});
 const viewport=new window.EventTarget();Object.assign(viewport,{width:375,height:812,offsetLeft:0,offsetTop:0,scale:1});
 Object.defineProperty(window,'visualViewport',{value:viewport});let reset=0;window.scrollTo=(x,y)=>{assert.equal(x,0);assert.equal(y,0);reset++};
 const controller=setupIOSViewport(window,window.document),root=window.document.documentElement;
 try{
  Object.assign(viewport,{height:340,offsetTop:88,offsetLeft:12,width:350,scale:1.1});viewport.dispatchEvent(new window.Event('resize'));viewport.dispatchEvent(new window.Event('scroll'));
  await new Promise(resolve=>window.requestAnimationFrame(resolve));
  assert.equal(root.style.getPropertyValue('--ios-visible-top'),'88px');assert.equal(root.style.getPropertyValue('--ios-visible-height'),'340px');assert.equal(root.style.getPropertyValue('--ios-visible-width'),'350px');
  controller.restore();assert.equal(reset,1);assert.equal(viewport.scale,1.1);
  Object.assign(viewport,{height:812,offsetTop:0,offsetLeft:0,width:375});viewport.dispatchEvent(new window.Event('resize'));
  await new Promise(resolve=>window.requestAnimationFrame(resolve));
  assert.equal(root.style.getPropertyValue('--ios-visible-top'),'0px');assert.equal(root.style.getPropertyValue('--ios-visible-height'),'812px');
  assert.equal(window.document.querySelector('main').textContent,'protected document');assert.equal(window.document.querySelector('main').style.fontSize,'36px');assert.equal(window.document.querySelector('meta').content,'width=device-width,initial-scale=1');
 }finally{controller.dispose();window.close()}
});
