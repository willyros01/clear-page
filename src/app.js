// Match the worker compatibility layer for Android 11 / older Fire WebViews.
import 'core-js/actual/object/has-own.js';
import 'core-js/actual/string/replace-all.js';
import 'core-js/actual/array/at.js';
import 'core-js/actual/string/at.js';
import {setupLegal} from './legal.js';
import {setupPreview} from './preview.js';
import {setupIOSViewport} from './ios-viewport.js';
import {setupProjects} from './project-ui.js';
import {createDocumentTabs} from './document-tabs.js';
import {createGitHub} from './github.js';
import {setupGitHub} from './github-ui.js';
import {Capacitor} from '@capacitor/core';
import {openAndroid} from './android-files.js';
import {saveText,native,desktop,closePlatform,handleDesktopExit,handleBack} from './platform.js';

import {createEditor} from './editor.js';
import {languageForDocument} from './languages.js';
import {languages} from './editor.js';
import {setupSyntax} from './syntax-ui.js';
import {checkC,chooseCCompiler,chooseCProject,compilerSetupInfo,installCCompiler,cancelCompilerSetup,appSandboxed} from './desktop.js';
const $=id=>document.getElementById(id);
const legal=setupLegal({document,storage:localStorage,openLink:desktop?(url)=>window.__TAURI_INTERNALS__.invoke('open_public_link',{url}):null});
const ios=Capacitor.getPlatform()==='ios',tabbed=true;
const iosViewport=native?setupIOSViewport():null;
// iOS file-provider UTIs can classify .sql and extensionless source as non-text.
// Let users choose a file, then validate its bytes before opening/copying it.
for(const id of ['file','projectFiles'])document.getElementById(id).removeAttribute('accept');
let workspace=null,projects=null,githubUi=null,loading=true,syntax=null,languageManual=false,advanced=true,closingApplication=false;
if(tabbed)try{const p=JSON.parse(localStorage.getItem('clear-page-preferences-v1')||'null');advanced=p?.experienceMode? p.experienceMode==='advanced':!!(p||localStorage.getItem('clear-page-workspace-v1')||localStorage.getItem('clear-page-draft-v1'));}catch{advanced=false}
const editor=createEditor($('editor'),()=>{if(!loading){closingApplication=false;dirty=true;counts();persist();syntax?.changed()}});let font=27,dirty=false,pending=null;const key='clear-page-draft-v1';const prefsKey='clear-page-preferences-v1';
function notice(msg){$('notice').textContent=msg;$('notice').hidden=!msg}
function counts(){const t=editor.value;const words=t.trim()?t.trim().split(/\s+/u).length:0;$('counts').textContent=`${words.toLocaleString()} ${words===1?'word':'words'} · ${Array.from(t).length.toLocaleString()} characters`}
function persist(){if(workspace&&!loading){workspace.edit();return}try{localStorage.setItem(key,JSON.stringify({text:editor.value,name:$('name').value,fontPt:font,dark:document.body.classList.contains('dark'),language:$('language').value,languageManual}));$('status').textContent='Draft saved on this device'}catch(e){$('status').textContent='Draft not saved — use Save file'}}
function persistPreferences(){try{localStorage.setItem(prefsKey,JSON.stringify({fontPt:font,buttonStyle:$('buttonStyle').value,editingMode:$('editingMode').value,dark:document.body.classList.contains('dark'),experienceMode:advanced?'advanced':'basic'}))}catch(e){}}
function updateSize(){$('editor').style.fontSize=font+'pt';$('fontSize').value=font;$('smaller').disabled=font<=10;$('larger').disabled=font>=54}
function setFont(value){if(!Number.isFinite(value)){updateSize();return}font=Math.min(54,Math.max(10,Math.round(value)));updateSize();persistPreferences();persist()}
function themeLabel(){editor.setDark(document.body.classList.contains('dark'));const label=document.body.classList.contains('dark')?'Light':'Dark';$('theme').querySelector('.control-label').textContent=label;$('theme').setAttribute('aria-label','Switch to '+label.toLowerCase()+' appearance');$('theme').title=$('theme').getAttribute('aria-label')}
try{let d=JSON.parse(localStorage.getItem(key));if(d){languageManual=!!d.languageManual;editor.value=typeof d.text==='string'?d.text:''; $('language').value=languageManual&&Object.prototype.hasOwnProperty.call(languages,d.language)?d.language:languageForDocument(d.name||'',editor.value);$('name').value=d.name||'Untitled';font=Math.min(54,Math.max(10,Number(d.fontPt)||(Number(d.font)||36)*.75));document.body.classList.toggle('dark',!!d.dark)}}catch(e){$('status').textContent='Use Save file to keep your work'}try{const p=JSON.parse(localStorage.getItem(prefsKey));if(p){font=Math.min(54,Math.max(10,Number(p.fontPt)||font));$('buttonStyle').value=p.buttonStyle==='icons'?'icons':'text';$('editingMode').value=p.editingMode==='vim'?'vim':'standard';document.body.classList.toggle('dark',!!p.dark)}}catch(e){}
if(native){$('exit').textContent='Close';$('exit').setAttribute('aria-label','Close document');$('exitTitle').textContent='Close the document?';$('saveExit').textContent='Save and close';$('discardExit').textContent='Close without saving'}
setupIcons();applyButtonStyle();
loading=false;editor.setLanguage(advanced?$('language').value:'plain');counts();updateSize();themeLabel();editor.setVim(advanced&&$('editingMode').value==='vim');
function commitFilename(){if(!$('name').value.trim())$('name').value='Untitled';dirty=true;if(!languageManual)setLanguage(languageForDocument($('name').value,editor.value));persist()}
$('name').onchange=commitFilename;
$('name').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();commitFilename();$('name').blur()}});
function leaveMenu({focus=!native}={}){commitFilename();if(document.activeElement instanceof HTMLElement)document.activeElement.blur();$('menu').close();iosViewport?.restore();if(focus)editor.focus()}

