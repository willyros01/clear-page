// GitHub screens for the proof of concept: connect with a key, choose a repository
// and branch, open files into tabs, and confirm each save with a short note.
import {validPath} from './github.js';

const html=`
<dialog id="githubDialog" aria-labelledby="githubTitle">
 <div class="gh-toolbar"><h2 id="githubTitle">GitHub</h2><button id="githubClose">Back to editor</button></div>
 <p id="githubStatus" role="status" aria-live="polite"></p>
 <section id="githubConnect">
  <p>Paste your GitHub key to connect. ATE keeps it only while this page is open; it is never saved in the browser.</p>
  <label class="gh-field">GitHub key<input id="githubKey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…"></label>
  <label class="gh-check"><input id="githubShowKey" type="checkbox"> Show key</label>
  <div class="actions"><button id="githubConnectButton" class="primary">Connect</button></div>
 </section>
 <section id="githubBrowse" hidden>
  <div class="gh-row"><span id="githubUser"></span><span><button id="githubRefresh">Refresh</button> <button id="githubDisconnect">Disconnect</button></span></div>
  <label class="gh-field">Repository<select id="githubRepo"></select></label>
  <label class="gh-field">Branch<select id="githubBranch"></select></label>
  <label class="gh-field">Find a file<input id="githubFilter" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type part of a name"></label>
  <p id="githubCount"></p>
  <div id="githubFiles" role="group" aria-label="Files in repository"></div>
  <details id="githubNew"><summary>New file</summary>
   <label class="gh-field">File path in the repository<input id="githubNewPath" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="folder/notes.md"></label>
   <div class="actions"><button id="githubCreate">Open new file</button></div>
  </details>
 </section>
</dialog>
<dialog id="githubSave" aria-labelledby="githubSaveTitle">
 <h2 id="githubSaveTitle">Save to GitHub</h2>
 <p id="githubSaveWhere"></p>
 <label class="gh-field">Note for this change<input id="githubMessage" autocomplete="off" spellcheck="true"></label>
 <p id="githubSaveStatus" role="status" aria-live="polite"></p>
 <div class="actions"><button id="githubSaveCancel">Cancel</button><button id="githubSaveConfirm" class="primary">Save to GitHub</button></div>
</dialog>`;

