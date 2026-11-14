import {createProjectStore} from '../src/projects.js';
import {iosProjectAdapter} from '../src/ios-projects.js';
import {EditorView} from '@codemirror/view';
import {undo} from '@codemirror/commands';
// Included only by ATE_IOS_VERIFICATION=1, never in distribution assets.
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
(async()=>{
 const marker='ATE_IPAD_SYNTAX_VERIFICATION_ONLY',checks=[],$=id=>document.getElementById(id);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);checks.push(message)};
 const until=async(fn,message)=>{for(let i=0;i<450&&!fn();i++)await wait(100);assert(fn(),message)};
 let passed=false,error='';
 try{
  await until(()=>!!document.querySelector('.cm-content'),'iPad editor initialized');
  const content=document.querySelector('.cm-content');
  const view=EditorView.findFromDOM(document.querySelector('.cm-editor'));
  const tabs=()=>[...document.querySelectorAll('#tabs [role=tab]')];
  const closeCurrent=()=>{ $('exit').click();if($('exitDialog').open)$('discardExit').click(); };
  const restart=JSON.parse(localStorage.getItem('ate-tabs-verification-restart')||'null');
  if(!restart&&!$('experienceModes').hidden){assert(document.body.classList.contains('basic-mode'),'New iOS install starts in Basic mode');$('advancedMode').click();assert(!document.body.classList.contains('basic-mode'),'Advanced mode enables coding tools');}
  if(restart){
   checks.push(...restart.checks);
   assert(tabs().length===2,'Workspace recovers both tabs after webview restart');
   assert($('name').value==='recovery.py'&&view.state.doc.toString()==='print(42)\n# unsaved','Active tab, exact text and filename recovered');
   assert($('language').value==='plain','Manual language choice recovered');
   assert(tabs()[1].textContent.includes('•'),'Unsaved indicator recovered');
   tabs()[0].click();assert($('name').value==='recovery.c'&&view.state.doc.toString()==='int main(void) { return 0; }','Inactive C document recovered');
   assert($('language').value==='c','Inactive language recovered');
   assert(document.body.classList.contains('basic-mode'),'Basic preference survives process restart');
   const persisted=JSON.parse(localStorage.getItem('clear-page-workspace-v1')).tabs.find(t=>t.name==='recovery.c');
   assert(persisted.projectRef?.id===restart.projectId,'Project tab association survives restart');
   view.dispatch({changes:{from:view.state.doc.length,insert:'\n// saved from Basic'}});
   assert(await $('save').onclick(),'Basic mode saves an existing project tab');
   const saved=await Filesystem.readFile({path:'ATEProjects/'+restart.projectId+'/recovery.c',directory:Directory.Documents,encoding:Encoding.UTF8});
   assert(saved.data==='int main(void) { return 0; }\n// saved from Basic','Project save after process recovery preserves exact disk text');
   localStorage.removeItem('ate-tabs-verification-restart');
   passed=true;
  }else{

  const text=()=>view.state.doc.toString();
  const key=(key,opts={})=>content.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...opts}));
  const open=async(value,name,keep=false)=>{
   if(tabs().length&&!keep)closeCurrent();
   const transfer=new DataTransfer();transfer.items.add(new File([value],name,{type:'text/plain'}));
   $('file').files=transfer.files;$('file').dispatchEvent(new Event('change'));
   await until(()=>text()===value,'iPad file import preserves '+name);
  };
  const check=async()=>{
   $('checkSyntax').click();
   await until(()=>!$('syntaxSummary').textContent.includes('Checking')&&!$('syntaxSummary').textContent.includes('not checked'),'iPad checker completed');
   if($('syntaxSummary').textContent.includes('unavailable'))throw Error('iPad checker unavailable: '+$('syntaxDetails').textContent);
   checks.push('iPad checker is available');
  };
  if(!$('tabs').hidden){
  assert(!$('tabs').hidden,'iOS tab bar is enabled');
  await open('int main(void) { return 0; }','first.c');
  view.dispatch({changes:{from:view.state.doc.length,insert:'\n// edited'},selection:{anchor:4}});
  await open('print(1)','second.py',true);
  view.dispatch({changes:{from:0,insert:'# edited\n'}});
  tabs()[1].click();assert(view.state.doc.toString().endsWith('// edited'),'C edits survive switching');
  assert(view.state.selection.main.head===4,'Selection survives switching');
  undo(view);assert(!view.state.doc.toString().includes('edited'),'C undo is independent');
  tabs()[2].click();assert(view.state.doc.toString().startsWith('# edited'),'Python edits survive C undo');
  undo(view);assert(view.state.doc.toString()==='print(1)','Python undo is independent');
  view.dispatch({changes:{from:0,insert:'# keep\n'}});
  $('exit').click();assert($('exitDialog').open,'Dirty close asks for a choice');$('exitCancel').click();assert(view.state.doc.toString().startsWith('# keep'),'Cancel close preserves edits');
  $('exit').click();$('discardExit').click();assert(tabs().length===2,'Discard closes only one tab');
  closeCurrent();
  await open(Array.from({length:120},(_,i)=>'// source line '+i).join('\n'),'scroll.c');
  await wait(300);view.scrollDOM.scrollTop=800;await wait(100);
  const oldScroll=view.scrollDOM.scrollTop;
  assert(oldScroll>100,'Long document can scroll');
  await open('print(1)','scroll.py',true);tabs()[1].click();await wait(200);
  assert(Math.abs(view.scrollDOM.scrollTop-oldScroll)<50,'Each tab preserves its scroll position');
  tabs()[2].click();closeCurrent();closeCurrent();
  }
  for(const id of ['menu','cSettings','compilerInstall','projects']){
   const dialog=$(id);dialog.showModal();
   assert(getComputedStyle(dialog).fontSize==='16px','12pt '+id+' control text');
   for(const element of dialog.querySelectorAll('button,input,select,textarea,label,h1,h2,h3,p')){
    if(element.getBoundingClientRect().width)assert(parseFloat(getComputedStyle(element).fontSize)<=18.67,'Control text is at most 14pt: '+id);
   }
   dialog.close();
  }
  assert(getComputedStyle(content).fontSize==='36px','iPad defaults to large 36px editor text');
  assert(/monospace/.test(getComputedStyle(content.closest('.cm-scroller')).fontFamily),'iPad uses monospaced code');
  assert(['pre-wrap','break-spaces'].includes(getComputedStyle(content).whiteSpace),'iPad retains whitespace');
  for(const [name,invalid,valid] of [
   ['fixture.js','const = 1;','export const value = 1;'],
   ['fixture.json','{"a":}','{"a":1}'],
   ['fixture.yaml','items: [one, two','items: [one, two]'],
   ['fixture.html','<script>const = 1;</script>','<p>Hello</p>'],
   ['fixture.css','body { color red; }','body { color: red; }'],
   ['fixture.ts','const a: = 1;','const a: number = 1;'],
   ['fixture.sh','#!/bin/sh\nif true; then\n echo hi\n','#!/bin/sh\nif true; then\n echo hi\nfi\n'],
   ['fixture.py','def greet(name)\n    return name','def greet(name):\n    return name'],
   ['fixture.sql','SELECT x FROM WHERE x=1;','SELECT name FROM people;'],
   ['fixture.c','int main(void) { return 0 }','#include <stdio.h>\nint main(void) { return 0; }']
  ]){
   await open(invalid,name);await check();
   assert($('syntaxIssues').children.length>0,'iPad '+name+' reports syntax errors');
   await until(()=>!!document.querySelector('.cm-lintRange-error, .cm-lintPoint-error'),'iPad '+name+' shows an error range or end-of-file marker');
   assert(getComputedStyle($('syntaxIssues').querySelector('button')).fontSize==='16px','iPad error messages use 12pt control text');
   if(name.endsWith('.c'))assert($('syntaxDetails').textContent.includes('Basic C syntax check only'),'iPad C explains parser limits');
   $('syntaxIssues').querySelector('button').click();assert(!$('syntaxDialog').open,'iPad issue selection returns to text');
   await open(valid,name);await check();
   assert($('syntaxSummary').textContent.includes('no syntax errors'),'iPad '+name+' clears corrected errors');
   assert(!document.querySelector('.cm-lintRange-error, .cm-lintPoint-error'),'iPad stale error markers cleared');
   $('closeSyntax').click();
  }
  await open('## Twice\n\n## Twice\n\n```py\npass','fixture.md');await check();
  assert($('syntaxIssues').children.length>0&&$('syntaxSummary').textContent.includes('lint issue'),'iPad Markdown reports lint warnings');
  $('closeSyntax').click();
  await open('# Title\n\n- item','fixture.md');await check();
  assert($('syntaxSummary').textContent.includes('no lint issues'),'iPad Markdown clears warnings');$('closeSyntax').click();
  await open('int main(void) { return 0; }','program.c.txt');
  assert($('language').value==='c'&&$('name').value==='program.c.txt','Content detection never renames the file');
  $('cSettingsButton').click();
  assert($('cPlatformNote').textContent.includes('No compiler download'),'iPad C needs no download');
  assert($('chooseCompiler').hidden,'iPad does not offer a desktop executable installer');
  $('closeCSettings').click();
  await open('function hello() {','indent.js');view.dispatch({selection:{anchor:view.state.doc.length}});content.focus();key('Enter');
  assert(/\n    /.test(text()),'iPad Enter indentation works');key('Tab');key('Tab',{shiftKey:true});
  assert(/\n    $/.test(text()),'iPad Tab/Shift Tab indentation works');
  await open('const first = 1;\nconst second = 2;','vim.js');
  $('editingMode').value='vim';$('editingMode').dispatchEvent(new Event('change'));content.focus();
  key('Escape');for(const char of 'ggdd')key(char);
  assert(text()==='const second = 2;','iPad Vim deletes the selected line');key('u');assert(text().startsWith('const first'),'iPad Vim undo works');
  $('editingMode').value='standard';$('editingMode').dispatchEvent(new Event('change'));
  $('theme').click();assert(document.body.classList.contains('dark'),'iPad dark theme works');
  await open('int main(void) { return 0 }','final.c');await check();
  if($('tabs').hidden){passed=true;}else{
  await open("#!/usr/bin/env bash\npython3 <<'PY'\ndef hello():\n    print('hello')\nPY\n",'embedded.sh');
  assert($('language').value==='shell','Shell header and extension override embedded Python');await check();assert($('syntaxIssues').children.length===0,'Embedded Python is not checked as Python in a shell script');$('closeSyntax').click();
  await open('#!/bin/zsh\nprint hello\n','dialect.zsh');$('checkSyntax').click();await until(()=>$('syntaxSummary').textContent.includes('unavailable'),'Unsupported shell dialect is not falsely certified');assert($('syntaxDetails').textContent.includes('dialect'),'Shell checker explains dialect limit');$('closeSyntax').click();
  const prior=text(),priorName=$('name').value;$('basicMode').click();assert(text()===prior&&$('name').value===priorName,'Switch to Basic preserves text and filename');$('advancedMode').click();assert(text()===prior,'Switch to Advanced preserves edits');
  $('projectsButton').click();await until(()=>$('projects').open&&!$('createProject').disabled,'Project dialog ready');
  $('projectName').value='Native verification';await $('createProject').onclick();
  const projectId=localStorage.getItem('ate-current-project-v1');assert(!!projectId,'Native project created');
  $('projectFileName').value='src';await $('newProjectFolder').onclick();
  $('projectFileName').value='src/main.c';await $('newProjectFile').onclick();
  view.dispatch({changes:{from:0,insert:'// café\r\nint main(void) { return 0; }\r\n'}});assert(await $('save').onclick(),'Project tab saves through real native filesystem');
  const store=createProjectStore(iosProjectAdapter());let original=await store.read(projectId,'src/main.c');assert(original.text===text(),'Project UTF-8 disk bytes match editor text');
  $('name').value='src/copy';$('name').dispatchEvent(new Event('change'));assert(await $('save').onclick(),'Project Save As accepts extensionless name');
  assert((await store.read(projectId,'src/main.c')).text===original.text,'Project Save As keeps original file');assert((await store.read(projectId,'src/copy')).name==='src/copy','Project Save As never appends txt');
  await store.remove(projectId,'src/copy');const retained=await Filesystem.readFile({path:'ATEProjects/'+projectId+'/src/copy',directory:Directory.Documents,encoding:Encoding.UTF8});assert(retained.data===original.text,'Removing project membership retains the native file');
  await store.add(projectId,[{path:'src/windows.c',text:'// café\r\nint value;\r\n'}]);assert((await store.read(projectId,'src/windows.c')).text==='// café\r\nint value;\r\n','Native project storage preserves UTF-8 and CRLF bytes');
  const zip=await store.export(projectId),imported=await store.import(zip.bytes);assert(imported.id!==projectId,'ZIP import creates a separate project');assert((await store.read(imported.id,'src/main.c')).text===original.text,'ZIP round trip preserves native project text');
  $('projectsButton').click();await until(()=>$('projects').open&&!$('createProject').disabled,'Projects reopen');$('projectSelect').value=projectId;await $('projectSelect').onchange();
  $('projectFileName').value='recovery.c';await $('newProjectFile').onclick();view.dispatch({changes:{from:0,insert:'int main(void) { return 0; }'}});assert(await $('save').onclick(),'Recovery project file saved');
  while(tabs().length>1){const other=tabs().find(t=>t.getAttribute('aria-label')!=='recovery.c');other.click();closeCurrent();}
  await open('print(42)','recovery.py',true);$('language').value='plain';$('language').dispatchEvent(new Event('change'));view.dispatch({changes:{from:view.state.doc.length,insert:'\n# unsaved'}});
  $('basicMode').click();
  localStorage.setItem('ate-tabs-verification-restart',JSON.stringify({checks,projectId}));
  await Filesystem.writeFile({path:'ate-ipad-restart-ready.json',directory:Directory.Data,encoding:Encoding.UTF8,data:'ready'});return;
  }
  }
 }catch(e){error=(e.message||String(e))+'\n'+(e.stack||'');const v=EditorView.findFromDOM(document.querySelector('.cm-editor'));if(v)error+='\nDocument: '+JSON.stringify(v.state.doc.toString())+'\nSelection: '+JSON.stringify(v.state.selection.toJSON());}
 await Filesystem.writeFile({path:'ate-ipad-syntax-verification.json',directory:Directory.Data,encoding:Encoding.UTF8,data:JSON.stringify({marker,passed,checks,error},null,2)});
})();