function setLanguage(id){languageManual=false;$('language').value=id;editor.setLanguage(advanced?id:'plain');syntax?.changed()}
$('language').onchange=()=>{languageManual=true;editor.setLanguage(advanced?$('language').value:'plain');syntax?.changed();persist()};
$('indent').onclick=()=>editor.indent();$('unindent').onclick=()=>editor.unindent();
$('smaller').onclick=()=>setFont(font-1);$('larger').onclick=()=>setFont(font+1);$('fontSize').oninput=()=>{const value=$('fontSize').valueAsNumber;if(Number.isFinite(value)&&value>=10&&value<=54){font=value;$('editor').style.fontSize=font+'pt';$('smaller').disabled=font<=10;$('larger').disabled=font>=54;persistPreferences();persist()}};$('fontSize').onchange=()=>setFont($('fontSize').valueAsNumber);$('buttonStyle').onchange=()=>{applyButtonStyle();persistPreferences()};$('theme').onclick=()=>{document.body.classList.toggle('dark');themeLabel();persistPreferences();persist()};
let saving=false;
async function save(){if(legal.required())return false;if(saving)return false;saving=true;try{let name=$('name').value||'Untitled';const text=editor.value,tabId=workspace?.current.id,ref=workspace?.current.projectRef;const result=ref?.kind==='github'?await githubUi.save(ref,name,text):ref?await projects.save(ref,name,text):await saveText(text,name);notice(typeof result==='string'?result:result.message);if(result?.name&&(!workspace||workspace.current.id===tabId)&&$('name').value===name&&result.name!==name){$('name').value=result.name;if(!languageManual)setLanguage(languageForDocument(result.name,editor.value));}dirty=editor.value!==text;if(workspace)workspace.saved(tabId,text,result?.name||name,result?.projectRef);else persist();return true}catch(e){notice((workspace?.current.projectRef?e.message+' ':'Save was cancelled or could not complete. ')+'Your draft is kept.');return false}finally{saving=false}}
$('save').onclick=save;
$('menuButton').onclick=()=>{previewUi.update();$('menu').showModal();$('menu').scrollTop=0;iosViewport?.restore()};
$('closeMenu').onclick=()=>leaveMenu();
$('menu').addEventListener('cancel',()=>{commitFilename();if(document.activeElement instanceof HTMLElement)document.activeElement.blur();iosViewport?.restore()});
let closingTabId=null;
function requestExit(){if(legal.required()){legal.show();return}if(saving){notice('Wait for the current save to finish.');return}projects?.dismiss();closingTabId=null;$('exitTitle').textContent='Exit ATE?';$('exitDialog').querySelector('p').textContent='Save open files before exiting, or discard unsaved changes. Saved project and device files are kept.';$('saveExit').textContent='Save and exit';$('discardExit').textContent='Exit without saving';$('exitDialog').showModal()}
if(!ios){$('exit').querySelector('.control-label').textContent='Exit';$('exit').setAttribute('aria-label','Exit')}
$('exit').onclick=()=>ios?requestClose(workspace.current.id):requestExit();
$('exitCancel').onclick=()=>{closingTabId=null;$('exitDialog').close();editor.focus()};
async function closeEditor(saved){
 if(workspace&&closingTabId!==null){workspace.close(closingTabId);closingTabId=null;$('exitDialog').close();return}
 if(workspace){closingApplication=true;workspace.clear({keepRecovery:saved});if(!saved)try{localStorage.removeItem(key)}catch{}$('exitDialog').close();notice('');for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();await leave();document.activeElement?.blur();try{await closePlatform()}catch{notice('Your files are closed. You can close the window now.')}return}

 try{if(!saved)localStorage.removeItem(key)}catch(e){notice('Could not discard the draft. Please keep editing or clear this app’s data.');$('exitDialog').close();return}
 loading=true;editor.value='';loading=false;dirty=false;pending=null;
 $('name').value='Untitled';setLanguage('plain');counts();notice('');
 for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
 leave();
 const active=document.activeElement;if(active instanceof HTMLElement)active.blur();
 try{await closePlatform()}catch(e){notice('The document is closed. You can close the window now.')}
}
handleDesktopExit(()=>{if(!$('exitDialog').open)requestExit()});
handleBack(()=>{if(legal.required()){legal.show();return}const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length){dialogs[dialogs.length-1].close();editor.focus()}else requestExit()});
$('discardExit').onclick=()=>closeEditor(false);
$('saveExit').onclick=async()=>{
 if(saving)return;
 if(closingTabId!==null){if(await save()){if(workspace.current.dirty){notice('New changes were made during saving. Save again before closing.');return}await closeEditor(true)}return}
 const active=workspace.current.id,dirty=workspace.documents().filter(t=>t.dirty),ids=[active,...dirty.map(t=>t.id).filter(id=>id!==active)];
 for(const id of ids){workspace.activate(id);if(!await save()||workspace.current.dirty){workspace.activate(active);notice('Exit cancelled. Your open files and drafts are kept.');return}}
 if(workspace.documents().some(t=>t.dirty)){notice('New changes were made during saving. Save again before exiting.');return}
 await closeEditor(true);
};

