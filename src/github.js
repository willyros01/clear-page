// GitHub access for ATE (proof of concept, web only).
// The key lives only in this page's memory: it is never written to browser storage,
// so closing or reloading the page forgets it.
// A save counts only after GitHub confirms the commit; otherwise nothing changes locally.
const API='https://api.github.com';
const MAX_BYTES=10*1024*1024;

export class GitHubError extends Error{constructor(message,status=0){super(message);this.status=status;}}

const enc=s=>s.split('/').map(encodeURIComponent).join('/');
export function validPath(path){return typeof path==='string'&&path.length>0&&path.length<=4096&&!path.startsWith('/')&&!path.endsWith('/')&&path.split('/').every(p=>p&&p!=='.'&&p!=='..'&&!/[\u0000-\u001f\\]/.test(p));}

function toBase64(text){const bytes=new TextEncoder().encode(text);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin);}
function fromBase64(b64){const bin=atob(b64.replace(/\s/g,''));const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);if(bytes.length>MAX_BYTES)throw new GitHubError('This file is larger than 10 MB, so ATE does not open it.');let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes)}catch{throw new GitHubError('This file is not plain text, so ATE does not open it.')}if(text.includes('\u0000'))throw new GitHubError('This file is not plain text, so ATE does not open it.');return text;}

export function createGitHub({fetchImpl=(...a)=>fetch(...a),timeoutMs=30000}={}){
 let token='',login='';
 async function call(method,path,body){
  if(!token)throw new GitHubError('Connect to GitHub first: Menu → GitHub.');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  let response;
  try{response=await fetchImpl(API+path,{method,cache:'no-store',signal:controller.signal,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
  catch{throw new GitHubError('Could not reach GitHub. Check the internet connection.');}
  finally{clearTimeout(timer);}
  let data=null;try{data=await response.json()}catch{}
  if(response.ok)return data;
  const s=response.status;
  if(s===401)throw new GitHubError('GitHub did not accept the key. It may be mistyped, expired or deleted.',s);
  if(s===403||s===429)throw new GitHubError(/rate limit/i.test(data?.message||'')?'GitHub is limiting requests for now. Try again in a few minutes.':'This key is not allowed to do that. Check it has Contents: Read and write for this repository.',s);
  if(s===404)throw new GitHubError('Not found on GitHub, or this key cannot see it.',s);
  if(s===409)throw new GitHubError('This file changed on GitHub since you opened it. Nothing was saved. Open it again from GitHub to get the latest version.',s);
  if(s===422)throw new GitHubError(/sha/i.test(data?.message||'')?'A file with this name already exists on GitHub. Nothing was saved. Open that file instead, or choose another name.':'GitHub refused the change: '+(data?.message||'invalid request')+'. Nothing was saved.',s);
  throw new GitHubError('GitHub returned an error ('+s+'). Nothing was saved.',s);
 }
 return {
  get connected(){return !!token},
  get login(){return login},
  async connect(key){
   key=String(key||'').trim();
   if(!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(key))throw new GitHubError('That does not look like a GitHub key. It should start with github_pat_.');
   const previous=token;token=key;
   try{const user=await call('GET','/user');login=user.login;return login;}catch(e){token=previous;throw e}
  },
  disconnect(){token='';login='';},
  async repos(){
   const all=[];
   for(let page=1;page<=5;page++){const list=await call('GET','/user/repos?per_page=100&sort=updated&page='+page);all.push(...list);if(list.length<100)break;}
   return all.map(r=>({owner:r.owner.login,name:r.name,full:r.full_name,branch:r.default_branch,canPush:!!r.permissions?.push}));
  },
  async branches(owner,repo){const list=await call('GET',`/repos/${enc(owner)}/${enc(repo)}/branches?per_page=100`);return list.map(b=>b.name);},
  async files(owner,repo,branch){
   const tree=await call('GET',`/repos/${enc(owner)}/${enc(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
   return {truncated:!!tree.truncated,files:tree.tree.filter(e=>e.type==='blob').map(e=>({path:e.path,sha:e.sha,size:e.size}))};
  },
  async read(owner,repo,branch,file){
   if(file.size>MAX_BYTES)throw new GitHubError('This file is larger than 10 MB, so ATE does not open it.');
   const blob=await call('GET',`/repos/${enc(owner)}/${enc(repo)}/git/blobs/${encodeURIComponent(file.sha)}`);
   if(blob.encoding!=='base64'||blob.sha!==file.sha)throw new GitHubError('GitHub sent an unexpected reply. The file was not opened.');
   return {text:fromBase64(blob.content||''),ref:{kind:'github',owner,repo,branch,path:file.path,sha:file.sha}};
  },
  async save(ref,name,text,message){
   if(ref?.kind!=='github'||!validPath(ref.path))throw new GitHubError('This tab is not linked to a GitHub file.');
   name=String(name||'').trim();
   if(!name||name.includes('/')||name==='.'||name==='..')throw new GitHubError('Choose a file name without slashes.');
   const folder=ref.path.includes('/')?ref.path.slice(0,ref.path.lastIndexOf('/')+1):'';
   const path=folder+name,isNew=path!==ref.path||!ref.sha;
   if(!validPath(path))throw new GitHubError('That file name cannot be used on GitHub.');
   if(new TextEncoder().encode(text).length>MAX_BYTES)throw new GitHubError('This file is larger than 10 MB. Nothing was saved.');
   const msg=String(message||'').trim()||(isNew?'Create ':'Update ')+path+' from ATE';
   const result=await call('PUT',`/repos/${enc(ref.owner)}/${enc(ref.repo)}/contents/${enc(path)}`,{message:msg,content:toBase64(text),branch:ref.branch,...(isNew?{}:{sha:ref.sha})});
   const sha=result?.content?.sha,commit=result?.commit?.sha;
   if(!/^[a-f0-9]{40}$/.test(sha||'')||!/^[a-f0-9]{40}$/.test(commit||'')||result.content.path!==path)throw new GitHubError('GitHub did not confirm the save. Check the repository before saving again.');
   return {name,projectRef:{...ref,path,sha},message:(path!==ref.path&&ref.sha?'Saved a new GitHub file ':'Saved to GitHub: ')+ref.owner+'/'+ref.repo+' · '+ref.branch+' · '+path+(path!==ref.path&&ref.sha?'. The original file is kept.':'')+' (commit '+commit.slice(0,7)+')'};
  }
 };
}
