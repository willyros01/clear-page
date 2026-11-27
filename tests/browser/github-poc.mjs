// ATE GitHub (web test build) against a pretend GitHub and sign-in relay: no real network.
// Taps through every screen the way a person would.
import {acceptTerms} from './legal-helper.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createFakeGitHub} from '../fake-github.mjs';

const server=createServer(async(req,res)=>{try{const path=req.url.split('?')[0],file=path==='/'?'index.html':path.slice(1);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await readFile(new URL('../../dist/'+file,import.meta.url)))}catch{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const REAL_RELAY='https://ate-github-login.willyros01.workers.dev';
const engines=process.env.ATE_BROWSER==='chromium'?{chromium}:{chromium,webkit};
try{for(const [engineName,engine] of Object.entries(engines)){
 const browser=await engine.launch();
 try{
  const fake=createFakeGitHub();const S=fake.state;
  S.addRepo('ate-test',{'README.md':'# Hello\n','src/app.js':'let a = 1;\n','www/index.html':'<p>hi</p>\n'});
  const R=S.repos.get('ate-test');
  R.workflows=[{id:1,name:'Build',path:'.github/workflows/b.yml',state:'active',dispatch:true},{id:2,name:'Nightly',path:'.github/workflows/n.yml',state:'active',dispatch:false}];
  R.runs=[{id:5,name:'Build',display_title:'Build',head_branch:'main',event:'push',status:'completed',conclusion:'failure',created_at:'2026-11-26T10:00:00Z',jobs:[{id:77,name:'web',status:'completed',conclusion:'failure',steps:[{name:'npm test',conclusion:'failure'}],annotations:[{annotation_level:'failure',message:'Process completed with exit code 1.'}],log:'2026-11-26T10:00:01.0Z ##[error]AssertionError: expected 2'}]},
   {id:4,name:'Build',display_title:'Build',head_branch:'main',event:'push',status:'completed',conclusion:'success',created_at:'2026-11-25T10:00:00Z',jobs:[]}];
  const page=await browser.newPage({viewport:{width:1194,height:834}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const route=async(route,base)=>{const req=route.request(),u=new URL(req.url());
   const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(base===fake.API)assert.equal(req.headers().authorization,'Bearer ghu_fake','API call without the sign-in pass: '+u.pathname);
   const res=await fake.handle(req.method(),base+u.pathname+u.search,req.postData()?JSON.parse(req.postData()):null);
   await route.fulfill({status:res.status,headers:{...cors,'Content-Type':'application/json'},body:res.status===204?'':res.text!==undefined?res.text:JSON.stringify(res.data)});};
  await page.route('https://api.github.com/**',r=>route(r,fake.API));
  await page.route(REAL_RELAY+'/**',r=>route(r,fake.RELAY));
  await page.goto('http://127.0.0.1:'+server.address().port);await acceptTerms(page);await page.waitForSelector('.cm-content');
  const $=id=>page.locator('#'+id),editor=page.locator('.cm-content'),text=async()=>(await editor.innerText()).trim();
  const idle=()=>page.waitForFunction(()=>!document.getElementById('githubRefresh')?.disabled&&!document.getElementById('githubSignIn')?.disabled);
  const openGitHub=async()=>{if(await $('githubDialog').evaluate(d=>d.open).catch(()=>false))await $('githubClose').click();await $('menuButton').click();await $('githubButton').click();await page.waitForSelector('#githubDialog[open]');await idle()};
  const notice=re=>page.waitForFunction(r=>new RegExp(r).test(document.getElementById('notice').textContent),re.source);
  const status=()=>$('githubStatus').innerText();
  const askOk=async()=>{await $('githubAskOk').click();await page.waitForSelector('#githubAsk',{state:'hidden'})};
  const nav=async name=>{await page.locator('#githubNav button',{hasText:name}).click();await idle()};
  const fileBtn=p=>page.getByRole('button',{name:p,exact:true});
  const openFile=async p=>{await openGitHub();await nav('Files');await $('githubFilter').fill(p);await fileBtn(p).click();await page.waitForSelector('#githubDialog',{state:'hidden'})};
  const saveTab=async note=>{await $('save').click();await page.waitForSelector('#githubAsk[open]');if(note)await $('ghAsk_note').fill(note);await askOk()};

  // Sign in with a code: no key anywhere.
  await openGitHub();assert.equal(await page.locator('#githubDialog input[type=password]').count(),0,'no key field');
  await notice(/Switched to Advanced/);assert.equal(await page.evaluate(()=>document.body.classList.contains('basic-mode')),false,'GitHub switches to Advanced');
  await $('githubSignIn').click();await page.waitForFunction(()=>document.getElementById('githubCode').textContent==='WDJB-MJHT');
  assert.equal(await $('githubDeviceLink').getAttribute('href'),'https://github.com/login/device');
  await page.waitForSelector('#githubSignedIn:not([hidden])',{timeout:20000});await idle();
  assert.match(await $('githubUser').innerText(),/tester/);assert.match(await $('githubRepoCount').innerText(),/ATE can use 1 repository/);
  await $('githubMoreRepos').click();await page.waitForSelector('#githubAsk[open]');assert.match(await $('githubAskBody').innerText(),/Danger zone/);assert.equal(await $('githubAskOk').innerText(),'Continue to GitHub');await $('githubAskCancel').click();
  const stored=await page.evaluate(()=>JSON.stringify({...localStorage})+JSON.stringify({...sessionStorage}));assert.ok(!stored.includes('ghu_fake'),'sign-in must not be stored');

  // A: open, edit, see changes before saving, save with a note.
  await $('githubFilter').fill('app');await fileBtn('src/app.js').click();await page.waitForSelector('#githubDialog',{state:'hidden'});
  assert.equal(await text(),'let a = 1;');await editor.fill('let a = 2;\n');
  await $('save').click();await page.waitForSelector('#githubAsk[open]');await $('githubShowChanges').click();
  await page.waitForSelector('#githubSaveChanges .gh-add');assert.match(await $('githubSaveChanges').innerText(),/let a = 1;[\s\S]*let a = 2;/);
  await $('ghAsk_note').fill('Change a');await askOk();await notice(/Saved to GitHub/);
  assert.equal(S.filesAt('ate-test','main')['src/app.js'],'let a = 2;\n');
  // A file changed elsewhere is not overwritten; the edit stays.
  S.pushElsewhere('ate-test','main',{'src/app.js':'changed elsewhere\n'});
  await editor.fill('mine\n');await $('save').click();await page.waitForSelector('#githubAsk[open]');await $('githubAskOk').click();
  await page.waitForFunction(()=>/changed on GitHub since you opened it/.test(document.getElementById('githubAskStatus').textContent));
  await $('githubAskCancel').click();await notice(/cancelled/);assert.equal(S.filesAt('ate-test','main')['src/app.js'],'changed elsewhere\n');assert.equal(await text(),'mine');

  // A: several files in one change (the conflicting app.js tab is left out).
  await openFile('README.md');await editor.fill('# Hello there\n');
  await openFile('www/index.html');await editor.fill('<p>hello</p>\n');
  await openGitHub();await nav('Files');await page.waitForSelector('#githubSaveAll');
  await $('githubSaveAll').click();await page.waitForSelector('#githubAsk[open]');
  const boxes=page.locator('#githubAskBody .gh-check');for(let i=0;i<await boxes.count();i++)if(/src\/app\.js/.test(await boxes.nth(i).innerText()))await boxes.nth(i).locator('input').uncheck();
  await $('ghAsk_note').fill('Two files');await askOk();await notice(/Saved 2 files to GitHub in one change/);
  const now=S.filesAt('ate-test','main');assert.equal(now['README.md'],'# Hello there\n');assert.equal(now['www/index.html'],'<p>hello</p>\n');
  assert.equal(fake.commits.get(S.head('ate-test','main')).message,'Two files');

  // A: history, what changed, restore an older version.
  await openGitHub();await nav('Files');await $('githubFilter').fill('README');await page.getByRole('button',{name:'More for README.md'}).click();await idle();
  await $('githubFileHistory').click();await idle();await page.getByRole('button',{name:/^Initial/}).click();await idle();
  assert.match(await $('githubPanel').innerText(),/# Hello/);await $('githubRestore').click();await page.waitForSelector('#githubDialog',{state:'hidden'});
  assert.equal(await text(),'# Hello');await notice(/not yet saved/);
  await saveTab('Restore README');assert.equal(S.filesAt('ate-test','main')['README.md'],'# Hello\n');

  // A: search inside files, rename/move, delete, new file.
  await openGitHub();await nav('Files');await page.locator('#githubSearchBox summary').click();await $('githubSearch').fill('hello');await $('githubSearchGo').click();await idle();
  assert.match(await status(),/2 matches/);await page.locator('#githubSearchResults button',{hasText:'www/index.html:1'}).click();await page.waitForSelector('#githubDialog',{state:'hidden'});
  await notice(/match on line 1/);
  await openGitHub();await nav('Files');await $('githubFilter').fill('index');await page.getByRole('button',{name:'More for www/index.html'}).click();await idle();await $('githubFileRename').click();
  await page.waitForSelector('#githubAsk[open]');await $('ghAsk_path').fill('web/home.html');await askOk();await notice(/Renamed on GitHub/);
  assert.equal(S.filesAt('ate-test','main')['web/home.html'],'<p>hello</p>\n');assert.equal(S.filesAt('ate-test','main')['www/index.html'],undefined);
  await openGitHub();await nav('Files');await $('githubFilter').fill('home');await page.getByRole('button',{name:'More for web/home.html'}).click();await idle();await $('githubFileDelete').click();
await page.waitForSelector('#githubAsk[open]');assert.match(await $('githubAskBody').innerText(),/history stays on GitHub/);await askOk();await notice(/Deleted from GitHub/);
  assert.equal(S.filesAt('ate-test','main')['web/home.html'],undefined);
  await openGitHub();await nav('Files');await page.locator('#githubNew summary').click();await $('githubNewPath').fill('docs/new.md');await $('githubCreate').click();
  await page.waitForSelector('#githubDialog',{state:'hidden'});await editor.fill('fresh\n');await saveTab();assert.equal(S.filesAt('ate-test','main')['docs/new.md'],'fresh\n');

  // B: create a branch, change it, merge it back, delete it.
  await openGitHub();await nav('Branches');await page.locator('#githubNewBranchBox summary').click();await $('githubNewBranch').fill('fairpot');await $('githubCreateBranch').click();await idle();
  assert.equal(await $('githubBranch').inputValue(),'fairpot');assert.match(await status(),/Created branch fairpot/);
  await nav('Files');await $('githubFilter').fill('new.md');await fileBtn('docs/new.md').click();await page.waitForSelector('#githubDialog',{state:'hidden'});
  await editor.fill('from fairpot\n');await saveTab('On fairpot');assert.equal(S.filesAt('ate-test','fairpot')['docs/new.md'],'from fairpot\n');assert.equal(S.filesAt('ate-test','main')['docs/new.md'],'fresh\n');
  await openGitHub();await nav('Branches');assert.match(await $('githubPanel').innerText(),/✓ fairpot · you are working here/);
  await page.locator('[data-switch="main"]').click();await idle();assert.equal(await $('githubBranch').inputValue(),'main');assert.match(await status(),/Now working on branch main/);
  await nav('Branches');assert.equal(await page.locator('[data-switch]').count(),1);await page.locator('[data-branch-more="fairpot"]').click();await idle();
  assert.match(await $('githubBranchMerge').innerText(),/Copy fairpot's changes into main/);await $('githubBranchMerge').click();await page.waitForSelector('#githubAsk[open]');await askOk();await idle();
  assert.match(await status(),/Copied fairpot's changes into main/);assert.equal(S.filesAt('ate-test','main')['docs/new.md'],'from fairpot\n');
  await page.locator('[data-branch-more="fairpot"]').click();await idle();await $('githubBranchDelete').click();await page.waitForSelector('#githubAsk[open]');await askOk();await idle();assert.equal(S.head('ate-test','fairpot'),undefined);

  // C: pull request: open, see changes, comment, merge.
  await nav('Branches');await page.locator('#githubNewBranchBox summary').click();await $('githubNewBranch').fill('fix');await $('githubCreateBranch').click();await idle();
  S.pushElsewhere('ate-test','fix',{'README.md':'# Fixed\n'});
  await nav('Pull requests');await page.locator('#githubNewPr summary').click();await $('githubPrHead').selectOption('fix');await $('githubPrBase').selectOption('main');
  await $('githubPrTitle').fill('Fix readme');await $('githubCreatePr').click();await idle();
  assert.match(await $('githubPanel').innerText(),/#\d+ Fix readme[\s\S]*README\.md[\s\S]*# Fixed/);
  await $('githubPrComment').fill('Looks good');await $('githubPrSendComment').click();await idle();assert.match(await $('githubPanel').innerText(),/Looks good/);
  await $('githubPrMerge').click();await page.waitForSelector('#githubAsk[open]');await askOk();await idle();
  assert.equal(S.filesAt('ate-test','main')['README.md'],'# Fixed\n');assert.match(await status(),/Merged #\d+ into main/);

  // D: Actions: green/red, why a run failed, start by hand, refused start.
  await nav('Actions');assert.match(await $('githubPanel').innerText(),/✗ failed · Build[\s\S]*✓ passed · Build/);
  await page.getByRole('button',{name:/✗ failed · Build/}).click();await idle();
  assert.match(await $('githubPanel').innerText(),/Failed step: npm test[\s\S]*(AssertionError: expected 2|exit code 1)/);
  // Full log, view only, with Find.
  await page.locator('.gh-log-btn[data-job="77"]').click();await idle();
  assert.match(await $('githubLogText').innerText(),/ERROR: AssertionError: expected 2/);assert.doesNotMatch(await $('githubLogText').innerText(),/2026-11-26T/);
  assert.equal(await $('githubLogText').evaluate(e=>e.isContentEditable),false);
  await $('githubLogFind').fill('assertion');await $('githubLogNext').click();assert.match(await $('githubLogCount').innerText(),/1 of 1/);
  await $('githubLogFind').fill('nothing-like-this');await $('githubLogNext').click();assert.match(await $('githubLogCount').innerText(),/Not found/);
  await page.locator('.gh-back',{hasText:'Run'}).click();await idle();assert.match(await $('githubPanel').innerText(),/Failed step: npm test/);
  await page.locator('.gh-back').click();await idle();await page.locator('#githubStartBox summary').click();await $('githubWorkflow').selectOption('1');await $('githubStartWorkflow').click();await idle();
  assert.match(await status(),/Started/);assert.equal(R.runs[0].event,'workflow_dispatch');
  await page.locator('#githubStartBox summary').click();await $('githubWorkflow').selectOption('2');await $('githubStartWorkflow').click();await idle();assert.match(await status(),/cannot be started by hand/);

  // Actions on/off.
  await nav('Actions');assert.match(await $('githubActionsState').innerText(),/On/);await $('githubActionsToggle').click();await page.waitForSelector('#githubAsk[open]');await askOk();await idle();
  assert.equal(R.actions,false);assert.match(await $('githubActionsState').innerText(),/Off/);
  await $('githubActionsToggle').click();await page.waitForSelector('#githubAsk[open]');await askOk();await idle();assert.equal(R.actions,true);
  // Copy: explanation page first, then copy all branches into a new repository.
  await $('githubRepoMore').click();await idle();await $('githubCopyRepo').click();await idle();
  const explain=await $('githubPanel').innerText();for(const w of [/Not copied/,/history of past changes/,/Secrets/,/never writes into a branch that already exists/,/switched off in a new repository/])assert.match(explain,w);
  assert.equal(await page.locator('#githubCopyNow').count(),0,'no Copy button before the explanation is accepted');
  await $('githubCopyNext').click();await idle();await $('githubCopyAll').check();await $('githubCopyName').fill('ate-test-copy');await $('githubCopyNow').click();await idle();
  assert.match(await $('githubPanel').innerText(),/Copy finished[\s\S]*Copied 2 branches into tester\/ate-test-copy[\s\S]*Actions are switched off/);
  assert.deepEqual(S.filesAt('ate-test-copy','main'),S.filesAt('ate-test','main'));assert.equal(S.repos.get('ate-test-copy').actions,false);assert.equal(S.repos.get('ate-test-copy').pushesWithActionsOn||0,0);
  assert.match(await $('githubCopyOpened').innerText(),/opened tester\/ate-test-copy/);assert.match(await $('githubRepo').locator('option:checked').innerText(),/ate-test-copy/);
  // Delete repository: warning, exact name, 5-second wait.
  await $('githubRepoMore').click();await idle();await $('githubDeleteRepo').click();await idle();assert.match(await $('githubPanel').innerText(),/every file[\s\S]*history[\s\S]*90 days/);
  await $('githubDeleteNext').click();await idle();assert.equal(await $('githubDeleteForever').isDisabled(),true);
  await $('githubDeleteName').fill('ate-test-cop');await page.waitForTimeout(5500);assert.equal(await $('githubDeleteForever').isDisabled(),true,'wrong name keeps the button off');
  await $('githubDeleteName').fill('ate-test-copy');assert.equal(await $('githubDeleteForever').isDisabled(),false);await $('githubDeleteForever').click();await idle();
  assert.equal(S.repos.has('ate-test-copy'),false);assert.match(await status(),/has been deleted/);assert.match(await $('githubRepo').locator('option:checked').innerText(),/ate-test/);
  // E: issues.
  await nav('Issues');await page.locator('#githubNewIssue summary').click();await $('githubIssueTitle').fill('Buy golf balls');await $('githubCreateIssue').click();await idle();
  await $('githubIssueComment').fill('Pro V1');await $('githubIssueSendComment').click();await idle();assert.match(await $('githubPanel').innerText(),/Pro V1/);
  await $('githubIssueState').click();await idle();assert.match(await status(),/Issue closed/);assert.equal(R.issues.find(i=>i.title==='Buy golf balls').state,'closed');

  // F: new repository.
  await nav('New repository');await $('githubRepoName').fill('brand-new');await $('githubCreateRepo').click();await idle();
  assert.match(await status(),/Created tester\/brand-new/);assert.ok(S.repos.has('brand-new'));assert.match(await $('githubRepo').locator('option:checked').innerText(),/brand-new/);

  // Super tabs: files grouped under repository + branch; the ⋯ menu saves a group's changes together and closes it.
  await $('githubRepo').selectOption({label:'tester/ate-test'});await idle();
  const grp=page.locator('.tg-group[data-group="gh:tester/ate-test@main"]');await $('githubClose').click();
  // Earlier steps left ate-test files open with unsaved edits: closing the whole group asks first.
  await grp.locator('.tg-menu').click();await page.waitForSelector('#tabGroupMenu[open]');await page.locator('#tabGroupActions button',{hasText:/^Close all/}).click();
  await page.waitForSelector('#tabCloseGroup[open]');assert.match(await $('tabCloseGroupText').innerText(),/not saved/);await $('tabCloseGroupOk').click();assert.equal(await grp.count(),0);
  await openFile('src/app.js');await editor.fill('let a = 2;\n');await openFile('README.md');await editor.fill('# Grouped\n');
  assert.match(await grp.locator('.tg-chip').innerText(),/ate-test[\s\S]*main[\s\S]*·\s*\d+[\s\S]*●2/);
  assert.equal(await grp.locator('.tg-current').count(),1,'the file being worked on is marked inside its group');
  assert.ok(await page.locator('.tg-group[data-group="device"]').count()<=1);
  await grp.locator('.tg-menu').click();await page.waitForSelector('#tabGroupMenu[open]');
  await page.locator('#tabGroupActions button',{hasText:'Save the 2 changed files together'}).click();await page.waitForSelector('#githubAsk[open]');await askOk();
  await notice(/Saved 2 files to GitHub in one change/);assert.equal(S.filesAt('ate-test','main')['src/app.js'],'let a = 2;\n');assert.equal(S.filesAt('ate-test','main')['README.md'],'# Grouped\n');
  assert.equal(await grp.locator('.tg-unsaved').count(),0);
  await grp.locator('.tg-chip').click();assert.equal(await grp.locator('.tg-file').count(),0,'tapping the group name folds it');
  await grp.locator('.tg-chip').click();assert.ok(await grp.locator('.tg-file').count()>=2);
  await grp.locator('.tg-menu').click();await page.waitForSelector('#tabGroupMenu[open]');await page.locator('#tabGroupActions button',{hasText:/^Close all/}).click();
  assert.equal(await grp.count(),0,'closing the group closes all its files');
  const blue=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());assert.equal(blue.toLowerCase(),'#1f5c99');
  // Sign-in ended on GitHub's side: plain message, back to the sign-in screen.
  await openGitHub();S.tokenValid=false;await $('githubRefresh').click();await idle();assert.match(await status(),/sign-in has ended/);assert.equal(await $('githubSignedOut').isVisible(),true);
  S.tokenValid=true;
  // Reload forgets the sign-in; saving a GitHub tab asks to sign in and keeps the draft.
  await $('githubClose').click();await page.reload();await page.waitForSelector('.cm-content');
  await editor.fill('after reload\n');await $('save').click();await notice(/Sign in to GitHub first/);assert.equal(await text(),'after reload');
  assert.deepEqual(errors,[]);
  console.log('PASS: '+engineName+' GitHub: auto Advanced, sign in with code (nothing stored), open/edit/show changes/save, conflict refused, several files in one change, history and restore, search, rename, delete, new file, branches create/merge/delete, pull request open/comment/merge, Actions runs/why failed/start/on-off, branch tap-to-switch and ⋯ merge/delete, copy with explanation page, delete repository with checks, issues, new repository, ended sign-in, reload forgets sign-in');
 }finally{await browser.close()}
}}finally{server.close()}
