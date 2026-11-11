import {saveText,native} from './platform.js';

import {createEditor, languageForName} from './editor.js';
const $=id=>document.getElementById(id);
let loading=true;
const editor=createEditor($('editor'),()=>{if(!loading){dirty=true;counts();persist()}});let font=27,dirty=false,pending=null;const key='clear-page-draft-v1';const prefsKey='clear-page-preferences-v1';
function notice(msg){$('notice').textContent=msg;$('notice').hidden=!msg}
function counts(){const t=editor.value;const words=t.trim()?t.trim().split(/\s+/u).length:0;$('counts').textContent=`${words.toLocaleString()} ${words===1?'word':'words'} · ${Array.from(t).length.toLocaleString()} characters`}
let closed=false;
function persist(){if(closed)return;try{localStorage.setItem(key,JSON.stringify({text:editor.value,name:$('name').value,fontPt:font,dark:document.body.classList.contains('dark'),language:$('language').value}));$('status').textContent='Draft saved on this device'}catch(e){$('status').textContent='Draft not saved — use Save file'}}
function persistPreferences(){try{localStorage.setItem(prefsKey,JSON.stringify({fontPt:font,buttonStyle:$('buttonStyle').value,editingMode:$('editingMode').value,dark:document.body.classList.contains('dark')}))}catch(e){}}
function updateSize(){$('editor').style.fontSize=font+'pt';$('fontSize').value=font;$('smaller').disabled=font<=10;$('larger').disabled=font>=54}
function setFont(value){if(!Number.isFinite(value)){updateSize();return}font=Math.min(54,Math.max(10,Math.round(value)));updateSize();persistPreferences();persist()}
function themeLabel(){editor.setDark(document.body.classList.contains('dark'));const label=document.body.classList.contains('dark')?'Light':'Dark';$('theme').querySelector('.control-label').textContent=label;$('theme').setAttribute('aria-label','Switch to '+label.toLowerCase()+' appearance');$('theme').title=$('theme').getAttribute('aria-label')}
try{let d=JSON.parse(localStorage.getItem(key));if(d){editor.value=typeof d.text==='string'?d.text:''; $('language').value=['plain','javascript','html','css','python'].includes(d.language)?d.language:languageForName(d.name||'');$('name').value=d.name||'Untitled.txt';font=Math.min(54,Math.max(10,Number(d.fontPt)||(Number(d.font)||36)*.75));document.body.classList.toggle('dark',!!d.dark)}}catch(e){$('status').textContent='Use Save file to keep your work'}try{const p=JSON.parse(localStorage.getItem(prefsKey));if(p){font=Math.min(54,Math.max(10,Number(p.fontPt)||font));$('buttonStyle').value=p.buttonStyle==='icons'?'icons':'text';$('editingMode').value=p.editingMode==='vim'?'vim':'standard';document.body.classList.toggle('dark',!!p.dark)}}catch(e){}
setupIcons();applyButtonStyle();
loading=false;editor.setLanguage($('language').value);counts();updateSize();themeLabel();editor.setVim($('editingMode').value==='vim');
$('name').onchange=()=>{setLanguage(languageForName($('name').value));persist()};
function setLanguage(id){$('language').value=id;editor.setLanguage(id)}
$('language').onchange=()=>{editor.setLanguage($('language').value);persist()};
$('indent').onclick=()=>editor.indent();$('unindent').onclick=()=>editor.unindent();
$('smaller').onclick=()=>setFont(font-1);$('larger').onclick=()=>setFont(font+1);$('fontSize').oninput=()=>{const value=$('fontSize').valueAsNumber;if(Number.isFinite(value)&&value>=10&&value<=54){font=value;$('editor').style.fontSize=font+'pt';$('smaller').disabled=font<=10;$('larger').disabled=font>=54;persistPreferences();persist()}};$('fontSize').onchange=()=>setFont($('fontSize').valueAsNumber);$('buttonStyle').onchange=()=>{applyButtonStyle();persistPreferences()};$('theme').onclick=()=>{document.body.classList.toggle('dark');themeLabel();persistPreferences();persist()};
let saving=false;
async function save(){if(saving)return false;saving=true;try{let name=$('name').value.trim()||'Untitled.txt';if(!/\.[a-z0-9]+$/i.test(name))name+='.txt';notice(await saveText(editor.value,name));dirty=false;persist();return true}catch(e){notice('Save was cancelled or could not complete. Your draft is kept.');return false}finally{saving=false}}
$('save').onclick=save;
$('menuButton').onclick=()=>{$('menu').showModal()};
$('closeMenu').onclick=()=>{$('menu').close();editor.focus()};
$('exit').onclick=()=>{$('exitDialog').showModal()};
$('exitCancel').onclick=()=>{$('exitDialog').close();editor.focus()};
function closeEditor(saved){
 try{if(!saved)localStorage.removeItem(key)}catch(e){notice('Could not discard the browser draft. Please keep editing or clear this site’s browser data.');$('exitDialog').close();return}
 closed=true;loading=true;editor.value='';loading=false;dirty=false;counts();
 $('exitDialog').close();leave();document.body.classList.add('closed');$('closed').hidden=false;
 $('closedMessage').textContent=saved?(native?'Save/share sheet closed. Your recovery draft is kept.':'File download started. Check your Downloads or Files app.'):'The browser draft was discarded.';
 $('restart').focus();
}
$('discardExit').onclick=()=>closeEditor(false);
$('saveExit').onclick=async()=>{if(await save())closeEditor(true)};
$('restart').onclick=()=>{closed=false;$('closed').hidden=true;document.body.classList.remove('closed');$('name').value='Untitled.txt';setLanguage('plain');notice('');persist();editor.focus()};

