import test from 'node:test';import assert from 'node:assert/strict';
import {buildBranchTree} from '../src/branch-tree.js';
const H=o=>new Map(Object.entries(o));
test('branch tree: sub-branches sit under the branch they were made from',()=>{
 // main: m2 m1 · fairpot made from main at m2, then f1 · fix made from fairpot at f1, then x1 · late made from main at m1
 const t=buildBranchTree(['fix','main','fairpot','late'],H({main:['m2','m1'],fairpot:['f1','m2','m1'],fix:['x1','f1','m2','m1'],late:['l1','m1']}),'main');
 assert.deepEqual(t.map(x=>[x.name,x.depth,x.note]),[['main',0,''],['fairpot',1,'made from main'],['fix',2,'made from fairpot'],['late',1,'made from main']]);
});
test('branch tree: identical branches, copied-in branches, no loops',()=>{
 const t=buildBranchTree(['main','b','a','copied'],H({main:['m1'],a:['m1'],b:['m1'],copied:['c1']}),'main');
 const by=Object.fromEntries(t.map(x=>[x.name,x]));
 assert.equal(by.a.note,'same as main');assert.equal(by.b.note,'same as main');assert.equal(by.copied.depth,0);assert.equal(by.copied.note,'brought in from another repository');
 assert.equal(t[0].name,'main');assert.equal(t.at(-1).name,'copied');
});
test('branch tree: a branch with new changes on main later still hangs under main',()=>{
 const t=buildBranchTree(['main','old'],H({main:['m3','m2','m1'],old:['o1','m1']}),'main');
 assert.deepEqual(t.map(x=>[x.name,x.depth,x.note]),[['main',0,''],['old',1,'made from main']]);
});
test('branch tree: a branch with no changes of its own, after its parent moved on',()=>{
 const t=buildBranchTree(['main','idle'],H({main:['m2','m1'],idle:['m1']}),'main');
 assert.deepEqual(t.map(x=>[x.name,x.depth,x.note]),[['main',0,''],['idle',1,'made from main, no changes yet']]);
});
