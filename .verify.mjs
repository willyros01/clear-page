import {createServer} from 'node:http';import {readFile,writeFile,appendFile} from 'node:fs/promises';import {chromium} from 'playwright';
import {files} from '/home/claude/atetest/files.mjs';
const types={js:'application/javascript',wasm:'application/wasm',html:'text/html'};
const server=createServer(async(req,res)=>{try{const p=req.url.split('?')[0],f=p==='/'?'index.html':p.slice(1);res.setHeader('Content-Type',types[f.split('.').pop()]||'application/octet-stream');res.end(await readFile('dist/'+f))}catch{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'});
const out=[];
for(const f of files){
 const page=await b.newPage({viewport:{width:1200,height:900}});
 try{
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('.cm-content');
 if(await page.locator('#termsDialog[open]').count()){await page.locator('#termsCheck').check();await page.locator('#acceptTerms').click();}
 await page.locator('#menuButton').click();await page.locator('#advancedMode').click();await page.locator('#closeMenu').click();
 const name=f.path.split('/').pop();
 await page.locator('#file').setInputFiles({name,mimeType:'text/plain',buffer:Buffer.from(f.text)});
 await page.waitForFunction(n=>document.getElementById('name').value===n,name,{timeout:10000});await page.waitForTimeout(300);
 const lang=await page.evaluate(()=>{const s=document.getElementById('language');return s.options[s.selectedIndex].text});
 await page.locator('#menuButton').click();await page.locator('#checkSyntax').click();
 await page.waitForFunction(()=>{const t=document.getElementById('syntaxSummary').textContent;return t&&!/Checking|not checked/.test(t)},null,{timeout:20000}).catch(()=>{});
 const summary=(await page.locator('#syntaxSummary').textContent()).trim(),first=(await page.locator('#syntaxIssues li').first().textContent({timeout:1000}).catch(()=>'')).trim();
 out.push({path:f.path,expect:f.expect,lang,summary,first});
 await appendFile('/tmp/verify.log',[f.path,f.expect,lang,summary,first.slice(0,100)].join(' | ')+'\n');
 }catch(e){await appendFile('/tmp/verify.log',f.path+' ERROR '+e.message.slice(0,100)+'\n')}
 await page.close();
}
await writeFile('/home/claude/atetest/results.json',JSON.stringify(out,null,1));
await b.close();server.close();