function guard(action,title){if(editor.value){pending=action;$('dialogTitle').textContent=title;$('confirm').showModal()}else action()}
$('cancel').onclick=()=>{$('confirm').close();pending=null};$('proceed').onclick=()=>{const fn=pending;pending=null;$('confirm').close();if(fn)fn()};
$('new').onclick=()=>{if(saving)return;closingApplication=false;$('menu').close();if(workspace){if(!workspace.add())notice('Close a tab before opening another (12 tabs maximum).');return}guard(()=>{editor.value='';$('name').value='Untitled';setLanguage('plain');dirty=false;counts();persist();notice('');editor.focus()},'Start a new document?')};
function opened(text,name,projectRef=null){closingApplication=false;text=text.replace(/\r\n?/g,'\n');if(workspace){if(!workspace.add(text,name,languageForDocument(name,text),projectRef))notice('Close a tab before opening another (12 tabs maximum).');else notice('Opened '+name);return}editor.value=text;$('name').value=name;setLanguage(languageForDocument(name,text));dirty=false;counts();persist();notice('Opened '+name);editor.focus()}
async function chooseOpen(){if(Capacitor.getPlatform()==='android'){try{const result=await openAndroid();opened(result.text,result.name)}catch(error){notice(error.message||'Open was cancelled. Your draft is kept.')}}else $('file').click()}
$('open').onclick=()=>{if(saving)return;$('menu').close();workspace?chooseOpen():guard(chooseOpen,'Open another document?')};$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>10*1024*1024)throw new Error('Please choose a text file smaller than 10 MB.');const text=typeof f.arrayBuffer==='function'?new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await f.arrayBuffer()):await f.text();if(text.includes('\u0000'))throw new Error('This does not look like a plain-text file.');opened(text,f.name)}catch(err){notice(err.message||'Could not open this file.')}finally{e.target.value=''}};
$('focus').onclick=async()=>{$('menu').close();document.body.classList.add('focus');try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch(e){}editor.focus()};
async function leave(){document.body.classList.remove('focus');if(document.fullscreenElement)try{await document.exitFullscreen()}catch(e){}}
$('leaveFocus').onclick=leave;document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('focus')});document.addEventListener('keydown',e=>{if(legal.required())return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}if(e.key==='Escape')leave()});window.addEventListener('beforeunload',e=>{if((workspace?workspace.list().some(t=>t.dirty):dirty)&&$('status').textContent.startsWith('Draft not')){e.preventDefault();e.returnValue=''}});

