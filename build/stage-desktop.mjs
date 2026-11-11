import {readFileSync,readdirSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const version=JSON.parse(readFileSync('package.json','utf8')).version;
mkdirSync('desktop-artifacts',{recursive:true});
if(process.platform==='darwin'){
 const dir='src-tauri/target/universal-apple-darwin/release/bundle/dmg';
 const files=readdirSync(dir).filter(x=>x.endsWith('.dmg'));if(files.length!==1)throw Error('Expected one preview DMG');
 copyFileSync(dir+'/'+files[0],'desktop-artifacts/ATE-'+version+'-universal-preview.dmg');
 copyFileSync('ate-mac-app.zip','desktop-artifacts/ate-mac-app.zip');
}else{
 const dir='src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis';
 const files=readdirSync(dir).filter(x=>x.endsWith('.exe'));if(files.length!==1)throw Error('Expected one Windows installer');
 const name='ATE-'+version+'-windows-x64-setup.exe';
 copyFileSync(dir+'/'+files[0],'desktop-artifacts/'+name);
 const bytes=readFileSync('desktop-artifacts/'+name);
 writeFileSync('desktop-artifacts/manifest.json',JSON.stringify({app:'ATE',platform:'windows-x64',version,run_id:Number(process.env.GITHUB_RUN_ID),source_sha:process.env.GITHUB_SHA,file:name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,signature:'unsigned',verification:'ci-installed-and-launched'},null,2)+'\n');
}
