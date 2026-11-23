// Authorized draft preparation only. No submission or release-request endpoints.
import fs from 'node:fs';
import crypto from 'node:crypto';
const L=JSON.parse(fs.readFileSync('store/listing.json')),appId='6833284199';
// The exact processed builds for this release are recorded in listing.json (buildIds), next to the version.
const expected=L.buildIds||{};if(!expected.IOS||!expected.MAC_OS)throw Error('listing.json buildIds missing');
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function jwt(){const n=Math.floor(Date.now()/1000),s=enc({alg:'ES256',kid:process.env.ASC_KEY_ID.trim(),typ:'JWT'})+'.'+enc({iss:process.env.ASC_ISSUER_ID.trim(),iat:n,exp:n+600,aud:'appstoreconnect-v1'});return s+'.'+crypto.sign('sha256',Buffer.from(s),{key:process.env.ASC_KEY_P8.trim(),dsaEncoding:'ieee-p1363'}).toString('base64url')}
async function api(path,method='GET',body){
 if(method!=='GET'&&!(/^(builds\/[^/?]+|accessibilityDeclarations(?:\/[^/?]+)?|territoryAvailabilities\/[^/?]+)$/.test(path)||path==='v2/appAvailabilities'))throw Error('Mutation outside preparation scope');
 const url=path.startsWith('https://api.appstoreconnect.apple.com/')?path:'https://api.appstoreconnect.apple.com/'+(path.startsWith('v2/')?'':'v1/')+path;
 const r=await fetch(url,{method,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const j=r.status===204?{}:await r.json();if(!r.ok){const e=Error('Apple '+method+' '+path.split('?')[0]+' HTTP '+r.status+' '+(j.errors||[]).map(x=>x.code+': '+x.detail).join('; '));e.status=r.status;throw e}return j;
}
async function list(path){const data=[];for(let next=path;next;){const r=await api(next);data.push(...r.data);next=r.links?.next}return data}
const done=[],pending=[],manual=[];
async function step(name,fn){try{const detail=await fn();done.push({name,detail});console.log('PASS '+name)}catch(e){pending.push({name,error:e.message});console.log('PENDING '+name+': '+e.message)}}
const app=(await api('apps/'+appId)).data;if(app.attributes.bundleId!=='io.github.willyros01.clearpage'||L.releaseType!=='AFTER_APPROVAL')throw Error('Unexpected app or release policy');
const versions=await list('apps/'+appId+'/appStoreVersions?limit=200');
for(const platform of ['IOS','MAC_OS'])await step(platform+' attached build, automatic release and listing readback',async()=>{
 const v=versions.find(x=>x.attributes.platform===platform&&x.attributes.versionString===L.versionString&&x.attributes.appStoreState==='PREPARE_FOR_SUBMISSION');if(!v)throw Error('Expected editable draft missing');
 if(v.attributes.releaseType!=='AFTER_APPROVAL')throw Error('Automatic release was not saved');
 const build=(await api('appStoreVersions/'+v.id+'/build')).data;
 if(build.id!==expected[platform]||build.attributes.processingState!=='VALID'||build.attributes.version!==L.buildNumber||build.attributes.expired)throw Error('Exact processed build mismatch');
 if(build.attributes.usesNonExemptEncryption!==false)await api('builds/'+build.id,'PATCH',{data:{type:'builds',id:build.id,attributes:{usesNonExemptEncryption:false}}});
 const checked=(await api('builds/'+build.id)).data;if(checked.attributes.usesNonExemptEncryption!==false)throw Error('Encryption exemption did not persist');
 const loc=(await list('appStoreVersions/'+v.id+'/appStoreVersionLocalizations?limit=200')).find(x=>x.attributes.locale===L.locale);if(!loc)throw Error('English-Canada listing missing');
 for(const k of ['description','keywords','promotionalText','supportUrl','marketingUrl'])if(loc.attributes[k]!==L[k])throw Error('Listing readback mismatch: '+k);
 const review=(await api('appStoreVersions/'+v.id+'/appStoreReviewDetail')).data.attributes;
 if(!review.contactPhone||!review.contactEmail||!review.notes||review.demoAccountRequired!==false)throw Error('Review details incomplete');
 const sets=await list('appStoreVersionLocalizations/'+loc.id+'/appScreenshotSets?limit=200'),screens=[];
 for(const set of sets){const photos=await list('appScreenshotSets/'+set.id+'/appScreenshots?limit=50');screens.push({displayType:set.attributes.screenshotDisplayType,count:photos.length,complete:photos.every(x=>x.attributes.assetDeliveryState?.state==='COMPLETE')})}
 if(screens.some(x=>!x.complete)||platform==='IOS'&&(!screens.some(x=>x.displayType==='APP_IPHONE_61'&&x.count>=4)||!screens.some(x=>x.displayType==='APP_IPAD_PRO_3GEN_129'&&x.count>=4))||platform==='MAC_OS'&&!screens.some(x=>x.displayType==='APP_DESKTOP'&&x.count>=2))throw Error('Required screenshot sets incomplete');
 const beta=(await api('builds/'+build.id+'/buildBetaDetail')).data.attributes;
 return {versionId:v.id,buildId:build.id,version:L.versionString,build:L.buildNumber,releaseType:v.attributes.releaseType,state:v.attributes.appStoreState,encryptionExempt:true,internalTestFlight:beta.internalBuildState,reviewContactComplete:true,screenshots:screens,description:loc.attributes.description};
});
await step('Free pricing readback',async()=>{
 const schedule=(await api('apps/'+appId+'/appPriceSchedule')).data;
 const prices=await api('appPriceSchedules/'+schedule.id+'/manualPrices?include=appPricePoint&limit=200');
 const points=(prices.included||[]).filter(x=>x.type==='appPricePoints');if(!points.length||points.some(x=>Number(x.attributes.customerPrice)!==0))throw Error('Free price not confirmed');return {free:true,baseTerritory:schedule.relationships?.baseTerritory?.data?.id,pricePoints:points.length};
});
await step('App information, policy and age-rating readback',async()=>{
 const infos=await api('apps/'+appId+'/appInfos?include=appInfoLocalizations,ageRatingDeclaration&limit=200');
 const loc=(infos.included||[]).find(x=>x.type==='appInfoLocalizations'&&x.attributes.locale===L.locale);
 if(loc?.attributes.privacyPolicyUrl!==L.privacyPolicyUrl||loc.attributes.subtitle!==L.subtitle)throw Error('App policy/subtitle mismatch');
 const age=(infos.included||[]).find(x=>x.type==='ageRatingDeclarations');if(!age)throw Error('Age questionnaire missing');
 return {locale:L.locale,subtitle:loc.attributes.subtitle,privacyPolicyUrl:loc.attributes.privacyPolicyUrl,ageQuestionnairePresent:true,ageAnswers:age.attributes};
});
await step('Country availability following The Scorecard reference',async()=>{
 const ref=(await api('apps?filter[bundleId]=io.github.willyros01.scorecard')).data[0];if(!ref)throw Error('Reference app unavailable');
 const reference=(await api('apps/'+ref.id+'/appAvailabilityV2')).data;
 const source=await list('v2/appAvailabilities/'+reference.id+'/territoryAvailabilities?include=territory&limit=200');
 const desired=source.filter(x=>x.attributes.available).map(x=>x.relationships.territory.data.id).sort();if(!desired.length)throw Error('Reference has no selected territories');
 let current;try{current=(await api('apps/'+appId+'/appAvailabilityV2')).data}catch(e){if(e.status!==404)throw e}
 if(!current){const included=desired.map((id,i)=>({type:'territoryAvailabilities',id:'${territory'+i+'}',attributes:{available:true,preOrderEnabled:false},relationships:{territory:{data:{type:'territories',id}}}}));current=(await api('v2/appAvailabilities','POST',{data:{type:'appAvailabilities',attributes:{availableInNewTerritories:reference.attributes.availableInNewTerritories},relationships:{app:{data:{type:'apps',id:appId}},territoryAvailabilities:{data:included.map(({type,id})=>({type,id}))}}},included})).data}
 const before=await list('v2/appAvailabilities/'+current.id+'/territoryAvailabilities?include=territory&limit=200');
 for(const row of before){const wanted=desired.includes(row.relationships.territory.data.id);if(row.attributes.available!==wanted||row.attributes.preOrderEnabled)await api('territoryAvailabilities/'+row.id,'PATCH',{data:{type:'territoryAvailabilities',id:row.id,attributes:{available:wanted,preOrderEnabled:false,releaseDate:null}}})}
 const after=await list('v2/appAvailabilities/'+current.id+'/territoryAvailabilities?include=territory&limit=200'),selected=after.filter(x=>x.attributes.available).map(x=>x.relationships.territory.data.id).sort();
 if(JSON.stringify(selected)!==JSON.stringify(desired))throw Error('Territory selection differs from reference');
 return {referenceAppId:ref.id,selectedCount:selected.length,territories:selected,availableInNewTerritories:current.attributes.availableInNewTerritories,restrictions:after.filter(x=>x.attributes.available&&!['AVAILABLE','AVAILABLE_FOR_SALE_UNRELEASED_APP','PROCESSING_TO_AVAILABLE'].includes(x.attributes.contentStatuses?.[0])).map(x=>({territory:x.relationships.territory.data.id,status:x.attributes.contentStatuses})).filter(x=>x.status?.length)};
});
await step('Accessibility declarations audit',async()=>{
 const rows=await list('apps/'+appId+'/accessibilityDeclarations?limit=200');
 // Keep unverified App Store labels unset. Editor font controls alone do not
 // prove Apple's 200%-throughout-the-interface Larger Text requirement.
 return {existing:rows.map(x=>({id:x.id,...x.attributes})),decision:'No new nutrition-label claims without complete common-task evidence on each device family. Large document text and dark mode remain accurately described in the listing.'};
});
manual.push('Physical-device owner acceptance on iPhone, iPad and Mac.','Publish the App Privacy questionnaire in App Store Connect; code/dependency audit proposes Data Not Collected.','Confirm account agreements, tax and DSA trader declarations in App Store Connect.','Final Apple submission validation occurs when submission is authorized; no review submission object was created.');
const result={preparedAt:new Date().toISOString(),appId,version:L.versionString,build:L.buildNumber,releaseType:L.releaseType,submitted:false,done,pending,manual};
fs.mkdirSync('store/final-evidence',{recursive:true});fs.writeFileSync('store/final-evidence/readiness.json',JSON.stringify(result,null,2)+'\n');
console.log('Preparation finished: '+done.length+' verified, '+pending.length+' unresolved. No app submitted.');if(pending.length)process.exitCode=1;
