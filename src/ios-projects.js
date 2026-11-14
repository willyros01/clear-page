import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
const root='ATEProjects';
function location(id,path=''){
 if(!/^p-[a-z0-9-]+$/i.test(id))throw Error('Invalid project identifier.');
 // Project member paths are validated by the store; metadata is deliberately separate.
 if(path.includes('..')&&path.split('/').includes('..')||path.startsWith('/')||/[\\\0]/.test(path))throw Error('Invalid project path.');
 return root+'/'+id+(path?'/'+path:'');
}
async function ensureDirectory(path){
 try{await Filesystem.mkdir({path,directory:Directory.Documents,recursive:true})}
 catch(error){if(error.code!=='OS-PLUG-FILE-0010')throw error;const existing=await Filesystem.stat({path,directory:Directory.Documents});if(existing.type!=='directory')throw error;}
}
async function entries(path){await ensureDirectory(path);return (await Filesystem.readdir({path,directory:Directory.Documents})).files;}
export function iosProjectAdapter(){return {
 async list(){return (await entries(root)).filter(x=>x.type==='directory'&&/^p-[a-z0-9-]+$/i.test(x.name)).map(x=>x.name)},
 async read(id,path){const full=location(id,path),parent=full.slice(0,full.lastIndexOf('/')),leaf=full.slice(full.lastIndexOf('/')+1);if(!(await entries(parent)).some(x=>x.name.normalize('NFC').toLowerCase()===leaf.normalize('NFC').toLowerCase()))return null;const result=await Filesystem.readFile({path:full,directory:Directory.Documents,encoding:Encoding.UTF8});if(typeof result.data!=='string')throw Error('Project file could not be read as UTF-8 text.');return result.data;},
 async write(id,path,text){const full=location(id,path),parent=full.slice(0,full.lastIndexOf('/')),leaf=full.slice(full.lastIndexOf('/')+1),existing=(await entries(parent)).find(x=>x.name.normalize('NFC').toLowerCase()===leaf.normalize('NFC').toLowerCase());if(existing&&existing.name.normalize('NFC')!==leaf.normalize('NFC'))throw Error('An existing file differs only by case. Choose another name.');await Filesystem.writeFile({path:location(id,path),directory:Directory.Documents,encoding:Encoding.UTF8,data:text,recursive:true})},
 async mkdir(id,path){await ensureDirectory(location(id,path))}
};}
export async function shareProjectZip({name,bytes}){
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const result=await Filesystem.writeFile({path:'project-exports/'+name,data:btoa(binary),directory:Directory.Cache,recursive:true});
 await Share.share({title:name,files:[result.uri],dialogTitle:'Save or share project ZIP'});
}
