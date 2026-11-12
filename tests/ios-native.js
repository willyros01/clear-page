// Included only by ATE_IOS_VERIFICATION=1, never in distribution assets.
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
(async()=>{
 const marker='ATE_IPAD_SYNTAX_VERIFICATION_ONLY',checks=[],$=id=>document.getElementById(id);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);checks.push(message)};
 const until=async(fn,message)=>{for(let i=0;i<120&&!fn();i++)await wait(100);assert(fn(),message)};
 let passed=false,error='';
 try{
  await until(()=>!!document.querySelector('.cm-content'),'iPad editor initialized');
  const content=document.querySelector('.cm-content');
  const text=()=>[...document.querySelectorAll('.cm-line')].map(e=>e.textContent).join('\n');
  const key=(key,opts={})=>content.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...opts}));
  const open=async(value,name)=>{
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
   ['fixture.c','int main(void) { return 0 }','#include <stdio.h>\nint main(void) { return 0; }']
  ]){
   await open(invalid,name);await check();
   assert($('syntaxIssues').children.length>0,'iPad '+name+' reports syntax errors');
   await until(()=>!!document.querySelector('.cm-lintRange-error, .cm-lintPoint-error'),'iPad '+name+' shows an error range or end-of-file marker');
   assert(getComputedStyle($('syntaxIssues').querySelector('button')).fontSize==='26px','iPad error messages use large text');
   if(name.endsWith('.c'))assert($('syntaxDetails').textContent.includes('Basic C syntax check only'),'iPad C explains parser limits');
   $('syntaxIssues').querySelector('button').click();assert(!$('syntaxDialog').open,'iPad issue selection returns to text');
   await open(valid,name);await check();
   assert($('syntaxSummary').textContent.includes('no syntax errors'),'iPad '+name+' clears corrected errors');
   assert(!document.querySelector('.cm-lintRange-error, .cm-lintPoint-error'),'iPad stale error markers cleared');
   $('closeSyntax').click();
  }
  $('cSettingsButton').click();
  assert($('cPlatformNote').textContent.includes('No compiler download'),'iPad C needs no download');
  assert($('chooseCompiler').hidden,'iPad does not offer a desktop executable installer');
  $('closeCSettings').click();
  await open('function hello() {','indent.js');content.focus();key('End');key('Enter');
  assert(/\n    /.test(text()),'iPad Enter indentation works');key('Tab');key('Tab',{shiftKey:true});
  assert(/\n    $/.test(text()),'iPad Tab/Shift Tab indentation works');
  await open('const first = 1;\nconst second = 2;','vim.js');
  $('editingMode').value='vim';$('editingMode').dispatchEvent(new Event('change'));content.focus();
  key('Escape');for(const char of 'ggdd')key(char);
  assert(text()==='const second = 2;','iPad Vim deletes the selected line');key('u');assert(text().startsWith('const first'),'iPad Vim undo works');
  $('editingMode').value='standard';$('editingMode').dispatchEvent(new Event('change'));
  $('theme').click();assert(document.body.classList.contains('dark'),'iPad dark theme works');
  await open('int main(void) { return 0 }','final.c');await check();
  passed=true;
 }catch(e){error=(e.message||String(e))+'\n'+(e.stack||'')}
 await Filesystem.writeFile({path:'ate-ipad-syntax-verification.json',directory:Directory.Data,encoding:Encoding.UTF8,data:JSON.stringify({marker,passed,checks,error},null,2)});
})();
