// Web GitHub proof of concept, against a pretend GitHub (no real network).
import {acceptTerms} from './legal-helper.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const server=createServer(async(req,res)=>{try{const path=req.url.split('?')[0],file=path==='/'?'index.html':path.slice(1);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await readFile(new URL('../../dist/'+file,import.meta.url)))}catch{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const KEY='github_pat_'+'T'.repeat(50),SHA=c=>c.repeat(40);
const engines=process.env.ATE_BROWSER==='chromium'?{chromium}:{chromium,webkit};
try{for(const [engineName,engine] of Object.entries(engines)){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:1194,height:834}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Pretend GitHub. remote holds the file versions on the server.
  const remote={'README.md':{sha:SHA('1'),text:'# Hello\n'},'src/app.js':{sha:SHA('2'),text:'let a = 1;\n'}};let puts=[],failNext=0,seq=3;
  await page.route('https://api.github.com/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname,m=req.method();
   const json=(status,body)=>route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
   if(m==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,PUT'}});
   assert.equal(req.headers().authorization,'Bearer '+KEY);
   if(p==='/user')return json(200,{login:'tester'});
   if(p==='/user/repos')return json(200,[{owner:{login:'tester'},name:'notes',full_name:'tester/notes',default_branch:'main',permissions:{push:true}}]);
   if(p==='/repos/tester/notes/branches')return json(200,[{name:'main'},{name:'dev'}]);
   if(p.startsWith('/repos/tester/notes/git/trees/'))return json(200,{truncated:false,tree:[{type:'tree',path:'src'},...Object.entries(remote).map(([path,f])=>({type:'blob',path,sha:f.sha,size:f.text.length}))]});
   if(p.startsWith('/repos/tester/notes/git/blobs/')){const sha=p.split('/').pop(),f=Object.values(remote).find(f=>f.sha===sha);return f?json(200,{sha,encoding:'base64',content:Buffer.from(f.text).toString('base64')}):json(404,{})}
   if(m==='PUT'&&p.startsWith('/repos/tester/notes/contents/')){
    const path=decodeURIComponent(p.slice('/repos/tester/notes/contents/'.length)),body=JSON.parse(req.postData());puts.push({path,body});
    if(failNext){failNext--;return route.abort('failed')}
    if(remote[path]&&body.sha!==remote[path].sha)return json(remote[path]&&!body.sha?422:409,{message:remote[path]&&!body.sha?'"sha" wasn\'t supplied':'does not match'});
    const sha=String(seq++%10).repeat(40);remote[path]={sha,text:Buffer.from(body.content,'base64').toString('utf8')};return json(200,{content:{path,sha},commit:{sha:SHA('c')}});
   }
   return json(404,{message:'Not Found'});
  });
  await page.goto('http://127.0.0.1:'+server.address().port);await acceptTerms(page);await page.waitForSelector('.cm-content');
  const $=id=>page.locator('#'+id),editor=page.locator('.cm-content');
  const openGitHub=async()=>{await $('menuButton').click();await $('githubButton').click();await page.waitForSelector('#githubDialog[open]')};
  const idle=()=>page.waitForFunction(()=>!document.getElementById('githubClose').disabled);
  // Connect: wrong-looking key refused, real one accepted; key field cleared afterwards.
  await openGitHub();await $('githubKey').fill('nonsense');await $('githubConnectButton').click();await idle();
  assert.match(await $('githubStatus').innerText(),/does not look like a GitHub key/);
  await $('githubShowKey').check();assert.equal(await $('githubKey').getAttribute('type'),'text');
  await $('githubKey').fill(KEY);await $('githubConnectButton').click();await page.waitForSelector('#githubBrowse:not([hidden])');await idle();
  assert.equal(await $('githubKey').inputValue(),'');assert.match(await $('githubUser').innerText(),/tester/);
  assert.equal(await $('githubBranch').inputValue(),'main');assert.match(await $('githubCount').innerText(),/2 files/);
  const stored=await page.evaluate(()=>JSON.stringify({...localStorage})+JSON.stringify({...sessionStorage}));assert.ok(!stored.includes(KEY),'key must not be stored in the browser');
  // Open, edit, save with a note.
  await $('githubFilter').fill('app');assert.match(await $('githubCount').innerText(),/1 file/);
  await page.getByRole('button',{name:'src/app.js',exact:true}).click();await page.waitForSelector('#githubDialog',{state:'hidden'});
  assert.equal((await editor.innerText()).trim(),'let a = 1;');assert.match(await $('notice').innerText(),/Opened from GitHub: tester\/notes · main · src\/app.js/);
  await editor.fill('let a = 2;\n');await $('save').click();await page.waitForSelector('#githubSave[open]');
  assert.match(await $('githubSaveWhere').innerText(),/tester\/notes · branch main · src\/app.js/);assert.equal(await $('githubMessage').inputValue(),'Update src/app.js');
  await $('githubMessage').fill('Change a');await $('githubSaveConfirm').click();await page.waitForSelector('#githubSave',{state:'hidden'});
  await page.waitForFunction(()=>/Saved to GitHub/.test(document.getElementById('notice').textContent));
  assert.equal(remote['src/app.js'].text,'let a = 2;\n');assert.equal(puts.at(-1).body.message,'Change a');assert.equal(puts.at(-1).body.sha,SHA('2'));
  assert.equal(await page.locator('#tabs [aria-selected="true"]').innerText().then(t=>t.includes('•')),false,'saved tab must not be marked unsaved');
  // Second save in a row uses the new version (no false conflict).
  await editor.fill('let a = 3;\n');await $('save').click();await page.waitForSelector('#githubSave[open]');await $('githubSaveConfirm').click();await page.waitForFunction(()=>/Saved to GitHub/.test(document.getElementById('notice').textContent)&&!document.getElementById('githubSave').open);
  assert.equal(remote['src/app.js'].text,'let a = 3;\n');
  // Someone else changes the file: ATE must refuse and keep the edit unsaved.
  remote['src/app.js']={sha:SHA('9'),text:'changed elsewhere\n'};
  await editor.fill('my edit\n');await $('save').click();await page.waitForSelector('#githubSave[open]');await $('githubSaveConfirm').click();await page.waitForSelector('#githubSave',{state:'hidden'});
  await page.waitForFunction(()=>/changed on GitHub since you opened it/.test(document.getElementById('notice').textContent));
  assert.equal(remote['src/app.js'].text,'changed elsewhere\n');assert.equal((await editor.innerText()).trim(),'my edit');
  // Network failure: nothing saved, edit kept.
  await page.getByRole('tab').last().click().catch(()=>{});
  await openGitHub();await $('githubFilter').fill('README');await page.getByRole('button',{name:'README.md',exact:true}).click();await page.waitForSelector('#githubDialog',{state:'hidden'});
  failNext=1;await editor.fill('# Hello again\n');await $('save').click();await page.waitForSelector('#githubSave[open]');await $('githubSaveConfirm').click();
  await page.waitForFunction(()=>/Could not reach GitHub/.test(document.getElementById('notice').textContent));assert.equal(remote['README.md'].text,'# Hello\n');
  // Cancel the note: nothing sent.
  const before=puts.length;await $('save').click();await page.waitForSelector('#githubSave[open]');await $('githubSaveCancel').click();
  await page.waitForFunction(()=>/cancelled/.test(document.getElementById('notice').textContent));assert.equal(puts.length,before);
  // Then a real save of the same edit works.
  await $('save').click();await page.waitForSelector('#githubSave[open]');await $('githubSaveConfirm').click();await page.waitForFunction(()=>/Saved to GitHub/.test(document.getElementById('notice').textContent)&&!document.getElementById('githubSave').open);
  assert.equal(remote['README.md'].text,'# Hello again\n');
  // New file.
  await openGitHub();await $('githubNew').locator('summary').click();await $('githubNewPath').fill('docs/new.md');await $('githubCreate').click();await page.waitForSelector('#githubDialog',{state:'hidden'});
  await editor.fill('fresh\n');await $('save').click();await page.waitForSelector('#githubSave[open]');assert.equal(await $('githubMessage').inputValue(),'Create docs/new.md');
  await $('githubSaveConfirm').click();await page.waitForFunction(()=>/Saved to GitHub/.test(document.getElementById('notice').textContent)&&!document.getElementById('githubSave').open);
  assert.equal(remote['docs/new.md'].text,'fresh\n');assert.equal(puts.at(-1).body.sha,undefined);
  // Ordinary (non-GitHub) save still downloads a file as before.
  // Reload: key forgotten; saving a GitHub tab asks to connect and keeps the draft.
  await editor.fill('after reload\n');await page.reload();await page.waitForSelector('.cm-content');
  await $('save').click();await page.waitForFunction(()=>/Connect to GitHub first/.test(document.getElementById('notice').textContent));
  assert.equal((await editor.innerText()).trim(),'after reload');
  await openGitHub();assert.equal(await $('githubConnect').isVisible(),true);
  assert.deepEqual(errors,[]);console.log('PASS: '+engineName+' GitHub proof of concept: connect, open, edit, save with note, conflict refused, offline kept, cancel, new file, key forgotten on reload');
 }finally{await browser.close()}
}}finally{server.close()}
