import test from 'node:test';import assert from 'node:assert/strict';
import {groupOf,groupTabs,roomFor} from '../src/tab-groups.js';
const gh=(repo,branch,path)=>({id:path,projectRef:{kind:'github',owner:'w',repo,branch,path}});
test('super tabs group files by repository and branch, Project, or device, in first-seen order',()=>{
 const items=[gh('a','main','x'),{id:'d1',projectRef:null},gh('a','dev','y'),gh('a','main','z'),{id:'p',projectRef:{id:'P1',projectName:'Notes'}}];
 const g=groupTabs(items);assert.deepEqual(g.map(x=>x.key),['gh:w/a@main','device','gh:w/a@dev','pr:P1']);
 assert.equal(g[0].tabs.length,2);assert.equal(g[3].branch,'Notes');assert.equal(groupOf(null).repo,'My files');
});
test('limits: 30 tabs in all, 12 per group',()=>{
 const twelve=Array.from({length:12},(_,i)=>gh('a','main','f'+i));
 assert.match(roomFor(twelve,{kind:'github',owner:'w',repo:'a',branch:'main'},30),/12 files per group/);
 assert.equal(roomFor(twelve,{kind:'github',owner:'w',repo:'a',branch:'dev'},30),'');
 const thirty=[...twelve,...Array.from({length:12},(_,i)=>gh('b','main','g'+i)),...Array.from({length:6},(_,i)=>gh('c','main','h'+i))];
 assert.match(roomFor(thirty,null,30),/30 tabs maximum/);
});