function applyButtonStyle(){document.body.classList.toggle('icons',$('buttonStyle').value==='icons')}
function setupIcons(){
 const paths={search:'M10 3a7 7 0 100 14 7 7 0 000-14M15 15l6 6',goToLine:'M3 6h18M3 12h18M3 18h18M7 3v18',selectAll:'M3 3h18v18H3zM7 7h10v10H7z',copy:'M8 8h13v13H8zM16 8V3H3v13h5',preview:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6',helpButton:'M9 8a3 3 0 116 0c0 2-3 2-3 5M12 17h.01M12 2a10 10 0 100 20 10 10 0 000-20',menuButton:'M4 6h16M4 12h16M4 18h16',exit:'M10 4H4v16h6M14 8l4 4-4 4M8 12h12',save:'M5 3h12l4 4v14H3V3h2M7 3v6h10V3M7 21v-8h10v8',new:'M6 3h8l4 4v14H6zM14 3v5h4M9 14h6M12 11v6',open:'M3 8V5h6l2 3h10v12H3z',closeMenu:'M5 12l4 4L19 6',indent:'M10 5h11M10 12h11M10 19h11M3 8l4 4-4 4',unindent:'M10 5h11M10 12h11M10 19h11M7 8l-4 4 4 4',smaller:'M3 19L8 5l5 14M5 14h6M16 12h6',larger:'M3 19L8 5l5 14M5 14h6M16 12h6M19 9v6',theme:'M12 3a9 9 0 100 18V3zM12 3a9 9 0 010 18',focus:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',leaveFocus:'M3 8h5V3M21 8h-5V3M8 21v-5H3M16 21v-5h5'};
 for(const [id,path] of Object.entries(paths)){const b=$(id),label=b.textContent;b.classList.add('icon-button');b.setAttribute('aria-label',b.getAttribute('aria-label')||label);b.title=b.getAttribute('aria-label');b.innerHTML='<svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg><span class="control-label"></span>';b.querySelector('.control-label').textContent=label}
}

