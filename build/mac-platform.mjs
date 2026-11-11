import {createPrivateKey,sign} from 'node:crypto';
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(){const now=Math.floor(Date.now()/1000);const input=encode({alg:'ES256',kid:process.env.ASC_KEY_ID.trim(),typ:'JWT'})+'.'+encode({iss:process.env.ASC_ISSUER_ID.trim(),iat:now,exp:now+300,aud:'appstoreconnect-v1'});return input+'.'+sign('sha256',Buffer.from(input),{key:createPrivateKey(process.env.ASC_KEY_P8.trim()),dsaEncoding:'ieee-p1363'}).toString('base64url')}
async function api(path,method='GET',body){const r=await fetch('https://api.appstoreconnect.apple.com/v1/'+path,{method,headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});const b=r.status===204?null:await r.json();if(!r.ok)throw Error('Apple Mac platform setup HTTP '+r.status+': '+(b.errors??[]).map(x=>x.code+': '+x.title).join('; '));return b}
const app=(await api('apps/6833284199')).data;
if(app.attributes.bundleId!=='io.github.willyros01.clearpage')throw Error('Wrong Apple app');
const versions=await api('apps/6833284199/appStoreVersions?filter[platform]=MAC_OS&limit=200');
if(!versions.data.length){await api('appStoreVersions','POST',{data:{type:'appStoreVersions',attributes:{platform:'MAC_OS',versionString:process.env.VERSION,releaseType:'MANUAL'},relationships:{app:{data:{type:'apps',id:app.id}}}}});console.log('Added macOS platform to existing ATE app. No App Store review or release submitted.')}
else console.log('macOS platform already present on ATE app.');
