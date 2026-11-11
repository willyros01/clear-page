import {createPrivateKey, sign} from 'node:crypto';
import {appendFileSync} from 'node:fs';
const appId='6833284199';
const buildId='9e20063f-4c91-44ef-a608-9c1fd961e126';
const mode='inspect';
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
 const users=await api('users?limit=200');
 const candidates=users.data.filter(x=>x.id==='00a4b5d8-6a2f-4433-809d-26aeeaff0ce7' && x.attributes.roles.includes('ACCOUNT_HOLDER') && x.attributes.lastName==='Rosales');
 if(candidates.length!==1) throw Error('Could not uniquely identify Willy Rosales as account holder');
 const owner=candidates[0];
 report({accountHolder:{id:owner.id,firstName:owner.attributes.firstName,lastName:owner.attributes.lastName,roles:owner.attributes.roles}});
 const email=owner.attributes.username;
 const query=new URLSearchParams({'filter[email]':email,limit:'200'});
 const testers=await api('betaTesters?'+query);
 report({matchingTesters:testers.data.map(x=>({id:x.id,firstName:x.attributes.firstName,lastName:x.attributes.lastName,exactAddress:x.attributes.email.toLowerCase()===email.toLowerCase(),inviteType:x.attributes.inviteType}))});
 for(const tester of testers.data){
  const memberships=await api('betaTesters/'+tester.id+'/betaGroups?limit=200');
  report({testerId:tester.id,memberships:memberships.data.map(g=>({id:g.id,name:g.attributes.name,isInternalGroup:g.attributes.isInternalGroup}))});
 }
 const groups=await api('apps/'+appId+'/betaGroups?limit=200');
 report({groups:groups.data.map(x=>({id:x.id,...x.attributes}))});
 const detail=await api('builds/'+buildId+'/buildBetaDetail');
 report({buildTesting:detail.data.attributes});
 if(mode==='inspect') return;
}
main().catch(error=>{report('FAIL: '+error.message);process.exitCode=1;});
