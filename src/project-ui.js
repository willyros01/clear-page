import {createProjectStore,projectPath,textBytes} from './projects.js';
import {iosProjectAdapter,shareProjectZip} from './ios-projects.js';
export function setupProjects({workspace,openDocument,canChange,notice,exclusive=fn=>fn(),store=createProjectStore(iosProjectAdapter()),share=shareProjectZip}){
 const $=id=>document.getElementById(id);
 let current=null,busy=false,destination='',pendingImport=null,closingId=null;
 const collapsed=new Set();
 const status=message=>{$('projectStatus').textContent=message};
 function selected(id){try{if(id)localStorage.setItem('ate-current-project-v1',id);else localStorage.removeItem('ate-current-project-v1')}catch{status('Project files are saved, but this device could not remember the selected project.')}}
 function guard(){if(!canChange())throw Error('Finish the current save first.');}
 async function task(fn){
  if(busy)return;busy=true;
  for(const e of $('projects').querySelectorAll('button,input,select,summary')){if('disabled' in e)e.disabled=true;}
  try{guard();await exclusive(fn)}catch(e){status(e.message||'Project operation could not complete. Your open tabs are kept.')}
  finally{busy=false;for(const e of $('projects').querySelectorAll('button,input,select'))e.disabled=false;}
 }
 function showComposer(path=destination){
  if(!current)return;destination=current.folders.includes(path)?path:'';
  $('projectFolder').value=destination;$('projectDestination').textContent=destination||'Project root';
  $('projectComposer').hidden=false;
  $('projectComposer').scrollIntoView?.({block:'nearest'});$('projectComposerTitle').focus();
 }
 async function openProject(id){current=await store.load(id);destination='';collapsed.clear();selected(id);$('projectComposer').hidden=current.files.length>0;await refresh();status('Opened project '+current.name+'.');}
 async function refresh(){
  const {projects,issues}=await store.list();
  if(current)current=projects.find(p=>p.id===current.id)||null;
  $('projectList').textContent='';$('projectLibraryCount').textContent=String(projects.length);
  for(const p of projects){const button=document.createElement('button');button.type='button';button.className='project-choice';button.dataset.projectId=p.id;button.textContent=p.name;button.setAttribute('aria-label','Open project '+p.name);button.setAttribute('aria-current',String(current?.id===p.id));button.onclick=()=>task(()=>openProject(p.id));$('projectList').append(button)}
  $('noSavedProjects').hidden=projects.length>0;$('projectLibrary').open=!current;
  if(issues.length)status('Some project manifests could not be read. Their files were kept. '+issues.join('; '));
  render();
 }
 function render(){
  $('projectHeading').textContent=current?current.name:'No project open';$('projectActions').hidden=!current;$('projectEmpty').hidden=!!current;
  $('projectTree').textContent='';$('projectFolder').textContent='';
  const root=document.createElement('option');root.value='';root.textContent='Project root';$('projectFolder').append(root);
  if(!current){$('projectComposer').hidden=true;return;}
  for(const path of [...current.folders].sort()){const option=document.createElement('option');option.value=path;option.textContent=path;$('projectFolder').append(option)}
  if(!current.folders.includes(destination))destination='';$('projectFolder').value=destination;$('projectDestination').textContent=destination||'Project root';
  $('projectSummary').textContent=`${current.files.length} ${current.files.length===1?'file':'files'} · ${current.folders.length} ${current.folders.length===1?'folder':'folders'}`;
  const parentOf=path=>path.split('/').slice(0,-1).join('/');
  function folderRow(path,depth){
   const row=document.createElement('div'),toggle=document.createElement('button'),add=document.createElement('button');row.className='project-folder-row';row.dataset.folder=path;
   toggle.type=add.type='button';toggle.className='project-folder-toggle';toggle.style.setProperty('--project-depth',depth);
   const label=path?path.split('/').pop():'Project root';toggle.textContent=(collapsed.has(path)?'▸ ':'▾ ')+label;toggle.setAttribute('aria-label',(collapsed.has(path)?'Expand folder ':'Collapse folder ')+(path||'Project root'));toggle.setAttribute('aria-expanded',String(!collapsed.has(path)));
   toggle.onclick=()=>{if(busy)return;collapsed.has(path)?collapsed.delete(path):collapsed.add(path);render()};
   add.className='project-folder-add';add.textContent='+';add.setAttribute('aria-label','Add files to '+(path||'Project root'));add.title='Add a file or folder to '+(path||'Project root');add.onclick=()=>{if(!busy&&canChange())showComposer(path)};
   row.append(toggle,add);$('projectTree').append(row);
  }
  function fileRow(path,depth){
   const name=path.split('/').pop(),row=document.createElement('div'),open=document.createElement('button'),remove=document.createElement('button');row.className='project-file';row.dataset.path=path;
   open.type=remove.type='button';open.className='project-file-open';open.style.setProperty('--project-depth',depth);open.textContent=name;open.setAttribute('aria-label','Open project file '+path);remove.textContent='Remove';remove.className='project-file-remove';remove.setAttribute('aria-label','Remove '+path+' from project');
   const projectId=current.id;
   open.onclick=()=>task(async()=>{const existing=workspace.documents().find(t=>t.projectRef?.id===projectId&&t.projectRef.path===path);if(existing){$('projects').close();workspace.activate(existing.id);return}if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');const doc=await store.read(projectId,path);$('projects').close();openDocument(doc.text,doc.name,doc.projectRef);});
   remove.onclick=()=>task(async()=>{current=await store.remove(projectId,path);await refresh();status('Removed '+path+' from the project list. Its file and any open tab are kept.');});
   row.append(open,remove);$('projectTree').append(row);
  }
  function contents(path,depth){
   if(collapsed.has(path))return;
   for(const child of [...current.folders].filter(p=>parentOf(p)===path).sort()){folderRow(child,depth);contents(child,depth+1)}
   for(const child of [...current.files].filter(p=>parentOf(p)===path).sort())fileRow(child,depth);
  }
  folderRow('',0);contents('',1);
  $('projectNoFiles').hidden=current.files.length>0;
 }
 $('projectsButton').onclick=()=>{if(!canChange()){notice('Finish the current save first.');return}$('menu').close();$('projects').showModal();task(async()=>{if(!current){let id;try{id=localStorage.getItem('ate-current-project-v1')}catch{}if(id)try{current=await store.load(id)}catch(e){status(e.message)}}$('projectComposer').hidden=!!current?.files.length;await refresh();})};
 $('closeProjects').onclick=()=>{if(!busy)$('projects').close()};
 $('createProject').onclick=()=>task(async()=>{current=await store.create($('projectName').value);destination='';collapsed.clear();selected(current.id);$('projectName').value='';$('projectComposer').hidden=false;$('projectCreatePanel').open=false;await refresh();showComposer('');status('Project created. Choose a destination, then create or add a file.');});
 $('showProjectAdd').onclick=()=>{if(!busy&&canChange())showComposer()};
 $('closeProjectComposer').onclick=()=>{if(!busy)$('projectComposer').hidden=true};
 $('projectFolder').onchange=()=>{destination=$('projectFolder').value;$('projectDestination').textContent=destination||'Project root'};
 const relative=()=>{if(!current)throw Error('Create or open a project first.');return projectPath((destination?destination+'/':'')+$('projectFileName').value)};
 $('newProjectFolder').onclick=()=>task(async()=>{const path=relative();current=await store.folder(current.id,path);destination=path;collapsed.delete(path);$('projectFileName').value='';await refresh();$('projectComposer').hidden=false;status('Created folder '+path+'. New files will go here.');});
 $('newProjectFile').onclick=()=>task(async()=>{if(workspace.list().length>=12)throw Error('Close a tab before opening another.');const path=relative();current=await store.add(current.id,[{path,text:''}]);$('projectFileName').value='';await refresh();const doc=await store.read(current.id,path);$('projects').close();openDocument(doc.text,doc.name,doc.projectRef);});
 $('addProjectFiles').onclick=()=>{if(!busy&&canChange()&&current){pendingImport={id:current.id,folder:destination};$('projectFiles').click()}};
 $('projectFiles').oncancel=()=>{pendingImport=null};
 $('projectFiles').onchange=event=>{const files=[...event.target.files],target=pendingImport;pendingImport=null;event.target.value='';if(!files.length||!target)return;return task(async()=>{if(current?.id!==target.id)throw Error('The project changed. Add the files again to choose their destination.');const entries=[];let total=0;for(const file of files){total+=file.size;if(file.size>10*1024*1024||total>20*1024*1024)throw Error('Choose text files within the project size limits.');const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await file.arrayBuffer());textBytes(text);entries.push({path:(target.folder?target.folder+'/':'')+file.name,text})}current=await store.add(target.id,entries);destination=target.folder;await refresh();status('Added '+entries.length+' file(s) to '+(target.folder||'Project root')+'. Outside originals are unchanged.');});};
 $('exportProject').onclick=()=>task(async()=>{if(workspace.documents().some(t=>t.projectRef?.id===current.id&&t.dirty))throw Error('Save the unsaved project tabs before exporting. ZIP export contains saved files only.');await share(await store.export(current.id));status('Project ZIP share sheet closed. Confirm the saved ZIP in Files.');});
 $('importProject').onclick=()=>{if(!busy&&canChange())$('projectZip').click()};
 $('projectZip').onchange=event=>{const file=event.target.files[0];event.target.value='';if(!file)return;return task(async()=>{if(file.size>20*1024*1024)throw Error('Choose a project ZIP smaller than 20 MB.');current=await store.import(new Uint8Array(await file.arrayBuffer()));destination='';collapsed.clear();selected(current.id);$('projectComposer').hidden=true;await refresh();status('Imported '+current.name+' as a new project.');});};
 function finishClose(id){
  if(current?.id!==id)throw Error('The active project changed. Close it again when ready.');
  const name=current.name,ids=workspace.documents().filter(t=>t.projectRef?.id===id).map(t=>t.id);
  workspace.closeMany(ids,{focus:false});current=null;destination='';pendingImport=null;collapsed.clear();selected(null);$('projectCreatePanel').open=false;
  return refresh().then(()=>status('Closed '+name+'. Saved project files are kept.'));
 }
 $('closeProject').onclick=()=>{
  if(busy||!canChange()||!current)return;
  if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
  const dirty=workspace.documents().filter(t=>t.projectRef?.id===current.id&&t.dirty);
  if(!dirty.length)return task(()=>finishClose(current.id));
  closingId=current.id;$('closeProjectTitle').textContent='Close '+current.name+'?';$('closeProjectMessage').textContent=`${dirty.length} project ${dirty.length===1?'file has':'files have'} unsaved changes. Other editor tabs and saved project files are kept.`;$('closeProjectDialog').showModal();
 };
 $('cancelProjectClose').onclick=()=>{$('closeProjectDialog').close();closingId=null};
 $('discardAndCloseProject').onclick=()=>{const id=closingId;$('closeProjectDialog').close();closingId=null;return task(()=>finishClose(id))};
 $('saveAndCloseProject').onclick=()=>{const id=closingId;$('closeProjectDialog').close();closingId=null;return task(async()=>{if(current?.id!==id)throw Error('The active project changed.');for(const tab of workspace.documents().filter(t=>t.projectRef?.id===id&&t.dirty)){const result=await store.save(tab.projectRef,tab.name,tab.text);workspace.saved(tab.id,tab.text,result.name,result.projectRef)}if(workspace.documents().some(t=>t.projectRef?.id===id&&t.dirty))throw Error('New changes were made while saving. The project is still open.');await finishClose(id)});};
 return {save:async(ref,name,text)=>{const result=await store.save(ref,name,text);if(current?.id===ref.id){current=await store.load(ref.id);render()}return result},store,get current(){return current}};
}