function guard(action,title){if(editor.value){pending=action;$('dialogTitle').textContent=title;$('confirm').showModal()}else action()}
$('cancel').onclick=()=>{$('confirm').close();pending=null};$('proceed').onclick=()=>{const fn=pending;pending=null;$('confirm').close();if(fn)fn()};
$('new').onclick=()=>{$('menu').close();guard(()=>{editor.value='';$('name').value='Untitled.txt';setLanguage('plain');dirty=false;counts();persist();notice('');editor.focus()},'Start a new document?')};
$('open').onclick=()=>{$('menu').close();guard(()=>$('file').click(),'Open another document?')};$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>10*1024*1024)throw new Error('Please choose a text file smaller than 10 MB.');const text=await f.text();if(text.includes('\u0000'))throw new Error('This does not look like a plain-text file.');editor.value=text;$('name').value=f.name;setLanguage(languageForName(f.name));dirty=false;counts();persist();notice('Opened '+f.name);editor.focus()}catch(err){notice(err.message||'Could not open this file.')}finally{e.target.value=''}};
$('focus').onclick=async()=>{$('menu').close();document.body.classList.add('focus');try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch(e){}editor.focus()};
async function leave(){document.body.classList.remove('focus');if(document.fullscreenElement)try{await document.exitFullscreen()}catch(e){}}
$('leaveFocus').onclick=leave;document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('focus')});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}if(e.key==='Escape')leave()});window.addEventListener('beforeunload',e=>{if(dirty&&$('status').textContent.startsWith('Draft not')){e.preventDefault();e.returnValue=''}});

function applyButtonStyle(){document.body.classList.toggle('icons',$('buttonStyle').value==='icons')}
function setupIcons(){
 const paths={search:'M10 3a7 7 0 100 14 7 7 0 000-14M15 15l6 6',goToLine:'M3 6h18M3 12h18M3 18h18M7 3v18',selectAll:'M3 3h18v18H3zM7 7h10v10H7z',copy:'M8 8h13v13H8zM16 8V3H3v13h5',helpButton:'M9 8a3 3 0 116 0c0 2-3 2-3 5M12 17h.01M12 2a10 10 0 100 20 10 10 0 000-20',menuButton:'M4 6h16M4 12h16M4 18h16',exit:'M10 4H4v16h6M14 8l4 4-4 4M8 12h12',save:'M5 3h12l4 4v14H3V3h2M7 3v6h10V3M7 21v-8h10v8',new:'M6 3h8l4 4v14H6zM14 3v5h4M9 14h6M12 11v6',open:'M3 8V5h6l2 3h10v12H3z',closeMenu:'M5 12l4 4L19 6',indent:'M10 5h11M10 12h11M10 19h11M3 8l4 4-4 4',unindent:'M10 5h11M10 12h11M10 19h11M7 8l-4 4 4 4',smaller:'M3 19L8 5l5 14M5 14h6M16 12h6',larger:'M3 19L8 5l5 14M5 14h6M16 12h6M19 9v6',theme:'M12 3a9 9 0 100 18V3zM12 3a9 9 0 010 18',focus:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',leaveFocus:'M3 8h5V3M21 8h-5V3M8 21v-5H3M16 21v-5h5'};
 for(const [id,path] of Object.entries(paths)){const b=$(id),label=b.textContent;b.classList.add('icon-button');b.setAttribute('aria-label',b.getAttribute('aria-label')||label);b.title=b.getAttribute('aria-label');b.innerHTML='<svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg><span class="control-label"></span>';b.querySelector('.control-label').textContent=label}
}

$('editingMode').onchange=()=>{editor.setVim($('editingMode').value==='vim');persistPreferences()};
$('search').onclick=()=>{$('menu').close();editor.search()};
$('goToLine').onclick=()=>{$('menu').close();editor.goToLine()};
$('selectAll').onclick=()=>{$('menu').close();editor.selectAll()};
$('copy').onclick=async()=>{const text=editor.selectedText();if(!text){$('menu').close();notice('Select text first, or choose Select all.');return}try{await navigator.clipboard.writeText(text);$('menu').close();notice('Copied selection to clipboard.')}catch(e){$('menu').close();$('copyText').value=text;$('copyDialog').showModal();$('copyText').select()}};
$('closeCopy').onclick=()=>{$('copyDialog').close();editor.focus()};
$('helpButton').onclick=()=>{$('menu').close();$('help').showModal();$('help').scrollTop=0};
$('closeHelp').onclick=()=>{$('help').close();editor.focus()};
editor.commands(save,()=>{$('exitDialog').showModal()},async()=>{if(await save())closeEditor(true)});
