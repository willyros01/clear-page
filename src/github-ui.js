// GitHub screens (web test build): sign in with a code, then work with files, branches,
// pull requests, Actions, issues and new repositories. One section shows at a time.
import {validPath} from './github.js';
import {lineDiff,withContext,parsePatch} from './line-diff.js';

const SECTIONS=[['files','Files'],['branches','Branches'],['pulls','Pull requests'],['actions','Actions'],['issues','Issues'],['newrepo','New repository']];
const html=`
<dialog id="githubDialog" aria-labelledby="githubTitle">
 <div class="gh-toolbar"><h2 id="githubTitle">GitHub</h2><button id="githubClose">Back to editor</button></div>
 <p id="githubStatus" role="status" aria-live="polite"></p>
 <section id="githubSignedOut">
  <p>Sign in with your GitHub account. ATE stays signed in only while this page is open.</p>
  <div class="actions"><button id="githubSignIn" class="primary">Sign in with GitHub</button></div>
  <div id="githubCodeBox" hidden>
   <p>1. Open GitHub's sign-in page: <a id="githubDeviceLink" href="https://github.com/login/device" target="_blank" rel="noopener">github.com/login/device</a></p>
   <p>2. Type this code there, then approve ATE:</p>
   <p id="githubCode" class="gh-code" aria-live="polite"></p>
   <div class="actions"><button id="githubCopyCode">Copy code</button><button id="githubCancelSignIn">Cancel</button></div>
   <p>Waiting for you to approve on GitHub…</p>
  </div>
 </section>
 <section id="githubSignedIn" hidden>
  <div class="gh-row"><span id="githubUser"></span><span class="gh-buttons"><button id="githubMoreRepos">Give ATE more repositories…</button><button id="githubSignOut">Sign out</button></span></div>
  <div class="gh-pickers">
   <label class="gh-field">Repository<select id="githubRepo"></select></label>
   <label class="gh-field">Branch<select id="githubBranch"></select></label>
   <span class="gh-buttons"><button id="githubRefresh">Refresh</button><button id="githubRepoMore" aria-label="More for this repository: copy or delete">More…</button></span>
  </div>
  <p id="githubRepoCount" class="gh-meta"></p>
  <nav id="githubNav" class="gh-nav" aria-label="GitHub sections"></nav>
  <div id="githubPanel"></div>
 </section>
</dialog>
<dialog id="githubAsk" aria-labelledby="githubAskTitle">
 <h2 id="githubAskTitle"></h2><div id="githubAskBody"></div><p id="githubAskStatus" role="status" aria-live="polite"></p>
 <div class="actions"><button id="githubAskCancel">Cancel</button><button id="githubAskOk" class="primary"></button></div>
</dialog>`;

