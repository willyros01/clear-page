import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium, webkit} from 'playwright';

// Exercise the built assets under the nonce policy Tauri applies to its assets.
// A plain development server misses the desktop-only stylesheet failure.
const nonce='ate-test-nonce-2026';
const server=createServer(async(req,res)=>{
 try{
  const path=req.url.split('?')[0];
  let data=await readFile(new URL('../../dist/'+(path==='/'?'index.html':path.slice(1)),import.meta.url));
  if(path==='/')data=Buffer.from(data.toString().replace('<style>',`<style nonce="${nonce}">`));
  res.setHeader('Content-Type',path.endsWith('.js')?'application/javascript':'text/html');
  res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' 'nonce-${nonce}'; img-src 'self' data:; object-src 'none'`);
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
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);
   await page.waitForSelector('.cm-content');
   const editor=page.locator('.cm-content');
   const text=()=>page.locator('.cm-line').allTextContents().then(lines=>lines.join('\n'));
   const menu=async()=>page.locator('#menuButton').click();
   const done=async()=>page.locator('#closeMenu').click();
   const setMode=async mode=>{await menu();await page.locator('#editingMode').selectOption(mode);await done()};
   const open=async content=>{
    await page.locator('#file').setInputFiles({name:'fixture.js',mimeType:'text/javascript',buffer:Buffer.from(content)});
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
   assert.ok(panel.width>200,JSON.stringify(panel));assert.notEqual(panel.color,panel.bg);assert.equal(panel.size,'24px');
   await page.keyboard.press('Enter');assert.ok(!(await text()).includes('const'));assert.match(await text(),/let second/);
   await page.keyboard.type('/third');await page.keyboard.press('Enter');await page.keyboard.type('nN');
   await page.keyboard.type(':2');await page.keyboard.press('Enter');await page.keyboard.type('dd');assert.ok(!(await text()).includes('second'));
   await page.keyboard.type('u');assert.match(await text(),/second/);
   await setMode('standard');await page.keyboard.press('ControlOrMeta+End');await page.keyboard.type(' // standard');assert.match(await text(),/\/\/ standard$/);
   await page.reload();await page.waitForSelector('.cm-content');assert.match(await text(),/\/\/ standard$/,'Draft recovery must keep edits');
   assert.deepEqual(errors,[]);
   await mkdir('editor-evidence',{recursive:true});
   await page.screenshot({path:`editor-evidence/${name}-editor.png`});
   console.log(`PASS ${name}: strict desktop CSP, 36px monospaced layout, preserved spaces, syntax colors, Tab/Shift+Tab, Enter indentation, dark theme, Vim insert/delete/undo/search/substitution/go-to-line, mode switching, draft recovery`);
  }catch(error){console.error(name+': '+error.stack);throw error}finally{await browser.close()}
 }
}finally{await new Promise(r=>server.close(r))}
