import {setupCompilerInstall} from './compiler-setup-ui.js';
import {createCheckRunner} from './check-runner.js';
import {checkableLanguages,MAX_CHECK_LENGTH} from './syntax-common.js';
import {languageLabels} from './languages.js';

export function setupSyntax({editor,getDocument,nativeCheck,chooseCompiler,chooseProject,compilerSetupInfo,installCCompiler,cancelCompilerSetup,desktop}) {
 const $=id=>document.getElementById(id),settingsKey='ate-syntax-preferences-v1';
 let revision=0,timer,diagnostics=[],settings={automatic:true,standard:'c17',includes:'',defines:''};
 try{Object.assign(settings,JSON.parse(localStorage.getItem(settingsKey))||{})}catch{}
 $('autoCheck').checked=settings.automatic!==false;
 $('cStandard').value=['c99','c11','c17','c23'].includes(settings.standard)?settings.standard:'c17';
 $('cIncludes').value=typeof settings.includes==='string'?settings.includes:'';
 $('cDefines').value=typeof settings.defines==='string'?settings.defines:'';
 if(!desktop)$('cSettingsButton').textContent='About C checks';
 $('chooseCompiler').disabled=$('chooseProject').disabled=!desktop;
 $('cPlatformNote').textContent=desktop?'Uses a local Clang compiler. Choose a project folder for relative headers; paths and macros are optional.':'Basic C syntax checking is included and works offline. No compiler download is needed. Header, macro and type checks require the desktop compiler edition.';
 if(!desktop)for(const id of ['chooseCompiler','compilerChoice','chooseProject','projectChoice','cStandard','cIncludes','cDefines'])($(id).closest('label')||$(id)).hidden=true;
 const runner=createCheckRunner({workerFactory:()=>new Worker(new URL('syntax-worker.js',document.baseURI)),nativeCheck:desktop?nativeCheck:null});
 function options(){return {standard:$('cStandard').value,includes:$('cIncludes').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),defines:$('cDefines').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}}
 const compilerInstall=setupCompilerInstall({desktop,info:compilerSetupInfo,install:installCCompiler,cancel:cancelCompilerSetup,chooseCompiler,ready:()=>check()});
 function render(result) {
  compilerInstall.missing(result.setupNeeded===true);
  diagnostics=result.diagnostics||[];editor.diagnostics(diagnostics);
  const count=diagnostics.length,label=languageLabels[getDocument().language];
  const summary=result.status==='checked'?(count?`${count} syntax issue${count===1?'':'s'}`:`${label}: no syntax errors found`):result.status==='checking'?'Checking syntax…':result.status==='pending'?'Syntax: not checked':'Syntax: check unavailable';
  $('syntaxStatus').textContent=summary;$('syntaxSummary').textContent=summary;
  $('syntaxDetails').textContent=result.message||'';
  $('syntaxIssues').replaceChildren();
  for(const d of diagnostics){
   const item=document.createElement('li'),button=document.createElement('button');
   button.textContent=`Line ${d.line}, column ${d.column} — ${d.severity}: ${d.message}`;
   button.onclick=()=>{$('syntaxDialog').close();editor.jumpTo(d.from,d.to)};
   item.append(button);$('syntaxIssues').append(item);
  }
 }
 async function check() {
  clearTimeout(timer);const current=++revision;runner.cancel();
  const request={...getDocument(),...options()};
  if(request.text.length>MAX_CHECK_LENGTH){render({status:'skipped',message:'Checking is limited to 512K characters. Editing and saving still work.'});return;}
  if(!checkableLanguages.has(request.language)){render({status:'unavailable',message:request.language==='plain'?'Choose a code language in Menu to check syntax.':`${languageLabels[request.language]} highlighting is available, but its checker is not implemented.`});return;}
  render({status:'checking'});
  try {const result=await runner.run(request);if(current===revision&&result.status!=='cancelled')render(result)}
  catch{if(current===revision)render({status:'unavailable',message:'The syntax check could not complete. Editing and saving still work.'})}
 }
 function changed() {
  revision++;runner.cancel();clearTimeout(timer);render({status:'pending'});
  if($('autoCheck').checked&&checkableLanguages.has(getDocument().language))timer=setTimeout(check,700);
 }
 function saveSettings(){try{localStorage.setItem(settingsKey,JSON.stringify({automatic:$('autoCheck').checked,standard:$('cStandard').value,includes:$('cIncludes').value,defines:$('cDefines').value}))}catch{}changed()}
 for(const id of ['autoCheck','cStandard','cIncludes','cDefines'])$(id).onchange=saveSettings;
 $('checkSyntax').onclick=()=>{$('menu').close();$('syntaxDialog').showModal();check()};
 $('syntaxStatus').onclick=()=>{$('syntaxDialog').showModal()};
 $('checkAgain').onclick=check;
 $('closeSyntax').onclick=()=>{$('syntaxDialog').close();editor.focus()};
 $('cSettingsButton').onclick=()=>{$('menu').close();compilerInstall.refresh();$('cSettings').showModal()};
 $('closeCSettings').onclick=()=>{$('cSettings').close();saveSettings();editor.focus()};
 for(const [id,choose,label] of [['chooseCompiler',chooseCompiler,'compilerChoice'],['chooseProject',chooseProject,'projectChoice']])$(id).onclick=async()=>{
  try{const path=await choose();if(path){$(label).textContent=path;changed()}}catch{$(label).textContent='Selection could not complete. Please try again.'}
 };
 changed();return {changed,check};
}
