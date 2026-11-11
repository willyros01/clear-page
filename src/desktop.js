import {isTauri, invoke} from '@tauri-apps/api/core';
import {listen} from '@tauri-apps/api/event';

export const desktop=isTauri();
export async function saveDesktop(text,name){
 const result=await invoke('save_document',{text,name});
 if(!result)throw new Error('Save cancelled');
 return 'Saved '+result+'. Your recovery draft is kept on this device.';
}
export async function closeDesktop(){await invoke('exit_editor')}
export function handleDesktopExit(action){
 if(desktop)listen('ate-exit-requested',action).catch(()=>{
  document.getElementById('notice').hidden=false;
  document.getElementById('notice').textContent='Use Exit to close the editor safely.';
 });
}
