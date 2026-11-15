import {createProjectStore,projectPath,textBytes} from './projects.js';
import {projectAdapter,exportProjectZip} from './project-platform.js';
export function setupProjects({workspace,openDocument,canChange,notice,exclusive=fn=>fn(),store=createProjectStore(projectAdapter()),share=exportProjectZip}){
 const $=id=>document.getElementById(id);
 let current=null,busy=false,destination='',pendingImport=null,closingId=null,deletePlan=null;
 const collapsed=new Set();
 const status=message=>{$('projectStatus').textContent=message;$('projectPickerStatus').textContent=message};
 function selected(id){try{if(id)localStorage.setItem('ate-current-project-v1',id);else localStorage.removeItem('ate-current-project-v1')}catch{status('Project files are saved, but this device could not remember the selected project.')}}
 function guard(){if(!canChange())throw Error('Finish the current save first.');}
 async function task(fn){
  if(busy)return;busy=true;
  for(const e of document.querySelectorAll('#projects button,#projects input,#projects select,#projectPicker button,#projectPicker input,#deleteFolderDialog button')){if('disabled' in e)e.disabled=true;}
  try{guard();await exclusive(fn)}catch(e){status(e.message||'Project operation could not complete. Your open tabs are kept.')}
  finally{busy=false;for(const e of document.querySelectorAll('#projects button,#projects input,#projects select,#projectPicker button,#projectPicker input,#deleteFolderDialog button'))e.disabled=false;syncSelection();}
 }
 function syncSelection(){
  $('selectedProjectFolder').textContent=destination||'Project root';$('deleteProjectFolder').hidden=!destination;$('deleteProjectFolder').disabled=busy||!current||!destination;
  for(const row of $('projectTree').querySelectorAll('[data-folder]')){const chosen=row.dataset.folder===destination;row.classList.toggle('selected',chosen);row.querySelector('.project-folder-select').setAttribute('aria-pressed',String(chosen));row.querySelector('.folder-selected-mark').hidden=!chosen;}
 }
 function chooseFolder(path){if(busy||!current)return;destination=current.folders.includes(path)?path:'';$('projectFolder').value=destination;syncSelection();}
 function showComposer(path=destination,kind='file'){
  if(!current)return;chooseFolder(path);$('projectDestination').textContent=destination||'Project root';
  $('newProjectFile').hidden=kind==='folder';$('addProjectFiles').hidden=kind==='folder';$('newProjectFolder').hidden=kind!=='folder';$('projectFileName').placeholder=kind==='folder'?'Folder name':'File name';
  $('projectComposer').hidden=false;$('projectFileName').value='';
  $('projectComposer').scrollIntoView?.({block:'nearest'});$('projectComposerTitle').focus();
 }
 async function openProject(id){current=await store.load(id);destination='';collapsed.clear();selected(id);$('projectComposer').hidden=true;await refresh();$('projectPicker').close();status('');}
 async function refresh(){
  const {projects,issues}=await store.list();
  if(current)current=projects.find(p=>p.id===current.id)||null;
  $('projectList').textContent='';$('projectLibraryCount').textContent=String(projects.length);
  for(const p of projects){const button=document.createElement('button');button.type='button';button.className='project-choice';button.dataset.projectId=p.id;button.textContent=p.name;button.setAttribute('aria-label','Open project '+p.name);button.setAttribute('aria-current',String(current?.id===p.id));button.onclick=()=>task(()=>openProject(p.id));$('projectList').append(button)}
  $('noSavedProjects').hidden=projects.length>0;
  if(issues.length)status('Some project manifests could not be read. Their files were kept. '+issues.join('; '));
  render();
 }
 function render(){
  $('projectHeading').textContent=current?current.name:'No project open';$('projectActions').hidden=!current;$('projectEmpty').hidden=!!current;
  $('projectTree').textContent='';$('projectMembership').textContent='';$('projectFolder').textContent='';$('closeProject').hidden=!current;$('projectFolderActions').hidden=!current;$('exportProject').hidden=!current;$('projectManageFiles').hidden=!current;
  const root=document.createElement('option');root.value='';root.textContent='Project root';$('projectFolder').append(root);
  if(!current){$('projectComposer').hidden=true;syncSelection();return;}
  for(const path of [...current.folders].sort()){const option=document.createElement('option');option.value=path;option.textContent=path;$('projectFolder').append(option)}
  if(!current.folders.includes(destination))destination='';$('projectFolder').value=destination;$('projectDestination').textContent=destination||'Project root';
  $('projectSummary').textContent=`${current.files.length} ${current.files.length===1?'file':'files'} · ${current.folders.length} ${current.folders.length===1?'folder':'folders'}`;
  const parentOf=path=>path.split('/').slice(0,-1).join('/');
  function icon(folder){const span=document.createElement('span');span.className='project-tree-icon';span.setAttribute('aria-hidden','true');span.innerHTML=folder?'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7V4h6l3 3h9v13H3Z"/></svg>':'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 2h9l5 5v15H5Z M14 2v6h5"/></svg>';return span;}
  function folderRow(path,depth){
   const row=document.createElement('div'),toggle=document.createElement('button'),select=document.createElement('button');row.className='project-folder-row';row.dataset.folder=path;row.style.setProperty('--project-depth',depth);
   toggle.type=select.type='button';toggle.className='project-folder-toggle';toggle.textContent=collapsed.has(path)?'▸':'▾';toggle.setAttribute('aria-label',(collapsed.has(path)?'Expand folder ':'Collapse folder ')+(path||'Project root'));toggle.setAttribute('aria-expanded',String(!collapsed.has(path)));
   toggle.onclick=()=>{if(busy)return;collapsed.has(path)?collapsed.delete(path):collapsed.add(path);render()};
   select.className='project-folder-select';select.append(icon(true),document.createTextNode(path?path.split('/').pop():'Project root'));const mark=document.createElement('span');mark.className='folder-selected-mark';mark.setAttribute('aria-hidden','true');mark.textContent='✓';select.append(mark);select.setAttribute('aria-label','Select folder '+(path||'Project root'));select.onclick=()=>chooseFolder(path);
   row.append(toggle,select);$('projectTree').append(row);
  }
  function fileRow(path,depth){
   const name=path.split('/').pop(),row=document.createElement('div'),open=document.createElement('button'),remove=document.createElement('button');row.className='project-file';row.dataset.path=path;row.style.setProperty('--project-depth',depth);
   open.type=remove.type='button';open.className='project-file-open';open.style.setProperty('--project-depth',depth);open.append(icon(false),document.createTextNode(name));open.setAttribute('aria-label','Open project file '+path);remove.textContent='Remove '+path+' from list';remove.className='project-file-remove';remove.setAttribute('aria-label','Remove '+path+' from project');
   const projectId=current.id;
   open.onclick=()=>task(async()=>{const existing=workspace.documents().find(t=>t.projectRef?.id===projectId&&t.projectRef.path===path);if(existing){$('projectComposer').hidden=true;$('projects').close();workspace.activate(existing.id);return}if(workspace.list().length>=12)throw Error('Close a tab before opening another (12 tabs maximum).');const doc=await store.read(projectId,path);$('projectComposer').hidden=true;$('projects').close();openDocument(doc.text,doc.name,doc.projectRef);});
   remove.onclick=()=>task(async()=>{current=await store.remove(projectId,path);await refresh();status('Removed '+path+' from the project list. Its file and any open tab are kept.');});
   row.append(open);$('projectTree').append(row);$('projectMembership').append(remove);
  }
  function contents(path,depth){
   if(collapsed.has(path))return;
   for(const child of [...current.folders].filter(p=>parentOf(p)===path).sort()){folderRow(child,depth);contents(child,depth+1)}
   for(const child of [...current.files].filter(p=>parentOf(p)===path).sort())fileRow(child,depth);
  }
  folderRow('',0);contents('',1);
  $('projectNoFiles').hidden=current.files.length>0;syncSelection();
 }
 $('projectsButton').onclick=()=>{if(!canChange()){notice('Finish the current save first.');return}$('menu').close();$('projects').showModal();task(async()=>{if(!current){let id;try{id=localStorage.getItem('ate-current-project-v1')}catch{}if(id)try{current=await store.load(id)}catch(e){status(e.message)}}$('projectComposer').hidden=true;await refresh();})};
 $('closeProjects').onclick=()=>{if(!busy)$('projects').close()};
 $('openProjectPicker').onclick=()=>{if(!busy){showProjectPanel('projectPicker');task(refresh)}};
 $('closeProjectPicker').onclick=()=>{if(!busy)$('projectPicker').close()};
 // Keep one modal in the top layer. Stacking native WebKit modals can
 // leave the returning page's accessibility children inert after Cancel.
 let projectReturn=null;
 function showProjectPanel(id){
  const page=$('projects'),body=page.querySelector('.project-body'),actions=$('projectFolderActions');
  projectReturn={scroll:body.scrollTop,actionScroll:actions.scrollTop};
  page.close();$(id).showModal();
 }
 for(const id of ['projectPicker','closeProjectDialog','deleteFolderDialog'])$(id).addEventListener('close',()=>{
  if(!projectReturn)return;const position=projectReturn;projectReturn=null;
  const page=$('projects');if(!page.open)page.showModal();
  page.querySelector('.project-body').scrollTop=position.scroll;$('projectFolderActions').scrollTop=position.actionScroll;
  $('closeProjects').focus({preventScroll:true});
 });
 $('createProject').onclick=()=>task(async()=>{current=await store.create($('projectName').value);destination='';collapsed.clear();selected(current.id);$('projectName').value='';$('projectComposer').hidden=true;$('projectCreatePanel').open=false;await refresh();$('projectPicker').close();status('Project created. Select a folder, then Add file or New folder.');});
 $('showProjectAdd').onclick=()=>{if(!busy&&canChange())showComposer()};
 $('showProjectFolder').onclick=()=>{if(!busy&&canChange())showComposer(destination,'folder')};
 $('closeProjectComposer').onclick=()=>{if(!busy)$('projectComposer').hidden=true};
 $('projectFolder').onchange=()=>{destination=$('projectFolder').value;$('projectDestination').textContent=destination||'Project root'};
 const relative=()=>{if(!current)throw Error('Create or open a project first.');return projectPath((destination?destination+'/':'')+$('projectFileName').value)};
 $('newProjectFolder').onclick=()=>task(async()=>{const path=relative();current=await store.folder(current.id,path);destination=path;collapsed.delete(path);$('projectFileName').value='';await refresh();$('projectComposer').hidden=true;status('Created folder '+path+'.');});
 $('newProjectFile').onclick=()=>task(async()=>{if(workspace.list().length>=12)throw Error('Close a tab before opening another.');const path=relative();current=await store.add(current.id,[{path,text:''}]);$('projectFileName').value='';await refresh();const doc=await store.read(current.id,path);$('projectComposer').hidden=true;$('projects').close();openDocument(doc.text,doc.name,doc.projectRef);});
 $('addProjectFiles').onclick=()=>{if(!busy&&canChange()&&current){pendingImport={id:current.id,folder:destination};$('projectFiles').click()}};
 $('projectFiles').oncancel=()=>{pendingImport=null};
 $('projectFiles').onchange=event=>{const files=[...event.target.files],target=pendingImport;pendingImport=null;event.target.value='';if(!files.length||!target)return;return task(async()=>{if(current?.id!==target.id)throw Error('The project changed. Add the files again to choose their destination.');const entries=[];let total=0;for(const file of files){total+=file.size;if(file.size>10*1024*1024||total>20*1024*1024)throw Error('Choose text files within the project size limits.');const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await file.arrayBuffer());textBytes(text);entries.push({path:(target.folder?target.folder+'/':'')+file.name,text})}current=await store.add(target.id,entries);destination=target.folder;await refresh();$('projectComposer').hidden=true;status('Added '+entries.length+' file(s) to '+(target.folder||'Project root')+'.');});};
 $('exportProject').onclick=()=>task(async()=>{if(workspace.documents().some(t=>t.projectRef?.id===current.id&&t.dirty))throw Error('Save the unsaved project tabs before exporting. ZIP export contains saved files only.');await share(await store.export(current.id));status('Project ZIP export finished. Confirm the saved copy in your chosen destination.');});
 $('importProject').onclick=()=>{if(!busy&&canChange())$('projectZip').click()};
 $('projectZip').onchange=event=>{const file=event.target.files[0];event.target.value='';if(!file)return;return task(async()=>{if(file.size>20*1024*1024)throw Error('Choose a project ZIP smaller than 20 MB.');current=await store.import(new Uint8Array(await file.arrayBuffer()));destination='';collapsed.clear();selected(current.id);$('projectComposer').hidden=true;await refresh();$('projectPicker').close();status('Imported '+current.name+' as a new project.');});};
 const affectedTabs=(id,path)=>workspace.documents().filter(t=>t.projectRef?.id===id&&(t.projectRef.path===path||t.projectRef.path.startsWith(path+'/')));
 $('deleteProjectFolder').onclick=()=>task(async()=>{
  if(!current||!destination)throw Error('Select a folder to delete. Project root cannot be deleted.');
  if(affectedTabs(current.id,destination).some(t=>t.dirty))throw Error('Save or close the unsaved files in this folder before deleting it.');
  deletePlan=await store.folderDeletion(current.id,destination);$('deleteFolderTitle').textContent='Delete '+destination+'?';$('deleteFolderMessage').textContent='This deletes the folder and '+deletePlan.files+' file(s), including '+deletePlan.folders+' subfolder(s), from this project’s storage. Outside originals and other projects are kept.';
  $('deleteFolderContents').textContent='';for(const item of deletePlan.entries){const li=document.createElement('li');li.textContent=item.path+(item.type==='directory'?'/':'');$('deleteFolderContents').append(li)}$('deleteFolderError').textContent='';showProjectPanel('deleteFolderDialog');
 });
 $('cancelDeleteFolder').onclick=()=>{deletePlan=null;$('deleteFolderDialog').close()};
 $('deleteFolderDialog').addEventListener('cancel',()=>{deletePlan=null});
 $('confirmDeleteFolder').onclick=()=>task(async()=>{
  const plan=deletePlan;if(!plan||current?.id!==plan.id)throw Error('Select the folder again before deleting.');
  const affected=affectedTabs(plan.id,plan.path);if(affected.some(t=>t.dirty)){$('deleteFolderError').textContent='Unsaved edits appeared. Keep the folder, then save or close those files.';return}
  try{const result=await store.deleteFolder(plan);workspace.closeMany(affected.map(t=>t.id),{focus:false});current=result;destination=plan.path.split('/').slice(0,-1).join('/');collapsed.clear();$('projectComposer').hidden=true;deletePlan=null;$('deleteFolderDialog').close();await refresh();status('Deleted folder '+plan.path+'.'+(result.cleanupPending?' A temporary recovery copy could not be removed.':''));}
  catch(e){$('deleteFolderError').textContent=e.message||'Folder deletion failed. Your files were kept.';}
 });
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
  closingId=current.id;$('closeProjectTitle').textContent='Close '+current.name+'?';$('closeProjectMessage').textContent=`${dirty.length} project ${dirty.length===1?'file has':'files have'} unsaved changes. Other editor tabs and saved project files are kept.`;showProjectPanel('closeProjectDialog');
 };
 $('cancelProjectClose').onclick=()=>{$('closeProjectDialog').close();closingId=null};
 $('discardAndCloseProject').onclick=()=>{const id=closingId;$('closeProjectDialog').close();closingId=null;return task(()=>finishClose(id))};
 $('saveAndCloseProject').onclick=()=>{const id=closingId;$('closeProjectDialog').close();closingId=null;return task(async()=>{if(current?.id!==id)throw Error('The active project changed.');for(const tab of workspace.documents().filter(t=>t.projectRef?.id===id&&t.dirty)){const result=await store.save(tab.projectRef,tab.name,tab.text);workspace.saved(tab.id,tab.text,result.name,result.projectRef)}if(workspace.documents().some(t=>t.projectRef?.id===id&&t.dirty))throw Error('New changes were made while saving. The project is still open.');await finishClose(id)});};
 return {dismiss(){projectReturn=null;for(const id of ['projectPicker','closeProjectDialog','deleteFolderDialog','projects'])if($(id).open)$(id).close()},save:async(ref,name,text)=>{const result=await store.save(ref,name,text);if(current?.id===ref.id){current=await store.load(ref.id);render()}return result},store,get current(){return current}};
}
