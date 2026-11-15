// Reuse successful desktop/web artifacts; never recompile or modify binaries.
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sourceRun=43732522398,sourceSha='f52d12ec97793e34c3b2471509b0d0094d6ae9b7',base='https://api.github.com/repos/willyros01/clear-page/';
const headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'};
async function get(path){const r=await fetch(base+path,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Artifact provenance HTTP '+r.status);return r.json()}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const mode=process.argv[2];
if(mode==='check'){
 const run=await get('actions/runs/'+sourceRun),{jobs}=await get('actions/runs/'+sourceRun+'/jobs?per_page=100');
 if(run.head_sha!==sourceSha||run.head_branch!=='desktop'||run.name!=='ATE Apple and Desktop')throw Error('Unexpected original source');
 for(const name of ['browser','mac-build','windows'])if(!jobs.some(j=>j.name===name&&j.conclusion==='success'))throw Error('Original native/browser gate did not pass: '+name);
 const diff=await get('compare/'+sourceSha+'...'+process.env.GITHUB_SHA);
 if(diff.files.length>10||diff.files.some(f=>!['build/recover-desktop-083.mjs','.github/workflows/release-desktop-083.yml'].includes(f.filename)))throw Error('Application source changed since the successful desktop tests');
 console.log('PASS: original Mac, Windows and browser jobs passed; application source unchanged. Android remains separate.');
}else if(mode==='web'){
 const dir='recovered-web',p=dir+'/ate-web-build.json',m=JSON.parse(readFileSync(p));
 if(m.run_id!==sourceRun||m.source_sha!==sourceSha||m.version!=='0.8.3'||m.build!==24)throw Error('Wrong original web artifact');
 for(const [name,meta] of Object.entries(m.files)){if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name))throw Error('Invalid web path');const bytes=readFileSync(dir+'/'+name);if(bytes.length!==meta.bytes||hash(bytes)!==meta.sha256)throw Error('Original web bytes differ');}
 m.verified_build_run_id=sourceRun;m.verified_build_source_sha=sourceSha;m.run_id=Number(process.env.GITHUB_RUN_ID);m.source_sha=process.env.GITHUB_SHA;writeFileSync(p,JSON.stringify(m,null,2)+'\n');
 console.log('PASS: exact tested web assets preserved; only provenance manifest updated.');
}else if(mode==='windows'){
 const dir='recovered-windows',p=dir+'/manifest.json',m=JSON.parse(readFileSync(p));
 if(m.run_id!==sourceRun||m.source_sha!==sourceSha||m.version!=='0.8.3'||m.build!==24||m.verification!=='ci-installed-and-launched'||!/^ATE-[0-9.]+-windows-x64-setup\.exe$/.test(m.file))throw Error('Wrong original Windows artifact');
 const bytes=readFileSync(dir+'/'+m.file);if(bytes.length!==m.bytes||hash(bytes)!==m.sha256)throw Error('Windows installer differs from the installed/tested original');
 m.verified_build_run_id=sourceRun;m.verified_build_source_sha=sourceSha;m.run_id=Number(process.env.GITHUB_RUN_ID);m.source_sha=process.env.GITHUB_SHA;writeFileSync(p,JSON.stringify(m,null,2)+'\n');
 console.log('PASS: exact tested Windows installer preserved, SHA-256 '+m.sha256);
}else if(mode==='report'){
 const {artifacts}=await get('actions/runs/'+process.env.GITHUB_RUN_ID+'/artifacts?per_page=100');
 const find=name=>{const a=artifacts.find(a=>a.name===name&&!a.expired);if(!a)throw Error('Missing verified artifact '+name);return a.id};
 const report={app:'ATE',workflow:'ATE Apple and Desktop',branch:'desktop',version:'0.8.3',run_id:Number(process.env.GITHUB_RUN_ID),source_sha:process.env.GITHUB_SHA,verified_build_run_id:sourceRun,verified_build_source_sha:sourceSha,web_artifact_id:find('ate-web-app'),windows_artifact_id:find('ate-windows-x64'),mac_artifact_id:find('ate-mac-website-release'),created_at:new Date().toISOString()};
 mkdirSync('desktop-report',{recursive:true});writeFileSync('desktop-report/ate-desktop-last-run.json',JSON.stringify(report,null,2)+'\n');console.log('PASS: desktop/web publication report ready; APK publication remains independent.');
}else throw Error('Unsupported artifact recovery operation');
