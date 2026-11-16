// Retain passed iPad core cases; native picker/tab repairs and largest-text cases remain mandatory.
import {readFileSync,readdirSync} from 'node:fs';import {join} from 'node:path';
const base='https://api.github.com/repos/willyros01/clear-page',headers={Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'};
async function get(p){const r=await fetch(base+p,{headers});if(!r.ok)throw Error('iPad provenance HTTP '+r.status);return r.json()}
const run=await get('/actions/runs/43816569242');if(run.head_sha!=='ef91d1f6081625b06bd7f196bffb4df5c5d2637a'||run.path!=='.github/workflows/store-prep.yml')throw Error('Unexpected iPad source');
const jobs=await get('/actions/runs/43816569242/jobs?per_page=100'),j=jobs.jobs.find(x=>x.name==='simulator (iPad)');
for(const name of ['Run native parser, editor, tabs and process-recovery checks','Focused first-use terms and consent persistence regression'])if(!j?.steps.some(s=>s.name===name&&s.conclusion==='success'))throw Error('iPad gate missing '+name);
function find(root,name){for(const e of readdirSync(root,{withFileTypes:true})){const p=join(root,e.name);if(e.isFile()&&e.name===name)return p;if(e.isDirectory()){const x=find(p,name);if(x)return x}}}
function read(name){const p=find('ipad-evidence',name);if(!p)throw Error('Missing iPad evidence '+name);return readFileSync(p,'utf8')}
const native=JSON.parse(read('ipad-syntax.json'));if(!native.passed||native.checks.length<100)throw Error('Original iPad native report did not pass');
const ui=read('ui-tests.log');for(const name of ['testFilenameMenuReturn','testFirstUseTermsAndPersistence','testModesAndProjects','testProjectLayoutAccessibility','testToolbarAndSaveVisibility'])if(!new RegExp('Test Case .*'+name+'.* passed \\(').test(ui))throw Error('Original passed iPad case missing '+name);
const allowed=['tests/ios/ATEFunctionalTests.swift','.github/workflows/store-prep.yml','store/account-survey.mjs','store/reuse-mac.mjs','store/reuse-iphone.mjs','store/reuse-ipad.mjs','tests/ios-native.js','tests/store-photos.js'];const cmp=await get('/compare/23f352a4ceb3ad99a5f112a564253f0f0dd9ea9e...'+process.env.GITHUB_SHA);if(cmp.files.length>12||cmp.files.some(x=>!allowed.includes(x.filename)))throw Error('Application source changed; cannot preserve iPad core evidence');
console.log('PASS: iPad native worker/filesystem/recovery, first-use terms and five normal core UI cases retained. Fresh native picker/tab repairs and largest-text tests are separately required.');
