// Included only in the editor-verification feature build, never public builds.
(async()=>{
 const checks=[];
 const assert=(condition,message)=>{if(!condition)throw Error(message);checks.push(message)};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const $=id=>document.getElementById(id);
 try{
  for(let i=0;i<100&&!document.querySelector('.cm-content');i++)await wait(100);
  const content=document.querySelector('.cm-content');
  assert(!!content,'Editor initialized');
  const text=()=>[...document.querySelectorAll('.cm-line')].map(e=>e.textContent).join('\n');
  const key=(key,opts={})=>content.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...opts}));
  const keys=str=>{for(const char of str){
   const active=document.activeElement;
   if(active?.matches('.cm-vim-panel input')){
    active.setRangeText(char,active.selectionStart,active.selectionEnd,'end');
    active.dispatchEvent(new Event('input',{bubbles:true}));
   }else key(char);
  }};
  const open=async value=>{
   const transfer=new DataTransfer();transfer.items.add(new File([value],'native-fixture.js',{type:'text/javascript'}));
   $('file').files=transfer.files;$('file').dispatchEvent(new Event('change'));
   for(let i=0;i<50&&text()!==value;i++)await wait(50);
   assert(text()===value,'File import preserves text and indentation');
  };
  const mode=value=>{$('editingMode').value=value;$('editingMode').dispatchEvent(new Event('change'));content.focus()};
  mode('standard');
  await open('function hello() {\n    const answer = 42;\n    return answer;\n}');
  await wait(150);
  const scroller=content.closest('.cm-scroller');
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
  mode('vim');key('Escape');keys('ggdd');
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
  await window.__TAURI_INTERNALS__.invoke('editor_verification_result',{passed:true,report:checks.map(x=>'PASS: '+x).join('\n')});
 }catch(error){
  await window.__TAURI_INTERNALS__.invoke('editor_verification_result',{passed:false,report:checks.map(x=>'PASS: '+x).join('\n')+'\nFAIL: '+error.stack});
 }
})();
