import test from 'node:test';
import assert from 'node:assert/strict';
import {createGitHub,validPath,validBranchName,validRepoName} from '../src/github.js';
import {createFakeGitHub} from './fake-github.mjs';
import {lineDiff,withContext,parsePatch} from '../src/line-diff.js';

async function setup({files={'README.md':'# Hello\n','src/app.js':'let a = 1;\n'},approveAfter=1}={}){
 const fake=createFakeGitHub();fake.state.addRepo('notes',files);fake.state.approveAfter=approveAfter;
 const gh=createGitHub({fetchImpl:fake.fetchImpl,config:{api:fake.API,relay:fake.RELAY,appSlug:'ate-test-app'},sleep:async()=>{}});
 const start=await gh.startSignIn();await gh.finishSignIn(start);
 return {fake,gh};
}
const O='tester',N='notes';

test('sign-in: code shown, waits while pending, then signed in',async()=>{
 const {fake,gh}=await setup({approveAfter:3});
 assert.equal(gh.signedIn,true);assert.equal(gh.login,'tester');assert.equal(fake.state.polls,3);
 assert.equal(gh.chooseReposUrl(),'https://github.com/apps/ate-test-app/installations/new');
});
test('sign-in: declined, cancelled and relay down are reported plainly',async()=>{
 const fake=createFakeGitHub();const gh=createGitHub({fetchImpl:fake.fetchImpl,config:{api:fake.API,relay:fake.RELAY},sleep:async()=>{}});
 fake.state.denied=true;await assert.rejects(gh.finishSignIn(await gh.startSignIn()),/declined/);
 fake.state.denied=false;fake.state.approveAfter=99;await assert.rejects(gh.finishSignIn(await gh.startSignIn(),()=>true),/cancelled/);
 fake.state.relayFails=true;await assert.rejects(gh.startSignIn(),/sign-in service is not answering/);
 assert.equal(gh.signedIn,false);
});
test('an ended sign-in signs out and says so',async()=>{
 const {fake,gh}=await setup();fake.state.tokenValid=false;
 await assert.rejects(gh.repos(),/sign-in has ended/);assert.equal(gh.signedIn,false);
});
test('lists repositories the app was given, branches and files',async()=>{
 const {gh}=await setup();
 assert.deepEqual((await gh.repos()).map(r=>r.full),['tester/notes']);
 assert.deepEqual((await gh.branches(O,N)).map(b=>b.name),['main']);
 assert.deepEqual((await gh.files(O,N,'main')).files.map(f=>f.path),['README.md','src/app.js']);
});
test('edit, save and read back; second save uses the new version',async()=>{
 const {fake,gh}=await setup();const f=(await gh.files(O,N,'main')).files.find(f=>f.path==='src/app.js');
 const {text,ref}=await gh.read(O,N,'main',f);assert.equal(text,'let a = 1;\n');
 const r1=await gh.commit(O,N,'main',[{path:ref.path,text:'let a = 2;\n',baseSha:ref.sha}],'Change a');
 assert.equal(fake.state.filesAt(N,'main')['src/app.js'],'let a = 2;\n');
 await gh.commit(O,N,'main',[{path:ref.path,text:'let a = 3;\n',baseSha:r1.files['src/app.js'].sha}],'Again');
 assert.equal(fake.state.filesAt(N,'main')['src/app.js'],'let a = 3;\n');
});
test('a file changed elsewhere is never overwritten',async()=>{
 const {fake,gh}=await setup();const f=(await gh.files(O,N,'main')).files.find(f=>f.path==='README.md');
 fake.state.pushElsewhere(N,'main',{'README.md':'# Other\n'});
 await assert.rejects(gh.commit(O,N,'main',[{path:'README.md',text:'# Mine\n',baseSha:f.sha}],'x'),/changed on GitHub since you opened it. Nothing was saved/);
 assert.equal(fake.state.filesAt(N,'main')['README.md'],'# Other\n');
});
test('a save racing another save is refused, nothing half-saved',async()=>{
 const {fake,gh}=await setup();const f=(await gh.files(O,N,'main')).files.find(f=>f.path==='README.md');
 fake.state.failNextRef=true;
 await assert.rejects(gh.commit(O,N,'main',[{path:'README.md',text:'x\n',baseSha:f.sha}],'x'),/at the same moment. Nothing was saved/);
 assert.equal(fake.state.filesAt(N,'main')['README.md'],'# Hello\n');
});
test('several files in one change; new file over an existing one is refused',async()=>{
 const {fake,gh}=await setup();const files=(await gh.files(O,N,'main')).files;const by=p=>files.find(f=>f.path===p).sha;
 await gh.commit(O,N,'main',[{path:'README.md',text:'# A\n',baseSha:by('README.md')},{path:'src/app.js',text:'b\n',baseSha:by('src/app.js')},{path:'docs/new.md',text:'n\n',baseSha:null}],'Three at once');
 const now=fake.state.filesAt(N,'main');assert.equal(now['README.md'],'# A\n');assert.equal(now['src/app.js'],'b\n');assert.equal(now['docs/new.md'],'n\n');
 const hist=await gh.history(O,N,'main','docs/new.md');assert.equal(hist.length,1);assert.equal(hist[0].message,'Three at once');
 await assert.rejects(gh.commit(O,N,'main',[{path:'docs/new.md',text:'x',baseSha:null}],'dup'),/already exists on GitHub/);
});
test('rename/move and delete',async()=>{
 const {fake,gh}=await setup();const f=(await gh.files(O,N,'main')).files.find(f=>f.path==='src/app.js');
 await gh.commit(O,N,'main',[{path:'lib/app.js',text:'let a = 1;\n',baseSha:null},{path:'src/app.js',remove:true,baseSha:f.sha}],'Move app.js');
 let now=fake.state.filesAt(N,'main');assert.equal(now['src/app.js'],undefined);assert.equal(now['lib/app.js'],'let a = 1;\n');
 const g=(await gh.files(O,N,'main')).files.find(f=>f.path==='lib/app.js');
 await gh.commit(O,N,'main',[{path:'lib/app.js',remove:true,baseSha:g.sha}],'Delete app.js');
 now=fake.state.filesAt(N,'main');assert.equal(now['lib/app.js'],undefined);
});
test('history, what changed, and an older version',async()=>{
 const {gh}=await setup();const f=()=>gh.files(O,N,'main').then(r=>r.files.find(f=>f.path==='README.md'));
 await gh.commit(O,N,'main',[{path:'README.md',text:'# Two\n',baseSha:(await f()).sha}],'Second');
 await gh.commit(O,N,'main',[{path:'README.md',text:'# Three\n',baseSha:(await f()).sha}],'Third');
 const h=await gh.history(O,N,'main','README.md');assert.deepEqual(h.map(x=>x.message),['Third','Second','Initial']);
 const d=await gh.commitDetail(O,N,h[0].sha);assert.deepEqual(parsePatch(d.files[0].patch).map(x=>x.type),['del','add']);
 assert.equal(await gh.fileAt(O,N,h[1].sha,'README.md'),'# Two\n');
});
test('search across all files of any branch',async()=>{
 const {gh}=await setup({files:{'a.txt':'hello\nworld\n','b/c.js':'say("Hello")\n','d.txt':'nothing\n'}});
 const {results}=await gh.search(O,N,'main','hello');assert.deepEqual(results.map(r=>r.file.path+':'+r.line),['a.txt:1','b/c.js:1']);
 await assert.rejects(gh.search(O,N,'main','h'),/at least 2/);
});
test('branches: create, merge, conflict, delete',async()=>{
 const {fake,gh}=await setup();const main=(await gh.branches(O,N))[0];
 await gh.createBranch(O,N,'feature/x',main.sha);assert.ok(fake.state.head(N,'feature/x'));
 await assert.rejects(gh.createBranch(O,N,'bad name',main.sha),/branch name/);
 assert.deepEqual(await gh.merge(O,N,'main','feature/x'),{result:'nothing'});
 fake.state.pushElsewhere(N,'feature/x',{'new.txt':'n\n'});
 assert.equal((await gh.merge(O,N,'main','feature/x')).result,'merged');assert.equal(fake.state.filesAt(N,'main')['new.txt'],'n\n');
 fake.state.pushElsewhere(N,'feature/x',{'README.md':'# F\n'});fake.state.pushElsewhere(N,'main',{'README.md':'# M\n'});
 assert.equal((await gh.merge(O,N,'main','feature/x')).result,'conflict');assert.equal(fake.state.filesAt(N,'main')['README.md'],'# M\n');
 await gh.deleteBranch(O,N,'feature/x');assert.equal(fake.state.head(N,'feature/x'),undefined);
});
test('pull requests: open, view changes, comment, merge',async()=>{
 const {fake,gh}=await setup();const main=(await gh.branches(O,N))[0];await gh.createBranch(O,N,'fix',main.sha);
 await assert.rejects(gh.createPull(O,N,{title:'Same',head:'fix',base:'main'}),/No commits between/);
 fake.state.pushElsewhere(N,'fix',{'README.md':'# Fixed\n'});
 const n=await gh.createPull(O,N,{title:'Fix readme',head:'fix',base:'main',body:'Please'});
 assert.deepEqual((await gh.pulls(O,N)).map(p=>p.title),['Fix readme']);
 let p=await gh.pull(O,N,n);assert.equal(p.files[0].path,'README.md');await gh.comment(O,N,n,'Looks good');
 p=await gh.pull(O,N,n);assert.equal(p.comments[0].body,'Looks good');
 fake.state.pushElsewhere(N,'fix',{'x.txt':'x\n'});await assert.rejects(gh.mergePull(O,N,n,p.headSha),/changed while you were looking/);
 p=await gh.pull(O,N,n);await gh.mergePull(O,N,n,p.headSha);assert.equal(fake.state.filesAt(N,'main')['README.md'],'# Fixed\n');
 assert.deepEqual(await gh.pulls(O,N),[]);
});
test('issues: create, comment, close, reopen',async()=>{
 const {gh}=await setup();const n=await gh.createIssue(O,N,{title:'To do',body:'Buy balls'});
 await gh.comment(O,N,n,'Done soon');let i=await gh.issue(O,N,n);assert.equal(i.comments.length,1);
 await gh.setIssueState(O,N,n,'closed');assert.deepEqual(await gh.issues(O,N),[]);
 await gh.setIssueState(O,N,n,'open');assert.equal((await gh.issues(O,N)).length,1);
 await assert.rejects(gh.createIssue(O,N,{title:' '}),/title/);
});
test('Actions: runs, start by hand, refused start, why it failed',async()=>{
 const {fake,gh}=await setup();const r=fake.state.repos.get(N);
 r.workflows=[{id:1,name:'Build',path:'.github/workflows/b.yml',state:'active',dispatch:true},{id:2,name:'Nightly',path:'.github/workflows/n.yml',state:'active',dispatch:false}];
 r.runs=[{id:5,name:'Build',display_title:'Build',head_branch:'main',event:'push',status:'completed',conclusion:'failure',created_at:'2026-11-26T10:00:00Z',jobs:[{id:77,name:'web',status:'completed',conclusion:'failure',steps:[{name:'npm test',conclusion:'failure'}],annotations:[{annotation_level:'failure',message:'Process completed with exit code 1.'}],log:'2026-11-26T10:00:00.0Z ok\n2026-11-26T10:00:01.0Z ##[error]AssertionError: expected 2'}]}];
 assert.equal((await gh.runs(O,N))[0].conclusion,'failure');
 const d=await gh.runDetail(O,N,5);assert.deepEqual(d[0].failedSteps,['npm test']);assert.ok(d[0].lines.some(l=>/AssertionError/.test(l)));assert.ok(d[0].lines.some(l=>/exit code 1/.test(l)));
 await gh.startWorkflow(O,N,1,'main');assert.equal((await gh.runs(O,N))[0].event,'workflow_dispatch');
 await assert.rejects(gh.startWorkflow(O,N,2,'main'),/cannot be started by hand/);
});
test('new repository',async()=>{
 const {gh}=await setup();const r=await gh.createRepo({name:'brand-new',isPrivate:true});assert.equal(r.full,'tester/brand-new');
 await assert.rejects(gh.createRepo({name:'brand-new'}),/already exists/);await assert.rejects(gh.createRepo({name:'bad name'}),/letters, numbers/);
});
test('name rules',()=>{
 for(const p of ['a','a/b.c','.github/workflows/x.yml'])assert.ok(validPath(p),p);for(const p of ['','/a','a/','a//b','../a','a/./b','a\\b','.git/x'])assert.ok(!validPath(p),p);
 for(const b of ['main','feature/x','fix-1.2'])assert.ok(validBranchName(b),b);for(const b of ['a b','-x','x/','a..b','x.lock','/x'])assert.ok(!validBranchName(b),b);
 assert.ok(validRepoName('my-repo_1.x'));assert.ok(!validRepoName('a b'));
});
test('line comparison',()=>{
 const d=lineDiff('a\nb\nc\n','a\nx\nc\n');assert.deepEqual(d.map(x=>x.type),['same','del','add','same']);
 assert.deepEqual(withContext(lineDiff('1\n2\n3\n4\n5\n6\n7\n8\n9\n','1\n2\n3\n4\n5\n6\n7\n8\nX\n'),1).map(x=>x.type),['gap','same','del','add']);
});
