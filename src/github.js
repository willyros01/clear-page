// GitHub access for ATE (web test build).
// Sign-in uses GitHub's device code: ATE shows a short code, the person types it on github.com.
// The sign-in is kept only in this page's memory: never written to browser storage.
// Every change counts only after GitHub confirms it; otherwise nothing changes locally.
export const GITHUB_CONFIG={
 api:'https://api.github.com',
 relay:'https://ate-github-login.willyros01.workers.dev', // forwards the two sign-in calls that browsers cannot make to github.com
 appSlug:'ate-another-text-editor', // the registered GitHub App; used for the "Choose repositories" link
};
const MAX_BYTES=10*1024*1024;

export class GitHubError extends Error{constructor(message,status=0,code=''){super(message);this.status=status;this.code=code;}}

const enc=s=>String(s).split('/').map(encodeURIComponent).join('/');
const SHA=/^[a-f0-9]{40}$/;
export function validPath(path){return typeof path==='string'&&path.length>0&&path.length<=4096&&!path.startsWith('/')&&!path.endsWith('/')&&path.split('/').every(p=>p&&p!=='.'&&p!=='..'&&p!=='.git'&&!/[\u0000-\u001f\\]/.test(p));}
export function validBranchName(name){return typeof name==='string'&&/^[A-Za-z0-9._\/-]{1,200}$/.test(name)&&!/(^[\/.-]|[\/.]$|\.\.|\/\/|@\{|\.lock$|\/\.)/.test(name);}
export function validRepoName(name){return typeof name==='string'&&/^[A-Za-z0-9._-]{1,100}$/.test(name)&&name!=='.'&&name!=='..';}

export function toBase64(text){const bytes=new TextEncoder().encode(text);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin);}
export function decodeText(b64){const bin=atob(String(b64||'').replace(/\s/g,''));const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);if(bytes.length>MAX_BYTES)throw new GitHubError('This file is larger than 10 MB, so ATE does not open it.');let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes)}catch{throw new GitHubError('This file is not plain text, so ATE does not open it.')}if(text.includes('\u0000'))throw new GitHubError('This file is not plain text, so ATE does not open it.');return text;}

