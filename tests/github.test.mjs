import test from 'node:test';
import assert from 'node:assert/strict';
import {createGitHub,validPath} from '../src/github.js';

const KEY='github_pat_'+'A'.repeat(40);
const sha=c=>c.repeat(40);
function fake(routes){
 const calls=[];
 const fetchImpl=async(url,opts)=>{calls.push({url,opts,body:opts.body?JSON.parse(opts.body):null});
  const key=opts.method+' '+url.replace('https://api.github.com','');
  const hit=routes[key];if(!hit)return {ok:false,status:404,json:async()=>({message:'Not Found'})};
  const [status,data]=typeof hit==='function'?hit(calls.at(-1)):hit;return {ok:status<300,status,json:async()=>data};};
 return {calls,gh:createGitHub({fetchImpl})};
}
const b64=t=>Buffer.from(t,'utf8').toString('base64');

test('rejects text that is not a GitHub key and does not call GitHub',async()=>{const {gh,calls}=fake({});await assert.rejects(gh.connect('hello'),/does not look like a GitHub key/);assert.equal(calls.length,0);assert.equal(gh.connected,false);});
test('a refused key leaves ATE disconnected',async()=>{const {gh}=fake({'GET /user':[401,{}]});await assert.rejects(gh.connect(KEY),/did not accept the key/);assert.equal(gh.connected,false);});
test('connect sends the key only in the Authorization header',async()=>{const {gh,calls}=fake({'GET /user':[200,{login:'willy'}]});assert.equal(await gh.connect(KEY),'willy');assert.equal(calls[0].opts.headers.Authorization,'Bearer '+KEY);assert.ok(!calls[0].url.includes(KEY));});
test('disconnect forgets the key',async()=>{const {gh}=fake({'GET /user':[200,{login:'w'}]});await gh.connect(KEY);gh.disconnect();assert.equal(gh.connected,false);await assert.rejects(gh.branches('a','b'),/Connect to GitHub first/);});

test('opens UTF-8 text and links the tab to the exact file version',async()=>{
 const {gh}=fake({'GET /user':[200,{login:'w'}],[`GET /repos/o/r/git/blobs/${sha('a')}`]:[200,{sha:sha('a'),encoding:'base64',content:b64('héllo ✓\n')}]});
 await gh.connect(KEY);const r=await gh.read('o','r','main',{path:'docs/a.md',sha:sha('a'),size:10});
 assert.equal(r.text,'héllo ✓\n');assert.deepEqual(r.ref,{kind:'github',owner:'o',repo:'r',branch:'main',path:'docs/a.md',sha:sha('a')});
});
test('refuses binary and oversized files',async()=>{
 const {gh}=fake({'GET /user':[200,{login:'w'}],[`GET /repos/o/r/git/blobs/${sha('b')}`]:[200,{sha:sha('b'),encoding:'base64',content:Buffer.from([0xff,0xfe,0]).toString('base64')}]});
 await gh.connect(KEY);await assert.rejects(gh.read('o','r','main',{path:'x.png',sha:sha('b'),size:3}),/not plain text/);
 await assert.rejects(gh.read('o','r','main',{path:'big',sha:sha('b'),size:11*1024*1024}),/larger than 10 MB/);
});

test('save sends the version it was opened at and counts only a confirmed commit',async()=>{
 const {gh,calls}=fake({'GET /user':[200,{login:'w'}],'PUT /repos/o/r/contents/docs/a%20b.md':[200,{content:{path:'docs/a b.md',sha:sha('c')},commit:{sha:sha('d')}}]});
 await gh.connect(KEY);const ref={kind:'github',owner:'o',repo:'r',branch:'dev',path:'docs/a b.md',sha:sha('a')};
 const out=await gh.save(ref,'a b.md','new ✓','my note');
 const put=calls.at(-1).body;assert.equal(put.sha,sha('a'));assert.equal(put.branch,'dev');assert.equal(put.message,'my note');assert.equal(Buffer.from(put.content,'base64').toString('utf8'),'new ✓');
 assert.equal(out.projectRef.sha,sha('c'));assert.match(out.message,/Saved to GitHub.*commit dddddd/);
});
test('a file changed on GitHub since opening is not overwritten',async()=>{
 const {gh}=fake({'GET /user':[200,{login:'w'}],'PUT /repos/o/r/contents/a.md':[409,{message:'a.md does not match'}]});
 await gh.connect(KEY);await assert.rejects(gh.save({kind:'github',owner:'o',repo:'r',branch:'main',path:'a.md',sha:sha('a')},'a.md','x'),/changed on GitHub since you opened it. Nothing was saved/);
});
test('a reply without a commit is not treated as saved',async()=>{
 const {gh}=fake({'GET /user':[200,{login:'w'}],'PUT /repos/o/r/contents/a.md':[200,{content:{path:'a.md',sha:sha('c')}}]});
 await gh.connect(KEY);await assert.rejects(gh.save({kind:'github',owner:'o',repo:'r',branch:'main',path:'a.md',sha:sha('a')},'a.md','x'),/did not confirm the save/);
});
test('renaming creates a new file without the old version and keeps the original',async()=>{
 const {gh,calls}=fake({'GET /user':[200,{login:'w'}],'PUT /repos/o/r/contents/src/b.js':[201,{content:{path:'src/b.js',sha:sha('c')},commit:{sha:sha('d')}}]});
 await gh.connect(KEY);const out=await gh.save({kind:'github',owner:'o',repo:'r',branch:'main',path:'src/a.js',sha:sha('a')},'b.js','x');
 assert.equal(calls.at(-1).body.sha,undefined);assert.equal(out.projectRef.path,'src/b.js');assert.match(out.message,/original file is kept/);
});
test('creating over an existing file is refused, not overwritten',async()=>{
 const {gh}=fake({'GET /user':[200,{login:'w'}],'PUT /repos/o/r/contents/n.md':[422,{message:'Invalid request.\n\n"sha" wasn\'t supplied.'}]});
 await gh.connect(KEY);await assert.rejects(gh.save({kind:'github',owner:'o',repo:'r',branch:'main',path:'n.md',sha:null},'n.md','x'),/already exists on GitHub. Nothing was saved/);
});
test('network failure reports that nothing was saved path is unreachable',async()=>{
 const gh=createGitHub({fetchImpl:async(url,o)=>{if(o.method==='GET')return {ok:true,status:200,json:async()=>({login:'w'})};throw new TypeError('offline')}});
 await gh.connect(KEY);await assert.rejects(gh.save({kind:'github',owner:'o',repo:'r',branch:'main',path:'a',sha:sha('a')},'a','x'),/Could not reach GitHub/);
});
test('lists text-bearing files from the branch tree',async()=>{
 const {gh}=fake({'GET /user':[200,{login:'w'}],'GET /repos/o/r/git/trees/feature%2Fx?recursive=1':[200,{truncated:false,tree:[{type:'tree',path:'src'},{type:'blob',path:'src/a.js',sha:sha('a'),size:5}]}]});
 await gh.connect(KEY);assert.deepEqual(await gh.files('o','r','feature/x'),{truncated:false,files:[{path:'src/a.js',sha:sha('a'),size:5}]});
});
test('path rules',()=>{for(const p of ['a','a/b.c','.github/workflows/x.yml'])assert.ok(validPath(p),p);for(const p of ['','/a','a/','a//b','../a','a/./b','a\\b'])assert.ok(!validPath(p),p);});
