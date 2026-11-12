import {createPrivateKey,sign} from 'node:crypto';
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(){const now=Math.floor(Date.now()/1000);const input=encode({alg:'ES256',kid:process.env.ASC_KEY_ID.trim(),typ:'JWT'})+'.'+encode({iss:process.env.ASC_ISSUER_ID.trim(),iat:now,exp:now+300,aud:'appstoreconnect-v1'});return input+'.'+sign('sha256',Buffer.from(input),{key:createPrivateKey(process.env.ASC_KEY_P8.trim()),dsaEncoding:'ieee-p1363'}).toString('base64url');}
async function api(path){const response=await fetch('https://api.appstoreconnect.apple.com/v1/'+path,{headers:{Authorization:'Bearer '+token()},redirect:'error',signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok)throw Error(path+': HTTP '+response.status+' '+JSON.stringify(data.errors?.map(x=>({code:x.code,title:x.title}))));return data;}
const groupId='a310eafe-4a60-4759-ba9e-a4db47551732';
const group=await api('betaGroups/'+groupId);
const members=await api('betaGroups/'+groupId+'/betaTesters?limit=200');
const assigned=await api('betaGroups/'+groupId+'/builds?limit=200');
console.log('GROUP',JSON.stringify({id:groupId,...group.data.attributes}));
for(const tester of members.data){const {email,firstName,lastName,...rest}=tester.attributes;console.log('TESTER',JSON.stringify({id:tester.id,email:email?.replace(/^(.{2}).*(@.*)$/,'$1***$2'),...rest}));}
for(const [platform,id]of [['IOS','81ffd03e-0758-480d-acb0-372cf2e4b712'],['MAC_OS','b8cbbf95-9e20-4324-9a9a-2ca2843538dd']]){
const build=await api('builds/'+id+'?include=preReleaseVersion');
const detail=await api('builds/'+id+'/buildBetaDetail');
console.log('BUILD',JSON.stringify({platform,id,...build.data.attributes,preRelease:build.included?.map(x=>x.attributes),assignedToGroup:assigned.data.some(x=>x.id===id),testing:detail.data.attributes,testingId:detail.data.id}));
}
