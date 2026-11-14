import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8,unzipSync} from 'fflate';
import {createProjectStore,projectPath,validateManifest,revision,manifestName} from '../src/projects.js';
function fixture(){const disk=new Map();let fail=false;const adapter={async list(){return [...new Set([...disk.keys()].map(k=>k.split('/')[0]))]},async read(id,path){return disk.get(id+'/'+path)??null},async write(id,path,text){if(fail)throw Error('disk full');disk.set(id+'/'+path,text)},async mkdir(){}};return {disk,store:createProjectStore(adapter),setFail:value=>fail=value};}
test('projects preserve exact ordinary files, folders, extensions, text and ZIP round trips',async()=>{
 const {store}=fixture();const p=await store.create('My C project');await store.folder(p.id,'src');
 await store.add(p.id,[{path:'src/main.c',text:'#include "main.h"\r\nint main(void) { return 0; }\r\n'},{path:'src/main.h',text:'#pragma once\n'},{path:'build',text:'#!/bin/sh\necho café\n'},{path:'README.md',text:'# Project\n'}]);
 const doc=await store.read(p.id,'build');assert.equal(doc.name,'build');assert.equal(doc.text,'#!/bin/sh\necho café\n');
 const bundle=await store.export(p.id),raw=unzipSync(bundle.bytes);assert.ok(raw[manifestName]);assert.ok(raw['src/main.c']);assert.equal(raw['build.txt'],undefined);
 const imported=await store.import(bundle.bytes);assert.notEqual(imported.id,p.id);assert.deepEqual((await store.load(imported.id)).files,(await store.load(p.id)).files);
 for(const path of imported.files)assert.equal((await store.read(imported.id,path)).text,(await store.read(p.id,path)).text);
});
test('project save detects stale/external edits, Save As keeps the source, and removing membership never deletes bytes',async()=>{
 const {store,disk}=fixture(),p=await store.create('Safe');await store.add(p.id,[{path:'main.c',text:'original'}]);let doc=await store.read(p.id,'main.c');
 const result=await store.save(doc.projectRef,'main.c','new');assert.equal(result.projectRef.revision,revision('new'));
 await assert.rejects(store.save(doc.projectRef,'main.c','stale'),/changed outside/);assert.equal((await store.read(p.id,'main.c')).text,'new');
 doc=await store.read(p.id,'main.c');await store.save(doc.projectRef,'new-file','copy');assert.equal((await store.read(p.id,'main.c')).text,'new');assert.equal((await store.read(p.id,'new-file')).text,'copy');
 await store.remove(p.id,'main.c');assert.equal(disk.get(p.id+'/main.c'),'new');assert.ok(!(await store.load(p.id)).files.includes('main.c'));
 await assert.rejects(store.add(p.id,[{path:'main.c',text:'different'}]),/already exists/);await store.add(p.id,[{path:'main.c',text:'new'}]);assert.equal((await store.read(p.id,'main.c')).text,'new');
});
test('project writes fail visibly without discarding the existing project, and serial saves reject the second stale revision',async()=>{
 const {store,setFail}=fixture(),p=await store.create('Failure');await store.add(p.id,[{path:'data',text:'old'}]);const doc=await store.read(p.id,'data');setFail(true);
 await assert.rejects(store.save(doc.projectRef,'data','new'),/disk full/);setFail(false);assert.equal((await store.read(p.id,'data')).text,'old');
 const results=await Promise.allSettled([store.save(doc.projectRef,'data','one'),store.save(doc.projectRef,'data','two')]);assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');
});
test('project paths reject traversal, absolute paths, metadata overwrites, portable-name collisions and file/folder conflicts',async()=>{
 for(const path of ['../secret','src/../file','/etc/passwd','C:\\data','src//file','a/./file','project.ateproj','NUL','file.','file ','src/CON.txt','src/%2e%2e/escape','src%2ffile','file#fragment'])assert.throws(()=>projectPath(path),undefined,path);
 const {store}=fixture(),p=await store.create('Paths');await store.add(p.id,[{path:'src/main.c',text:'x'}]);
 await assert.rejects(store.add(p.id,[{path:'SRC/MAIN.C',text:'y'}]),/already in/);
 await assert.rejects(store.add(p.id,[{path:'src/main.c/child',text:'y'}]),/Duplicate|file cannot|file.*folder/i);
 await assert.rejects(store.add(p.id,[{path:'image',text:'binary\0data'}]),/UTF-8/);
 assert.throws(()=>validateManifest({format:'ate-project',version:99,name:'x',files:[],folders:[]}),/invalid/);
});
test('project ZIP import rejects unsafe paths, missing members, binary text, and expansion bombs before writing a project',async()=>{
 const {store,disk}=fixture();const m={format:'ate-project',version:1,name:'Import',folders:[],files:['main.c']};
 for(const files of [
  {[manifestName]:strToU8(JSON.stringify(m)),'../escape':strToU8('x'),'main.c':strToU8('x')},
  {[manifestName]:strToU8(JSON.stringify(m))},
  {[manifestName]:strToU8(JSON.stringify(m)),'main.c':new Uint8Array([255,254])},
  {[manifestName]:strToU8(JSON.stringify(m)),'main.c':new Uint8Array(10*1024*1024+1)}
 ])await assert.rejects(store.import(zipSync(files)));
 assert.equal(disk.size,0);
});

test('project edits retain the original CRLF convention while revisions use exact stored bytes',async()=>{
 const {store}=fixture(),p=await store.create('Windows source');const original='// café\r\nint main(void) { return 0; }\r\n';await store.add(p.id,[{path:'main.c',text:original}]);
 const doc=await store.read(p.id,'main.c');assert.equal(doc.projectRef.lineEnding,'\r\n');
 const edited=doc.text.replace(/\r\n/g,'\n')+'// edited\n';const result=await store.save(doc.projectRef,'main.c',edited);assert.equal((await store.read(p.id,'main.c')).text,original+'// edited\r\n');assert.equal(result.projectRef.revision,revision(original+'// edited\r\n'));
});
