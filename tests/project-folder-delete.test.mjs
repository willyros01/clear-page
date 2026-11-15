import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProjectStore,manifestName} from '../src/projects.js';
function fixture(){
 const files=new Map(),dirs=new Set();let failCommit=false,failRename=false,failCleanup=false;
 const key=(id,path)=>id+'/'+path;
 const adapter={list:async()=>[],read:async(id,path)=>files.get(key(id,path))??null,write:async(id,path,text)=>{if(path===manifestName&&failCommit){failCommit=false;throw Error('settings write failed')}files.set(key(id,path),text)},mkdir:async(id,path)=>dirs.add(key(id,path)),
 folderEntries:async(id,path)=>[...dirs,...files.keys()].filter(p=>p.startsWith(key(id,path)+'/')).map(p=>({path:p.slice(id.length+1),type:dirs.has(p)?'directory':'file',size:files.get(p)?.length||0,mtime:0})),
 renameFolder:async(id,from,to)=>{if(failRename)throw Error('rename failed');const prefix=key(id,from),target=key(id,to);for(const p of [...dirs])if(p===prefix||p.startsWith(prefix+'/')){dirs.delete(p);dirs.add(target+p.slice(prefix.length))}for(const [p,v] of [...files])if(p.startsWith(prefix+'/')){files.delete(p);files.set(target+p.slice(prefix.length),v)}},
 removeFolder:async(id,path)=>{if(failCleanup)throw Error('cleanup failed');const prefix=key(id,path);for(const p of [...dirs])if(p===prefix||p.startsWith(prefix+'/'))dirs.delete(p);for(const p of [...files.keys()])if(p.startsWith(prefix+'/'))files.delete(p)}};
 return {files,dirs,store:createProjectStore(adapter),failCommit:()=>failCommit=true,failRename:()=>failRename=true,failCleanup:()=>failCleanup=true};
}
test('folder deletion reviews and removes nested, unlisted and empty contents without touching sibling paths or another project',async()=>{
 const f=fixture(),p=await f.store.create('Delete'),other=await f.store.create('Other');
 await f.store.folder(p.id,'src/empty');await f.store.add(p.id,[{path:'src/main.c',text:'code'},{path:'src-old/keep.c',text:'keep'}]);await f.store.add(other.id,[{path:'src/main.c',text:'other'}]);f.files.set(p.id+'/src/unlisted.bin','binary bytes');
 const plan=await f.store.folderDeletion(p.id,'src');assert.equal(plan.files,2);assert.equal(plan.folders,1);assert.ok(plan.entries.some(e=>e.path==='src/unlisted.bin'));assert.ok(f.files.has(p.id+'/src/main.c'),'Review alone must not delete anything');
 const updated=await f.store.deleteFolder(plan);assert.ok(!updated.folders.includes('src'));assert.ok(!updated.files.includes('src/main.c'));assert.equal(f.dirs.has(p.id+'/src'),false);assert.equal(f.files.has(p.id+'/src/unlisted.bin'),false);assert.equal(f.files.get(p.id+'/src-old/keep.c'),'keep');assert.equal(f.files.get(other.id+'/src/main.c'),'other');
 await f.store.folder(p.id,'empty');const empty=await f.store.folderDeletion(p.id,'empty');assert.equal(empty.entries.length,0);await f.store.deleteFolder(empty);assert.equal(f.dirs.has(p.id+'/empty'),false);
});
test('folder deletion rejects root, traversal, a missing confirmation and contents changed after confirmation',async()=>{
 const f=fixture(),p=await f.store.create('Stale');await f.store.folder(p.id,'src');await assert.rejects(f.store.folderDeletion(p.id,''));await assert.rejects(f.store.folderDeletion(p.id,'../src'));await assert.rejects(f.store.deleteFolder(null));
 const plan=await f.store.folderDeletion(p.id,'src');f.files.set(p.id+'/src/new.txt','new');await assert.rejects(f.store.deleteFolder(plan),/contents changed/);assert.equal(f.files.get(p.id+'/src/new.txt'),'new');assert.ok((await f.store.load(p.id)).folders.includes('src'));
});
test('folder staging or manifest failure preserves original bytes and project membership',async()=>{
 for(const failure of ['failRename','failCommit']){const f=fixture(),p=await f.store.create('Failure');await f.store.add(p.id,[{path:'src/file.txt',text:'protected'}]);await f.store.folder(p.id,'src');const plan=await f.store.folderDeletion(p.id,'src');f[failure]();await assert.rejects(f.store.deleteFolder(plan),/failed/);assert.equal(f.files.get(p.id+'/src/file.txt'),'protected');assert.ok((await f.store.load(p.id)).files.includes('src/file.txt'));}
});
test('failed cleanup retains staged recovery bytes after the committed folder removal',async()=>{
 const f=fixture(),p=await f.store.create('Cleanup');await f.store.folder(p.id,'src');await f.store.add(p.id,[{path:'src/file.txt',text:'recoverable'}]);const plan=await f.store.folderDeletion(p.id,'src');f.failCleanup();const result=await f.store.deleteFolder(plan);assert.equal(result.cleanupPending,true);assert.ok(!result.folders.includes('src'));assert.ok([...f.files].some(([p,v])=>p.includes('/.ate-delete-')&&v==='recoverable'));
});
