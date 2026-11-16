// Preserve the exact successful universal Mac app when only iOS test/store-prep files change.
const base='https://api.github.com/repos/willyros01/clear-page',headers={Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'};
async function get(path){const r=await fetch(base+path,{headers});if(!r.ok)throw Error('Provenance HTTP '+r.status);return r.json()}
const source='23f352a4ceb3ad99a5f112a564253f0f0dd9ea9e',run=await get('/actions/runs/43810798310');
if(run.head_sha!==source||run.path!=='.github/workflows/store-prep.yml')throw Error('Unexpected original source');
const jobs=await get('/actions/runs/43810798310/jobs');for(const name of ['regression','mac-verify'])if(!jobs.jobs.some(x=>x.name===name&&x.conclusion==='success'))throw Error('Original '+name+' did not pass');
const compare=await get('/compare/'+source+'...'+process.env.GITHUB_SHA);
if(compare.files.length>12||compare.files.some(x=>!['tests/ios/ATEFunctionalTests.swift','.github/workflows/store-prep.yml','store/account-survey.mjs','store/reuse-mac.mjs','store/reuse-iphone.mjs','store/reuse-ipad.mjs','tests/ios-native.js','tests/store-photos.js'].includes(x.filename)))throw Error('App source changed; cannot reuse Mac binary');
console.log('PASS: exact universal Mac app and native screenshot verification preserved from run 43810798310, source '+source+'. Only iOS test automation and preparation/audit scripts changed.');
