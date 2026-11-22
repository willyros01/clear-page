// Included only in the editor-verification feature build, never public builds.
(async()=>{
 const checks=[];
 const assert=(condition,message)=>{if(!condition)throw Error(message);checks.push(message)};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const $=id=>document.getElementById(id);
 const nativeCRequests=()=>window.__TAURI_INTERNALS__.invoke('c_verification_calls');
 try{
  for(let i=0;i<100&&!document.querySelector('.cm-content');i++)await wait(100);
  if($('termsDialog').open){$('termsCheck').checked=true;$('termsCheck').dispatchEvent(new Event('change'));$('acceptTerms').click();assert(!$('termsDialog').open,'Mandatory terms accepted through the real controls');}
  const content=document.querySelector('.cm-content');
  assert(!!content,'Editor initialized');
  const fit=JSON.parse(await window.__TAURI_INTERNALS__.invoke('window_fit_report'));
  assert(fit.fits,'Window fits inside the screen '+JSON.stringify(fit));
  const status=$('syntaxStatus').getBoundingClientRect(),saveButton=$('save').getBoundingClientRect();
  assert(status.bottom<=innerHeight&&saveButton.right<=innerWidth,'Syntax line and Save button are inside the window');
  const text=()=>[...document.querySelectorAll('.cm-line')].map(e=>e.textContent).join('\n');
  const key=(key,opts={})=>content.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...opts}));
  const keys=str=>{for(const char of str){
   const active=document.activeElement;
   if(active?.matches('.cm-vim-panel input')){
    active.setRangeText(char,active.selectionStart,active.selectionEnd,'end');
    active.dispatchEvent(new Event('input',{bubbles:true}));
   }else key(char);
  }};
  $('advancedMode').click();
  const open=async(value,name='native-fixture.js')=>{
   const close=document.querySelector('#tabs [role=tab][aria-selected=true]')?.nextElementSibling;if(close){close.click();if($('exitDialog').open)$('discardExit').click();}
   const transfer=new DataTransfer();transfer.items.add(new File([value],name,{type:'text/javascript'}));
   $('file').files=transfer.files;$('file').dispatchEvent(new Event('change'));
   for(let i=0;i<50&&text()!==value;i++)await wait(50);
   assert(text()===value,'File import preserves text and indentation');
  };
  const storeShot=async label=>{await wait(500);await window.__TAURI_INTERNALS__.invoke('store_capture',{label})};
  const mode=value=>{$('editingMode').value=value;$('editingMode').dispatchEvent(new Event('change'));content.focus()};
  mode('standard');
  await open('function hello() {\n    const answer = 42;\n    return answer;\n}');
  await wait(150);await storeShot('01-editor');
  const scroller=content.closest('.cm-scroller');
  for(const id of ['menu','cSettings','compilerInstall']){
   const dialog=$(id);dialog.showModal();
   assert(getComputedStyle(dialog).fontSize==='16px','12pt '+id+' control text');
   for(const element of dialog.querySelectorAll('button,input,select,textarea,label,h1,h2,h3,p')){
    if(element.getBoundingClientRect().width)assert(parseFloat(getComputedStyle(element).fontSize)<=18.67,'Control text is at most 14pt: '+id);
   }
   dialog.close();
  }
  assert(getComputedStyle(content.closest('.cm-editor')).display==='flex','Native editor uses CodeMirror flex layout');
  assert(['pre-wrap','break-spaces'].includes(getComputedStyle(content).whiteSpace),'Native editor preserves whitespace');
  assert(/monospace/.test(getComputedStyle(scroller).fontFamily),'Native editor uses a monospaced font');
  assert(getComputedStyle(content).fontSize==='36px','Native editor defaults to large 36px text');
  assert(getComputedStyle(content).paddingTop==='24px','Native editor retains reading padding');
  const keyword=content.querySelector('.cm-line span');
  assert(keyword&&getComputedStyle(keyword).color!==getComputedStyle(content).color,'Native JavaScript syntax colors render');
  await open('function hello() {');
  key('End');key('Enter');
  assert(/\n    /.test(text()),'Native Enter automatically indents JavaScript');
  key('Tab');assert(/\n        /.test(text()),'Native Tab indents');
  key('Tab',{shiftKey:true});assert(/\n    $/.test(text()),'Native Shift Tab unindents');
  await open('const first = 1;\nconst second = 2;\nconst third = 3;');
  mode('vim');key('Escape');await wait(100);
  assert($('vimMode').textContent==='NORMAL'&&!$('vimMode').hidden,'Native Vim mode shows in the bottom line');
  assert(document.querySelector('.cm-vim-panel').getBoundingClientRect().height===0,'Native Vim mode strip takes no editing space');
  keys('ggdd');
  assert(text()==='const second = 2;\nconst third = 3;','Native Vim gg and dd work');
  keys('u');assert(/^const first/.test(text()),'Native Vim undo restores text');
  keys(':%s/const/let/g');await wait(100);
  const command=document.querySelector('.cm-vim-panel input');
  assert(command&&command.getBoundingClientRect().width>200,'Native Vim command input is wide and visible');
  assert(getComputedStyle(command).color!==getComputedStyle(command).backgroundColor,'Native Vim command text has contrast');
  command.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true,cancelable:true}));
  assert(!text().includes('const')&&text().includes('let second'),'Native Vim substitution replaces matches');
  keys(':2');
  document.querySelector('.cm-vim-panel input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true,cancelable:true}));
  keys('dd');assert(!text().includes('second'),'Native Vim go to line and delete work');
  mode('standard');
  $('theme').click();await wait(100);
  assert(document.body.classList.contains('dark'),'Native dark appearance works');
  const setup=await window.__TAURI_INTERNALS__.invoke('compiler_setup_info');
  if(setup.ready)assert(setup.supported,'Managed Windows compiler detected after app startup');
  assert($('cChecker').value==='basic','Desktop defaults to the built-in C parser');
  assert($('getCompiler').hidden,'Basic checks do not offer a compiler download');
  // Real bundled worker, lint UI and local compiler, inside the native webview.
  const until=async predicate=>{for(let i=0;i<120&&!predicate();i++)await wait(100);assert(predicate(),'Native syntax result arrived')};
  await open('const = 1;');
  $('checkSyntax').click();
  await until(()=>$('syntaxIssues').children.length>0);
  assert(/Line 1, column 7/.test($('syntaxIssues').textContent),'Native worker reports JavaScript error positions');
  assert(!!document.querySelector('.cm-lintRange-error'),'Native syntax errors have underlines');
  $('syntaxIssues').querySelector('button').click();
  assert(!$('syntaxDialog').open,'Native error selection returns to the editor');
  await open('const fixed = 1;');
  $('checkSyntax').click();
  await until(()=>$('syntaxSummary').textContent.includes('no syntax errors'));
  assert(!document.querySelector('.cm-lintRange-error'),'Native fixed code clears old errors');
  await storeShot('02-syntax');$('closeSyntax').click();
  for(const [name,invalid,valid] of [
   ['offline.py','def greet(name)\n    return name','def greet(name):\n    return name'],
   ['offline.sql','SELECT x FROM WHERE x=1;','SELECT name FROM people;'],
   ['offline.md','## Twice\n\n## Twice\n\n```py\npass','# Title\n\n- item']
  ]){
   await open(invalid,name);$('checkSyntax').click();await until(()=>$('syntaxIssues').children.length>0);
   assert(!$('syntaxSummary').textContent.includes('unavailable'),'Native offline checker works for '+name);
   $('closeSyntax').click();await open(valid,name);$('checkSyntax').click();
   await until(()=>$('syntaxSummary').textContent.includes(name.endsWith('.md')?'no lint issues':'no syntax errors'));
   assert($('syntaxIssues').children.length===0,'Native corrected '+name+' clears diagnostics');$('closeSyntax').click();
  }
  await open('int main(void) { return 0 }');
  $('language').value='c';$('language').dispatchEvent(new Event('change'));
  $('checkSyntax').click();
  await until(()=>$('syntaxIssues').children.length>0);
  assert($('syntaxDetails').textContent.includes('Basic C syntax check only'),'Native offline C parser and Wasm work under desktop CSP');
  $('closeSyntax').click();
  await open('#include <missing_header_for_basic_mode.h>\nint main(void) { return 0; }');
  $('language').value='c';$('language').dispatchEvent(new Event('change'));
  $('checkSyntax').click();
  await until(()=>$('syntaxSummary').textContent.includes('no syntax errors'));
  assert($('syntaxDetails').textContent.includes('Headers, macros, types and C-standard conformance are not checked'),'Basic mode discloses header limitations');
  $('closeSyntax').click();
  assert(await nativeCRequests()===0,'Basic C checks do not invoke a native compiler');
  const sandboxed=await window.__TAURI_INTERNALS__.invoke('app_sandboxed');
  if(sandboxed){
   await wait(300);
   assert($('cCheckerLabel').hidden&&$('cChecker').value==='basic','Mac App Store sandbox offers only the built-in C check');
  }else{
  $('cSettingsButton').click();
  $('cChecker').value='clang';$('cChecker').dispatchEvent(new Event('change'));
  assert(!$('cAdvanced').hidden,'Advanced Clang controls appear only after selection');
  for(const e of $('cAdvanced').querySelectorAll('button,input,select,textarea,label,p')){
   if(e.getBoundingClientRect().width)assert(parseFloat(getComputedStyle(e).fontSize)<=18.67,'Advanced controls stay at most 14pt');
  }
  $('closeCSettings').click();
  await open('int main(void) { return 0 }');
  $('language').value='c';$('language').dispatchEvent(new Event('change'));
  $('checkSyntax').click();
  await until(()=>$('syntaxIssues').textContent.includes("expected ';'"));
  assert(/Line 1/.test($('syntaxIssues').textContent),'Native Clang diagnostic maps into the open unsaved buffer');
  assert(await nativeCRequests()>0,'Clang runs only after explicit advanced selection');
  $('closeSyntax').click();
  $('cSettingsButton').click();
  $('cChecker').value='basic';$('cChecker').dispatchEvent(new Event('change'));
  assert($('cAdvanced').hidden,'Switching back to Basic hides compiler configuration');
  assert(JSON.parse(localStorage.getItem('ate-syntax-preferences-v1')).cChecker==='basic','C checker preference is persisted');
  $('closeCSettings').click();
  }
  // The real native project bridge, not a mocked browser filesystem.
  $('projectsButton').click();await until(()=>$('projects').open&&!$('createProject').disabled);
  $('openProjectPicker').click();await until(()=>$('projectPicker').open&&!$('createProject').disabled);
  $('projectName').value='Native desktop';await $('createProject').onclick();await until(()=>$('projects').open);
  const projectId=localStorage.getItem('ate-current-project-v1');assert(!!projectId,'Native desktop project created');
  $('projectFileName').value='src';await $('newProjectFolder').onclick();$('projectFileName').value='query.sql';await $('newProjectFile').onclick();
  assert($('name').value==='src/query.sql','Native desktop project file opens in its own tab');
  // Use the ordinary input path to edit a bound project tab without a native dialog.
  mode('vim');key('Escape');keys(':s/^/SELECT 1;/');document.querySelector('.cm-vim-panel input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true,cancelable:true}));mode('standard');
  assert(await $('save').onclick(),'Native desktop project save completes');
  const io=(op,path='',extra={})=>window.__TAURI_INTERNALS__.invoke('project_io',{request:{op,id:projectId,path,...extra}});
  assert((await io('read','src/query.sql')).text.includes('SELECT 1;'),'Native project UTF-8 bytes persisted outside recovery');
  await io('write','keep.sql',{text:'SELECT 2;'});
  $('projectsButton').click();await until(()=>$('projects').open&&!$('createProject').disabled);
  document.querySelector('[aria-label="Select folder src"]').click();await $('deleteProjectFolder').onclick();assert($('deleteFolderDialog').open,'Native folder deletion previews contents');$('cancelDeleteFolder').click();await until(()=>$('projects').open);
  assert((await io('read','src/query.sql')).text.includes('SELECT 1;'),'Native cancellation keeps project bytes');
  await $('deleteProjectFolder').onclick();await $('confirmDeleteFolder').onclick();await until(()=>$('projects').open);
  assert((await io('read','src/query.sql')).text===null,'Native confirmed deletion removes directory bytes');assert((await io('read','keep.sql')).text==='SELECT 2;','Native folder deletion preserves sibling bytes');
  await storeShot('03-projects');$('closeProject').click();await until(()=>$('projectActions').hidden);$('closeProjects').click();
  assert(document.querySelectorAll('#tabs [role=tab]').length>0,'Closing a project keeps the ordinary workspace');
  // 0.8.8: Preview under the real desktop webview policy, new checkers in the packaged worker, colour-only languages.
  {
   const probe=document.createElement('iframe');probe.setAttribute('sandbox','allow-same-origin');
   probe.srcdoc='<!doctype html><html><head><style>h1{color:rgb(138, 59, 18)}</style></head><body><h1>x</h1><p style="background:rgb(1, 2, 3)">y</p></body></html>';
   document.body.append(probe);await until(()=>probe.contentDocument?.querySelector('p'));await wait(200);
   const doc=probe.contentDocument;
   assert(getComputedStyle(doc.querySelector('h1')).color==='rgb(138, 59, 18)','Preview page stylesheets apply under the packaged desktop policy');
   assert(getComputedStyle(doc.querySelector('p')).backgroundColor==='rgb(1, 2, 3)','Preview inline style attributes apply under the packaged desktop policy');
   probe.remove();
   await open('<!doctype html><h1>Native preview</h1><script>document.title="SCRIPT RAN"</script>','native-preview.html');
   await until(()=>$('language').value==='html');
   $('menuButton').click();assert(!$('preview').hidden,'Preview offered for an HTML file');
   $('preview').click();assert($('previewDialog').open,'Preview opens full screen');
   assert($('previewFrame').getAttribute('sandbox')==='','Preview frame is fully sandboxed');
   await wait(500);assert(document.title!=='SCRIPT RAN','Preview never runs page scripts');
   const r=$('previewFrame').getBoundingClientRect();assert(r.height>innerHeight*0.6&&r.width>=innerWidth-2,'Preview fills the window');
   $('closePreview').click();await wait(200);assert(!$('previewDialog').open&&!$('previewFrame'),'Back to editor closes Preview and removes its copy');
   for(const [name,lang,text,expect] of [['Bad.java','java','class A {\n  void f() {\n    int x = 1\n  }\n}\n',/Line 3, column 14/],['bad.xml','xml','<a>\n<b></c>\n</a>\n',/Line 2/],['bad.toml','toml','[a]\nx = 1\n[a]\n',/Line 3/],['bad.ini','ini','[s]\n[broken\n',/Line 2/]]){
    await open(text,name);await until(()=>$('language').value===lang);
    $('menuButton').click();$('checkSyntax').click();await until(()=>$('syntaxIssues').children.length>0);
    assert(expect.test($('syntaxIssues').textContent),'Native worker checks '+name+': '+$('syntaxIssues').textContent.slice(0,80));
    $('closeSyntax').click();
   }
   await open('fn main() { let x = "s"; }\n','main.rs');await until(()=>$('language').value==='rust');await wait(300);
   assert(document.querySelectorAll('.cm-content span[class]').length>2,'Rust file is coloured');
  }
  await window.__TAURI_INTERNALS__.invoke('editor_verification_result',{passed:true,report:checks.map(x=>'PASS: '+x).join('\n')});
 }catch(error){
  await window.__TAURI_INTERNALS__.invoke('editor_verification_result',{passed:false,report:checks.map(x=>'PASS: '+x).join('\n')+'\nFAIL: '+error.message+'\n'+error.stack});
 }
})();
