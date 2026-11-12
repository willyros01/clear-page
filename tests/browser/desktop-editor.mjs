import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium, webkit} from 'playwright';

// Exercise the built assets under the nonce policy Tauri applies to its assets.
// A plain development server misses the desktop-only stylesheet failure.
const nonce='ate-test-nonce-2026';
const csp=JSON.parse(await readFile(new URL('../../src-tauri/tauri.conf.json',import.meta.url),'utf8')).app.security.csp.replace("style-src 'self' 'unsafe-inline'","style-src 'self' 'nonce-"+nonce+"'");
const server=createServer(async(req,res)=>{
 try{
  const path=req.url.split('?')[0];
  let data=await readFile(new URL('../../dist/'+(path==='/'?'index.html':path.slice(1)),import.meta.url));
  if(path==='/')data=Buffer.from(data.toString().replace('<style>',`<style nonce="${nonce}">`));
  res.setHeader('Content-Type',path.endsWith('.js')?'application/javascript':path.endsWith('.wasm')?'application/wasm':'text/html');
  res.setHeader('Content-Security-Policy',csp);
  res.end(data);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
const engines=process.env.ATE_BROWSER==='chromium'?{chromium}:{chromium,webkit};
try{
 for(const [name,engine] of Object.entries(engines)){
  const browser=await engine.launch(name==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:850}});
   page.on('console',message=>{if(message.type()==='error')console.error(name+': '+message.text())});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);
   await page.waitForSelector('.cm-content');
   const editor=page.locator('.cm-content');
   for(const id of ['menu','cSettings','compilerInstall']){
    const fonts=await page.locator('#'+id).evaluate(dialog=>{dialog.showModal();const result=[...dialog.querySelectorAll('button,input,select,textarea,label,p,h1,h2,h3')].filter(e=>e.getBoundingClientRect().width).map(e=>parseFloat(getComputedStyle(e).fontSize));dialog.close();return result});
    assert.ok(fonts.every(size=>size<=18.67),'Controls must not exceed 14pt: '+id+' '+fonts);
   }

   const text=()=>page.locator('.cm-line').allTextContents().then(lines=>lines.join('\n'));
   const menu=async()=>page.locator('#menuButton').click();
   const done=async()=>page.locator('#closeMenu').click();
   const setMode=async mode=>{await menu();await page.locator('#editingMode').selectOption(mode);await done()};
   const open=async (content,name="fixture.js")=>{
    await page.locator('#file').setInputFiles({name,mimeType:'text/javascript',buffer:Buffer.from(content)});
    await page.waitForFunction(expected=>[...document.querySelectorAll('.cm-line')].map(e=>e.textContent).join('\n')===expected,content);
   };
   await open('function hello() {\n    const answer = 42;\n    return answer;\n}');
   const styles=await editor.evaluate(e=>{
    const scroller=e.closest('.cm-scroller'),line=e.querySelector('.cm-line'),keyword=line.querySelector('span');
    return {whiteSpace:getComputedStyle(e).whiteSpace,font:getComputedStyle(scroller).fontFamily,size:getComputedStyle(e).fontSize,padding:getComputedStyle(e).paddingTop,line:getComputedStyle(line).lineHeight,keyword:keyword&&getComputedStyle(keyword).color,color:getComputedStyle(e).color,display:getComputedStyle(e.closest('.cm-editor')).display,nonce:[...document.querySelectorAll('style')].every(s=>s.nonce==='ate-test-nonce-2026')};
   });
   assert.equal(styles.display,'flex',JSON.stringify(styles));
   assert.ok(['pre-wrap','break-spaces'].includes(styles.whiteSpace));assert.match(styles.font,/monospace/);
   assert.equal(styles.size,'36px');assert.equal(styles.padding,'24px');
   assert.ok(styles.keyword&&styles.keyword!==styles.color,'JavaScript keywords must have syntax colors');assert.ok(styles.nonce);
   assert.match(await text(),/\n    const answer/,'Opening must preserve indentation');
   await editor.click();await page.keyboard.press('ControlOrMeta+End');await page.keyboard.press('Tab');
   assert.match(await text(),/\n    }$/);await page.keyboard.press('Shift+Tab');assert.match(await text(),/\n}$/);
   await open('function hello() {');await page.keyboard.press('ControlOrMeta+End');await page.keyboard.press('Enter');await page.keyboard.type('return 42;');
   assert.match(await text(),/\n    return 42;/,'Enter must indent JavaScript blocks');
   await menu();await page.locator('#theme').click();await done();
   assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('dark')));
   await open('const first = 1;\nconst second = 2;\nconst third = 3;');
   await setMode('vim');await page.keyboard.press('Escape');await page.keyboard.type('ggdd');
   assert.equal(await text(),'const second = 2;\nconst third = 3;');
   await page.keyboard.type('u');assert.match(await text(),/^const first/);
   await page.keyboard.type('i');await page.keyboard.type('// ');await page.keyboard.press('Escape');assert.match(await text(),/^\/\/ const first/);
   await page.keyboard.type(':%s/const/let/g');
   const command=page.locator('.cm-vim-panel input');await command.waitFor({state:'visible'});
   const panel=await command.evaluate(e=>({width:e.getBoundingClientRect().width,color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor,size:getComputedStyle(e).fontSize}));
   assert.ok(panel.width>200,JSON.stringify(panel));assert.notEqual(panel.color,panel.bg);assert.equal(panel.size,'16px');
   await page.keyboard.press('Enter');assert.ok(!(await text()).includes('const'));assert.match(await text(),/let second/);
   await page.keyboard.type('/third');await page.keyboard.press('Enter');await page.keyboard.type('nN');
   await page.keyboard.type(':2');await page.keyboard.press('Enter');await page.keyboard.type('dd');assert.ok(!(await text()).includes('second'));
   await page.keyboard.type('u');assert.match(await text(),/second/);
   await setMode('standard');await page.keyboard.press('ControlOrMeta+End');await page.keyboard.type(' // standard');assert.match(await text(),/\/\/ standard$/);
   await page.reload();await page.waitForSelector('.cm-content');assert.match(await text(),/\/\/ standard$/,'Draft recovery must keep edits');
   // Check the built worker under the same strict nonce policy as the editor.
   await open('const = 2;');
   await menu();await page.locator('#checkSyntax').click();
   await page.waitForFunction(()=>document.getElementById('syntaxIssues').children.length>0);
   assert.match(await page.locator('#syntaxIssues').innerText(),/Line 1, column 7/);
   assert.ok(await page.locator('.cm-lintRange-error').count(),'Errors must be underlined');
   assert.equal(await page.locator('#syntaxIssues button').first().evaluate(e=>getComputedStyle(e).fontSize),'16px');
   await mkdir('editor-evidence',{recursive:true});
   await page.screenshot({path:`editor-evidence/${name}-syntax-errors.png`});
   await page.locator('#syntaxIssues button').first().click();
   assert.equal(await page.locator('#syntaxDialog').evaluate(e=>e.open),false);
   await open('const fixed = 2;');
   await page.waitForFunction(()=>document.getElementById('syntaxStatus').textContent.includes('no syntax errors'));
   assert.equal(await page.locator('.cm-lintRange-error').count(),0);
   await open('{"name":}', 'fixture.json');
   await page.waitForFunction(()=>document.getElementById('syntaxStatus').textContent.includes('syntax issue'));
   assert.equal(await page.locator('#language').inputValue(),'json');
   // Explicit language override works for new or unknown file names and recovers.
   await open('const = 1;', 'fixture.txt');
   await menu();await page.locator('#language').selectOption('javascript');await done();
   await page.waitForFunction(()=>document.getElementById('syntaxStatus').textContent.includes('syntax issue'));
   await page.reload();await page.waitForSelector('.cm-content');
   assert.equal(await page.locator('#language').inputValue(),'javascript');
   await page.waitForFunction(()=>document.getElementById('syntaxStatus').textContent.includes('syntax issue'));
   // Obsolete worker results must not survive a document/language replacement.
   await open('const = 1;');await open('ordinary notes','notes.txt');
   await page.waitForTimeout(1000);
   assert.equal(await page.locator('#syntaxStatus').innerText(),'Syntax: not checked');
   assert.equal(await page.locator('.cm-lintRange-error').count(),0);
   await menu();await page.locator('#checkSyntax').click();
   assert.match(await page.locator('#syntaxDetails').innerText(),/Choose a code language/);
   await page.locator('#closeSyntax').click();
   await open('int main(void) { return 0 }','fixture.c');
   await menu();await page.locator('#checkSyntax').click();
   await page.waitForFunction(()=>document.getElementById('syntaxIssues').children.length>0);
   assert.match(await page.locator('#syntaxDetails').innerText(),/Basic C syntax check only/);
   assert.match(await page.locator('#syntaxIssues').innerText(),/Missing/);
   await page.locator('#closeSyntax').click();
   for(const [name,invalid,valid] of [
    ['offline.py','def greet(name)\n    return name','def greet(name):\n    return name'],
    ['offline.sql','SELECT x FROM WHERE x=1;','SELECT name FROM people;'],
    ['offline.md','## Twice\n\n## Twice\n\n```py\npass','# Title\n\n- item']
   ]){
    await open(invalid,name);await menu();await page.locator('#checkSyntax').click();
    await page.waitForFunction(()=>document.getElementById('syntaxIssues').children.length>0);
    assert.match(await page.locator('#syntaxDetails').innerText(),/Offline|Markdown lint/);
    await page.locator('#closeSyntax').click();await open(valid,name);await menu();await page.locator('#checkSyntax').click();
    await page.waitForFunction(()=>/no syntax errors|no lint issues/.test(document.getElementById('syntaxSummary').textContent));
    assert.equal(await page.locator('#syntaxIssues li').count(),0);await page.locator('#closeSyntax').click();
   }
   // Manual checking still works when automatic checking is disabled.
   await menu();await page.locator('#autoCheck').uncheck();await done();
   await open('name: [unfinished','fixture.yaml');
   await page.waitForTimeout(900);assert.equal(await page.locator('#syntaxStatus').innerText(),'Syntax: not checked');
   await menu();await page.locator('#checkSyntax').click();
   await page.waitForFunction(()=>document.getElementById('syntaxIssues').children.length>0);
   await page.locator('#closeSyntax').click();
   await menu();await page.locator('#cSettingsButton').click();
   assert.equal(await page.locator('#chooseCompiler').isVisible(),false);
   assert.equal(await page.locator('#cStandard').isVisible(),false);
   assert.match(await page.locator('#cPlatformNote').innerText(),/No compiler download/);
   await page.locator('#closeCSettings').click();
   await page.reload();await page.waitForSelector('.cm-content');
   await page.setViewportSize({width:390,height:844});
   await menu();await page.locator('#checkSyntax').click();
   await page.waitForFunction(()=>document.getElementById('syntaxIssues').children.length>0);
   assert.ok(await page.locator('#syntaxDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Syntax results must fit a narrow screen');
   await page.screenshot({path:`editor-evidence/${name}-syntax-narrow.png`});
   await page.locator('#closeSyntax').click();
   assert.deepEqual(errors,[]);
   await mkdir('editor-evidence',{recursive:true});
   await page.screenshot({path:`editor-evidence/${name}-editor.png`});
   console.log(`PASS ${name}: strict desktop CSP, 36px monospaced layout, preserved spaces, syntax colors, Tab/Shift+Tab, Enter indentation, dark theme, Vim insert/delete/undo/search/substitution/go-to-line, mode switching, draft recovery, worker syntax checks, language override, diagnostics, stale-result cancellation and bundled C parser diagnostics`);
  }catch(error){console.error(name+': '+error.stack);throw error}finally{await browser.close()}
 }
}finally{await new Promise(r=>server.close(r))}
