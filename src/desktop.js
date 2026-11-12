import {isTauri, invoke} from '@tauri-apps/api/core';
import {listen} from '@tauri-apps/api/event';
import {clangDiagnostics} from './syntax-common.js';

export const desktop=isTauri();
export const compilerSetupInfo=()=>invoke('compiler_setup_info');
export const installCCompiler=()=>invoke('install_c_compiler');
export const cancelCompilerSetup=()=>invoke('cancel_compiler_setup');
export const chooseCCompiler=()=>invoke('choose_c_compiler');
export const chooseCProject=()=>invoke('choose_c_project');
export async function checkC(request){
 if(!desktop)return {status:'unavailable',diagnostics:[],message:'C checking requires the Mac or Windows desktop app with a local Clang compiler.'};
 const result=await invoke('check_c',{text:request.text,standard:request.standard,includes:request.includes,defines:request.defines});
 const parsed=clangDiagnostics(request.text,result.output);
 const missing=/file not found|cannot find|invalid value.*-std|unsupported option/i.test(result.output);
 return {setupNeeded:result.status==='unavailable'&&/Clang could not start/.test(result.message),status:missing||parsed.external.length?'unavailable':result.status,diagnostics:parsed.diagnostics,message:[missing?'Header or compiler setup needs attention. Check C settings.':'',result.message,...parsed.external,(!parsed.diagnostics.length&&result.status!=='checked')?result.output:''].filter(Boolean).join('\n')};
}
export async function saveDesktop(text,name){
 const result=await invoke('save_document',{text,name});
 if(!result)throw new Error('Save cancelled');
 return {name:result,message:'Saved '+result+'. Your recovery draft is kept on this device.'};
}
export async function closeDesktop(){await invoke('exit_editor')}
export function handleDesktopExit(action){
 if(desktop)listen('ate-exit-requested',action).catch(()=>{
  document.getElementById('notice').hidden=false;
  document.getElementById('notice').textContent='Use Exit to close the editor safely.';
 });
}
