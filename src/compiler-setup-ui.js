// Optional Windows setup. No download occurs until the explicit confirmation.
export function setupCompilerInstall({desktop,info,install,cancel,chooseCompiler,ready,enabled=()=>true}) {
 const $=id=>document.getElementById(id);
 let supported=false,busy=false,poll,needsSetup=false;
 const controls=()=>{ $('installCompiler').disabled=busy;$('cancelCompilerInstall').hidden=!busy;$('compilerInstallLater').disabled=busy;$('compilerInstallChoose').disabled=busy; };
 async function refresh(){
  if(!desktop||!enabled()){$('getCompiler').hidden=$('syntaxGetCompiler').hidden=true;return;}
  try {
   const state=await info();if(!state)return;
   supported=state.supported===true;
   $('getCompiler').hidden=!(supported&&enabled());
   $('syntaxGetCompiler').hidden=!(supported&&needsSetup&&enabled());
   $('compilerInstallDescription').textContent=`Free LLVM-MinGW C compiler. Download: ${(state.bytes/1000000).toFixed(0)} MB. Allow 3 GB free disk space. Installs only for ATE; no administrator access or PATH change. Licenses are included with the toolchain.`;
   $('compilerInstallDestination').textContent='Install location: '+state.destination;
   if(state.message)$('compilerInstallStatus').textContent=state.message;
   if(state.ready&&!busy)$('compilerChoice').textContent='ATE-managed LLVM-MinGW is ready (remembered after restart).';
  }catch{if(busy)$('compilerInstallStatus').textContent='Setup is running. Waiting for its progress…'}
 }
 function open(){if(!supported||!enabled())return;$('compilerInstallStatus').textContent='Download is optional. Your editor works without it.';refresh();$('compilerInstall').showModal()}
 $('getCompiler').onclick=open;$('syntaxGetCompiler').onclick=open;
 $('compilerInstallLater').onclick=()=>{$('compilerInstall').close()};
 $('compilerInstallChoose').onclick=async()=>{
  $('compilerInstall').close();
  try{const path=await chooseCompiler();if(path){$('compilerChoice').textContent=path;ready()}}catch{$('compilerChoice').textContent='Selection could not complete. Please try again.'}
 };
 $('compilerInstall').addEventListener('cancel',event=>{if(busy)event.preventDefault()});
 $('cancelCompilerInstall').onclick=async()=>{try{$('compilerInstallStatus').textContent='Cancelling setup…';await cancel()}catch{$('compilerInstallStatus').textContent='Cancellation could not be requested. Please try again.'}};
 $('installCompiler').onclick=async()=>{
  if(busy||!supported||!enabled())return;
  busy=true;controls();$('compilerInstallStatus').textContent='Starting compiler setup…';
  poll=setInterval(refresh,500);
  try{const message=await install();$('compilerInstallStatus').textContent=message;$('compilerChoice').textContent='ATE-managed LLVM-MinGW is ready (remembered after restart).';$('syntaxGetCompiler').hidden=true;ready()}
  catch(error){$('compilerInstallStatus').textContent=String(error?.message||error||'Setup failed. Please retry. Your document is kept.')}
  finally{clearInterval(poll);busy=false;controls()}
 };
 refresh();controls();
 return {missing(value){needsSetup=value;$('syntaxGetCompiler').hidden=!(supported&&value&&enabled())},refresh};
}
