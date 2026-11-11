import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
if(!existsSync('android/app/build.gradle'))execFileSync('npx',['--no-install','cap','add','android'],{stdio:'inherit'});
execFileSync('npx',['--no-install','cap','sync','android'],{stdio:'inherit'});
const version=JSON.parse(readFileSync('package.json')).version;
const build=Number(process.env.GITHUB_RUN_NUMBER||1);
if(!Number.isSafeInteger(build)||build<1)throw Error('Invalid Android build number');
const gradle='android/app/build.gradle';let text=readFileSync(gradle,'utf8');
text=text.replace(/versionCode\s+\d+/,`versionCode ${build}`).replace(/versionName\s+"[^"]*"/,`versionName "${version}"`);writeFileSync(gradle,text);
const res='android/app/src/main/res';
writeFileSync(process.env.RUNNER_TEMP+'/ate-icon.png',Buffer.from(readFileSync('resources/stickman-icon.png.base64','utf8').replace(/\s/g,''),'base64'));
for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
 const folder=`${res}/mipmap-${density}`;mkdirSync(folder,{recursive:true});
 for(const name of ['ic_launcher','ic_launcher_round'])execFileSync('convert',[process.env.RUNNER_TEMP+'/ate-icon.png','-resize',`${size}x${size}`,`${folder}/${name}.png`]);
 execFileSync('convert',[process.env.RUNNER_TEMP+'/ate-icon.png','-resize',`${Math.round(size*2.25)}x${Math.round(size*2.25)}`,`${folder}/ic_launcher_foreground.png`]);
}
// Use the approved opaque artwork on all launcher variants, including adaptive icons.
for(const name of ['ic_launcher','ic_launcher_round'])writeFileSync(`${res}/mipmap-anydpi-v26/${name}.xml`,'<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@mipmap/ic_launcher_foreground"/></adaptive-icon>');
const colors=`${res}/values/ic_launcher_background.xml`;writeFileSync(colors,'<?xml version="1.0" encoding="utf-8"?><resources><color name="ic_launcher_background">#FAF8F0</color></resources>');
console.log(`Prepared ATE ${version} (${build}) and approved Android launcher icons`);
