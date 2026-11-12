import {readFileSync,writeFileSync,rmSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
if(!process.env.ATE_ANDROID_SIGNING)throw Error('One-time setup required: add repository secret ATE_ANDROID_SIGNING from the private signing setup file. Unsigned APK is not published.');
let signing;try{signing=JSON.parse(process.env.ATE_ANDROID_SIGNING)}catch{throw Error('ATE_ANDROID_SIGNING must contain the complete JSON signing package')}
if(signing.alias!=='ate'||!signing.password||!signing.keystoreBase64)throw Error('Incomplete signing package');
const expected=readFileSync('resources/android-signer.sha256','utf8').trim();
if(signing.certificateSha256!==expected)throw Error('Signing package fingerprint does not match permanent ATE certificate');
console.log('::add-mask::'+signing.password);
const dir=process.env.RUNNER_TEMP;const key=join(dir,'ate-signing.p12');
writeFileSync(key,Buffer.from(signing.keystoreBase64,'base64'),{mode:0o600});
const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
const tools=execFileSync('bash',['-c','find "$1/build-tools" -name apksigner -type f | sort -V | tail -1','bash',sdk],{encoding:'utf8'}).trim();
const env={...process.env,ATE_KEY_PASSWORD:signing.password};
const version=JSON.parse(readFileSync('package.json')).version;const apk=`out/ate.v${version}.apk`;
try{
 execFileSync(tools.replace(/apksigner$/,'zipalign'),['-p','-f','4','out/ate-unsigned.apk',join(dir,'ate-aligned.apk')],{stdio:'inherit'});
 execFileSync(tools,['sign','--ks',key,'--ks-type','PKCS12','--ks-key-alias','ate','--ks-pass','env:ATE_KEY_PASSWORD','--key-pass','env:ATE_KEY_PASSWORD','--out',apk,join(dir,'ate-aligned.apk')],{env,stdio:'inherit'});
 const cert=execFileSync(tools,['verify','--print-certs',apk],{encoding:'utf8'});
 const actual=cert.match(/certificate SHA-256 digest:\s*([a-fA-F0-9]+)/)?.[1]?.toLowerCase();
 if(actual!==expected)throw Error('Final APK signature mismatch');
 execFileSync('unzip',['-tqq',apk]);rmSync('out/ate-unsigned.apk');
 console.log('PASS: signed ATE Android APK; permanent certificate '+actual);
 if(process.env.GITHUB_OUTPUT)writeFileSync(process.env.GITHUB_OUTPUT,`apk_name=ate.v${version}.apk\n`,{flag:'a'});
}finally{rmSync(key,{force:true});rmSync(join(dir,'ate-aligned.apk'),{force:true})}
