
import {createEditor, languageForName} from './editor.js';
const $=id=>document.getElementById(id);
let loading=true;
const editor=createEditor($('editor'),()=>{if(!loading){dirty=true;counts();persist()}});let font=36,dirty=false,pending=null;const key='clear-page-draft-v1';
function notice(msg){$('notice').textContent=msg;$('notice').hidden=!msg}
function counts(){const t=editor.value;const words=t.trim()?t.trim().split(/\s+/u).length:0;$('counts').textContent=`${words.toLocaleString()} ${words===1?'word':'words'} · ${Array.from(t).length.toLocaleString()} characters`}
let closed=false;
function persist(){if(closed)return;try{localStorage.setItem(key,JSON.stringify({text:editor.value,name:$('name').value,font,dark:document.body.classList.contains('dark'),language:$('language').value}));$('status').textContent='Draft saved on this device'}catch(e){$('status').textContent='Draft not saved — use Save file'}}
function updateSize(){$('editor').style.fontSize=font+'px';$('size').textContent=font+'px';$('smaller').disabled=font<=24;$('larger').disabled=font>=72}
function themeLabel(){editor.setDark(document.body.classList.contains('dark'));$('theme').textContent=document.body.classList.contains('dark')?'Light':'Dark';$('theme').setAttribute('aria-label','Switch to '+$('theme').textContent.toLowerCase()+' appearance')}
try{let d=JSON.parse(localStorage.getItem(key));if(d){editor.value=typeof d.text==='string'?d.text:''; $('language').value=['plain','javascript','html','css','python'].includes(d.language)?d.language:languageForName(d.name||'');$('name').value=d.name||'Untitled.txt';font=Math.min(72,Math.max(24,Number(d.font)||36));document.body.classList.toggle('dark',!!d.dark)}}catch(e){$('status').textContent='Use Save file to keep your work'}loading=false;editor.setLanguage($('language').value);counts();updateSize();themeLabel();
$('name').onchange=()=>{setLanguage(languageForName($('name').value));persist()};
function setLanguage(id){$('language').value=id;editor.setLanguage(id)}
$('language').onchange=()=>{editor.setLanguage($('language').value);persist()};
$('indent').onclick=()=>editor.indent();$('unindent').onclick=()=>editor.unindent();
$('smaller').onclick=()=>{font=Math.max(24,font-4);updateSize();persist()};$('larger').onclick=()=>{font=Math.min(72,font+4);updateSize();persist()};$('theme').onclick=()=>{document.body.classList.toggle('dark');themeLabel();persist()};
function save(){let name=$('name').value.trim()||'Untitled.txt';if(!/\.[a-z0-9]+$/i.test(name))name+='.txt';const blob=new Blob([editor.value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);dirty=false;notice('File download started. Your draft is also kept in this browser.');persist()}
$('save').onclick=save;
$('menuButton').onclick=()=>{$('menu').showModal()};
$('closeMenu').onclick=()=>{$('menu').close();editor.focus()};
$('exit').onclick=()=>{$('exitDialog').showModal()};
$('exitCancel').onclick=()=>{$('exitDialog').close();editor.focus()};
function closeEditor(saved){
 try{if(!saved)localStorage.removeItem(key)}catch(e){notice('Could not discard the browser draft. Please keep editing or clear this site’s browser data.');$('exitDialog').close();return}
 closed=true;loading=true;editor.value='';loading=false;dirty=false;counts();
 $('exitDialog').close();leave();document.body.classList.add('closed');$('closed').hidden=false;
 $('closedMessage').textContent=saved?'File download started. Check your Downloads or Files app.':'The browser draft was discarded.';
 $('restart').focus();
}
$('discardExit').onclick=()=>closeEditor(false);
$('saveExit').onclick=()=>{save();closeEditor(true)};
$('restart').onclick=()=>{closed=false;$('closed').hidden=true;document.body.classList.remove('closed');$('name').value='Untitled.txt';setLanguage('plain');notice('');persist();editor.focus()};

function guard(action,title){if(editor.value){pending=action;$('dialogTitle').textContent=title;$('confirm').showModal()}else action()}
$('cancel').onclick=()=>{$('confirm').close();pending=null};$('proceed').onclick=()=>{const fn=pending;pending=null;$('confirm').close();if(fn)fn()};
$('new').onclick=()=>{$('menu').close();guard(()=>{editor.value='';$('name').value='Untitled.txt';setLanguage('plain');dirty=false;counts();persist();notice('');editor.focus()},'Start a new document?')};
$('open').onclick=()=>{$('menu').close();guard(()=>$('file').click(),'Open another document?')};$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>10*1024*1024)throw new Error('Please choose a text file smaller than 10 MB.');const text=await f.text();if(text.includes('\u0000'))throw new Error('This does not look like a plain-text file.');editor.value=text;$('name').value=f.name;setLanguage(languageForName(f.name));dirty=false;counts();persist();notice('Opened '+f.name);editor.focus()}catch(err){notice(err.message||'Could not open this file.')}finally{e.target.value=''}};
$('focus').onclick=async()=>{$('menu').close();document.body.classList.add('focus');try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch(e){}editor.focus()};
async function leave(){document.body.classList.remove('focus');if(document.fullscreenElement)try{await document.exitFullscreen()}catch(e){}}
$('leaveFocus').onclick=leave;document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('focus')});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}if(e.key==='Escape')leave()});window.addEventListener('beforeunload',e=>{if(dirty&&$('status').textContent.startsWith('Draft not')){e.preventDefault();e.returnValue=''}});
