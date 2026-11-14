import {zipSync,unzipSync,strToU8} from 'fflate';
import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '@noble/hashes/utils.js';
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
export const manifestName='project.ateproj';
export const limits={files:200,folders:100,fileBytes:10*1024*1024,totalBytes:20*1024*1024};
const lineEndingOf=text=>(text.match(/\r\n|\r|\n/)||['\n'])[0];
export const revision=text=>bytesToHex(sha256(strToU8(text)));
const fold=path=>path.normalize('NFC').toLowerCase();
export function projectPath(path){
 if(typeof path!=='string'||!path||path.length>512||path.startsWith('/')||/[\\:%#\u0000-\u001f\u007f]/.test(path))throw Error('Use a relative project path, such as src/main.c.');
 for(const part of path.split('/'))if(!part||part==='.'||part==='..'||part!==part.trim()||/[. ]$/.test(part)||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)||/[<>"|?*]/.test(part))throw Error('That path is not portable. Use ordinary folder and file names.');
 if(fold(path)===manifestName)throw Error('project.ateproj is reserved for project settings.');
 return path;
}
export function textBytes(text){if(typeof text!=='string'||text.includes('\0'))throw Error('Projects accept UTF-8 text files only.');const bytes=strToU8(text);if(bytes.length>limits.fileBytes)throw Error('Each project file must be smaller than 10 MB.');return bytes;}
export function validateManifest(input){
 if(input?.format!=='ate-project'||input.version!==1||typeof input.name!=='string'||!input.name.trim()||input.name.length>80||!Array.isArray(input.files)||!Array.isArray(input.folders)||input.files.length>limits.files||input.folders.length>limits.folders)throw Error('Unsupported or invalid ATE project manifest.');
 const files=input.files.map(projectPath),folders=input.folders.map(projectPath),seen=new Set();
 for(const path of [...files,...folders]){const key=fold(path);if(seen.has(key))throw Error('Duplicate project paths are not allowed, including case-only duplicates.');seen.add(key);}
 for(const path of [...files,...folders])for(const parent of parents(path)){const prior=folders.find(p=>fold(p)===fold(parent));if(prior&&prior!==parent)throw Error('Folder names differ only by case.');if(!prior){if(seen.has(fold(parent)))throw Error('A file cannot also be a folder.');folders.push(parent);seen.add(fold(parent));}}
 if(folders.length>limits.folders)throw Error('Too many project folders.');
 for(const file of files)for(const other of [...files,...folders])if(other!==file&&fold(other).startsWith(fold(file)+'/'))throw Error('A file cannot also be a project folder.');
 return {format:'ate-project',version:1,name:input.name.trim(),folders,files};
}
const parents=path=>path.split('/').slice(0,-1).map((_,i,a)=>a.slice(0,i+1).join('/'));
export function createProjectStore(adapter){
 let queue=Promise.resolve();
 const serial=fn=>{const task=queue.then(fn);queue=task.catch(()=>{});return task};
 const load=async id=>{const text=await adapter.read(id,manifestName);if(text===null)throw Error('Project not found. Export your recovered tab to keep a separate copy.');return validateManifest(JSON.parse(text));};
 const commit=(id,m)=>adapter.write(id,manifestName,JSON.stringify(validateManifest(m),null,2)+'\n');
 async function create(name,initial={folders:[],files:[]},contents={}){
  const m=validateManifest({format:'ate-project',version:1,name,...initial});
  const slug=m.name.normalize('NFKD').replace(/[^a-z0-9]+/gi,'-').slice(0,36).toLowerCase()||'project';
  const id='p-'+slug+'-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  for(const folder of m.folders)await adapter.mkdir(id,folder);
  for(const path of m.files)await adapter.write(id,path,contents[path]);
  await commit(id,m);return {id,...m};
 }
 async function budget(id,m,replacements={}){let size=0;for(const path of m.files){const text=own(replacements,path)?replacements[path]:await adapter.read(id,path);if(text===null)throw Error('Missing project file: '+path);size+=textBytes(text).length;if(size>limits.totalBytes)throw Error('A project is limited to 20 MB of text.');}}
 async function add(id,entries){
  const m=await load(id),contents=Object.create(null);
  for(const entry of entries){const path=projectPath(entry.path);textBytes(entry.text);if(own(contents,path)||m.files.some(p=>fold(p)===fold(path)))throw Error('That file is already in the project: '+path);const retained=await adapter.read(id,path);if(retained!==null&&retained!==entry.text)throw Error('A file already exists at '+path+'. Choose another name; existing files are kept.');contents[path]=entry.text;m.files.push(path);for(const folder of parents(path))if(!m.folders.includes(folder))m.folders.push(folder);}
  validateManifest(m);await budget(id,m,contents);
  for(const [path,text] of Object.entries(contents))await adapter.write(id,path,text);
  await commit(id,m);return {id,...m};
 }
 return {
  create:name=>serial(()=>create(name)),
  list:()=>serial(async()=>{const projects=[],issues=[];for(const id of await adapter.list()){try{projects.push({id,...await load(id)})}catch(e){issues.push(id+': '+e.message)}}return {projects,issues}}),
  load:id=>serial(async()=>({id,...await load(id)})),
  add:(id,entries)=>serial(()=>add(id,entries)),
  folder:(id,path)=>serial(async()=>{projectPath(path);const m=await load(id);for(const folder of [...parents(path),path])if(!m.folders.includes(folder))m.folders.push(folder);validateManifest(m);await adapter.mkdir(id,path);await commit(id,m);return {id,...m}}),
  read:(id,path)=>serial(async()=>{projectPath(path);const m=await load(id);if(!m.files.includes(path))throw Error('That file is no longer listed in this project.');const text=await adapter.read(id,path);if(text===null)throw Error('Project file is missing: '+path);textBytes(text);return {text,name:path,projectRef:{id,path,revision:revision(text),lineEnding:lineEndingOf(text)}};}),
  save:(ref,name,text)=>serial(async()=>{
   const path=projectPath(name),m=await load(ref.id),ending=['\n','\r\n','\r'].includes(ref.lineEnding)?ref.lineEnding:'\n';text=text.replace(/\r\n|\r|\n/g,ending);textBytes(text);
   if(path!==ref.path){await add(ref.id,[{path,text}]);return {name:path,projectRef:{id:ref.id,path,revision:revision(text),lineEnding:ending},message:'Saved a new project copy: '+path+'. The original file is kept.'};}
   const old=await adapter.read(ref.id,path);if(old===null||revision(old)!==ref.revision)throw Error('This project file changed outside this tab. Reopen it, or use Export copy to keep your edits.');
   await budget(ref.id,m,{[path]:text});await adapter.write(ref.id,path,text);
   return {name:path,projectRef:{id:ref.id,path,revision:revision(text),lineEnding:ending},message:'Saved in project '+m.name+': '+path};
  }),
  remove:(id,path)=>serial(async()=>{const m=await load(id);m.files=m.files.filter(p=>p!==path);await commit(id,m);return {id,...m};}),
  export: id=>serial(async()=>{const m=await load(id);await budget(id,m);const files=Object.create(null);files[manifestName]=strToU8(JSON.stringify(m,null,2)+'\n');for(const path of m.files)files[path]=textBytes(await adapter.read(id,path));for(const folder of m.folders)files[folder+'/']=new Uint8Array();return {name:m.name.replace(/[\\/:%#\u0000-\u001f]/g,'_')+'.zip',bytes:zipSync(files,{level:6})};}),
  import: bytes=>serial(async()=>{
   if(!(bytes instanceof Uint8Array)||bytes.length>limits.totalBytes)throw Error('Choose a project ZIP smaller than 20 MB.');
   let total=0,count=0;const seen=new Set();
   const files=unzipSync(bytes,{filter:entry=>{const key=fold(entry.name.replace(/\/$/,''));if(seen.has(key))throw Error('Duplicate ZIP paths are not allowed.');seen.add(key);if(++count>limits.files+limits.folders+1)throw Error('Too many ZIP entries.');if(entry.name!==manifestName)projectPath(entry.name.replace(/\/$/,''));total+=entry.originalSize;if(entry.originalSize>limits.fileBytes||total>limits.totalBytes+128*1024)throw Error('Project ZIP expands beyond the size limit.');return true;}});
   if(!files[manifestName]||files[manifestName].length>128*1024)throw Error('The ZIP must contain project.ateproj at its root.');
   const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}),m=validateManifest(JSON.parse(decoder.decode(files[manifestName]))),contents=Object.create(null);
   let contentSize=0;for(const path of m.files){if(!own(files,path))throw Error('Project ZIP is missing '+path);contents[path]=decoder.decode(files[path]);contentSize+=textBytes(contents[path]).length;if(contentSize>limits.totalBytes)throw Error('A project is limited to 20 MB of text.');}
   return create(m.name,m,contents);
  })
 };
}
