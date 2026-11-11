import {createPrivateKey, sign} from 'node:crypto';
import {appendFileSync} from 'node:fs';
const appId='6833284199';
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
function report(message) {
 console.log(message);
 if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,message+'\n');
}
function token() {
 const now=Math.floor(Date.now()/1000);
 const input=encode({alg:'ES256',kid:process.env.ASC_KEY_ID.trim(),typ:'JWT'})+'.'+encode({iss:process.env.ASC_ISSUER_ID.trim(),iat:now,exp:now+300,aud:'appstoreconnect-v1'});
 return input+'.'+sign('sha256',Buffer.from(input),{key:createPrivateKey(process.env.ASC_KEY_P8.trim()),dsaEncoding:'ieee-p1363'}).toString('base64url');
}
async function main() {
 const build=process.env.GITHUB_RUN_NUMBER;
 if(!/^\d+$/.test(build??'')) throw Error('Missing build number');
 for(let attempt=0;attempt<24;attempt++) {
  const url=new URL('https://api.appstoreconnect.apple.com/v1/builds');
  url.search=new URLSearchParams({'filter[app]':appId,'filter[version]':build,'include':'preReleaseVersion',limit:'5'});
  let response;
  try { response=await fetch(url,{headers:{Authorization:'Bearer '+token()},redirect:'error',signal:AbortSignal.timeout(30000)}); }
  catch { throw Error('Apple processing lookup connection failed'); }
  if(!response.ok) throw Error('Apple processing lookup HTTP '+response.status);
  const body=await response.json();
  const entry=body.data?.find(item=>item.attributes?.version===build && body.included?.some(v=>v.id===item.relationships?.preReleaseVersion?.data?.id && v.attributes?.version===process.env.VERSION && v.attributes?.platform===(process.env.APPLE_PLATFORM||'IOS')));
  if(entry) {
   const state=entry.attributes.processingState;
   console.log('Apple processing state: '+state);
   if(state==='VALID') {
    report('PASS: Apple finished processing ATE '+process.env.VERSION+' ('+build+'). Build ID: '+entry.id);
    const groupId='a310eafe-4a60-4759-ba9e-a4db47551732';
    const call=async(path,method='GET',body)=>{
     const response=await fetch('https://api.appstoreconnect.apple.com/v1/'+path,{method,headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});
     if(!response.ok) throw Error('Internal testing assignment HTTP '+response.status);
     return response.status===204?null:response.json();
    };
    const group=await call('betaGroups/'+groupId);
    if(!group.data.attributes.isInternalGroup) throw Error('Expected internal tester group');
    let assigned=await call('betaGroups/'+groupId+'/builds?limit=200');
    if(!assigned.data.some(x=>x.id===entry.id)) await call('betaGroups/'+groupId+'/relationships/builds','POST',{data:[{type:'builds',id:entry.id}]});
    assigned=await call('betaGroups/'+groupId+'/builds?limit=200');
    if(!assigned.data.some(x=>x.id===entry.id)) throw Error('New build tester assignment not verified');
    report('PASS: updated build assigned to the existing internal tester group. Physical-device acceptance remains pending.');
    return;
   }
   if(['INVALID','FAILED'].includes(state)) throw Error('Apple processing rejected build: '+state);
  } else console.log('Waiting for uploaded build to appear in Apple API.');
  if(attempt<23) await new Promise(resolve=>setTimeout(resolve,30000));
 }
 throw Error('Upload succeeded, but Apple processing is still pending after the observation window. Check TestFlight before retrying upload.');
}
main().catch(error=>{report('FAIL: '+error.message);process.exitCode=1;});

