import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {checkProjectLayout} from '../project-layout.js';
const nonce='ate-project-test-2026';
const csp=JSON.parse(await readFile(new URL('../../src-tauri/tauri.conf.json',import.meta.url),'utf8')).app.security.csp.replace("style-src 'self' 'unsafe-inline'",`style-src 'self' 'nonce-${nonce}'`);
const server=createServer(async(req,res)=>{try{const path=req.url.split('?')[0];let data=await readFile(new URL('../../dist/'+(path==='/'?'index.html':path.slice(1)),import.meta.url));if(path==='/')data=Buffer.from(data.toString().replace('<style>',`<style nonce="${nonce}">`));res.setHeader('Content-Type',path.endsWith('.js')?'application/javascript':path.endsWith('.wasm')?'application/wasm':'text/html');res.setHeader('Content-Security-Policy',csp);res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const engines=process.env.ATE_BROWSER==='chromium'?{chromium}:{chromium,webkit};
try{for(const [engineName,engine] of Object.entries(engines)){
 const browser=await engine.launch(engineName==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 try{
  const page=await browser.newPage({viewport:{width:1194,height:834}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const prior=JSON.parse(localStorage.getItem('__ateTestDisk')||'null'),files=new Map(prior?.files||[]),dirs=new Set(prior?.dirs||[]);window.__ateFiles=files;const persistDisk=()=>localStorage.setItem('__ateTestDisk',JSON.stringify({files:[...files],dirs:[...dirs]}));
   window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
   window.Capacitor={PluginHeaders:[{name:'Filesystem',methods:['readFile','writeFile','mkdir','readdir','stat'].map(name=>({name,rtype:'promise'}))},{name:'Share',methods:[{name:'share',rtype:'promise'}]}],nativePromise:async(plugin,method,o)=>{
    if(plugin==='Share')throw Error('Share cancelled');
    if(method==='mkdir'){if(dirs.has(o.path))throw Object.assign(Error('Already exists'),{code:'OS-PLUG-FILE-0010'});dirs.add(o.path);persistDisk();return {}}
    if(method==='stat')return {type:dirs.has(o.path)?'directory':'file'};
    if(method==='writeFile'){const parts=o.path.split('/');for(let i=1;i<parts.length;i++)dirs.add(parts.slice(0,i).join('/'));files.set(o.path,o.data);persistDisk();return {uri:'file:///'+o.path}}
    if(method==='readFile'){if(!files.has(o.path))throw Error('Missing');return {data:files.get(o.path)}}
    if(method==='readdir'){const entries=new Map();for(const path of [...dirs,...files.keys()])if(path.startsWith(o.path+'/')){const name=path.slice(o.path.length+1).split('/')[0];if(name)entries.set(name,{name,type:dirs.has(o.path+'/'+name)?'directory':'file'})}return {files:[...entries.values()]}}
   }};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForSelector('.cm-content');
  const editor=page.locator('.cm-content'),projects=async()=>{await page.locator('#menuButton').click();await page.locator('#projectsButton').click();await page.waitForFunction(()=>document.getElementById('projects').open&&!document.getElementById('createProject').disabled)};
  assert.equal(await page.locator('#file').getAttribute('accept'),null);
  assert.equal(await page.locator('#projectFiles').getAttribute('accept'),null);
  await editor.fill('Protected filename content');
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.locator('#menuButton').click();await page.locator('#name').fill('Qzzzzzzz.sql');await page.locator('#name').press('Enter');await page.locator('#closeMenu').click();
   assert.equal(await editor.innerText(),'Protected filename content');assert.ok(await page.getByRole('tab',{name:'Qzzzzzzz.sql, unsaved changes',exact:true}).count());
   await page.waitForTimeout(450);await page.evaluate(()=>{const r=document.getElementById('save').getBoundingClientRect(),v=visualViewport;if(r.left<0||r.right>v.width+1||r.top<v.offsetTop-1)throw Error('Save clipped after menu return')});
  }
  await page.setViewportSize({width:1194,height:834});
  await page.locator('#file').setInputFiles({name:'query.sql',mimeType:'application/sql',buffer:Buffer.from('SELECT name FROM people;')});
  await page.waitForFunction(()=>document.getElementById('name').value==='query.sql');assert.equal(await editor.innerText(),'SELECT name FROM people;');
  await editor.fill('SELECT id FROM people;');await page.locator('#save').click();await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('Your draft is kept'));
  assert.equal(await editor.innerText(),'SELECT id FROM people;');await page.locator('#exit').click();await page.locator('#discardExit').click();
  await editor.fill('Ordinary note');await page.locator('#menuButton').click();await page.locator('#advancedMode').click();await page.locator('#autoCheck').uncheck();await page.locator('#projectsButton').click();
  await page.locator('#projectName').fill('Project UI');await page.locator('#createProject').click();await page.waitForFunction(()=>document.getElementById('projectHeading').textContent==='Project UI'&&!document.getElementById('createProject').disabled);
  await page.locator('#projectFileName').fill('src');await page.locator('#newProjectFolder').click();await page.waitForFunction(()=>document.getElementById('projectFolder').value==='src');
  await page.locator('#projectFileName').fill('main.c');await page.locator('#newProjectFile').click();await page.waitForFunction(()=>!document.getElementById('projects').open);
  await editor.fill('int main(void) { return 0; }');await page.locator('#save').click();await page.waitForFunction(()=>document.getElementById('notice').textContent.startsWith('Saved in project'));
  await projects();
  const plus=folder=>page.getByRole('button',{name:'Add files to '+folder,exact:true});
  const addFiles=async files=>{
   const chooserPromise=page.waitForEvent('filechooser');await page.locator('#addProjectFiles').click();const chooser=await chooserPromise;await chooser.setFiles(files.map(([name,text])=>({name,mimeType:'text/plain',buffer:Buffer.from(text)})));
   await page.waitForFunction(()=>!document.getElementById('addProjectFiles').disabled&&document.getElementById('projectStatus').textContent.startsWith('Added '));
  };
  await plus('src').click();assert.equal(await page.locator('#projectFolder').inputValue(),'src');await addFiles([['util.h','int value;'],['query.sql','SELECT 1;']]);
  await plus('Project root').click();await page.locator('#projectFileName').fill('docs');await page.locator('#newProjectFolder').click();await page.waitForFunction(()=>document.getElementById('projectFolder').value==='docs');await addFiles([['README.md','# Project']]);
  await plus('Project root').click();await addFiles([['a-long-source-name.c.txt','int x;'],...Array.from({length:12},(_,i)=>['note-'+i+'.txt','note']),['settings.json','{}']]);
  await page.locator('#closeProjectComposer').click();
  assert.ok(await page.locator('[data-path="src/util.h"]').count());assert.ok(await page.locator('[data-path="docs/README.md"]').count());assert.ok(await page.locator('[data-path="settings.json"]').count());
  for(const viewport of [{width:320,height:1000},{width:390,height:1000},{width:768,height:1024},{width:1194,height:834}]){
   await page.setViewportSize(viewport);await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ios-visible-width'))-visualViewport.width)<1);for(const scale of [1,2,3])console.log('PASS '+engineName+': '+await page.evaluate(checkProjectLayout,[scale]));
  }
  await mkdir('editor-evidence',{recursive:true});await page.setViewportSize({width:1194,height:834});await page.locator('[data-path="settings.json"]').scrollIntoViewIfNeeded();await page.screenshot({path:`editor-evidence/${engineName}-projects-aligned-bottom.png`});
  await plus('src').click();await page.locator('#projectFileName').fill('draft.txt');await page.locator('#newProjectFile').click();await page.waitForFunction(()=>!document.getElementById('projects').open);await editor.fill('project draft');
  await projects();await page.locator('#closeProject').click();await page.locator('#cancelProjectClose').click();assert.equal(await page.locator('#projectActions').isVisible(),true);
  await page.locator('#closeProject').click();await page.locator('#saveAndCloseProject').click();await page.waitForFunction(()=>document.getElementById('projectActions').hidden&&!document.getElementById('createProject').disabled);
  assert.equal(await page.evaluate(()=>[...window.__ateFiles].find(([key])=>key.endsWith('/src/draft.txt'))?.[1]),'project draft');
  await page.locator('#closeProjects').click();assert.equal(await editor.innerText(),'Ordinary note');
  await page.reload();await page.waitForSelector('.cm-content');await projects();assert.equal(await page.locator('#projectActions').isVisible(),false,'Closed selection must stay closed after restart');
  await page.getByRole('button',{name:'Open project Project UI',exact:true}).click();await page.getByRole('button',{name:'Open project file src/draft.txt',exact:true}).click();await editor.fill('discard this edit');await projects();await page.locator('#closeProject').click();await page.locator('#discardAndCloseProject').click();await page.waitForFunction(()=>document.getElementById('projectActions').hidden);
  assert.equal(await page.evaluate(()=>[...window.__ateFiles].find(([key])=>key.endsWith('/src/draft.txt'))?.[1]),'project draft');
  assert.deepEqual(errors,[]);console.log(`PASS ${engineName}: real production project UI, root/nested destinations, aligned bottom rows, close cancel/save/discard and ordinary-note preservation`);
 }finally{await browser.close()}
}}finally{await new Promise(resolve=>server.close(resolve))}
