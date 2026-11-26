// A small pretend GitHub (and sign-in relay) for tests: enough of the real API's
// behaviour (commits, trees, branches, merges, pull requests, issues, Actions) to
// prove ATE's GitHub screens without touching the real service.
import {createHash} from 'node:crypto';
import {lineDiff} from '../src/line-diff.js';

const sha1=s=>createHash('sha1').update(s).digest('hex');
const API='https://api.github.com',RELAY='https://relay.test';

export function createFakeGitHub({login='tester'}={}){
 let counter=0;
 const trees=new Map(),commits=new Map(),blobs=new Map();
 const blob=text=>{const s=sha1('blob'+text);blobs.set(s,text);return s};
 const saveTree=files=>{const id=sha1('tree'+JSON.stringify([...files].sort()));trees.set(id,new Map(files));return id};
 const makeCommit=(message,treeId,parents)=>{const s=sha1('commit'+message+treeId+parents.join()+(counter++));commits.set(s,{sha:s,message,tree:treeId,parents,date:new Date(Date.UTC(2026,10,1,12,0,counter)).toISOString()});return s};
 const repos=new Map();
 const state={login,repos,relayFails:false,approveAfter:1,polls:0,denied:false,tokenValid:true,calls:[],failNextRef:false,
  addRepo(name,files,{private:priv=false}={}){const t=saveTree(Object.entries(files).map(([p,text])=>[p,{sha:blob(text),mode:'100644'}]));const c=makeCommit('Initial',t,[]);
   repos.set(name,{name,owner:login,private:priv,default:'main',branches:new Map([['main',c]]),pulls:[],issues:[],comments:new Map(),runs:[],workflows:[],nextNumber:1,description:'',homepage:'',topics:[],hasIssues:true,hasWiki:false,hasProjects:false,actions:true});return repos.get(name)},
  head(repo,branch){return repos.get(repo).branches.get(branch)},
  filesAt(repo,branch){const t=trees.get(commits.get(state.head(repo,branch)).tree);return Object.fromEntries([...t].map(([p,f])=>[p,blobs.get(f.sha)]))},
  // A change made "elsewhere" (e.g. from another computer) on a branch.
  pushElsewhere(repo,branch,files,message='Changed elsewhere'){const r=repos.get(repo),old=commits.get(r.branches.get(branch));const m=new Map(trees.get(old.tree));for(const [p,t] of Object.entries(files)){if(t===null)m.delete(p);else m.set(p,{sha:blob(t),mode:'100644'})}r.branches.set(branch,makeCommit(message,saveTree([...m]),[old.sha]))},
 };
 const isAncestor=(a,b)=>{const seen=new Set(),q=[b];while(q.length){const x=q.shift();if(x===a)return true;if(seen.has(x))continue;seen.add(x);q.push(...commits.get(x).parents)}return false};
 const ancestors=c=>{const s=new Set(),q=[c];while(q.length){const x=q.shift();if(s.has(x))continue;s.add(x);q.push(...commits.get(x).parents)}return s};
 const mergeBase=(a,b)=>{const A=ancestors(a),q=[b],seen=new Set();while(q.length){const x=q.shift();if(A.has(x))return x;if(seen.has(x))continue;seen.add(x);q.push(...commits.get(x).parents)}return null};
 const patch=(a,b)=>(lineDiff(a??'',b??'')||[]).map(d=>(d.type==='add'?'+':d.type==='del'?'-':' ')+d.text).join('\n');
 const changed=(c)=>{const cur=trees.get(commits.get(c).tree),prev=commits.get(c).parents[0]?trees.get(commits.get(commits.get(c).parents[0]).tree):new Map();const out=[];
  for(const [p,f] of cur){const o=prev.get(p);if(!o)out.push({filename:p,status:'added',patch:patch('',blobs.get(f.sha))});else if(o.sha!==f.sha)out.push({filename:p,status:'modified',patch:patch(blobs.get(o.sha),blobs.get(f.sha))})}
  for(const [p,o] of prev)if(!cur.has(p))out.push({filename:p,status:'removed',patch:patch(blobs.get(o.sha),'')});return out};
 const repoJson=r=>({name:r.name,full_name:r.owner+'/'+r.name,owner:{login:r.owner},default_branch:r.default,private:r.private,permissions:{push:true,admin:true},html_url:'https://github.com/'+r.owner+'/'+r.name,description:r.description,homepage:r.homepage,has_issues:r.hasIssues,has_wiki:r.hasWiki,has_projects:r.hasProjects});
 const resolve=(r,x)=>r.branches.get(x)||(commits.has(x)?x:null);

 async function handle(method,url,body){
  const u=new URL(url);state.calls.push(method+' '+u.pathname);
  const json=(status,data)=>({status,data});
  if(u.origin===RELAY){
   if(state.relayFails)return json(502,{error:'github_unavailable'});
   if(u.pathname==='/device/code'){state.polls=0;return json(200,{device_code:'dev-'+counter,user_code:'WDJB-MJHT',verification_uri:'https://github.com/login/device',expires_in:900,interval:5})}
   if(u.pathname==='/access_token'){if(state.denied)return json(200,{error:'access_denied'});state.polls++;return json(200,state.polls>=state.approveAfter?{access_token:'ghu_fake',token_type:'bearer',expires_in:28800}:{error:'authorization_pending'})}
  }
  const p=u.pathname,q=u.searchParams;let m;
  if(!state.tokenValid)return json(401,{message:'Bad credentials'});
  if(p==='/user')return json(200,{login:state.login});
  if(p==='/user/installations')return json(200,{installations:[{id:1}]});
  if(p==='/user/installations/1/repositories')return json(200,{repositories:Number(q.get('page')||1)>1?[]:[...repos.values()].map(repoJson)});
  if(p==='/user/repos'&&method==='POST'){if(repos.has(body.name))return json(422,{message:'Repository creation failed.',errors:[{message:'name already exists on this account'}]});const r=state.addRepo(body.name,{'README.md':'# '+body.name+'\n'},{private:body.private});Object.assign(r,{description:body.description||'',homepage:body.homepage||'',hasIssues:body.has_issues!==false,hasWiki:!!body.has_wiki,hasProjects:!!body.has_projects});return json(201,repoJson(r))}
  if(!(m=p.match(/^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/)))return json(404,{message:'Not Found'});
  const r=repos.get(decodeURIComponent(m[2]));if(!r||decodeURIComponent(m[1])!==r.owner)return json(404,{message:'Not Found'});
  const rest=m[3]||'';
  if(rest===''&&method==='GET')return json(200,repoJson(r));
  if(rest===''&&method==='DELETE'){repos.delete(r.name);return {status:204}}
  if(rest===''&&method==='PATCH'){if(body.default_branch){if(!r.branches.has(body.default_branch))return json(422,{message:'bad branch'});r.default=body.default_branch}return json(200,repoJson(r))}
  if(rest==='/topics')return method==='PUT'?(r.topics=body.names,json(200,{names:r.topics})):json(200,{names:r.topics});
  if(rest==='/actions/permissions')return method==='PUT'?(r.actions=!!body.enabled,{status:204}):json(200,{enabled:r.actions});
  if(rest==='/git/blobs'&&method==='POST'){const t=Buffer.from(body.content,body.encoding==='base64'?'base64':'utf8').toString('utf8');return json(201,{sha:blob(t)})}
  if(rest==='/branches')return json(200,Number(q.get('page')||1)>1?[]:[...r.branches].map(([name,sha])=>({name,commit:{sha},protected:false})));
  if((m=rest.match(/^\/git\/trees\/(.+)$/))&&method==='GET'){const c=resolve(r,decodeURIComponent(m[1]));if(!c)return json(404,{message:'Not Found'});const t=trees.get(commits.get(c).tree);return json(200,{truncated:false,tree:[...t].map(([path,f])=>({path,type:'blob',sha:f.sha,mode:f.mode,size:new TextEncoder().encode(blobs.get(f.sha)).length}))})}
  if((m=rest.match(/^\/git\/blobs\/([a-f0-9]{40})$/))){const t=blobs.get(m[1]);return t===undefined?json(404,{}):json(200,{sha:m[1],encoding:'base64',content:Buffer.from(t).toString('base64')})}
  if((m=rest.match(/^\/git\/ref\/heads\/(.+)$/))){const c=r.branches.get(decodeURIComponent(m[1]));return c?json(200,{object:{sha:c}}):json(404,{})}
  if((m=rest.match(/^\/git\/commits\/([a-f0-9]{40})$/))&&method==='GET'){const c=commits.get(m[1]);return json(200,{sha:c.sha,tree:{sha:c.tree}})}
  if(rest==='/git/trees'&&method==='POST'){const base=new Map(body.base_tree?trees.get(body.base_tree):[]);for(const e of body.tree){if(e.sha===null)base.delete(e.path);else base.set(e.path,{sha:e.content!==undefined?blob(e.content):e.sha,mode:e.mode})}return json(201,{sha:saveTree([...base])})}
  if(rest==='/git/commits'&&method==='POST')return json(201,{sha:makeCommit(body.message,body.tree,body.parents)});
  if((m=rest.match(/^\/git\/refs\/heads\/(.+)$/))&&method==='PATCH'){const name=decodeURIComponent(m[1]),cur=r.branches.get(name);if(state.failNextRef){state.failNextRef=false;return json(422,{message:'Update is not a fast forward'})}if(!body.force&&!isAncestor(cur,body.sha))return json(422,{message:'Update is not a fast forward'});r.branches.set(name,body.sha);return json(200,{object:{sha:body.sha}})}
  if((m=rest.match(/^\/git\/refs\/heads\/(.+)$/))&&method==='DELETE'){const name=decodeURIComponent(m[1]);if(!r.branches.delete(name))return json(422,{message:'Reference does not exist'});return {status:204}}
  if(rest==='/git/refs'&&method==='POST'){const name=body.ref.replace('refs/heads/','');if(r.branches.has(name))return json(422,{message:'Reference already exists'});r.branches.set(name,body.sha);if(r.actions)r.pushesWithActionsOn=(r.pushesWithActionsOn||0)+1;return json(201,{ref:body.ref})}
  if(rest==='/commits'&&method==='GET'){const out=[];let c=resolve(r,q.get('sha'));const path=q.get('path');while(c){const cc=commits.get(c),t=trees.get(cc.tree),pt=cc.parents[0]?trees.get(commits.get(cc.parents[0]).tree):new Map();if(!path||t.get(path)?.sha!==pt.get(path)?.sha)out.push({sha:c,commit:{message:cc.message,author:{name:'Willy',date:cc.date}},author:{login:state.login}});c=cc.parents[0]}return json(200,out)}
  if((m=rest.match(/^\/commits\/([a-f0-9]{40})$/))){const cc=commits.get(m[1]);return json(200,{sha:cc.sha,commit:{message:cc.message,author:{name:'Willy',date:cc.date}},files:changed(cc.sha)})}
  if(rest==='/merges'&&method==='POST'){const b=r.branches.get(body.base),h=r.branches.get(body.head);if(!b||!h)return json(404,{});if(isAncestor(h,b))return {status:204};
   const base=mergeBase(b,h),T=c=>trees.get(commits.get(c).tree),O=T(base),B=T(b),H=T(h),out=new Map(B);
   for(const path of new Set([...O.keys(),...B.keys(),...H.keys()])){const o=O.get(path)?.sha,bb=B.get(path)?.sha,hh=H.get(path)?.sha;if(hh===o)continue;if(bb===o){if(hh)out.set(path,H.get(path));else out.delete(path);continue}if(bb!==hh)return json(409,{message:'Merge conflict'})}
   const c=makeCommit(body.commit_message,saveTree([...out]),[b,h]);r.branches.set(body.base,c);return json(201,{sha:c})}
  if(rest.startsWith('/pulls')||rest.startsWith('/issues')){
   const all=r.issues;
   if(rest==='/pulls'&&method==='GET')return json(200,all.filter(i=>i.pull&&(q.get('state')==='all'||i.state===(q.get('state')||'open'))).map(i=>({number:i.number,title:i.title,head:{ref:i.head,sha:r.branches.get(i.head)},base:{ref:i.base},user:{login:state.login},state:i.state,merged_at:i.merged?'x':null})));
   if(rest==='/pulls'&&method==='POST'){if(!r.branches.has(body.head)||!r.branches.has(body.base))return json(422,{message:'Validation Failed',errors:[{message:'branch not found'}]});if(isAncestor(r.branches.get(body.head),r.branches.get(body.base)))return json(422,{message:'Validation Failed',errors:[{message:'No commits between '+body.base+' and '+body.head}]});const i={number:r.nextNumber++,title:body.title,body:body.body,pull:true,head:body.head,base:body.base,state:'open'};all.push(i);r.comments.set(i.number,[]);return json(201,{number:i.number})}
   if((m=rest.match(/^\/pulls\/(\d+)$/))){const i=all.find(i=>i.number==m[1]&&i.pull);return json(200,{number:i.number,title:i.title,body:i.body,head:{ref:i.head,sha:r.branches.get(i.head)},base:{ref:i.base},user:{login:state.login},state:i.state,merged:!!i.merged,mergeable:true})}
   if((m=rest.match(/^\/pulls\/(\d+)\/files$/))){const i=all.find(i=>i.number==m[1]);const b=r.branches.get(i.base),h=r.branches.get(i.head),base=mergeBase(b,h),O=trees.get(commits.get(base).tree),H=trees.get(commits.get(h).tree),out=[];for(const path of new Set([...O.keys(),...H.keys()])){const o=O.get(path),hh=H.get(path);if(o?.sha!==hh?.sha)out.push({filename:path,status:!o?'added':!hh?'removed':'modified',patch:patch(o&&blobs.get(o.sha),hh&&blobs.get(hh.sha))})}return json(200,out)}
   if((m=rest.match(/^\/pulls\/(\d+)\/merge$/))&&method==='PUT'){const i=all.find(i=>i.number==m[1]);if(body.sha!==r.branches.get(i.head))return json(409,{message:'Head branch was modified'});const res=await handle('POST',`${API}/repos/${r.owner}/${r.name}/merges`,{base:i.base,head:i.head,commit_message:'Merge pull request #'+i.number});if(res.status===409)return json(405,{message:'Pull Request is not mergeable'});i.state='closed';i.merged=true;return json(200,{merged:true,sha:'x'})}
   if(rest==='/issues'&&method==='GET')return json(200,all.filter(i=>q.get('state')==='all'||i.state===(q.get('state')||'open')).map(i=>({number:i.number,title:i.title,user:{login:state.login},state:i.state,comments:r.comments.get(i.number).length,...(i.pull?{pull_request:{}}:{})})));
   if(rest==='/issues'&&method==='POST'){const i={number:r.nextNumber++,title:body.title,body:body.body,state:'open'};all.push(i);r.comments.set(i.number,[]);return json(201,{number:i.number})}
   if((m=rest.match(/^\/issues\/(\d+)$/))){const i=all.find(i=>i.number==m[1]);if(method==='PATCH'){i.state=body.state;}return json(200,{number:i.number,title:i.title,body:i.body,state:i.state,user:{login:state.login}})}
   if((m=rest.match(/^\/issues\/(\d+)\/comments$/))){const list=r.comments.get(Number(m[1]));if(method==='POST'){list.push({user:{login:state.login},body:body.body,created_at:'2026-11-26T12:00:00Z'});return json(201,{})}return json(200,list)}
  }
  if(rest==='/actions/runs')return json(200,{workflow_runs:r.runs});
  if(rest==='/actions/workflows')return json(200,{workflows:r.workflows});
  if((m=rest.match(/^\/actions\/workflows\/(\d+)\/dispatches$/))){const w=r.workflows.find(w=>w.id==m[1]);if(!w.dispatch)return json(422,{message:"Workflow does not have 'workflow_dispatch' trigger"});r.runs.unshift({id:900+r.runs.length,name:w.name,display_title:w.name,head_branch:body.ref,event:'workflow_dispatch',status:'queued',conclusion:null,created_at:'2026-11-26T13:00:00Z'});return {status:204}}
  if((m=rest.match(/^\/actions\/runs\/(\d+)\/jobs$/))){const run=r.runs.find(x=>x.id==m[1]);return json(200,{jobs:run.jobs||[]})}
  if((m=rest.match(/^\/check-runs\/(\d+)\/annotations$/))){const job=r.runs.flatMap(x=>x.jobs||[]).find(j=>j.id==m[1]);return json(200,job?.annotations||[])}
  if((m=rest.match(/^\/actions\/jobs\/(\d+)\/logs$/))){const job=r.runs.flatMap(x=>x.jobs||[]).find(j=>j.id==m[1]);return {status:200,text:job?.log||''}}
  return json(404,{message:'Not Found'});
 }
 // fetch-compatible function, for unit tests.
 async function fetchImpl(url,opts={}){
  const res=await handle(opts.method||'GET',url,opts.body?JSON.parse(opts.body):null);
  const text=res.text!==undefined?res.text:res.data===undefined?'':JSON.stringify(res.data);
  return new Response(res.status===204?null:text,{status:res.status,headers:{'Content-Type':'application/json'}});
 }
 return {state,handle,fetchImpl,API,RELAY,commits};
}