export function createGitHub({fetchImpl=(...a)=>fetch(...a),config=GITHUB_CONFIG,timeoutMs=30000,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 let token='',login='';
 const blobCache=new Map(); // blob sha → text (a blob's content never changes)

 async function raw(url,opts={},{auth=true}={}){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetchImpl(url,{cache:'no-store',...opts,signal:controller.signal,headers:{Accept:'application/vnd.github+json',...(auth&&token?{Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'}:{}),...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});}
  catch{throw new GitHubError('Could not reach GitHub. Check the internet connection.');}
  finally{clearTimeout(timer);}
 }
 async function call(method,path,body,{allow=[]}={}){
  if(!token)throw new GitHubError('Sign in to GitHub first: Menu → GitHub.',0,'signed-out');
  const response=await raw(config.api+path,{method,body:body?JSON.stringify(body):undefined});
  let data=null;if(response.status!==204)try{data=await response.json()}catch{}
  if(response.ok||allow.includes(response.status))return {status:response.status,data};
  const s=response.status,msg=data?.message||'';
  if(s===401){token='';login='';throw new GitHubError('Your GitHub sign-in has ended. Sign in again: Menu → GitHub. Nothing else was changed.',s,'signed-out');}
  if(s===403||s===429)throw new GitHubError(/rate limit/i.test(msg)?'GitHub is limiting requests for now. Try again in a few minutes. Nothing was changed.':'GitHub did not allow that. ATE may not have been given this repository or this permission: use "Choose repositories". Nothing was changed.',s);
  if(s===404)throw new GitHubError('Not found on GitHub, or ATE has not been given access to it. Nothing was changed.',s);
  if(s===409)throw new GitHubError('GitHub reports a conflict: something changed on GitHub at the same time. Nothing was changed. Refresh and try again.',s,'conflict');
  if(s===422)throw new GitHubError('GitHub refused the change: '+(data?.errors?.[0]?.message||msg||'invalid request')+'. Nothing was changed.',s);
  throw new GitHubError('GitHub returned an error ('+s+'). Nothing was changed.',s);
 }
 const get=(p,o)=>call('GET',p,null,o).then(r=>r.data);
 const R=(owner,repo)=>`/repos/${enc(owner)}/${enc(repo)}`;

 // ---- Sign-in (device code) ----
 async function relay(path,body){
  const response=await raw(config.relay+path,{method:'POST',body:JSON.stringify(body)},{auth:false});
  let data=null;try{data=await response.json()}catch{}
  if(!response.ok)throw new GitHubError('The GitHub sign-in service is not answering. Try again in a minute.',response.status);
  return data||{};
 }
 const api={
  get signedIn(){return !!token},
  get login(){return login},
  chooseReposUrl(){return 'https://github.com/apps/'+encodeURIComponent(config.appSlug)+'/installations/new'},
  async startSignIn(){
   const d=await relay('/device/code',{});
   if(!d.device_code||!/^[A-Z0-9-]{6,12}$/.test(d.user_code||'')||!/^https:\/\/github\.com\//.test(d.verification_uri||''))throw new GitHubError('GitHub sent an unexpected sign-in reply. Try again.');
   return {deviceCode:d.device_code,userCode:d.user_code,url:d.verification_uri,interval:Math.max(5,Number(d.interval)||5),expiresAt:Date.now()+Math.min(900,Number(d.expires_in)||900)*1000};
  },
  // Waits until the person has entered the code (or gives up). isCancelled() stops it.
  async finishSignIn(start,isCancelled=()=>false){
   let interval=start.interval;
   while(Date.now()<start.expiresAt){
    await sleep(interval*1000);
    if(isCancelled())throw new GitHubError('Sign-in cancelled.',0,'cancelled');
    const r=await relay('/access_token',{device_code:start.deviceCode});
    if(r.access_token){
     const previous=token;token=r.access_token;
     try{const u=await get('/user');login=u.login;return login}catch(e){token=previous;throw e}
    }
    if(r.error==='authorization_pending')continue;
    if(r.error==='slow_down'){interval=Math.max(interval+5,Number(r.interval)||0);continue}
    if(r.error==='access_denied')throw new GitHubError('Sign-in was declined on GitHub.',0,'denied');
    if(r.error==='expired_token')break;
    throw new GitHubError('GitHub did not complete the sign-in ('+(r.error||'unknown')+'). Try again.');
   }
   throw new GitHubError('The sign-in code ran out of time. Tap Sign in with GitHub to get a new code.',0,'expired');
  },
  signOut(){token='';login='';blobCache.clear();},

  // ---- Repositories and branches ----
  async repos(){
   const inst=await get('/user/installations?per_page=100');const all=new Map();
   for(const i of inst.installations||[])for(let page=1;page<=10;page++){
    const r=await get(`/user/installations/${i.id}/repositories?per_page=100&page=${page}`);
    for(const x of r.repositories||[])all.set(x.full_name,{owner:x.owner.login,name:x.name,full:x.full_name,branch:x.default_branch,canPush:x.permissions?.push!==false,private:!!x.private});
    if((r.repositories||[]).length<100)break;
   }
   return [...all.values()].sort((a,b)=>a.full.localeCompare(b.full));
  },
  async branches(owner,repo){const out=[];for(let page=1;page<=10;page++){const list=await get(`${R(owner,repo)}/branches?per_page=100&page=${page}`);out.push(...list.map(b=>({name:b.name,sha:b.commit.sha,protected:!!b.protected})));if(list.length<100)break}return out;},
  async createRepo({name,description='',isPrivate=true}){
   if(!validRepoName(name))throw new GitHubError('Use letters, numbers, dots, dashes or underscores for the name.');
   const {data}=await call('POST','/user/repos',{name,description,private:!!isPrivate,auto_init:true});
   if(!data?.full_name)throw new GitHubError('GitHub did not confirm the new repository.');
   return {owner:data.owner.login,name:data.name,full:data.full_name,branch:data.default_branch,url:data.html_url};
  },

  // ---- Files ----
  async files(owner,repo,branch){
   const tree=await get(`${R(owner,repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
   return {truncated:!!tree.truncated,files:tree.tree.filter(e=>e.type==='blob').map(e=>({path:e.path,sha:e.sha,size:e.size,mode:e.mode}))};
  },
  async blobText(owner,repo,sha,size=0){
   if(size>MAX_BYTES)throw new GitHubError('This file is larger than 10 MB, so ATE does not open it.');
   if(blobCache.has(sha))return blobCache.get(sha);
   const blob=await get(`${R(owner,repo)}/git/blobs/${encodeURIComponent(sha)}`);
   if(blob.encoding!=='base64'||blob.sha!==sha)throw new GitHubError('GitHub sent an unexpected reply. The file was not opened.');
   const text=decodeText(blob.content);blobCache.set(sha,text);return text;
  },
  async read(owner,repo,branch,file){
   const text=await api.blobText(owner,repo,file.sha,file.size);
   return {text,ref:{kind:'github',owner,repo,branch,path:file.path,sha:file.sha,mode:file.mode||'100644'}};
  },
  // One commit with any number of changes. Each change: {path, text} to write, {path, remove:true} to delete,
  // plus baseSha = the version the person started from (null for a new file). If any file changed on GitHub
  // since then, nothing is written.
  async commit(owner,repo,branch,changes,message){
   if(!changes.length)throw new GitHubError('There is nothing to save.');
   message=String(message||'').trim();if(!message)throw new GitHubError('Type a short note describing the change.');
   for(const c of changes){if(!validPath(c.path))throw new GitHubError('This file path cannot be used on GitHub: '+c.path);if(!c.remove&&new TextEncoder().encode(c.text).length>MAX_BYTES)throw new GitHubError(c.path+' is larger than 10 MB. Nothing was saved.')}
   const ref=await get(`${R(owner,repo)}/git/ref/heads/${enc(branch)}`);
   const head=ref.object.sha;const commit=await get(`${R(owner,repo)}/git/commits/${head}`);
   const current=await api.files(owner,repo,head);
   if(current.truncated)throw new GitHubError('This repository is too large for ATE to check safely. Nothing was saved.');
   const now=new Map(current.files.map(f=>[f.path,f]));
   for(const c of changes){
    const f=now.get(c.path);
    if(c.baseSha===null&&f)throw new GitHubError(c.path+' already exists on GitHub. Nothing was saved. Open that file instead, or choose another name.',0,'exists');
    if(c.baseSha&&(!f||f.sha!==c.baseSha))throw new GitHubError(c.path+(f?' changed':' was moved or deleted')+' on GitHub since you opened it. Nothing was saved. Open it again from GitHub to get the latest version.',0,'conflict');
    if(c.remove&&!f)throw new GitHubError(c.path+' is no longer on GitHub. Nothing was saved.',0,'conflict');
   }
   const tree=changes.map(c=>c.remove?{path:c.path,mode:now.get(c.path).mode,type:'blob',sha:null}:{path:c.path,mode:c.mode||now.get(c.path)?.mode||'100644',type:'blob',content:c.text});
   const {data:newTree}=await call('POST',`${R(owner,repo)}/git/trees`,{base_tree:commit.tree.sha,tree});
   const {data:newCommit}=await call('POST',`${R(owner,repo)}/git/commits`,{message,tree:newTree.sha,parents:[head]});
   if(!SHA.test(newCommit?.sha||''))throw new GitHubError('GitHub did not confirm the save. Nothing was changed.');
   try{await call('PATCH',`${R(owner,repo)}/git/refs/heads/${enc(branch)}`,{sha:newCommit.sha,force:false})}
   catch(e){if(e.status===422||e.status===409)throw new GitHubError('Someone else saved to '+branch+' at the same moment. Nothing was saved. Try again.',e.status,'conflict');throw e}
   // Read back the new versions so each tab knows exactly what is on GitHub now.
   const after=new Map((await api.files(owner,repo,newCommit.sha)).files.map(f=>[f.path,f]));
   for(const c of changes){const f=after.get(c.path);if(c.remove?f:!f)throw new GitHubError('GitHub did not confirm '+c.path+'. Check the repository before saving again.');if(!c.remove)blobCache.set(f.sha,c.text)}
   return {commit:newCommit.sha,files:Object.fromEntries(changes.filter(c=>!c.remove).map(c=>[c.path,after.get(c.path)]))};
  },
  async history(owner,repo,branch,path){
   const list=await get(`${R(owner,repo)}/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}&per_page=30`);
   return list.map(c=>({sha:c.sha,message:c.commit.message,author:c.commit.author?.name||c.author?.login||'',date:c.commit.author?.date||''}));
  },
  async commitDetail(owner,repo,sha){
   const c=await get(`${R(owner,repo)}/commits/${encodeURIComponent(sha)}`);
   return {sha:c.sha,message:c.commit.message,author:c.commit.author?.name||'',date:c.commit.author?.date||'',files:(c.files||[]).map(f=>({path:f.filename,status:f.status,previous:f.previous_filename||'',patch:f.patch||''}))};
  },
  async fileAt(owner,repo,commitSha,path){
   const t=await api.files(owner,repo,commitSha);const f=t.files.find(f=>f.path===path);
   if(!f)throw new GitHubError('That file did not exist in this version.');
   return api.blobText(owner,repo,f.sha,f.size);
  },
  // Search the text of every file on the branch (any branch, not just the main one).
  async search(owner,repo,branch,term,{onProgress=()=>{},maxFiles=400,maxBytes=8*1024*1024}={}){
   term=String(term||'');if(term.length<2)throw new GitHubError('Type at least 2 characters to search for.');
   const list=(await api.files(owner,repo,branch)).files.filter(f=>f.size<=1024*1024);
   const lower=term.toLowerCase(),results=[];let bytes=0,done=0,skipped=0;
   const queue=list.slice(0,maxFiles);skipped=list.length-queue.length;
   async function worker(){while(queue.length){const f=queue.shift();if(bytes+f.size>maxBytes){skipped++;continue}bytes+=f.size;let text;try{text=await api.blobText(owner,repo,f.sha,f.size)}catch(e){if(e.status)throw e;continue}finally{onProgress(++done)}
    const lines=text.split('\n');lines.forEach((l,i)=>{if(l.toLowerCase().includes(lower)&&results.length<500)results.push({file:f,line:i+1,text:l.trim().slice(0,200)})});}}
   await Promise.all(Array.from({length:6},worker));
   results.sort((a,b)=>a.file.path.localeCompare(b.file.path)||a.line-b.line);
   return {results,skipped};
  },

  // ---- Branches ----
  async createBranch(owner,repo,name,fromSha){
   if(!validBranchName(name))throw new GitHubError('Use a branch name with letters, numbers, dashes or slashes, no spaces.');
   await call('POST',`${R(owner,repo)}/git/refs`,{ref:'refs/heads/'+name,sha:fromSha});
  },
  async deleteBranch(owner,repo,name){await call('DELETE',`${R(owner,repo)}/git/refs/heads/${enc(name)}`)},
  async merge(owner,repo,base,head,message){
   const r=await call('POST',`${R(owner,repo)}/merges`,{base,head,commit_message:message||`Merge ${head} into ${base}`},{allow:[409]});
   if(r.status===204)return {result:'nothing'};
   if(r.status===409)return {result:'conflict'};
   return {result:'merged',sha:r.data.sha};
  },

  // ---- Pull requests ----
  async pulls(owner,repo,state='open'){return (await get(`${R(owner,repo)}/pulls?state=${state}&per_page=50`)).map(p=>({number:p.number,title:p.title,head:p.head.ref,base:p.base.ref,author:p.user?.login||'',state:p.merged_at?'merged':p.state}));},
  async createPull(owner,repo,{title,head,base,body}){
   if(!String(title||'').trim())throw new GitHubError('Type a title for the pull request.');
   const {data}=await call('POST',`${R(owner,repo)}/pulls`,{title:title.trim(),head,base,body:body||''});return data.number;
  },
  async pull(owner,repo,number){
   const [p,files,comments]=await Promise.all([get(`${R(owner,repo)}/pulls/${number}`),get(`${R(owner,repo)}/pulls/${number}/files?per_page=100`),get(`${R(owner,repo)}/issues/${number}/comments?per_page=100`)]);
   return {number:p.number,title:p.title,body:p.body||'',head:p.head.ref,base:p.base.ref,headSha:p.head.sha,author:p.user?.login||'',state:p.merged?'merged':p.state,mergeable:p.mergeable,files:files.map(f=>({path:f.filename,status:f.status,patch:f.patch||''})),comments:comments.map(c=>({author:c.user?.login||'',body:c.body||'',date:c.created_at}))};
  },
  async mergePull(owner,repo,number,headSha){
   const r=await call('PUT',`${R(owner,repo)}/pulls/${number}/merge`,{sha:headSha,merge_method:'merge'},{allow:[405,409]});
   if(r.status===405)throw new GitHubError('GitHub cannot merge this pull request yet: '+(r.data?.message||'it is not ready')+'. Nothing was changed.',405);
   if(r.status===409)throw new GitHubError('The pull request changed while you were looking at it. Nothing was changed. Open it again.',409,'conflict');
   if(!r.data?.merged)throw new GitHubError('GitHub did not confirm the merge.');
  },

  // ---- Issues (also used for pull request comments) ----
  async issues(owner,repo,state='open'){return (await get(`${R(owner,repo)}/issues?state=${state}&per_page=50`)).filter(i=>!i.pull_request).map(i=>({number:i.number,title:i.title,author:i.user?.login||'',state:i.state,comments:i.comments}));},
  async issue(owner,repo,number){
   const [i,comments]=await Promise.all([get(`${R(owner,repo)}/issues/${number}`),get(`${R(owner,repo)}/issues/${number}/comments?per_page=100`)]);
   return {number:i.number,title:i.title,body:i.body||'',state:i.state,author:i.user?.login||'',comments:comments.map(c=>({author:c.user?.login||'',body:c.body||'',date:c.created_at}))};
  },
  async createIssue(owner,repo,{title,body}){if(!String(title||'').trim())throw new GitHubError('Type a title for the issue.');const {data}=await call('POST',`${R(owner,repo)}/issues`,{title:title.trim(),body:body||''});return data.number;},
  async comment(owner,repo,number,body){if(!String(body||'').trim())throw new GitHubError('Type a comment first.');await call('POST',`${R(owner,repo)}/issues/${number}/comments`,{body});},
  async setIssueState(owner,repo,number,state){const {data}=await call('PATCH',`${R(owner,repo)}/issues/${number}`,{state});if(data?.state!==state)throw new GitHubError('GitHub did not confirm the change.');},

  // ---- Actions ----
  async runs(owner,repo){return ((await get(`${R(owner,repo)}/actions/runs?per_page=25`)).workflow_runs||[]).map(r=>({id:r.id,name:r.name||r.display_title,title:r.display_title||'',branch:r.head_branch,event:r.event,status:r.status,conclusion:r.conclusion,created:r.created_at,url:r.html_url}));},
  async workflows(owner,repo){return ((await get(`${R(owner,repo)}/actions/workflows?per_page=100`)).workflows||[]).filter(w=>w.state==='active').map(w=>({id:w.id,name:w.name,path:w.path}));},
  async startWorkflow(owner,repo,id,branch){
   const r=await call('POST',`${R(owner,repo)}/actions/workflows/${encodeURIComponent(id)}/dispatches`,{ref:branch},{allow:[422]});
   if(r.status===422)throw new GitHubError('This workflow cannot be started by hand'+(/input/i.test(r.data?.message||'')?' from ATE because it needs extra details':'')+'. Nothing was started.',422);
  },
  async runDetail(owner,repo,id){
   const jobs=(await get(`${R(owner,repo)}/actions/runs/${id}/jobs?per_page=100`)).jobs||[];
   const out=[];
   for(const j of jobs){
    const failedSteps=(j.steps||[]).filter(s=>s.conclusion==='failure').map(s=>s.name);
    let lines=[];
    if(j.conclusion==='failure'){
     try{const a=await get(`${R(owner,repo)}/check-runs/${j.id}/annotations`);lines=a.filter(x=>x.annotation_level==='failure'||x.annotation_level==='warning').map(x=>x.message.split('\n')[0].slice(0,300))}catch{}
     try{const resp=await raw(`${config.api}${R(owner,repo)}/actions/jobs/${j.id}/logs`,{method:'GET'});if(resp.ok){const t=await resp.text();const all=t.split('\n').map(l=>l.replace(/^\S+Z /,'').replace(/\u001b\[[0-9;]*m/g,''));const errs=all.filter(l=>/##\[error\]|error|fail|assert/i.test(l)).slice(-15);lines=[...lines,...(errs.length?errs:all.slice(-15))].map(l=>l.replace('##[error]','').trim().slice(0,300)).filter(Boolean)}}catch{}
    }
    out.push({name:j.name,status:j.status,conclusion:j.conclusion,failedSteps,lines:[...new Set(lines)].slice(0,25)});
   }
   return out;
  },
 };
 return api;
}
