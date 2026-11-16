// Reuse proved native/core cases; the repaired ordinary-file largest-text case is a separate required job.
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const base='https://api.github.com/repos/willyros01/clear-page',headers={Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'};
async function get(path){const r=await fetch(base+path,{headers});if(!r.ok)throw Error('iPhone provenance HTTP '+r.status);return r.json()}
const source='23f352a4ceb3ad99a5f112a564253f0f0dd9ea9e',run=await get('/actions/runs/43810798310');
if(run.head_sha!==source||run.path!=='.github/workflows/store-prep.yml')throw Error('Unexpected original iPhone source');
const allowed=['tests/ios/ATEFunctionalTests.swift','.github/workflows/store-prep.yml','.github/workflows/all-platforms.yml','.github/workflows/desktop-build.yml','store/account-survey.mjs','store/reuse-mac.mjs','store/reuse-iphone.mjs','store/reuse-ipad.mjs','tests/ios-native.js','tests/store-photos.js'];
const compare=await get('/compare/'+source+'...'+process.env.GITHUB_SHA);if(compare.files.length>12||compare.files.some(x=>!allowed.includes(x.filename)))throw Error('Application source changed; cannot reuse native cases');
const job=(await get('/actions/runs/43810798310/jobs?per_page=100')).jobs.find(x=>x.name==='simulator (iPhone)');
for(const name of ['Run native parser, editor, tabs and process-recovery checks','Focused project layout and nested-dialog accessibility regression','Native functional tests including Files and Share cancellation','Export native App Store screenshot attachments'])if(!job?.steps.some(s=>s.name===name&&s.conclusion==='success'))throw Error('Original iPhone gate missing: '+name);
function find(root,name){for(const e of readdirSync(root,{withFileTypes:true})){const p=join(root,e.name);if(e.isFile()&&e.name===name)return p;if(e.isDirectory()){const hit=find(p,name);if(hit)return hit}}}
const read=name=>{const p=find('iphone-evidence',name);if(!p)throw Error('Missing original evidence '+name);return readFileSync(p,'utf8')};
const report=JSON.parse(read('ipad-syntax.json'));if(!report.passed||report.checks.length<100)throw Error('Native parser/editor recovery report failed');
const ui=read('ui-tests.log');if(!ui.includes('** TEST SUCCEEDED **')||(ui.match(/Test Case .* passed \(/g)||[]).length<7)throw Error('Full native iPhone suite did not pass');
const large=read('large-text-tests.log');if(!/Test Case .*testProjectLayoutAccessibility.* passed \(/.test(large))throw Error('Largest-text project case did not pass');
const failed=[...large.matchAll(/Test Case '([^']+)' failed/g)].map(x=>x[1]);if(!failed.length||failed.some(x=>!x.includes('testToolbarAndSaveVisibility')))throw Error('Unexpected original largest-text failure');
console.log('PASS: original native parser/recovery, all seven functional/screenshot cases and largest-text Projects preserved. The ordinary-file largest-text Share case must pass the separate repaired native iPhone job.');