$('editingMode').onchange=()=>{editor.setVim(advanced&&$('editingMode').value==='vim');persistPreferences()};
$('search').onclick=()=>{$('menu').close();editor.search()};
$('goToLine').onclick=()=>{$('menu').close();editor.goToLine()};
$('selectAll').onclick=()=>{$('menu').close();editor.selectAll()};
$('copy').onclick=async()=>{const text=editor.selectedText();if(!text){$('menu').close();notice('Select text first, or choose Select all.');return}try{await navigator.clipboard.writeText(text);$('menu').close();notice('Copied selection to clipboard.')}catch(e){$('menu').close();$('copyText').value=text;$('copyDialog').showModal();$('copyText').select()}};
$('closeCopy').onclick=()=>{$('copyDialog').close();editor.focus()};
const previewUi=setupPreview({document,$,editor,getLanguage:()=>$('language').value,getName:()=>$('name').value||'Untitled'});
$('helpButton').onclick=()=>{$('menu').close();$('help').showModal();$('help').scrollTop=0};
$('closeHelp').onclick=()=>{$('help').close();editor.focus()};
editor.commands(save,()=>{$('exit').click()},async()=>{if(ios){closingTabId=workspace.current.id;if(await save()&&!workspace.current.dirty)await closeEditor(true)}else{requestExit();await $('saveExit').onclick()}});
syntax=setupSyntax({editor,getDocument:()=>({text:editor.value,language:$('language').value,name:$('name').value}),nativeCheck:checkC,chooseCompiler:chooseCCompiler,chooseProject:chooseCProject,compilerSetupInfo,installCCompiler,cancelCompilerSetup,desktop,isSandboxed:desktop?appSandboxed:null,isEnabled:()=>advanced,keepIdleWorker:Capacitor.getPlatform()==='android'});


function requestClose(id){
 if(saving){notice('Wait for the current save to finish.');return}
 workspace.activate(id);closingTabId=id;$('saveExit').textContent='Save and close';$('discardExit').textContent='Close without saving';$('exitDialog').querySelector('p').textContent='Save a copy before closing this tab, or discard its unsaved changes. Other tabs and saved files are kept.';
 if(workspace.current.dirty){$('exitTitle').textContent='Close '+workspace.current.name+'?';$('exitDialog').showModal()}
 else {workspace.close(id);closingTabId=null;}
}
if(tabbed){
 $('tabs').hidden=false;$('documentBar').hidden=false;if(ios)$('exit').setAttribute('aria-label','Close current tab');
 $('exitDialog').querySelector('p').textContent='Save a copy before closing, or discard this tab’s unsaved changes. Other tabs and existing files are kept.';
 workspace=createDocumentTabs({editor,storage:localStorage,preserveScroll:Capacitor.getPlatform()==='android',
 getMeta:()=>({name:$('name').value,language:$('language').value,manual:languageManual}),
 setMeta:t=>{loading=true;$('name').value=t.name;const id=!t.manual&&!t.state?languageForDocument(t.name,t.text):t.language;$('language').value=languages[id]?id:'plain';t.language=$('language').value;languageManual=!!t.manual;editor.setLanguage(advanced?$('language').value:'plain');editor.setDark(document.body.classList.contains('dark'));editor.setVim(advanced&&$('editingMode').value==='vim');dirty=!!t.dirty;},
 changed:()=>{loading=false;counts();syntax?.changed()},
 status:ok=>{$('status').textContent=ok?'Tabs recovered on this device':'Draft not saved — use Save file';$('recoveryWarning').hidden=ok},
 render:items=>{
  $('tabs').textContent='';
  for(const t of items){const group=document.createElement('div'),button=document.createElement('button'),close=document.createElement('button');
   group.className='document-tab';group.setAttribute('role','presentation');button.type=close.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected',String(t.active));button.tabIndex=t.active?0:-1;button.onkeydown=e=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(e.key)||saving)return;e.preventDefault();const index=items.findIndex(x=>x.id===t.id);const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;workspace.activate(items[next].id);$('tabs').querySelector('[aria-selected=true]').focus()};const full=t.name||'Untitled';button.title=full;button.textContent=(full.length>24?full.slice(0,9)+'…'+full.slice(-12):full)+(t.dirty?' •':'');button.setAttribute('aria-label',(t.name||'Untitled')+(t.dirty?', unsaved changes':''));button.onclick=()=>{if(!saving)workspace.activate(t.id)};
   close.textContent='×';close.setAttribute('aria-label','Close '+t.name);close.onclick=()=>requestClose(t.id);group.append(button,close);$('tabs').append(group);if(t.active)requestAnimationFrame(()=>group.scrollIntoView({block:'nearest',inline:'nearest'}));
  }
 }
 });
 workspace.init({text:editor.value,name:$('name').value,language:$('language').value,manual:languageManual});
 // Convert legacy recovery only after the complete workspace is durably stored.
 if(workspace.persist())try{localStorage.removeItem(key)}catch{}
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&!closingApplication)workspace.persist()});
}