export function setupGitHub({github,workspace,opened,notice,isAdvanced=()=>true,ensureAdvanced=()=>false,markSaved,replaceText}){
 document.body.insertAdjacentHTML('beforeend',html);
 const $=id=>document.getElementById(id);
 let repos=[],branches=[],files=[],section='files',busy=false,signInCancelled=false,view=null;
 const status=t=>{$('githubStatus').textContent=t||''};
 const repo=()=>repos[Number($('githubRepo').value)];
 const branch=()=>$('githubBranch').value;
 const sameBranch=ref=>{const r=repo();return !!(r&&ref?.kind==='github'&&ref.owner===r.owner&&ref.repo===r.name&&ref.branch===branch())};
 function el(tag,props={},...kids){const e=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else if(k.startsWith('on'))e[k]=v;else if(k==='checked')e.checked=!!v;else if(v!==undefined&&v!==null&&v!==false)e.setAttribute(k,v===true?'':v)}for(const k of kids.flat())if(k!=null)e.append(k);return e}
 const panel=(...kids)=>{$('githubPanel').replaceChildren(...kids.filter(k=>k!=null))};
 // While GitHub is working, controls are switched off; afterwards only those this switched off come back on
 // (a control that was already off, such as the 5-second delete button, stays off).
 function lockControls(){const list=[...$('githubDialog').querySelectorAll('button,input,select,textarea')].filter(e=>!e.disabled&&!['githubClose','githubCancelSignIn','githubCopyCode'].includes(e.id));for(const e of list)e.disabled=true;return ()=>{for(const e of list)if(e.isConnected)e.disabled=false}}
 async function task(work,{lock=true}={}){if(busy)return;busy=true;const unlock=lock?lockControls():()=>{};try{await work()}catch(e){status(e.message);if(e.code==='signed-out')showView()}finally{busy=false;unlock()}}
 const when=iso=>{if(!iso)return '';const d=new Date(iso);return isNaN(d)?'':d.toLocaleString([],{dateStyle:'medium',timeStyle:'short'})};
 function diffView(lines,label){
  const box=el('div',{class:'gh-diff',role:'group','aria-label':label||'Changes'});
  if(!lines){box.append(el('p',{text:'The two versions are too different to show line by line.'}));return box}
  if(!lines.some(l=>l.type==='add'||l.type==='del')){box.append(el('p',{text:'No changes.'}));return box}
  for(const l of lines){
   if(l.type==='gap'){box.append(el('div',{class:'gh-line gh-gap',text:l.text||`… ${l.count} unchanged ${l.count===1?'line':'lines'} …`}));continue}
   box.append(el('div',{class:'gh-line gh-'+l.type},el('span',{class:'gh-sign','aria-hidden':'true',text:l.type==='add'?'+':l.type==='del'?'−':' '}),el('span',{class:'gh-sr',text:l.type==='add'?'Added: ':l.type==='del'?'Removed: ':''}),l.text||' '));
  }
  return box;
 }
 // A small question box. fields: [{id,label,value,type,placeholder,rows}]; resolves with the values (or run's result), or null when cancelled.
 function ask({title,text,fields=[],ok='OK',run,extra}){return new Promise(resolve=>{
  $('githubAskTitle').textContent=title;$('githubAskOk').textContent=ok;$('githubAskStatus').textContent='';
  const body=[];if(text)body.push(el('p',{text}));if(extra)body.push(extra);
  for(const f of fields){const input=f.rows?el('textarea',{id:'ghAsk_'+f.id,rows:f.rows,placeholder:f.placeholder||''}):el('input',{id:'ghAsk_'+f.id,autocomplete:'off',autocapitalize:'off',spellcheck:'false',placeholder:f.placeholder||''});
   input.value=f.value||'';body.push(el('label',{class:'gh-field'},f.label,input))}
  $('githubAskBody').replaceChildren(...body);
  const values=()=>Object.fromEntries(fields.map(f=>[f.id,$('ghAsk_'+f.id).value]));
  const finish=v=>{$('githubAskOk').onclick=$('githubAskCancel').onclick=null;$('githubAsk').oncancel=null;$('githubAsk').close();resolve(v)};
  $('githubAskCancel').onclick=()=>finish(null);
  $('githubAsk').oncancel=e=>{e.preventDefault();if(!$('githubAskOk').disabled)finish(null)};
  $('githubAskOk').onclick=async()=>{const v=values();if(!run){finish(v);return}
   $('githubAskOk').disabled=$('githubAskCancel').disabled=true;$('githubAskStatus').textContent='Working…';
   try{const r=await run(v);finish(r===undefined?v:r)}catch(e){$('githubAskStatus').textContent=e.message}finally{$('githubAskOk').disabled=$('githubAskCancel').disabled=false}};
  $('githubAsk').showModal();($('githubAskBody').querySelector('input,textarea')||$('githubAskOk')).focus();
 })}

 // ---- Sign-in ----
 function showView(){$('githubSignedOut').hidden=github.signedIn;$('githubSignedIn').hidden=!github.signedIn;$('githubUser').textContent=github.signedIn?'Signed in as '+github.login:'';if(!github.signedIn){$('githubCodeBox').hidden=true;$('githubSignIn').hidden=false}}
 $('githubSignIn').onclick=()=>task(async()=>{
  status('Asking GitHub for a sign-in code…');const start=await github.startSignIn();
  signInCancelled=false;$('githubCode').textContent=start.userCode;$('githubDeviceLink').href=start.url;$('githubCodeBox').hidden=false;$('githubSignIn').hidden=true;status('');
  try{await github.finishSignIn(start,()=>signInCancelled)}catch(e){$('githubCodeBox').hidden=true;$('githubSignIn').hidden=false;throw e}
  showView();status('Signed in as '+github.login+'.');await loadRepos();
 });
 $('githubCancelSignIn').onclick=()=>{signInCancelled=true;status('Cancelling…')};
 $('githubCopyCode').onclick=async()=>{try{await navigator.clipboard.writeText($('githubCode').textContent);status('Code copied.')}catch{status('Copy did not work here; type the code instead.')}};
 $('githubClose').onclick=()=>$('githubDialog').close();
 $('githubSignOut').onclick=()=>{github.signOut();repos=[];files=[];view=null;showView();status('Signed out. ATE no longer has access to your GitHub.')};

 // ---- Repository and branch ----
 async function loadRepos(){
  const was=repo()?.full,b=branch();status('Loading repositories…');repos=await github.repos();
  $('githubRepo').replaceChildren(...repos.map((r,i)=>el('option',{value:String(i),text:r.full+(r.canPush?'':' (read only)')})));
  if(!repos.length){status('ATE has not been given any repositories yet. Tap "Choose repositories", pick some on GitHub, then tap Refresh.');$('githubBranch').replaceChildren();panel();return}
  $('githubRepoCount').textContent=repos.length===1?'ATE can use 1 repository. To add more, tap "Give ATE more repositories…".':`ATE can use ${repos.length} repositories.`;
  const i=repos.findIndex(r=>r.full===was);if(i>=0)$('githubRepo').value=String(i);
  await loadBranches(i>=0?b:'');
 }
 async function loadBranches(keep){
  const r=repo();if(!r)return;status('Loading branches…');branches=await github.branches(r.owner,r.name);
  $('githubBranch').replaceChildren(...branches.map(b=>el('option',{value:b.name,text:b.name})));
  const names=branches.map(b=>b.name);$('githubBranch').value=keep&&names.includes(keep)?keep:names.includes(r.branch)?r.branch:names[0];
  await loadFiles();
 }
 async function loadFiles(){
  const r=repo();if(!r)return;status('Loading files…');
  const result=await github.files(r.owner,r.name,branch());files=result.files.sort((a,b)=>a.path.localeCompare(b.path));
  status(result.truncated?'This repository is very large; GitHub sent only part of the file list.':r.canPush?'':'You can read this repository but not change it.');
  await showSection(section);
 }
 $('githubRepo').onchange=()=>{view=null;task(()=>loadBranches())};
 $('githubBranch').onchange=()=>{view=null;task(loadFiles)};
 $('githubRefresh').onclick=()=>task(async()=>{await loadRepos();if(!$('githubStatus').textContent)status('Up to date with GitHub.')});
 $('githubNav').replaceChildren(...SECTIONS.map(([id,label])=>el('button',{'data-section':id,'aria-pressed':'false',text:label,onclick:()=>{view=null;status('');task(()=>showSection(id))}})));
 async function showSection(id){
  section=id;for(const b of $('githubNav').children)b.setAttribute('aria-pressed',String(b.dataset.section===id));
  if(!repo()){panel();return}
  await ({files:filesPanel,branches:branchesPanel,pulls:pullsPanel,actions:actionsPanel,issues:issuesPanel,newrepo:newRepoPanel})[id]();
 }
 const go=fn=>{view=fn;task(()=>showSection(section))};
 const back=(label,fn=null)=>el('button',{class:'gh-back',text:'‹ '+label,onclick:()=>{status('');go(fn)}});

 // ---- Files ----
 function dirtyHere(){return workspace.documents().filter(t=>t.dirty&&sameBranch(t.projectRef))}
 async function filesPanel(){
  if(view)return view();
  const r=repo(),list=el('div',{class:'gh-list',role:'group','aria-label':'Files in repository'}),count=el('p'),q=el('input',{type:'search',id:'githubFilter',autocomplete:'off',autocapitalize:'off',spellcheck:'false',placeholder:'Type part of a name'});
  const draw=()=>{const s=q.value.trim().toLowerCase(),shown=files.filter(f=>f.path.toLowerCase().includes(s));
   list.replaceChildren(...shown.slice(0,200).map(f=>el('div',{class:'gh-item'},el('button',{class:'gh-file',text:f.path,onclick:()=>openFile(f)}),el('button',{class:'gh-more','aria-label':'More for '+f.path,text:'⋯',onclick:()=>go(()=>fileActions(f))}))));
   count.textContent=shown.length>200?`Showing 200 of ${shown.length} files. Type more of the name to narrow the list.`:`${shown.length} ${shown.length===1?'file':'files'}`};
  q.oninput=draw;draw();
  const dirty=dirtyHere();
  const searchInput=el('input',{type:'search',id:'githubSearch',autocomplete:'off',autocapitalize:'off',spellcheck:'false',placeholder:'Text to find in all files'});
  const searchOut=el('div',{id:'githubSearchResults',class:'gh-list'});
  const runSearch=()=>task(async()=>{status('Searching…');const {results,skipped}=await github.search(r.owner,r.name,branch(),searchInput.value,{onProgress:n=>status(`Searching… ${n} files read`)});
   status(`${results.length} ${results.length===1?'match':'matches'}`+(skipped?`. ${skipped} large or extra files were not searched.`:'.'));
   searchOut.replaceChildren(...results.map(x=>el('button',{class:'gh-file',onclick:()=>openFile(x.file,x.line)},el('strong',{text:`${x.file.path}:${x.line}`}),' '+x.text)));});
  searchInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();runSearch()}};
  panel(
   dirty.length&&r.canPush?el('div',{class:'actions'},el('button',{id:'githubSaveAll',class:'primary',text:`Save ${dirty.length} changed ${dirty.length===1?'file':'files'} together…`,onclick:saveAll})):null,
   el('details',{id:'githubSearchBox'},el('summary',{text:'Search inside files'}),el('label',{class:'gh-field'},'Find text in this branch',searchInput),el('div',{class:'actions'},el('button',{id:'githubSearchGo',text:'Search',onclick:runSearch})),searchOut),
   el('label',{class:'gh-field'},'Find a file',q),count,list,
   r.canPush?el('details',{id:'githubNew'},el('summary',{text:'New file'}),el('label',{class:'gh-field'},'File path in the repository',el('input',{id:'githubNewPath',autocomplete:'off',autocapitalize:'off',spellcheck:'false',placeholder:'folder/notes.md'})),el('div',{class:'actions'},el('button',{id:'githubCreate',text:'Open new file',onclick:newFile}))):null);
 }
 function newFile(){task(async()=>{const r=repo(),path=$('githubNewPath').value.trim();
  if(!validPath(path))throw Error('Type a path such as folder/notes.md, without a leading slash.');
  if(files.some(f=>f.path===path))throw Error('That file already exists. Choose it from the list instead.');
  if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');
  $('githubDialog').close();opened('',path.split('/').pop(),{kind:'github',owner:r.owner,repo:r.name,branch:branch(),path,sha:null,mode:'100644'});notice('New GitHub file '+path+'. Save to create it on GitHub.');})}
 function openTab(f){return workspace.documents().find(t=>sameBranch(t.projectRef)&&t.projectRef.path===f.path)}
 function openFile(f,line){return task(async()=>{
  const r=repo(),b=branch(),existing=openTab(f);
  if(existing&&existing.projectRef.sha!==f.sha){if(existing.dirty)throw Error('This file changed on GitHub, and its tab has unsaved edits. Copy your edits, close that tab, then open the file again.');workspace.closeMany([existing.id],{focus:false});}
  else if(existing){$('githubDialog').close();workspace.activate(existing.id);notice(f.path+' is already open'+(line?' (match on line '+line+')':'')+'.');return}
  if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');
  status('Opening '+f.path+'…');const result=await github.read(r.owner,r.name,b,f);
  $('githubDialog').close();opened(result.text,f.path.split('/').pop(),result.ref);
  notice('Opened from GitHub: '+r.full+' · '+b+' · '+f.path+(line?' (match on line '+line+')':'')+(isAdvanced()?'':'. For colours and syntax checks: Menu → Advanced.'));
 })}
 function fileActions(f){const r=repo();panel(back('All files'),el('h3',{text:f.path}),el('div',{class:'actions gh-stack'},
   el('button',{id:'githubFileOpen',text:'Open',onclick:()=>openFile(f)}),
   el('button',{id:'githubFileHistory',text:'History (past versions)',onclick:()=>go(()=>historyView(f))}),
   r.canPush?el('button',{id:'githubFileRename',text:'Rename or move',onclick:()=>renameFile(f)}):null,
   r.canPush?el('button',{id:'githubFileDelete',class:'danger',text:'Delete',onclick:()=>deleteFile(f)}):null))}
 async function historyView(f){
  const r=repo();status('Loading history…');const h=await github.history(r.owner,r.name,branch(),f.path);status('');
  panel(back('All files'),el('h3',{text:'History of '+f.path}),el('p',{text:'Newest first. Tap a change to see what it changed.'}),
   el('div',{class:'gh-list'},...h.map(c=>el('button',{class:'gh-file',onclick:()=>go(()=>versionView(f,c))},el('strong',{text:c.message.split('\n')[0]}),el('span',{class:'gh-meta',text:` ${c.author} · ${when(c.date)} · ${c.sha.slice(0,7)}`})))));
 }
 async function versionView(f,c){
  const r=repo();status('Loading change…');const d=await github.commitDetail(r.owner,r.name,c.sha);status('');
  const mine=d.files.find(x=>x.path===f.path),others=d.files.filter(x=>x!==mine);
  panel(back('History',()=>historyView(f)),el('h3',{text:c.message.split('\n')[0]}),el('p',{class:'gh-meta',text:`${c.author} · ${when(c.date)} · ${c.sha.slice(0,7)}`}),
   el('h4',{text:'What changed in '+f.path}),diffView(mine?parsePatch(mine.patch):[],'Changes to '+f.path),
   others.length?el('p',{text:'Also changed: '+others.map(x=>x.path).join(', ')}):null,
   r.canPush?el('div',{class:'actions'},el('button',{id:'githubRestore',text:'Restore this version',onclick:()=>restoreVersion(f,c)})):null);
 }
 function restoreVersion(f,c){task(async()=>{
  const r=repo(),b=branch(),current=files.find(x=>x.path===f.path);
  if(!current)throw Error('This file is no longer on the branch. Refresh first.');
  const existing=openTab(current);if(existing?.dirty)throw Error('This file has unsaved edits in a tab. Save or close that tab first.');
  if(existing)workspace.closeMany([existing.id],{focus:false});
  if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');
  status('Loading that version…');const old=await github.fileAt(r.owner,r.name,c.sha,f.path),now=await github.read(r.owner,r.name,b,current);
  view=null;$('githubDialog').close();opened(now.text,f.path.split('/').pop(),now.ref);replaceText(old.replace(/\r\n?/g,'\n'));
  notice(`The version from ${when(c.date)} is in the tab, not yet saved. Check it, then Save to put it back on GitHub.`);
 })}
 async function renameFile(f){
  const r=repo(),b=branch();
  const v=await ask({title:'Rename or move',text:'Type the new path. Use folder/name to move it into a folder.',ok:'Rename on GitHub',fields:[{id:'path',label:'New path',value:f.path},{id:'note',label:'Note for this change',value:'Rename '+f.path}],
   run:async v=>{const path=v.path.trim();if(path===f.path)throw Error('Type a different path.');if(!validPath(path))throw Error('That path cannot be used on GitHub.');if(files.some(x=>x.path===path))throw Error('A file with that path already exists.');
    const tab=openTab(f);if(tab?.dirty)throw Error('This file has unsaved edits in a tab. Save or close that tab first.');
    const text=await github.blobText(r.owner,r.name,f.sha,f.size);
    const res=await github.commit(r.owner,r.name,b,[{path,text,baseSha:null,mode:f.mode},{path:f.path,remove:true,baseSha:f.sha}],v.note.trim()||'Rename '+f.path+' to '+path);
    if(tab)markSaved(tab.id,tab.text,path.split('/').pop(),{...tab.projectRef,path,sha:res.files[path].sha});return path}});
  if(v){view=null;notice('Renamed on GitHub: '+f.path+' → '+v);await task(loadFiles)}
 }
 async function deleteFile(f){
  const r=repo(),b=branch(),tab=openTab(f);
  if(tab?.dirty){status('This file has unsaved edits in a tab. Save or close that tab first.');return}
  const v=await ask({title:'Delete '+f.path+'?',text:'The file is removed from branch '+b+'. Its history stays on GitHub, so it can be restored later.',ok:'Delete from GitHub',fields:[{id:'note',label:'Note for this change',value:'Delete '+f.path}],
   run:v=>github.commit(r.owner,r.name,b,[{path:f.path,remove:true,baseSha:f.sha}],v.note.trim()||'Delete '+f.path)});
  if(v){if(tab)workspace.closeMany([tab.id],{focus:false});view=null;notice('Deleted from GitHub: '+f.path);await task(loadFiles)}
 }
 async function saveAll(){
  const r=repo(),b=branch(),dirty=dirtyHere();
  const boxes=dirty.map(t=>{const folder=t.projectRef.path.includes('/')?t.projectRef.path.slice(0,t.projectRef.path.lastIndexOf('/')+1):'';return {t,path:folder+t.name,input:el('input',{type:'checkbox',checked:true})}});
  const extra=el('div',{class:'gh-list'},...boxes.map(x=>el('label',{class:'gh-check'},x.input,' '+x.path+(x.path!==x.t.projectRef.path?' (new name)':''))));
  const v=await ask({title:'Save changed files together',text:`One change on ${r.full} · branch ${b}.`,extra,ok:'Save to GitHub',fields:[{id:'note',label:'Note for this change',value:'Update '+boxes.length+' files'}],
   run:async v=>{const chosen=boxes.filter(x=>x.input.checked);if(!chosen.length)throw Error('Tick at least one file.');
    const paths=chosen.map(x=>x.path);if(new Set(paths).size!==paths.length)throw Error('Two tabs would save to the same file name. Rename one first.');
    const res=await github.commit(r.owner,r.name,b,chosen.map(x=>({path:x.path,text:x.t.text,baseSha:x.path===x.t.projectRef.path?x.t.projectRef.sha:null,mode:x.t.projectRef.mode})),v.note);
    for(const x of chosen)markSaved(x.t.id,x.t.text,x.t.name,{...x.t.projectRef,path:x.path,sha:res.files[x.path].sha});return {count:chosen.length,commit:res.commit}}});
  if(v){notice(`Saved ${v.count} ${v.count===1?'file':'files'} to GitHub in one change (${v.commit.slice(0,7)}).`);await task(loadFiles)}
 }

 // ---- Branches ----
 async function switchBranch(name){$('githubBranch').value=name;view=null;section='files';await loadFiles();status('Now working on branch '+name+'.')}
 function branchesPanel(){
  if(view)return view();
  const r=repo(),b=branch(),name=el('input',{id:'githubNewBranch',autocomplete:'off',autocapitalize:'off',spellcheck:'false',placeholder:'new-branch-name'});
  panel(el('p',{text:'Tap a branch to work on it.'}),
   el('div',{class:'gh-list'},...branches.map(x=>el('div',{class:'gh-item'},
    x.name===b?el('div',{class:'gh-file gh-current',text:'✓ '+x.name+' · you are working here'}):el('button',{class:'gh-file','data-switch':x.name,text:x.name+(x.name===r.branch?' (main branch)':''),onclick:()=>task(()=>switchBranch(x.name))}),
    r.canPush&&x.name!==b?el('button',{class:'gh-more','data-branch-more':x.name,'aria-label':'More for branch '+x.name,text:'⋯',onclick:()=>go(()=>branchActions(x))}):null))),
   r.canPush?el('details',{id:'githubNewBranchBox'},el('summary',{text:`New branch from ${b}`}),el('label',{class:'gh-field'},'Branch name',name),el('div',{class:'actions'},el('button',{id:'githubCreateBranch',text:'Create branch',onclick:()=>task(async()=>{
    const nb=name.value.trim(),from=branches.find(x=>x.name===b);await github.createBranch(r.owner,r.name,nb,from.sha);await loadBranches(nb);status('Created branch '+nb+'. You are now working on it.')})}))):null);
 }
 function branchActions(x){const r=repo(),b=branch();
  panel(back('Branches'),el('h3',{text:'Branch '+x.name}),el('div',{class:'actions gh-stack'},
   el('button',{id:'githubBranchSwitch',text:'Work on this branch',onclick:()=>task(()=>switchBranch(x.name))}),
   el('button',{id:'githubBranchMerge',text:`Copy ${x.name}'s changes into ${b}`,onclick:()=>mergeBranch(x.name,b)}),
   x.name!==r.branch&&!x.protected?el('button',{id:'githubBranchDelete',class:'danger',text:'Delete branch '+x.name,onclick:()=>deleteBranch(x.name)}):null))}
 async function mergeBranch(head,base){
  const r=repo();
  const v=await ask({title:`Copy ${head}'s changes into ${base}?`,text:`Everything changed on ${head} is added to ${base} (this is called a merge). ${head} itself stays as it is.`,ok:'Copy changes',fields:[{id:'note',label:'Note for this change',value:`Merge ${head} into ${base}`}],
   run:async v=>{const res=await github.merge(r.owner,r.name,base,head,v.note.trim());if(res.result==='conflict')throw Error(`The same lines were changed on both branches, so GitHub cannot combine them automatically. Nothing was changed. Open a pull request to see the differences.`);return res}});
  if(v)await task(async()=>{view=null;await loadBranches(base);section='branches';await showSection('branches');status(v.result==='nothing'?`${base} already has everything from ${head}. Nothing to copy.`:`Copied ${head}'s changes into ${base}.`)})
 }
 async function deleteBranch(name){
  const r=repo();const v=await ask({title:`Delete branch ${name}?`,text:'Changes that were only on this branch will no longer be listed. This cannot be undone from ATE.',ok:'Delete branch',run:()=>github.deleteBranch(r.owner,r.name,name)});
  if(v)await task(async()=>{view=null;await loadBranches(branch());section='branches';await showSection('branches');status('Deleted branch '+name+'.')})
 }

 // ---- Repository: more repositories, copy, delete ----
 $('githubMoreRepos').onclick=()=>ask({title:'Give ATE more repositories',text:'This opens GitHub\'s page for ATE in a new tab. There, tick the repositories ATE may use, then tap Save. Do not change anything else on that page, especially the red "Danger zone" buttons. Then come back here and tap Refresh.',ok:'Continue to GitHub',run:()=>{window.open(github.chooseReposUrl(),'_blank','noopener')}});
 $('githubRepoMore').onclick=()=>{if(!repo())return;view=()=>repoActions();task(()=>showSection(section))};
 const clearNav=()=>{for(const b of $('githubNav').children)b.setAttribute('aria-pressed','false')};
 function repoActions(){clearNav();const r=repo();
  panel(back('Back'),el('h3',{text:r.full}),el('div',{class:'actions gh-stack'},
   el('button',{id:'githubCopyRepo',text:'Copy branches to another repository…',onclick:()=>go(()=>copyExplain())}),
   el('button',{id:'githubDeleteRepo',class:'danger',text:'Delete this repository…',onclick:()=>go(()=>deleteRepoStep1())})))}
 function copyExplain(){clearNav();const r=repo();
  const section=(h,lines)=>el('div',{},el('h4',{text:h}),...lines.map(t=>el('p',{text:'• '+t})));
  panel(back('Back',()=>repoActions()),el('h3',{text:'Copy branches of '+r.full}),
   el('p',{text:'Read this first. It explains exactly what a copy does.'}),
   section('Copied',['The files of the branch or branches you choose, as they are right now.','Into a new repository: its description, website address, topics, which features are on (Issues, Wiki, Projects) and the main branch name.']),
   section('You choose',['One branch, or all branches.','A new repository, or new branches in an existing repository.','For a new repository: public or private (the original\'s setting is pre-selected; nothing becomes public unless you choose it).']),
   section('Not copied',['The history of past changes: GitHub does not let an app copy it. Only the files as they are now.','Secrets (hidden keys used by workflows): GitHub never shows their values, so you add them again yourself.','The website setup (GitHub Pages), branch locks and the people who have access.','Issues, pull requests and past Actions runs: they belong to the original.']),
   section('Safety',['ATE never writes into a branch that already exists, so nothing can be overwritten.','Actions (automatic jobs) are switched off in a new repository before any file arrives, so its workflows cannot run without their secrets. Switch them on in the Actions section when ready.','Up to 1,000 files and 50 MB per copy. ATE checks that every file arrived exactly.']),
   el('div',{class:'actions'},el('button',{text:'Cancel',onclick:()=>go(null)}),el('button',{id:'githubCopyNext',class:'primary',text:'I understand, continue',onclick:()=>go(()=>copyForm())})));
 }
 async function copyForm(){clearNav();
  const r=repo(),b=branch();status('Reading '+r.full+'…');const info=await github.repoInfo(r.owner,r.name);status('');
  const one=el('input',{type:'radio',name:'ghCopyWhat',id:'githubCopyOne',checked:true}),all=el('input',{type:'radio',name:'ghCopyWhat',id:'githubCopyAll'});
  const toNew=el('input',{type:'radio',name:'ghCopyWhere',id:'githubCopyToNew',checked:true}),toOld=el('input',{type:'radio',name:'ghCopyWhere',id:'githubCopyToExisting'});
  const newName=el('input',{id:'githubCopyName',autocomplete:'off',autocapitalize:'off',spellcheck:'false',value:r.name+'-copy'}),priv=el('input',{type:'checkbox',id:'githubCopyPrivate',checked:info.private});
  const others=repos.filter(x=>x.full!==r.full&&x.canPush),targetSel=el('select',{id:'githubCopyTarget'},...others.map(x=>el('option',{value:x.full,text:x.full})));
  const names=el('div',{id:'githubCopyNames'}),offBox=el('input',{type:'checkbox',id:'githubCopyActionsOff',checked:true});
  const newBox=el('div',{},el('label',{class:'gh-field'},'Name of the new repository',newName),el('label',{class:'gh-check'},priv,' Private (only you can see it)'));
  const oldBox=el('div',{hidden:true},others.length?el('label',{class:'gh-field'},'Copy into',targetSel):el('p',{text:'ATE has no other repository you can change.'}),names,el('label',{class:'gh-check'},offBox,' Switch off Actions in that repository first (recommended: its workflows could otherwise start on the copied branches). Switch them back on later in Actions.'));
  const chosen=()=>all.checked?branches.map(x=>x.name):[b];
  const drawNames=()=>{names.replaceChildren(...chosen().map(n=>el('label',{class:'gh-field'},`New branch name for ${n}`,el('input',{'data-from':n,autocomplete:'off',autocapitalize:'off',spellcheck:'false',value:`${n}-from-${r.name}`}))))};
  const sync=()=>{newBox.hidden=!toNew.checked;oldBox.hidden=toNew.checked;drawNames()};for(const x of [one,all,toNew,toOld])x.onchange=sync;sync();
  panel(back('Back',()=>copyExplain()),el('h3',{text:'Copy from '+r.full}),
   el('h4',{text:'What to copy'}),el('label',{class:'gh-check'},one,` Branch ${b} only`),el('label',{class:'gh-check'},all,` All ${branches.length} branches`),
   el('h4',{text:'Where to'}),el('label',{class:'gh-check'},toNew,' A new repository'),el('label',{class:'gh-check'},toOld,' New branches in an existing repository'),newBox,oldBox,
   el('div',{class:'actions'},el('button',{text:'Cancel',onclick:()=>go(null)}),el('button',{id:'githubCopyNow',class:'primary',text:'Copy now',onclick:()=>task(async()=>{
    let target;
    if(toNew.checked)target={kind:'new',name:newName.value.trim(),isPrivate:priv.checked};
    else{if(!others.length)throw Error('Choose a new repository instead.');const [owner,name]=targetSel.value.split('/');const map={};for(const i of names.querySelectorAll('input'))map[i.dataset.from]=i.value.trim();target={kind:'existing',owner,repo:name,names:map};
     if(offBox.checked){status('Switching off Actions in '+targetSel.value+'…');await github.setActionsEnabled(owner,name,false)}}
    const res=await github.copy({owner:r.owner,repo:r.name},chosen(),target,{onProgress:status});
    await loadRepos();const i=repos.findIndex(x=>x.full===res.to.full);
    view=()=>panel(el('h3',{text:'Copy finished'}),el('p',{text:`Copied ${res.branches.length} ${res.branches.length===1?'branch':'branches'} into ${res.to.full}: ${res.branches.join(', ')}. Every file was checked.`}),
     el('p',{text:'Not copied: history of past changes, secrets, GitHub Pages setup, branch locks, people with access, issues, pull requests and past Actions runs.'+(target.kind==='new'||offBox.checked?' Actions are switched off in '+res.to.full+'.':'')}),
     res.skipped.length?el('p',{text:'Skipped links to other repositories (submodules): '+res.skipped.join(', ')}):null,
     i<0?el('p',{text:'ATE cannot open the new repository yet. Tap "Give ATE more repositories…", tick it, then Refresh.'}):el('div',{class:'actions'},el('button',{id:'githubOpenCopy',text:'Open '+res.to.full,onclick:()=>task(async()=>{view=null;$('githubRepo').value=String(i);await loadBranches()})})));
    await showSection(section);status('Copy finished.')})})));
 }
 function deleteRepoStep1(){clearNav();const r=repo();
  panel(back('Back',()=>repoActions()),el('h3',{class:'gh-danger-title',text:'Delete '+r.full+'?'}),
   el('p',{text:'Deleting removes the whole repository from GitHub:'}),
   ...['every file','the history of all changes','all branches','its issues and pull requests','its Actions workflows and past runs','its website, if it has one (GitHub Pages)'].map(t=>el('p',{text:'• '+t})),
   el('p',{text:'GitHub may let you restore a recently deleted repository from your own GitHub settings (Settings → Repositories → Deleted repositories), usually within 90 days, but this is not guaranteed. ATE cannot undo it.'}),
   el('div',{class:'actions'},el('button',{text:'Cancel',onclick:()=>go(null)}),el('button',{id:'githubDeleteNext',class:'danger',text:'Continue',onclick:()=>go(()=>deleteRepoStep2())})));
 }
 function deleteRepoStep2(){clearNav();const r=repo();
  const typed=el('input',{id:'githubDeleteName',autocomplete:'off',autocapitalize:'off',spellcheck:'false'});
  const final=el('button',{id:'githubDeleteForever',class:'danger',disabled:true,text:'Delete forever (wait 5)'});
  let left=5,ready=false;const tick=setInterval(()=>{left--;if(left<=0){clearInterval(tick);ready=true;final.textContent='Delete forever';update()}else final.textContent=`Delete forever (wait ${left})`},1000);
  const update=()=>{final.disabled=!(ready&&typed.value===r.name)};typed.oninput=update;
  final.onclick=()=>task(async()=>{if(typed.value!==r.name)throw Error('Type the exact name first.');status('Deleting '+r.full+'…');await github.deleteRepo(r.owner,r.name,typed.value);view=null;await loadRepos();status(`${r.full} has been deleted from GitHub.`)});
  panel(back('Back',()=>{clearInterval(tick);return deleteRepoStep1()}),el('h3',{class:'gh-danger-title',text:'Last check'}),el('p',{text:`To confirm, type the repository's name exactly: ${r.name}`}),el('label',{class:'gh-field'},'Repository name',typed),
   el('div',{class:'actions'},el('button',{text:'Cancel',onclick:()=>{clearInterval(tick);go(null)}}),final));
 }

 // ---- Pull requests ----
 async function pullsPanel(){
  if(view)return view();
  const r=repo();status('Loading pull requests…');const list=await github.pulls(r.owner,r.name);status('');
  const head=el('select',{id:'githubPrHead'},...branches.map(x=>el('option',{value:x.name,text:x.name}))),base=el('select',{id:'githubPrBase'},...branches.map(x=>el('option',{value:x.name,text:x.name})));
  head.value=branch();base.value=branches.some(x=>x.name===r.branch)?r.branch:branches[0]?.name;
  const title=el('input',{id:'githubPrTitle',autocomplete:'off'}),body=el('textarea',{id:'githubPrBody',rows:3});
  panel(el('h3',{text:'Open pull requests'}),list.length?el('div',{class:'gh-list'},...list.map(p=>el('button',{class:'gh-file',onclick:()=>go(()=>pullView(p.number))},el('strong',{text:`#${p.number} ${p.title}`}),el('span',{class:'gh-meta',text:` ${p.head} → ${p.base} · ${p.author}`})))):el('p',{text:'None open.'}),
   r.canPush?el('details',{id:'githubNewPr'},el('summary',{text:'New pull request'}),el('label',{class:'gh-field'},'From branch',head),el('label',{class:'gh-field'},'Into branch',base),el('label',{class:'gh-field'},'Title',title),el('label',{class:'gh-field'},'Description (optional)',body),
    el('div',{class:'actions'},el('button',{id:'githubCreatePr',text:'Open pull request',onclick:()=>task(async()=>{if(head.value===base.value)throw Error('Choose two different branches.');const n=await github.createPull(r.owner,r.name,{title:title.value,head:head.value,base:base.value,body:body.value});view=()=>pullView(n);await showSection('pulls');status('Opened pull request #'+n+'.')})}))):null);
 }
 async function pullView(n){
  const r=repo();status('Loading pull request…');const p=await github.pull(r.owner,r.name,n);status('');
  const comment=el('textarea',{id:'githubPrComment',rows:3});
  panel(back('Pull requests'),el('h3',{text:`#${p.number} ${p.title}`}),el('p',{class:'gh-meta',text:`${p.head} → ${p.base} · ${p.author} · ${p.state}`}),p.body?el('p',{class:'gh-body',text:p.body}):null,
   el('h4',{text:`Changes (${p.files.length} ${p.files.length===1?'file':'files'})`}),...p.files.map(f=>el('details',{open:p.files.length<=3},el('summary',{text:f.path+' ('+f.status+')'}),diffView(parsePatch(f.patch),'Changes to '+f.path))),
   el('h4',{text:'Comments'}),...(p.comments.length?p.comments.map(c=>el('div',{class:'gh-comment'},el('strong',{text:c.author+' · '+when(c.date)}),el('p',{text:c.body}))):[el('p',{text:'No comments yet.'})]),
   el('label',{class:'gh-field'},'Add a comment',comment),el('div',{class:'actions'},el('button',{id:'githubPrSendComment',text:'Post comment',onclick:()=>task(async()=>{await github.comment(r.owner,r.name,n,comment.value);await pullView(n);status('Comment posted.')})}),
    p.state==='open'&&r.canPush?el('button',{id:'githubPrMerge',class:'primary',text:`Merge into ${p.base}`,onclick:()=>mergePull(p)}):null));
 }
 async function mergePull(p){
  const r=repo();const v=await ask({title:`Merge pull request #${p.number}?`,text:`Copies the changes from ${p.head} into ${p.base}.`,ok:'Merge',run:()=>github.mergePull(r.owner,r.name,p.number,p.headSha)});
  if(v)await task(async()=>{view=()=>pullView(p.number);await loadBranches(branch());status(`Merged #${p.number} into ${p.base}.`)})
 }

 // ---- Actions ----
 const runLabel=x=>x.status!=='completed'?'⏳ running':x.conclusion==='success'?'✓ passed':x.conclusion==='failure'?'✗ failed':x.conclusion==='cancelled'?'– cancelled':'• '+(x.conclusion||x.status);
 async function actionsPanel(){
  if(view)return view();
  const r=repo();status('Loading workflow runs…');const [runs,flows,on]=await Promise.all([github.runs(r.owner,r.name),github.workflows(r.owner,r.name),github.actionsEnabled(r.owner,r.name).catch(()=>null)]);status('');
  const pick=el('select',{id:'githubWorkflow'},...flows.map(w=>el('option',{value:String(w.id),text:w.name})));
  const toggle=on===null||!r.canPush?null:el('div',{class:'gh-row gh-switch'},el('strong',{id:'githubActionsState',text:'Automatic jobs (Actions): '+(on?'On':'Off')}),el('button',{id:'githubActionsToggle',class:on?'danger':'',text:on?'Switch off':'Switch on',onclick:async()=>{
   const v=await ask({title:on?'Switch off Actions?':'Switch on Actions?',text:on?`No workflow in ${r.full} will run until you switch Actions on again. Nothing is deleted.`:`Workflows in ${r.full} will run again when their triggers happen. Make sure their secrets are in place first.`,ok:on?'Switch off':'Switch on',run:()=>github.setActionsEnabled(r.owner,r.name,!on)});
   if(v)await task(async()=>{await actionsPanel();status(on?'Actions switched off.':'Actions switched on.')})}}));
  panel(toggle,el('h3',{text:'Latest runs'}),runs.length?el('div',{class:'gh-list'},...runs.map(x=>el('button',{class:'gh-file gh-run gh-'+(x.conclusion||'running'),onclick:()=>go(()=>runView(x))},el('strong',{text:runLabel(x)+' · '+x.name}),el('span',{class:'gh-meta',text:` ${x.branch} · ${x.event} · ${when(x.created)}`})))):el('p',{text:'No runs yet.'}),
   flows.length&&r.canPush?el('details',{id:'githubStartBox'},el('summary',{text:'Start a workflow'}),el('label',{class:'gh-field'},'Workflow',pick),el('p',{text:`Runs on branch ${branch()}.`}),el('div',{class:'actions'},el('button',{id:'githubStartWorkflow',text:'Start',onclick:()=>task(async()=>{await github.startWorkflow(r.owner,r.name,pick.value,branch());await actionsPanel();status('Started. It can take a few seconds to appear; tap Actions to update.')})}))):null);
 }
 async function runView(x){
  const r=repo();status('Loading run details…');const jobs=await github.runDetail(r.owner,r.name,x.id);status('');
  panel(back('Actions'),el('h3',{text:runLabel(x)+' · '+x.name}),el('p',{class:'gh-meta',text:`${x.branch} · ${when(x.created)}`}),
   ...jobs.map(j=>el('div',{class:'gh-comment'},el('strong',{text:runLabel(j)+' · '+j.name}),j.failedSteps.length?el('p',{text:'Failed step: '+j.failedSteps.join(', ')}):null,j.lines.length?el('div',{class:'gh-diff'},...j.lines.map(l=>el('div',{class:'gh-line gh-del',text:l}))):null)),
   jobs.length?null:el('p',{text:'No jobs yet.'}));
 }

 // ---- Issues ----
 async function issuesPanel(){
  if(view)return view();
  const r=repo();status('Loading issues…');const list=await github.issues(r.owner,r.name);status('');
  const title=el('input',{id:'githubIssueTitle',autocomplete:'off'}),body=el('textarea',{id:'githubIssueBody',rows:3});
  panel(el('h3',{text:'Open issues'}),list.length?el('div',{class:'gh-list'},...list.map(i=>el('button',{class:'gh-file',onclick:()=>go(()=>issueView(i.number))},el('strong',{text:`#${i.number} ${i.title}`}),el('span',{class:'gh-meta',text:` ${i.author} · ${i.comments} ${i.comments===1?'comment':'comments'}`})))):el('p',{text:'None open.'}),
   el('details',{id:'githubNewIssue'},el('summary',{text:'New issue'}),el('label',{class:'gh-field'},'Title',title),el('label',{class:'gh-field'},'Details (optional)',body),el('div',{class:'actions'},el('button',{id:'githubCreateIssue',text:'Create issue',onclick:()=>task(async()=>{const n=await github.createIssue(r.owner,r.name,{title:title.value,body:body.value});view=()=>issueView(n);await showSection('issues');status('Created issue #'+n+'.')})}))));
 }
 async function issueView(n){
  const r=repo();status('Loading issue…');const i=await github.issue(r.owner,r.name,n);status('');
  const comment=el('textarea',{id:'githubIssueComment',rows:3});
  panel(back('Issues'),el('h3',{text:`#${i.number} ${i.title}`}),el('p',{class:'gh-meta',text:`${i.author} · ${i.state}`}),i.body?el('p',{class:'gh-body',text:i.body}):null,
   el('h4',{text:'Comments'}),...(i.comments.length?i.comments.map(c=>el('div',{class:'gh-comment'},el('strong',{text:c.author+' · '+when(c.date)}),el('p',{text:c.body}))):[el('p',{text:'No comments yet.'})]),
   el('label',{class:'gh-field'},'Add a comment',comment),
   el('div',{class:'actions'},el('button',{id:'githubIssueSendComment',text:'Post comment',onclick:()=>task(async()=>{await github.comment(r.owner,r.name,n,comment.value);await issueView(n);status('Comment posted.')})}),
    el('button',{id:'githubIssueState',text:i.state==='open'?'Close issue':'Reopen issue',onclick:()=>task(async()=>{await github.setIssueState(r.owner,r.name,n,i.state==='open'?'closed':'open');await issueView(n);status(i.state==='open'?'Issue closed.':'Issue reopened.')})})));
 }

 // ---- New repository ----
 function newRepoPanel(){
  if(view)return view();
  const name=el('input',{id:'githubRepoName',autocomplete:'off',autocapitalize:'off',spellcheck:'false',placeholder:'my-new-project'}),desc=el('input',{id:'githubRepoDesc',autocomplete:'off'}),priv=el('input',{type:'checkbox',id:'githubRepoPrivate',checked:true});
  panel(el('p',{text:'Creates a new repository in your GitHub account, starting with a README file.'}),el('label',{class:'gh-field'},'Name',name),el('label',{class:'gh-field'},'Description (optional)',desc),el('label',{class:'gh-check'},priv,' Private (only you can see it)'),
   el('div',{class:'actions'},el('button',{id:'githubCreateRepo',class:'primary',text:'Create repository',onclick:()=>task(async()=>{
    const made=await github.createRepo({name:name.value.trim(),description:desc.value,isPrivate:priv.checked});
    repos=await github.repos();$('githubRepo').replaceChildren(...repos.map((x,i)=>el('option',{value:String(i),text:x.full+(x.canPush?'':' (read only)')})));
    const i=repos.findIndex(x=>x.full===made.full);
    if(i>=0){$('githubRepo').value=String(i);section='files';await loadBranches();status('Created '+made.full+'.')}
    else{const was=repos.findIndex(x=>x.full!==made.full);if(was>=0)$('githubRepo').value=String(was);status('Created '+made.full+'. To work on it in ATE, tap "Choose repositories", add it, then tap Refresh.')}})})));
 }

 return {
  open(){showView();status('');if(ensureAdvanced())notice('Switched to Advanced, so GitHub files get colours and syntax checks. You can switch back in the Menu.');$('githubDialog').showModal();if(github.signedIn)task(loadRepos);else $('githubSignIn').focus();},
  // Ask for a note, optionally show what changed, then save one tab. Resolves with the confirmed result.
  save(ref,name,text){
   if(!github.signedIn)return Promise.reject(Error('Sign in to GitHub first: Menu → GitHub. ATE stays signed in only while the page is open.'));
   const folder=ref.path.includes('/')?ref.path.slice(0,ref.path.lastIndexOf('/')+1):'',path=folder+name,isNew=path!==ref.path||!ref.sha;
   if(name.includes('/')||!validPath(path))return Promise.reject(Error('Choose a file name without slashes.'));
   const changes=el('div',{id:'githubSaveChanges'});
   const show=el('button',{id:'githubShowChanges',text:'Show changes',onclick:async()=>{show.disabled=true;try{const old=isNew?'':await github.blobText(ref.owner,ref.repo,ref.sha);changes.replaceChildren(diffView(withContext(lineDiff(old,text)),'Your changes'))}catch(e){changes.replaceChildren(el('p',{text:e.message}))}finally{show.disabled=false}}});
   return ask({title:'Save to GitHub',text:`${ref.owner}/${ref.repo} · branch ${ref.branch} · ${path}`,extra:el('div',{},el('div',{class:'actions'},show),changes),ok:'Save to GitHub',fields:[{id:'note',label:'Note for this change',value:(isNew?'Create ':'Update ')+path}],
    run:async v=>{const res=await github.commit(ref.owner,ref.repo,ref.branch,[{path,text,baseSha:path===ref.path?ref.sha:null,mode:ref.mode}],v.note.trim()||((isNew?'Create ':'Update ')+path));
     const f=res.files[path];if(sameBranch(ref)){const i=files.findIndex(x=>x.path===path);if(i>=0)files[i]=f;else{files.push(f);files.sort((a,b)=>a.path.localeCompare(b.path))}}
     return {name,projectRef:{...ref,path,sha:f.sha,mode:f.mode},message:(path!==ref.path&&ref.sha?'Saved a new GitHub file ':'Saved to GitHub: ')+ref.owner+'/'+ref.repo+' · '+ref.branch+' · '+path+(path!==ref.path&&ref.sha?'. The original file is kept.':'')+' (change '+res.commit.slice(0,7)+')'}}})
    .then(v=>{if(v===null)throw Error('Save to GitHub was cancelled. Nothing was saved.');return v});
  }
 };
}
