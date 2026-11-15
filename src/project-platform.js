import {Capacitor} from '@capacitor/core';
import {invoke} from '@tauri-apps/api/core';
import {desktop} from './desktop.js';
import {iosProjectAdapter,shareProjectZip} from './ios-projects.js';
import {browserProjectAdapter} from './browser-projects.js';
export function projectAdapter(){
 if(Capacitor.isNativePlatform())return iosProjectAdapter();
 if(!desktop)return browserProjectAdapter();
 const io=async(op,id,path='',extra={})=>invoke('project_io',{request:{op,id,path,...extra}});
 return {list:async()=>(await io('list','')).ids,read:async(id,path)=>(await io('read',id,path)).text,write:(id,path,text)=>io('write',id,path,{text}),mkdir:(id,path)=>io('mkdir',id,path),folderEntries:async(id,path)=>(await io('entries',id,path)).entries,renameFolder:(id,from,to)=>io('rename',id,from,{to}),removeFolder:(id,path)=>io('remove',id,path)};
}
export async function exportProjectZip({name,bytes}){
 if(Capacitor.isNativePlatform())return shareProjectZip({name,bytes});
 if(desktop){const saved=await invoke('save_project_zip',{name,bytes:[...bytes]});if(!saved)throw Error('Project ZIP save cancelled. Your project is kept.');return;}
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
