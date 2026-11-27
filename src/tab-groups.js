// Super tabs: open files grouped by where they live — a GitHub repository and branch,
// a Project, or this device. Fixed colours and symbols: repository blue, branch purple,
// file rust (see --c-repo, --c-branch, --c-file in index.html).
import {MAX_PER_GROUP} from './document-tabs.js';

export function groupOf(ref){
 if(ref?.kind==='github')return {key:`gh:${ref.owner}/${ref.repo}@${ref.branch}`,kind:'github',repo:ref.repo,owner:ref.owner,branch:ref.branch,title:`${ref.owner}/${ref.repo} · branch ${ref.branch}`};
 if(ref&&ref.id)return {key:'pr:'+ref.id,kind:'project',repo:'Project',branch:ref.projectName||'files',title:'Project '+(ref.projectName||'')};
 return {key:'device',kind:'device',repo:'My files',branch:'',title:'My files'};
}
// Groups in the order their first tab appears.
export function groupTabs(items){
 const groups=new Map();
 for(const t of items){const g=groupOf(t.projectRef);if(!groups.has(g.key))groups.set(g.key,{...g,tabs:[]});groups.get(g.key).tabs.push(t)}
 return [...groups.values()];
}
export function roomFor(items,ref,max){
 if(items.length>=max)return `Close a tab before opening another (${max} tabs maximum).`;
 const key=groupOf(ref).key;
 if(items.filter(t=>groupOf(t.projectRef).key===key).length>=MAX_PER_GROUP)return `Close a file in this group first (${MAX_PER_GROUP} files per group maximum).`;
 return '';
}

const NS='http://www.w3.org/2000/svg';
function icon(kind){
 const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 16 16');s.setAttribute('aria-hidden','true');s.setAttribute('class','tg-icon tg-icon-'+kind);
 const shapes={
  repo:'<rect x="1" y="1" width="14" height="14" rx="3" class="tg-fill"/><path d="M4.5 6h7M4.5 10h5" class="tg-cut"/>',
  branch:'<path d="M4 4.5v7M12 6.5c0 3.5-8 2.5-8 5" class="tg-line"/><circle cx="4" cy="3" r="2.4" class="tg-fill"/><circle cx="4" cy="13" r="2.4" class="tg-fill"/><circle cx="12" cy="4.5" r="2.4" class="tg-fill"/>',
  folder:'<path d="M1 3.5h5l1.5 2H15v8.5H1z" class="tg-fill"/>',
  device:'<rect x="3" y="1" width="10" height="14" rx="2" class="tg-fill"/><path d="M6.5 12.5h3" class="tg-cut"/>',
  file:'<path d="M2 0.5h7.5l3.5 3.5v11.5H2z" class="tg-fill"/><path d="M5 8h5M5 11h4" class="tg-cut"/>'
 };
 s.innerHTML=shapes[kind];return s;
}
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};

