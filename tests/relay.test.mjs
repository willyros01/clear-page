import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=(await readFile(new URL('../relay/worker.js',import.meta.url),'utf8')).replace("'Iv23li8BSDes04NZkw1o'","'Iv1.test'");
const worker=(await import('data:text/javascript,'+encodeURIComponent(src))).default;
const ORIGIN='https://www.cuberoot-systems.com';
function withFetch(fn,impl){const old=globalThis.fetch;globalThis.fetch=impl;return fn().finally(()=>{globalThis.fetch=old})}
test('refuses other websites',async()=>{const r=await worker.fetch(new Request('https://x/device/code',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'}));assert.equal(r.status,403);});
test('answers the browser pre-check',async()=>{const r=await worker.fetch(new Request('https://x/device/code',{method:'OPTIONS',headers:{Origin:ORIGIN}}));assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),ORIGIN);});
test('asks GitHub for a code with only the public app ID',()=>withFetch(async()=>{
 const r=await worker.fetch(new Request('https://x/device/code',{method:'POST',headers:{Origin:ORIGIN},body:'{"client_id":"someone-else"}'}));
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{device_code:'dc',user_code:'ABCD-1234',verification_uri:'https://github.com/login/device',expires_in:900,interval:5});
},async(url,opts)=>{assert.equal(url,'https://github.com/login/device/code');assert.equal(opts.body.toString(),'client_id=Iv1.test');return new Response(JSON.stringify({device_code:'dc',user_code:'ABCD-1234',verification_uri:'https://github.com/login/device',expires_in:900,interval:5,extra:'dropped'}))}));
test('exchanges the code for a pass and passes on only needed fields',()=>withFetch(async()=>{
 const r=await worker.fetch(new Request('https://x/access_token',{method:'POST',headers:{Origin:ORIGIN},body:'{"device_code":"dc"}'}));
 assert.deepEqual(await r.json(),{access_token:'ghu_x',token_type:'bearer',expires_in:28800});
},async(url,opts)=>{assert.equal(url,'https://github.com/login/oauth/access_token');const p=new URLSearchParams(opts.body.toString());assert.equal(p.get('client_id'),'Iv1.test');assert.equal(p.get('device_code'),'dc');assert.equal(p.get('client_secret'),null);return new Response(JSON.stringify({access_token:'ghu_x',token_type:'bearer',expires_in:28800,refresh_token:'ghr_never_forwarded',scope:''}))}));
test('unknown paths are refused',async()=>{const r=await worker.fetch(new Request('https://x/anything',{method:'POST',headers:{Origin:ORIGIN},body:'{}'}));assert.equal(r.status,404);});
test('the installed apps may sign in too (iPhone/iPad, Android, Mac/Linux, Windows)',async()=>{
 const orig=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({device_code:'dc',user_code:'ABCD-1234',verification_uri:'https://github.com/login/device',expires_in:900,interval:5}),{status:200});
 try{for(const o of ['capacitor://localhost','https://localhost','tauri://localhost','http://tauri.localhost','https://tauri.localhost']){const r=await worker.fetch(new Request('https://x/device/code',{method:'POST',headers:{Origin:o},body:'{}'}));assert.equal(r.status,200,o);assert.equal(r.headers.get('Access-Control-Allow-Origin'),o)}}
 finally{globalThis.fetch=orig}
});
