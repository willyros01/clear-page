import {readdir,readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const release=JSON.parse(await readFile('release.json','utf8'));
if(!/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA||''))throw Error('A tested source revision is required');
const files={};await mkdir('web-artifacts',{recursive:true});
for(const name of await readdir('dist')){if(!/^[a-zA-Z0-9_.-]+$/.test(name))throw Error('Unexpected web asset');const bytes=await readFile('dist/'+name);files[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};await copyFile('dist/'+name,'web-artifacts/'+name);}
await writeFile('web-artifacts/ate-web-build.json',JSON.stringify({app:'ATE',platform:'web',version:release.version,build:release.build,source_sha:process.env.GITHUB_SHA,run_id:Number(process.env.GITHUB_RUN_ID),files},null,2)+'\n');
