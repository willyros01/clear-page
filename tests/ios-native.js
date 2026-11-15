import {Capacitor} from '@capacitor/core';
import {checkProjectLayout} from './project-layout.js';
import {checkToolbarLayout} from './toolbar-layout.js';
import {createProjectStore} from '../src/projects.js';
import {iosProjectAdapter,projectDirectory} from '../src/ios-projects.js';
import {EditorView} from '@codemirror/view';
import {undo} from '@codemirror/commands';
// Included only by ATE_IOS_VERIFICATION=1, never in distribution assets.
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
(async()=>{
 const android=Capacitor.getPlatform()==='android';
 const marker='ATE_IPAD_SYNTAX_VERIFICATION_ONLY',checks=[],$=id=>document.getElementById(id);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);checks.push(message);if(android&&checks.length%10===0)console.info('ATE_NATIVE_PROGRESS',checks.length,message)};
 const until=async(fn,message)=>{for(let i=0;i<450&&!fn();i++)await wait(100);assert(fn(),message)};
 let passed=false,error='';
 try{
  if(android)try{const prior=await Filesystem.readFile({path:'ate-ipad-syntax-verification.json',directory:Directory.Data,encoding:Encoding.UTF8});if(JSON.parse(prior.data).passed)return}catch{}
  await until(()=>!!document.querySelector('.cm-content'),'iPad editor initialized');
  const content=document.querySelector('.cm-content');
  const view=EditorView.findFromDOM(document.querySelector('.cm-editor'));
  for(const scale of [1,2,3])for(const icons of [false,true])assert(!!checkToolbarLayout([scale,icons]),`Native toolbar/save reflow at ${scale*100}% ${icons?'icons':'text'}`);
  const tabs=()=>[...document.querySelectorAll('#tabs [role=tab]')];
  const askClose=()=>document.querySelector('#tabs [aria-selected=true]')?.nextElementSibling.click();
  const closeCurrent=()=>{askClose();if($('exitDialog').open)$('discardExit').click();};
  let restart=null;
  if(android){try{restart=JSON.parse((await Filesystem.readFile({path:'ate-ipad-restart-state.json',directory:Directory.Data,encoding:Encoding.UTF8})).data)}catch{}}
  else restart=JSON.parse(localStorage.getItem('ate-tabs-verification-restart')||'null');
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
   const saved=await Filesystem.readFile({path:'ATEProjects/'+restart.projectId+'/recovery.c',directory:projectDirectory,encoding:Encoding.UTF8});
   assert(saved.data==='int main(void) { return 0; }\n// saved from Basic','Project save after process recovery preserves exact disk text');
   localStorage.removeItem('ate-tabs-verification-restart');
   if(android)try{await Filesystem.deleteFile({path:'ate-ipad-restart-state.json',directory:Directory.Data})}catch{}
   if(android){
    $('advancedMode').click();
    while(tabs().length>1)closeCurrent();closeCurrent();
    const transfer=new DataTransfer();transfer.items.add(new File(['int main(void) { return 0 }'],'final.c',{type:'text/plain'}));$('file').files=transfer.files;$('file').dispatchEvent(new Event('change'));
    await until(()=>$('name').value==='final.c','Android native Save fixture restored');$('checkSyntax').click();await until(()=>$('syntaxIssues').children.length>0,'Android native Save fixture checked');
   }
   passed=true;
  }else{

  const text=()=>view.state.doc.toString();
  assert(!$('file').hasAttribute('accept')&&!$('projectFiles').hasAttribute('accept'),'iOS file pickers do not exclude SQL or extensionless source UTIs');
  const originalText=text(),originalName=$('name').value;
  $('menuButton').click();$('name').focus();$('name').value='Qzzzzzzz.sql';
  $('name').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));$('closeMenu').click();await wait(500);
  assert(text()===originalText,'Filename entry and menu exit never change document bytes');
  assert(tabs().some(t=>t.textContent.includes('Qzzzzzzz.sql')),'Entered filename appears only as document metadata/tab');
  assert(!$('menu').open&&document.activeElement!==$('name'),'Menu exit releases filename focus');
  assert(!$('documentBar').hidden&&$('documentBar').textContent.includes('Open files'),'Tabs have an Open files label');
  const bodyBox=document.body.getBoundingClientRect(),visible=window.visualViewport;
  assert(bodyBox.width<=visible.width+1&&bodyBox.height<=visible.height+1,'iOS shell stays inside visible viewport after menu return');
  $('name').value=originalName;$('name').onchange();

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
  askClose();assert($('exitDialog').open,'Dirty close asks for a choice');$('exitCancel').click();assert(view.state.doc.toString().startsWith('# keep'),'Cancel close preserves edits');
  askClose();$('discardExit').click();assert(tabs().length===2,'Discard closes only one tab');
  closeCurrent();
  await open(Array.from({length:120},(_,i)=>'// source line '+i).join('\n'),'scroll.c');
  await wait(300);view.scrollDOM.scrollTop=800;await wait(100);
  const oldScroll=view.scrollDOM.scrollTop;
  assert(oldScroll>100,'Long document can scroll');
  await open('print(1)','scroll.py',true);tabs()[1].click();
  // Slow emulators can take several frames to restore the position; wait for it, then make sure it stays put.
  for(let i=0;i<50&&Math.abs(view.scrollDOM.scrollTop-oldScroll)>=50;i++)await wait(100);
  await wait(500);
  assert(Math.abs(view.scrollDOM.scrollTop-oldScroll)<50,'Each tab preserves its scroll position (expected '+oldScroll+', got '+view.scrollDOM.scrollTop+')');
  tabs()[2].click();closeCurrent();closeCurrent();
  }
  for(const id of ['menu','cSettings','compilerInstall','projects']){
   const dialog=$(id);dialog.showModal();
   // Owner approved 15 Nov 2026: Projects uses the Menu's sizes.
   assert(getComputedStyle(dialog).fontSize==='16px',id+' control text follows its approved size');
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
  assert($('cSettingsTitle').textContent==='Syntax checking'&&['Python','YAML','Shell scripts','SQL','Markdown'].every(name=>$('syntaxOverview').textContent.includes(name)),'General syntax help covers supported checkers');
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
  const projectId=localStorage.getItem('ate-current-project-v1');assert(!!projectId&&$('projectHeading').textContent==='Native verification','Native project created and listed: '+$('projectStatus').textContent);
  $('projectFileName').value='src';await $('newProjectFolder').onclick();assert($('projectFolder').value==='src','Native project folder created: '+$('projectStatus').textContent);
  $('projectFileName').value='main.c';await $('newProjectFile').onclick();assert($('name').value==='src/main.c'&&!$('projects').open,'Project file opened in a bound tab: '+$('projectStatus').textContent);
  view.dispatch({changes:{from:0,insert:'// café\r\nint main(void) { return 0; }\r\n'}});assert(await $('save').onclick(),'Project tab saves through real native filesystem');
  const store=createProjectStore(iosProjectAdapter());let original=await store.read(projectId,'src/main.c');assert(original.text===text(),'Project UTF-8 disk bytes match editor text');
  $('name').value='src/copy';$('name').dispatchEvent(new Event('change'));assert(await $('save').onclick(),'Project Save As accepts extensionless name');
  assert((await store.read(projectId,'src/main.c')).text===original.text,'Project Save As keeps original file');assert((await store.read(projectId,'src/copy')).name==='src/copy','Project Save As never appends txt');
  await store.remove(projectId,'src/copy');const retained=await Filesystem.readFile({path:'ATEProjects/'+projectId+'/src/copy',directory:projectDirectory,encoding:Encoding.UTF8});assert(retained.data===original.text,'Removing project membership retains the native file');
  await store.add(projectId,[{path:'src/windows.c',text:'// café\r\nint value;\r\n'}]);assert((await store.read(projectId,'src/windows.c')).text==='// café\r\nint value;\r\n','Native project storage preserves UTF-8 and CRLF bytes');
  const zip=await store.export(projectId),imported=await store.import(zip.bytes);assert(imported.id!==projectId,'ZIP import creates a separate project');assert((await store.read(imported.id,'src/main.c')).text===original.text,'ZIP round trip preserves native project text');
  $('projectsButton').click();await until(()=>$('projects').open&&!$('createProject').disabled,'Projects reopen');await $('projectList').querySelector('[data-project-id="'+projectId+'"]').onclick();
  // Real native filesystem import into the folder chosen before the picker.
  $('projectFolder').value='';$('projectFolder').onchange();$('projectFileName').value='docs';await $('newProjectFolder').onclick();
  const plus=path=>$('projectTree').querySelector('[aria-label="Select folder '+path+'"]');
  plus('docs').click();$('showProjectAdd').click();assert($('projectDestination').textContent==='docs','Selected folder chooses a visible add destination');
  const input=$('projectFiles'),click=input.click;input.click=()=>{};$('addProjectFiles').onclick();input.click=click;
  $('projectFolder').value='';$('projectFolder').onchange();
  await input.onchange({target:{files:[{name:'README.md',size:8,arrayBuffer:async()=>new TextEncoder().encode('# native').buffer}],value:'picked'}});
  assert((await store.read(projectId,'docs/README.md')).text==='# native','Native Add files writes the captured subdirectory, not a later dropdown value');
  const entries=Array.from({length:14},(_,i)=>({path:'note-'+i+'.txt',text:'note'}));entries.push({path:'settings.json',text:'{}'});await store.add(projectId,entries);
  await $('projectList').querySelector('[data-project-id="'+projectId+'"]').onclick();$('projectComposer').hidden=true;
  for(const scale of [1,2,3])assert(!!checkProjectLayout([scale]),'Native project root/nested alignment and reachable last row at '+scale*100+'%');
  await store.folder(projectId,'delete-native/empty');await store.add(projectId,[{path:'delete-native/query.sql',text:'SELECT 1;'}]);await $('projectList').querySelector('[data-project-id="'+projectId+'"]').onclick();
  plus('delete-native').click();await $('deleteProjectFolder').onclick();assert($('deleteFolderDialog').open&&$('deleteFolderContents').textContent.includes('delete-native/query.sql'),'Native folder deletion previews its contents');$('cancelDeleteFolder').click();assert((await store.read(projectId,'delete-native/query.sql')).text==='SELECT 1;','Cancel folder deletion keeps native bytes');
  await $('deleteProjectFolder').onclick();await $('confirmDeleteFolder').onclick();assert(!(await store.load(projectId)).folders.includes('delete-native'),'Confirmed native folder deletion removes subtree membership');
  let removed=false;try{await Filesystem.stat({path:'ATEProjects/'+projectId+'/delete-native',directory:projectDirectory})}catch{removed=true}assert(removed,'Confirmed native folder deletion removes directory bytes');assert((await store.read(projectId,'src/main.c')).text===original.text,'Deleting a folder preserves its sibling native files');

  // Closing a project is distinct from dismissing its page or closing one tab.
  view.dispatch({changes:{from:view.state.doc.length,insert:'\n// save on close'}});
  $('closeProject').onclick();assert($('closeProjectDialog').open,'Dirty project close offers Save/Discard/Cancel');$('cancelProjectClose').click();assert(localStorage.getItem('ate-current-project-v1')===projectId&&text().includes('save on close'),'Cancel project close retains edits and selection');
  $('closeProject').onclick();await $('saveAndCloseProject').onclick();assert(localStorage.getItem('ate-current-project-v1')===null&&$('projectActions').hidden,'Save and close clears only the active project selection');
  assert(!JSON.parse(localStorage.getItem('clear-page-workspace-v1')).tabs.some(t=>t.projectRef?.id===projectId),'Closed project tabs are removed from native workspace recovery');
  const savedCopy=await Filesystem.readFile({path:'ATEProjects/'+projectId+'/src/copy',directory:projectDirectory,encoding:Encoding.UTF8});assert(savedCopy.data.includes('save on close'),'Save and close persists unsaved native project bytes');
  await $('projectList').querySelector('[data-project-id="'+projectId+'"]').onclick();assert($('projectHeading').textContent==='Native verification','A closed project reopens from the saved-project list');
  plus('Project root').click();
  $('projectFileName').value='recovery.c';await $('newProjectFile').onclick();assert($('name').value==='recovery.c','Recovery project tab opened: '+$('projectStatus').textContent);view.dispatch({changes:{from:0,insert:'int main(void) { return 0; }'}});assert(await $('save').onclick(),'Recovery project file saved');
  while(tabs().length>1){const other=tabs().find(t=>t.getAttribute('aria-label')!=='recovery.c');other.click();closeCurrent();}
  await open('print(42)','recovery.py',true);$('language').value='plain';$('language').dispatchEvent(new Event('change'));view.dispatch({changes:{from:view.state.doc.length,insert:'\n# unsaved'}});
  $('basicMode').click();
  localStorage.setItem('ate-tabs-verification-restart',JSON.stringify({checks,projectId}));
  if(android)await Filesystem.writeFile({path:'ate-ipad-restart-state.json',directory:Directory.Data,encoding:Encoding.UTF8,data:JSON.stringify({checks,projectId})});
  await Filesystem.writeFile({path:'ate-ipad-restart-ready.json',directory:Directory.Data,encoding:Encoding.UTF8,data:'ready'});return;
  }
  }
 }catch(e){error=(e.message||String(e))+'\n'+(e.stack||'');const v=EditorView.findFromDOM(document.querySelector('.cm-editor'));if(v)error+='\nDocument: '+JSON.stringify(v.state.doc.toString())+'\nSelection: '+JSON.stringify(v.state.selection.toJSON())+'\nProject status: '+$('projectStatus').textContent;}
 await Filesystem.writeFile({path:'ate-ipad-syntax-verification.json',directory:Directory.Data,encoding:Encoding.UTF8,data:JSON.stringify({marker,passed,checks,error},null,2)});
})();