function applyExperience(){
 document.body.classList.toggle('basic-mode',!advanced);
 $('basicMode').setAttribute('aria-pressed',String(!advanced));$('advancedMode').setAttribute('aria-pressed',String(advanced));
 editor.setLanguage(advanced?$('language').value:'plain');editor.setVim(advanced&&$('editingMode').value==='vim');syntax?.changed();
}
if(tabbed){
 $('experienceModes').hidden=false;$('projectsButton').hidden=false;$('exportCopy').hidden=false;
 projects=setupProjects({workspace,openDocument:opened,canChange:()=>!saving,notice,exclusive:async fn=>{if(saving)throw Error('Finish the current save first.');saving=true;try{return await fn()}finally{saving=false}}});
 githubUi=setupGitHub({github:createGitHub(),workspace,opened,notice,isAdvanced:()=>advanced,markSaved:(id,text,name,ref)=>{const active=workspace.current.id===id;if(active)$('name').value=name;workspace.saved(id,text,name,ref);if(active)dirty=editor.value!==text},replaceText:text=>editor.replace(text)});
 $('githubButton').onclick=()=>{if(saving)return;$('menu').close();githubUi.open()};
 $('basicMode').onclick=()=>{advanced=false;applyExperience();persistPreferences()};
 $('advancedMode').onclick=()=>{advanced=true;applyExperience();persistPreferences()};
 $('exportCopy').onclick=async()=>{if(saving)return;leaveMenu({focus:false});saving=true;try{notice(await saveText(editor.value,$('name').value.split('/').pop()||'Untitled'))}catch{notice('Export cancelled or unavailable. Your editor tab is kept.')}finally{saving=false;iosViewport?.restore()}};
 applyExperience();persistPreferences();
}

// Touch devices: hide the bottom line while the on-screen keyboard takes the screen.
if(window.visualViewport&&matchMedia('(pointer:coarse)').matches){const vv=window.visualViewport;let base=0,wide=innerWidth>innerHeight;const keyboard=()=>{const now=innerWidth>innerHeight;if(now!==wide){wide=now;base=0}base=Math.max(base,vv.height);document.documentElement.classList.toggle('keyboard-up',vv.height<base*0.75)};vv.addEventListener('resize',keyboard);addEventListener('resize',keyboard);keyboard()}

// Vim: show the mode (NORMAL, INSERT…) in the bottom line instead of a separate strip;
// the strip still appears while a Vim command (:w, /search) or message is shown.
{const show=t=>{for(const id of ['vimMode','vimModeTop']){const e=$(id);if(e.textContent!==t)e.textContent=t;e.hidden=!t}};
 const sync=()=>{const p=$('editor').querySelector('.cm-vim-panel');if(!p){show('');return}const text=p.textContent.trim(),plain=!p.querySelector('input')&&/^--[^-].*?--/.test(text);if(p.classList.contains('vim-status-only')!==plain)p.classList.toggle('vim-status-only',plain);show(plain?text.replace(/^--(.*?)--/,'$1').trim():'')};
 new MutationObserver(sync).observe($('editor'),{childList:true,subtree:true,characterData:true});sync()}
