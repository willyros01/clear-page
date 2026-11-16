// Retain completed native iPhone verification for unchanged application source.
const base='https://api.github.com/repos/willyros01/clear-page',headers={Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'};
async function get(path){const r=await fetch(base+path,{headers});if(!r.ok)throw Error('iPhone verification provenance HTTP '+r.status);return r.json()}
const source='23f352a4ceb3ad99a5f112a564253f0f0dd9ea9e';
const run=await get('/actions/runs/43810798310');if(run.head_sha!==source||run.path!=='.github/workflows/store-prep.yml')throw Error('Unexpected iPhone source');
const compare=await get('/compare/'+source+'...'+process.env.GITHUB_SHA);
const allowed=['tests/ios/ATEFunctionalTests.swift','.github/workflows/store-prep.yml','store/account-survey.mjs','store/reuse-mac.mjs','store/reuse-iphone.mjs'];
if(compare.files.length>10||compare.files.some(x=>!allowed.includes(x.filename)))throw Error('Application changed; native iPhone verification cannot be reused');
for(let attempt=0;attempt<90;attempt++){
 const job=(await get('/actions/runs/43810798310/jobs?per_page=100')).jobs.find(x=>x.name==='simulator (iPhone)');
 if(!job)throw Error('Original iPhone job missing');
 if(job.status==='completed'){if(job.conclusion!=='success')throw Error('Original iPhone native suite failed; rerun iPhone with corrected harness before uploading');console.log('PASS: original native iPhone parser, recovery, full UI, native screenshot and largest-text gates passed at source '+source);process.exit(0)}
 console.log('Waiting for existing iPhone suite; preserving Mac and running corrected iPad checks independently.');await new Promise(r=>setTimeout(r,20000));
}
throw Error('Original iPhone verification is still in progress; do not publish');