// Draws the tab row. On a narrow screen (phone) the open group's files go in a second row.
export function createTabBar({row,filesRow,workspace,isBusy=()=>false,requestClose,openMenu,openMore,narrowQuery='(max-width: 700px)'}){
 const folded=new Set();let lastActiveGroup=null,last=[];
 const narrow=window.matchMedia?window.matchMedia(narrowQuery):{matches:false};
 narrow.addEventListener?.('change',()=>render(last));
 function short(name){return name.length>24?name.slice(0,9)+'…'+name.slice(-12):name}
 function fileTab(t,items){
  const wrap=el('div','document-tab tg-file'+(t.active?' tg-current':'')),button=el('button'),close=el('button','tg-close','×');
  wrap.setAttribute('role','presentation');button.type=close.type='button';
  button.setAttribute('role','tab');button.dataset.order=String(items.findIndex(x=>x.id===t.id));button.setAttribute('aria-selected',String(t.active));button.tabIndex=t.active?0:-1;
  const full=t.name||'Untitled';button.title=full;button.append(icon('file'),el('span','tg-name',short(full)+(t.dirty?' •':'')));
  button.setAttribute('aria-label',full+(t.dirty?', unsaved changes':''));
  button.onclick=()=>{if(!isBusy())workspace.activate(t.id)};
  button.onkeydown=e=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(e.key)||isBusy())return;e.preventDefault();const index=items.findIndex(x=>x.id===t.id);const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;workspace.activate(items[next].id);document.querySelector('[role=tab][aria-selected=true]')?.focus()};
  close.setAttribute('aria-label','Close '+full);close.onclick=()=>requestClose(t.id);
  wrap.append(button,close);return wrap;
 }
 function render(items){
  last=items;
  const groups=groupTabs(items),activeGroup=groups.find(g=>g.tabs.some(t=>t.active));
  // The group holding the file you are working on always opens.
  if(activeGroup&&activeGroup.key!==lastActiveGroup){folded.delete(activeGroup.key);lastActiveGroup=activeGroup.key}
  row.textContent='';filesRow.textContent='';
  const isNarrow=narrow.matches,flat=groups.flatMap(g=>g.tabs);
  filesRow.hidden=!isNarrow;
  for(const g of groups){
   const open=!folded.has(g.key),current=g===activeGroup,changed=g.tabs.filter(t=>t.dirty).length;
   const box=el('div','tg-group'+(open?' tg-open':'')+(current?' tg-active':''));box.dataset.group=g.key;box.setAttribute('role','presentation');
   const chip=el('button','tg-chip');chip.type='button';chip.title=`${g.title} · ${g.tabs.length} ${g.tabs.length===1?'file':'files'}${changed?`, ${changed} not saved`:''}`;
   chip.setAttribute('aria-expanded',String(open));chip.setAttribute('aria-label',chip.title+(open?', open':', folded'));
   chip.append(el('span','tg-arrow',open?'▾':'▸'),icon(g.kind==='device'?'device':'repo'),el('span','tg-repo',g.repo));
   if(g.branch)chip.append(icon(g.kind==='github'?'branch':'folder'),el('span','tg-branch',g.branch));
   chip.append(el('span','tg-count','· '+g.tabs.length));
   if(changed)chip.append(el('span','tg-unsaved','●'+changed));
   chip.onclick=()=>{if(isBusy())return;if(isNarrow){if(!current)workspace.activate(g.tabs[0].id);return}if(open)folded.add(g.key);else folded.delete(g.key);render(last)};
   const more=el('button','tg-menu','⋯');more.type='button';more.setAttribute('aria-label','More for '+g.title);more.onclick=()=>{if(!isBusy())openMenu(g,{fold:()=>{folded.add(g.key);render(last)},open:()=>{folded.delete(g.key);render(last)},folded:!open})};
   box.append(chip,more);row.append(box);
   const target=isNarrow?(current?filesRow:null):(open?box:null);
   let shown=[];
   if(target){
    // Long groups: show up to 5 files plus the current one, and a "+N more" list for the rest.
    shown=g.tabs;if(g.tabs.length>6){shown=g.tabs.slice(0,5);const cur=g.tabs.find(t=>t.active);if(cur&&!shown.includes(cur))shown=[...shown,cur]}
    for(const t of shown)target.append(fileTab(t,flat));
    if(shown.length<g.tabs.length){const m=el('button','tg-more','+'+(g.tabs.length-shown.length)+' more');m.type='button';m.setAttribute('aria-label',`Show all ${g.tabs.length} files in ${g.title}`);m.onclick=()=>openMore(g);target.append(m)}
   }
   // Files not on show (folded group, another group on a phone, or behind "+N more") stay in the page,
   // hidden, so the tab list keeps every open file in order (keyboard order, tests).
   const rest=g.tabs.filter(t=>!shown.includes(t));
   if(rest.length){const hold=el('div','tg-hidden');hold.hidden=true;for(const t of rest)hold.append(fileTab(t,flat));box.append(hold)}
  }
  filesRow.hidden=!isNarrow||!filesRow.children.length;
  requestAnimationFrame(()=>{(filesRow.hidden?row:filesRow).querySelector('.tg-current')?.scrollIntoView?.({block:'nearest',inline:'nearest'});row.querySelector('.tg-active')?.scrollIntoView?.({block:'nearest',inline:'nearest'})});
 }
 return {render};
}
