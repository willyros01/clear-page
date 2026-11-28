import test from 'node:test';import assert from 'node:assert/strict';
import {createKeyboardWatch,screenIsLandscape} from '../src/keyboard-line.js';
const sim=(start,land=false)=>{let h=start,l=land,up=null;const w=createKeyboardWatch({height:()=>h,landscape:()=>l,onChange:v=>{up=v}});w();return {set:(nh,nl=l)=>{h=nh;l=nl;w();return up}}};
test('Fire HD 8 (portrait 600×960): keyboard makes the page wider than tall — still seen as keyboard up',()=>{
 const d=sim(960);assert.equal(d.set(470),true,'keyboard up');assert.equal(d.set(960),false,'keyboard down');
});
test('phone portrait and a real turn to landscape',()=>{
 const d=sim(844);assert.equal(d.set(500),true);assert.equal(d.set(844),false);
 assert.equal(d.set(390,true),false,'turning sideways is not a keyboard');assert.equal(d.set(180,true),true,'keyboard in landscape');
});
test('orientation is read from the screen',()=>{
 assert.equal(screenIsLandscape({screen:{orientation:{type:'portrait-primary'},width:800,height:1280}}),false);
 assert.equal(screenIsLandscape({screen:{orientation:{type:'landscape-primary'}}}),true);
 assert.equal(screenIsLandscape({orientation:90,screen:{}}),true);
 assert.equal(screenIsLandscape({screen:{width:1280,height:800}}),true);
});
