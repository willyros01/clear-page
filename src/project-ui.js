import {createProjectStore,projectPath,textBytes} from './projects.js';
import {iosProjectAdapter,shareProjectZip} from './ios-projects.js';
export function setupProjects({workspace,openDocument,canChange,notice,store=createProjectStore(iosProjectAdapter()),share=shareProjectZip}){
 const $=id=>document.getElementById(id);let current=null,busy=false;
 const status=message=>{$('projectStatus').textContent=message};
 function selected(id){try{localStorage.setItem('ate-current-project-v1',id)}catch{status('Project files are saved, but this device could not remember the selected project.')}}
 function guard(){if(!canChange())throw Error('Finish the current save first.');}
 async function task(fn){if(busy)return;busy=true;for(const e of $('projects').querySelectorAll('button,input,select'))e.disabled=true;try{guard();await fn()}catch(e){status(e.message||'Project operation could not complete. Your open tabs are kept.')}finally{busy=false;for(const e of $('projects').querySelectorAll('button,input,select'))e.disabled=false;}}
 async function refresh(){const {projects,issues}=await store.list();if(current){const updated=projects.find(p=>p.id===current.id);current=updated||null;}$('projectSelect').textContent='';const empty=document.createElement('option');empty.value='';empty.textContent='Choose a saved project';$('projectSelect').append(empty);for(const p of projects){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;$('projectSelect').append(option)}if(current)$('projectSelect').value=current.id;if(issues.length)status('Some project manifests could not be read. Their files were kept. '+issues.join('; '));render();}
 function render(){
  $('projectHeading').textContent=current?current.name:'No project open';$('projectActions').hidden=!current;$('projectTree').textContent='';$('projectFolder').textContent='';
  const root=document.createElement('option');root.value='';root.textContent='Project root';$('projectFolder').append(root);
  if(!current)return;
  for(const path of [...current.folders].sort()){const option=document.createElement('option');option.value=path;option.textContent=path;$('projectFolder').append(option)}
  const groups=new Map([['',$('projectTree')]]);
  function folder(path){if(groups.has(path))return groups.get(path);const parts=path.split('/'),name=parts.pop(),parent=folder(parts.join('/')),details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');details.open=true;summary.textContent=name;details.append(summary,list);parent.append(details);groups.set(path,list);return list;}
  for(const path of [...current.folders].sort())folder(path);
  for(const path of [...current.files].sort()){
   const parts=path.split('/'),name=parts.pop(),row=document.createElement('div'),open=document.createElement('button'),remove=document.createElement('button');row.className='project-file';open.textContent=name;open.setAttribute('aria-label','Open project file '+path);remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+path+' from project');
   const projectId=current.id;
   open.onclick=()=>task(async()=>{const existing=workspace.documents().find(t=>t.projectRef?.id===projectId&&t.projectRef.path===path);if(existing){$('projects').close();workspace.activate(existing.id);return}if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');const doc=await store.read(projectId,path);$('projects').close();openDocument(doc.text,doc.name,doc.projectRef);});
   remove.onclick=()=>task(async()=>{current=await store.remove(projectId,path);render();status('Removed '+path+' from the project list. Its file and any open tab are kept.');});
   row.append(open,remove);folder(parts.join('/')).append(row);
  }
 }
 $('projectsButton').onclick=()=>{if(!canChange()){notice('Finish the current save first.');return}$('menu').close();$('projects').showModal();task(async()=>{if(!current){let id;try{id=localStorage.getItem('ate-current-project-v1')}catch{}if(id)try{current=await store.load(id)}catch(e){status(e.message)}}await refresh();})};
 $('closeProjects').onclick=()=>{if(busy)return;$('projects').close()};
 $('createProject').onclick=()=>task(async()=>{current=await store.create($('projectName').value);selected(current.id);$('projectName').value='';status('Project created. Add files or create a new file.');await refresh()});
 $('projectSelect').onchange=()=>task(async()=>{if(!$('projectSelect').value)return;current=await store.load($('projectSelect').value);selected(current.id);render();status('Opened project '+current.name+'. Existing editor tabs are kept.');});
 const relative=()=>{if(!current)throw Error('Create or open a project first.');return projectPath(($('projectFolder').value?$('projectFolder').value+'/':'')+$('projectFileName').value)};
 $('newProjectFolder').onclick=()=>task(async()=>{current=await store.folder(current.id,relative());render();$('projectFileName').value='';status('Folder created.');});
 $('newProjectFile').onclick=()=>task(async()=>{if(workspace.list().length>=12)throw Error('Close a tab before opening another.');const path=relative();current=await store.add(current.id,[{path,text:''}]);render();const doc=await store.read(current.id,path);$('projects').close();openDocument(doc.text,doc.name,doc.projectRef);});
 $('addProjectFiles').onclick=()=>{if(!busy&&canChange())$('projectFiles').click()};
 $('projectFiles').onchange=event=>{const files=[...event.target.files],folder=$('projectFolder').value,id=current?.id;event.target.value='';if(!files.length||!id)return;task(async()=>{const entries=[];let total=0;for(const file of files){total+=file.size;if(file.size>10*1024*1024||total>20*1024*1024)throw Error('Choose text files within the project size limits.');const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await file.arrayBuffer());textBytes(text);entries.push({path:(folder?folder+'/':'')+file.name,text})}current=await store.add(id,entries);render();status('Added copies of '+entries.length+' file(s). Outside originals are unchanged.');});};
 $('exportProject').onclick=()=>task(async()=>{if(workspace.documents().some(t=>t.projectRef?.id===current.id&&t.dirty))throw Error('Save the unsaved project tabs before exporting. ZIP export contains saved files only.');await share(await store.export(current.id));status('Project ZIP share sheet closed. Confirm the saved ZIP in Files.');});
 $('importProject').onclick=()=>{if(!busy&&canChange())$('projectZip').click()};
 $('projectZip').onchange=event=>{const file=event.target.files[0];event.target.value='';if(!file)return;task(async()=>{if(file.size>20*1024*1024)throw Error('Choose a project ZIP smaller than 20 MB.');current=await store.import(new Uint8Array(await file.arrayBuffer()));selected(current.id);await refresh();status('Imported '+current.name+' as a new project. Existing projects and outside files are kept.');});};
 return {save:async(ref,name,text)=>{const result=await store.save(ref,name,text);if(current?.id===ref.id){current=await store.load(ref.id);render()}return result},store,get current(){return current}};
}
