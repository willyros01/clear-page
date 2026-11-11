import {createPrivateKey, sign} from 'node:crypto';
import {appendFileSync} from 'node:fs';
const appId='6833284199';
const buildId='9e20063f-4c91-44ef-a608-9c1fd961e126';
const mode='enable';
function report(value) {
 const line=typeof value==='string'?value:JSON.stringify(value);
 console.log(line);
 if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,line+'\n');
}
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
function token(){
 const now=Math.floor(Date.now()/1000);
 const input=encode({alg:'ES256',kid:process.env.ASC_KEY_ID.trim(),typ:'JWT'})+'.'+encode({iss:process.env.ASC_ISSUER_ID.trim(),iat:now,exp:now+300,aud:'appstoreconnect-v1'});
 return input+'.'+sign('sha256',Buffer.from(input),{key:createPrivateKey(process.env.ASC_KEY_P8.trim()),dsaEncoding:'ieee-p1363'}).toString('base64url');
}
async function api(path,method='GET',body){
 const response=await fetch('https://api.appstoreconnect.apple.com/v1/'+path,{method,headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});
 const data=response.status===204?null:await response.json();
 if(!response.ok) throw Error(method+' '+path.split('?')[0]+': HTTP '+response.status+' '+(data?.errors??[]).map(x=>x.code+': '+x.title).join('; '));
 return data;
}
async function main(){
 const name='Another Text Editor (ATE)';
 const infos=await api('apps/'+appId+'/appInfos?limit=200');
 const candidates=infos.data.filter(x=>['PREPARE_FOR_SUBMISSION','DEVELOPER_REJECTED','REJECTED','METADATA_REJECTED'].includes(x.attributes.appStoreState));
 if(candidates.length!==1) throw Error('Could not uniquely identify editable app information');
 const localizations=await api('appInfos/'+candidates[0].id+'/appInfoLocalizations?limit=200');
 const locale=localizations.data.find(x=>x.attributes.locale==='en-CA');
 if(!locale) throw Error('English Canada app information not found');
 if(!['Clear Page',name].includes(locale.attributes.name)) throw Error('Unexpected current app name; refusing overwrite');
 if(locale.attributes.name!==name) await api('appInfoLocalizations/'+locale.id,'PATCH',{data:{type:'appInfoLocalizations',id:locale.id,attributes:{name}}});
 const checked=await api('appInfoLocalizations/'+locale.id);
 if(checked.data.attributes.name!==name) throw Error('App name verification failed');
 report('PASS: Apple app name is '+name+'. Existing app ID and bundle ID retained.');
}
main().catch(error=>{report('FAIL: '+error.message);process.exitCode=1;});
