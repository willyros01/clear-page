import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base='https://api.github.com/repos/willyros01/clear-page/';
const headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'};
async function get(path){const r=await fetch(base+path,{headers,redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('GitHub lookup HTTP '+r.status);return r.json()}
const artifacts=(await get('actions/runs/'+process.env.GITHUB_RUN_ID+'/artifacts?per_page=100')).artifacts;
const jobs=(await get('actions/runs/'+process.env.GITHUB_RUN_ID+'/jobs?per_page=100')).jobs;
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const web=artifacts.find(x=>x.name==='ate-web-app'&&!x.expired);
const windows=artifacts.find(x=>x.name==='ate-windows-x64'&&!x.expired);
const mac=jobs.some(j=>j.name.includes('mac-release')&&j.name.includes('website')&&j.conclusion==='success')?artifacts.find(x=>x.name==='ate-mac-website-release'&&!x.expired):null;
// A Mac release artifact may contain failure logs: the publisher must require
// a notarization manifest and verify the DMG, never infer success from its name.
const report={app:'ATE',workflow:'ATE Apple and Desktop',branch:'desktop',version,run_id:Number(process.env.GITHUB_RUN_ID),source_sha:process.env.GITHUB_SHA,web_artifact_id:web?.id??null,windows_artifact_id:windows?.id??null,mac_artifact_id:mac?.id??null,created_at:new Date().toISOString()};
mkdirSync('desktop-report',{recursive:true});writeFileSync('desktop-report/ate-desktop-last-run.json',JSON.stringify(report,null,2)+'\n');
console.log('Desktop report: Windows artifact '+(windows?.id??'unavailable')+', Mac release artifact '+(mac?.id??'unavailable'));

const apk=artifacts.find(x=>x.name==='ate-android-apk'&&!x.expired);
if(!web||!windows||!mac||!apk)throw Error('All verified platform artifacts are required before publication');
writeFileSync('desktop-report/ate-last-run.json',JSON.stringify({workflow:'ATE Apple and Desktop',branch:'desktop',outcome:'success',run_id:Number(process.env.GITHUB_RUN_ID),run_number:Number(process.env.ATE_BUILD_NUMBER),source_sha:process.env.GITHUB_SHA,artifact_id:apk.id,apk_name:'ate.v'+version+'.apk',version,signer_sha256:readFileSync('resources/android-signer.sha256','utf8').trim(),reported_at:new Date().toISOString()},null,2)+'\n');