export function setupGitHub({github,workspace,opened,notice,isAdvanced=()=>true}){
 document.body.insertAdjacentHTML('beforeend',html);
 const $=id=>document.getElementById(id);
 let repos=[],files=[],busy=false;
 const status=t=>{$('githubStatus').textContent=t;};
 async function task(work){if(busy)return;busy=true;for(const e of $('githubDialog').querySelectorAll('button,input,select'))e.disabled=true;try{await work()}catch(e){status(e.message)}finally{busy=false;for(const e of $('githubDialog').querySelectorAll('button,input,select'))e.disabled=false;}}
 function view(){$('githubConnect').hidden=github.connected;$('githubBrowse').hidden=!github.connected;$('githubUser').textContent=github.connected?'Connected as '+github.login:'';}
 const repo=()=>repos[Number($('githubRepo').value)];
 function list(){
  const q=$('githubFilter').value.trim().toLowerCase();const shown=files.filter(f=>f.path.toLowerCase().includes(q));
  $('githubFiles').textContent='';
  for(const f of shown.slice(0,200)){const b=document.createElement('button');b.className='gh-file';b.textContent=f.path;b.onclick=()=>openFile(f);$('githubFiles').append(b);}
  $('githubCount').textContent=shown.length>200?`Showing 200 of ${shown.length} files. Type more of the name to narrow the list.`:`${shown.length} ${shown.length===1?'file':'files'}`;
 }
 async function loadFiles(){const r=repo();if(!r)return;status('Loading files…');const result=await github.files(r.owner,r.name,$('githubBranch').value);files=result.files.sort((a,b)=>a.path.localeCompare(b.path));list();status(r.canPush?'':'This key can read this repository but not save to it.');if(result.truncated)status('This repository is very large; GitHub sent only part of the file list.');}
 async function loadBranches(keep){const r=repo();if(!r)return;status('Loading branches…');const names=await github.branches(r.owner,r.name);$('githubBranch').textContent='';for(const n of names){const o=document.createElement('option');o.value=n;o.textContent=n;$('githubBranch').append(o)}$('githubBranch').value=keep&&names.includes(keep)?keep:names.includes(r.branch)?r.branch:names[0];await loadFiles();}
 async function loadRepos(){const was=repo()?.full,branch=$('githubBranch').value;status('Loading repositories…');repos=await github.repos();$('githubRepo').textContent='';repos.forEach((r,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=r.full+(r.canPush?'':' (read only)');$('githubRepo').append(o)});if(!repos.length){status('This key cannot see any repositories.');return}const i=repos.findIndex(r=>r.full===was);if(i>=0)$('githubRepo').value=String(i);await loadBranches(i>=0?branch:'');}
 function openFile(f){return task(async()=>{const r=repo(),branch=$('githubBranch').value;
  const existing=workspace.documents().find(t=>t.projectRef?.kind==='github'&&t.projectRef.owner===r.owner&&t.projectRef.repo===r.name&&t.projectRef.branch===branch&&t.projectRef.path===f.path);
  if(existing&&existing.projectRef.sha!==f.sha){if(existing.dirty)throw Error('This file changed on GitHub, and its tab has unsaved edits. Copy your edits, close that tab, then open the file again.');workspace.closeMany([existing.id],{focus:false});}
  else if(existing){$('githubDialog').close();workspace.activate(existing.id);return}
  if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');
  status('Opening '+f.path+'…');const result=await github.read(r.owner,r.name,branch,f);
  $('githubDialog').close();opened(result.text,f.path.split('/').pop(),result.ref);notice('Opened from GitHub: '+r.full+' · '+branch+' · '+f.path+(isAdvanced()?'':'. For colours and syntax checks: Menu → Advanced.'));});}
 $('githubShowKey').onchange=()=>{$('githubKey').type=$('githubShowKey').checked?'text':'password'};
 $('githubConnectButton').onclick=()=>task(async()=>{status('Connecting…');await github.connect($('githubKey').value);$('githubKey').value='';$('githubShowKey').checked=false;$('githubKey').type='password';view();await loadRepos();});
 $('githubDisconnect').onclick=()=>{github.disconnect();repos=[];files=[];view();status('Disconnected. The key has been forgotten.')};
 $('githubRepo').onchange=()=>task(()=>loadBranches());
 $('githubRefresh').onclick=()=>task(async()=>{await loadRepos();if(!$('githubStatus').textContent)status('Up to date with GitHub.')});
 $('githubBranch').onchange=()=>task(loadFiles);
 $('githubFilter').oninput=list;
 $('githubCreate').onclick=()=>task(async()=>{const r=repo(),path=$('githubNewPath').value.trim();if(!validPath(path))throw Error('Type a path such as folder/notes.md, without a leading slash.');if(files.some(f=>f.path===path))throw Error('That file already exists. Choose it from the list instead.');if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');$('githubDialog').close();opened('',path.split('/').pop(),{kind:'github',owner:r.owner,repo:r.name,branch:$('githubBranch').value,path,sha:null});$('githubNewPath').value='';notice('New GitHub file '+path+'. Save to create it on GitHub.');});
 $('githubClose').onclick=()=>$('githubDialog').close();
 return {
  open(){view();status('');$('githubDialog').showModal();if(!github.connected)$('githubKey').focus();else task(loadRepos);},
  // Ask for a note, then save. Resolves with the confirmed result, or rejects.
  save(ref,name,text){return new Promise((resolve,reject)=>{
   if(!github.connected){reject(Error('Connect to GitHub first: Menu → GitHub. The key is forgotten when the page is closed.'));return}
   const folder=ref.path.includes('/')?ref.path.slice(0,ref.path.lastIndexOf('/')+1):'';
   $('githubSaveWhere').textContent=ref.owner+'/'+ref.repo+' · branch '+ref.branch+' · '+folder+name;
   $('githubMessage').value=(folder+name!==ref.path||!ref.sha?'Create ':'Update ')+folder+name;$('githubSaveStatus').textContent='';
   const done=(fn,v)=>{$('githubSaveConfirm').onclick=$('githubSaveCancel').onclick=null;$('githubSave').oncancel=null;$('githubSave').close();fn(v)};
   $('githubSaveCancel').onclick=()=>done(reject,Error('Save to GitHub was cancelled. Nothing was saved.'));
   $('githubSave').oncancel=e=>{e.preventDefault();if(!$('githubSaveConfirm').disabled)done(reject,Error('Save to GitHub was cancelled. Nothing was saved.'))};
   $('githubSaveConfirm').onclick=async()=>{$('githubSaveConfirm').disabled=$('githubSaveCancel').disabled=true;$('githubSaveStatus').textContent='Saving to GitHub…';
    try{const result=await github.save(ref,name,text,$('githubMessage').value);const r=repo(),n=result.projectRef;if(r&&r.owner===n.owner&&r.name===n.repo&&$('githubBranch').value===n.branch){const f=files.find(f=>f.path===n.path);if(f)f.sha=n.sha;else{files.push({path:n.path,sha:n.sha,size:0});files.sort((a,b)=>a.path.localeCompare(b.path))}}done(resolve,result)}
    catch(e){done(reject,e)}
    finally{$('githubSaveConfirm').disabled=$('githubSaveCancel').disabled=false}};
   $('githubSave').showModal();$('githubMessage').focus();
  });}
 };
}
