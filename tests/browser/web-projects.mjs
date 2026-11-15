import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {unzipSync,strFromU8} from 'fflate';
import {checkProjectLayout} from '../project-layout.js';
const server=createServer(async(req,res)=>{try{const path=req.url.split('?')[0],file=path==='/'?'index.html':path.slice(1);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await readFile(new URL('../../dist/'+file,import.meta.url)))}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const engines=process.env.ATE_BROWSER==='chromium'?{chromium}:{chromium,webkit};
try{for(const [engineName,engine] of Object.entries(engines)){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:1194,height:834},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('.cm-content');
  const $=id=>page.locator('#'+id),editor=page.locator('.cm-content');
  await $('menuButton').click();assert.equal(await $('basicMode').getAttribute('aria-pressed'),'true');await $('advancedMode').click();await $('closeMenu').click();
  await editor.fill('Keep ordinary note');
  const projects=async()=>{await $('menuButton').click();await $('projectsButton').click();await page.waitForFunction(()=>document.getElementById('projects').open&&!document.getElementById('createProject').disabled)};
  const ready=async()=>page.waitForFunction(()=>!document.getElementById('createProject').disabled);
  await projects();await $('openProjectPicker').click();await $('projectName').fill('Web project');await $('createProject').click();await page.waitForSelector('#projects[open]');await ready();
  const projectId=await page.evaluate(()=>localStorage.getItem('ate-current-project-v1'));
  const select=path=>page.getByRole('button',{name:'Select folder '+path,exact:true});
  const folder=async name=>{await $('showProjectFolder').click();await $('projectFileName').fill(name);await $('newProjectFolder').click();await page.waitForSelector('#projectComposer',{state:'hidden'});await ready()};
  const file=async(name,text)=>{await $('showProjectAdd').click();await $('projectFileName').fill(name);await $('newProjectFile').click();await page.waitForSelector('#projects',{state:'hidden'});await editor.fill(text);await $('save').click();await page.waitForFunction(()=>document.getElementById('notice').textContent.startsWith('Saved in project'))};
  await folder('src');await file('query.sql',"SELECT 'café';\n");await projects();await select('Project root').click();await file('settings.json','{}');
  await projects();await select('Project root').click();await folder('__proto__');await file('constructor','ordinary portable name');
  await page.reload();await page.waitForSelector('.cm-content');assert.equal(await editor.innerText(),'ordinary portable name');await projects();assert.ok(await page.getByRole('button',{name:'Open project file src/query.sql',exact:true}).count());
  await select('src').click();for(const scale of [1,2,3])assert.ok(await page.evaluate(checkProjectLayout,[scale]));
  await $('openProjectPicker').click();const downloading=page.waitForEvent('download');await $('exportProject').click();const download=await downloading;const zip=await readFile(await download.path()),files=unzipSync(zip);
  assert.equal(strFromU8(files['src/query.sql']),"SELECT 'café';\n");assert.equal(strFromU8(files['__proto__/constructor']),'ordinary portable name');assert.equal(JSON.parse(strFromU8(files['project.ateproj'])).name,'Web project');
  // Import creates an independent copy in real IndexedDB and survives navigation.
  await $('projectZip').setInputFiles({name:'project.zip',mimeType:'application/zip',buffer:zip});await page.waitForSelector('#projects[open]');await ready();const importedId=await page.evaluate(()=>localStorage.getItem('ate-current-project-v1'));assert.notEqual(importedId,projectId);
  await select('src').click();await $('deleteProjectFolder').click();await page.waitForSelector('#deleteFolderDialog[open]');assert.equal(await page.locator('dialog[open]').count(),1);await $('cancelDeleteFolder').click();await page.waitForSelector('#projects[open]');assert.ok(await page.getByRole('button',{name:'Open project file src/query.sql',exact:true}).count());
  await $('deleteProjectFolder').click();await $('confirmDeleteFolder').click();await page.waitForFunction(()=>document.getElementById('projectStatus').textContent.startsWith('Deleted folder src.'));assert.equal(await page.getByRole('button',{name:'Open project file src/query.sql',exact:true}).count(),0);
  const stored=await page.evaluate(async ids=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ate-project-files-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return Promise.all(ids.map(id=>new Promise((resolve,reject)=>{const r=db.transaction('projects').objectStore('projects').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})))},[projectId,importedId]);
  assert.equal(stored[0].files['src/query.sql'].text,"SELECT 'café';\n");assert.equal(Object.hasOwn(stored[1].files,'src/query.sql'),false);assert.equal(stored[1].files['settings.json'].text,'{}');assert.equal(stored[1].files['__proto__/constructor'].text,'ordinary portable name');
  await $('closeProject').click();await page.waitForFunction(()=>document.getElementById('projectActions').hidden);await $('closeProjects').click();assert.equal(await editor.innerText(),'ordinary portable name','Closing the imported project keeps ordinary and other-project tabs');
  await $('exit').click();await $('exitCancel').click();assert.equal(await editor.innerText(),'ordinary portable name');await $('exit').click();await $('discardExit').click();await page.waitForFunction(()=>document.getElementById('name').value==='Untitled');assert.equal(await editor.innerText(),'');assert.equal(await page.evaluate(()=>localStorage.getItem('clear-page-workspace-v1')),null);
  await page.reload();await page.waitForSelector('.cm-content');await projects();await $('openProjectPicker').click();assert.equal(await page.locator('#projectList button').count(),2,'Exiting discards drafts without deleting stored projects');await $('closeProjectPicker').click();await page.waitForSelector('#projects[open]');
  await mkdir('editor-evidence',{recursive:true});await page.screenshot({path:'editor-evidence/'+engineName+'-web-projects.png'});assert.deepEqual(errors,[]);
  console.log('PASS '+engineName+': real IndexedDB projects, cross-platform ZIP bytes, prototype-safe names, restart, independent deletion, tab recovery and whole-workspace Exit');
 }finally{await browser.close()}
}}finally{await new Promise(r=>server.close(r))}
