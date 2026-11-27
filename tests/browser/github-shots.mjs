// Screenshots of the GitHub screens for a visual check (not part of the test run).
import {acceptTerms} from './legal-helper.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createFakeGitHub} from '../fake-github.mjs';
const server=createServer(async(req,res)=>{try{const path=req.url.split('?')[0],file=path==='/'?'index.html':path.slice(1);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await readFile(new URL('../../dist/'+file,import.meta.url)))}catch{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const out=process.argv[2]||'/tmp';
const browser=await chromium.launch();
for(const [w,h,tag] of [[1194,834,'ipad'],[390,844,'phone']]){
 const fake=createFakeGitHub({login:'willyros01'});const S=fake.state;S.addRepo('ate-test',{'README.md':'# Fairpot\n','www/index.html':'<p>hi</p>\n','www/app.js':'let total = 0;\nfunction add(x){\n  total += x;\n}\n'});
 S.pushElsewhere('ate-test','main',{'www/app.js':'let total = 0;\nfunction add(x){\n  total += Number(x);\n}\n'},'Fix adding');
 {const m=S.head('ate-test','main');S.repos.get('ate-test').branches.set('fairpot',m);}
 const page=await browser.newPage({viewport:{width:w,height:h}});
 const route=async(r,base)=>{const q=r.request(),u=new URL(q.url());if(q.method()==='OPTIONS')return r.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'}});const res=await fake.handle(q.method(),base+u.pathname+u.search,q.postData()?JSON.parse(q.postData()):null);await r.fulfill({status:res.status,headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},body:res.status===204?'':JSON.stringify(res.data)})};
 await page.route('https://api.github.com/**',r=>route(r,fake.API));await page.route('https://ate-github-login.willyros01.workers.dev/**',r=>route(r,fake.RELAY));
 await page.goto('http://127.0.0.1:'+server.address().port);await acceptTerms(page);await page.waitForSelector('.cm-content');
 const $=id=>page.locator('#'+id);const idle=()=>page.waitForFunction(()=>!document.getElementById('githubRefresh')?.disabled&&!document.getElementById('githubSignIn')?.disabled);
 await $('menuButton').click();await $('githubButton').click();await idle();await page.screenshot({path:`${out}/gh-${tag}-1-signin.png`});
 S.approveAfter=99;await $('githubSignIn').click();await page.waitForFunction(()=>document.getElementById('githubCode').textContent);await page.screenshot({path:`${out}/gh-${tag}-2-code.png`});
 S.approveAfter=0;await page.waitForSelector('#githubSignedIn:not([hidden])',{timeout:20000});await idle();await page.screenshot({path:`${out}/gh-${tag}-3-files.png`});
 await page.getByRole('button',{name:'More for www/app.js'}).click();await idle();await $('githubFileHistory').click();await idle();await page.getByRole('button',{name:/^Fix adding/}).click();await idle();await page.screenshot({path:`${out}/gh-${tag}-4-change.png`});
 await page.locator('#githubNav button',{hasText:'Branches'}).click();await idle();await page.screenshot({path:`${out}/gh-${tag}-5-branches.png`});
 await $('githubRepoMore').click();await idle();await $('githubCopyRepo').click();await idle();await page.screenshot({path:`${out}/gh-${tag}-6-copy.png`,fullPage:true});
 await $('githubCopyNext').click();await idle();await page.screenshot({path:`${out}/gh-${tag}-7-copyform.png`});
 await page.locator('.gh-back').click();await idle();await page.locator('.gh-back').click();await idle();await $('githubDeleteRepo').click();await idle();await $('githubDeleteNext').click();await idle();await page.screenshot({path:`${out}/gh-${tag}-8-delete.png`});
 // Super tabs: two branches of one repository plus files on this device.
 await $('githubClose').click();await $('new').evaluate(b=>b.click());await page.locator('.cm-content').fill('notes');
 const openGh=async(branch,path)=>{await $('menuButton').click();await $('githubButton').click();await idle();await page.locator('#githubNav button',{hasText:'Files'}).click();await idle();await $('githubBranch').selectOption(branch);await idle();await page.locator('#githubFilter').fill(path);await page.getByRole('button',{name:path,exact:true}).click();await page.waitForSelector('#githubDialog',{state:'hidden'})};
 await openGh('main','README.md');await openGh('main','www/index.html');await openGh('main','www/app.js');await page.locator('.cm-content').fill('let total = 1;\n');await openGh('fairpot','README.md');
 await page.screenshot({path:`${out}/gh-${tag}-9-supertabs.png`});
 await page.locator('.tg-menu').nth(1).click();await page.screenshot({path:`${out}/gh-${tag}-10-groupmenu.png`});
 await page.close();
}
await browser.close();server.close();
