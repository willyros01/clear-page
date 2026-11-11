// Read-only inventory. Certificate private keys cannot be downloaded from Apple.
import {createPrivateKey,sign} from 'node:crypto';
import {writeFileSync,appendFileSync} from 'node:fs';
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(){const now=Math.floor(Date.now()/1000);const input=encode({alg:'ES256',kid:process.env.ASC_KEY_ID.trim(),typ:'JWT'})+'.'+encode({iss:process.env.ASC_ISSUER_ID.trim(),iat:now,exp:now+300,aud:'appstoreconnect-v1'});return input+'.'+sign('sha256',Buffer.from(input),{key:createPrivateKey(process.env.ASC_KEY_P8.trim()),dsaEncoding:'ieee-p1363'}).toString('base64url')}
async function get(path){const r=await fetch('https://api.appstoreconnect.apple.com/v1/'+path,{headers:{Authorization:'Bearer '+token()},redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)return {http:r.status};const b=await r.json();return {http:r.status,data:b.data}}
const certificates=await get('certificates?limit=200');
const versions=await get('apps/6833284199/appStoreVersions?filter[platform]=MAC_OS&limit=20');
const result={certificateLookup:certificates.http,certificateTypes:[...new Set(certificates.data?.map(x=>x.attributes.certificateType)??[])],macPlatformLookup:versions.http,macVersions:versions.data?.map(x=>({version:x.attributes.versionString,state:x.attributes.appStoreState}))??[],
 signingSecrets:{developerId:!!process.env.MAC_DEVELOPER_ID_P12,appStoreApplication:!!process.env.MAC_APP_STORE_P12,appStoreInstaller:!!process.env.MAC_INSTALLER_P12},
 note:'Read-only check. The Mac release jobs will attempt cloud-managed export with the existing Apple key. No certificate was created or revoked.'};
writeFileSync('mac-signing-readiness.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### Mac signing readiness\n```json\n'+JSON.stringify(result,null,2)+'\n```\n');
