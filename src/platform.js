import {Capacitor} from '@capacitor/core';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
export const native=Capacitor.isNativePlatform();
export async function saveText(text,name){
 if(native){
  const safeName=name.replace(/[\\/\u0000-\u001f:]/g,'_')||'Untitled.txt';
  const result=await Filesystem.writeFile({path:'exports/'+safeName,data:text,directory:Directory.Cache,encoding:Encoding.UTF8,recursive:true});
  await Share.share({title:'Save '+safeName,files:[result.uri],dialogTitle:'Save or share your text file'});
  return 'Save/share sheet closed. Your recovery draft is kept on this device.';
 }
 const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 return 'File download started. Your draft is also kept in this browser.';
}
