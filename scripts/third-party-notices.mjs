import {readFile,readdir,writeFile} from 'node:fs/promises';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
let result='ATE third-party notices\n\nATE remains proprietary. The following notices apply only to bundled third-party components.\nClang and platform SDKs are installed separately by the user and are not included in ATE.\n';
for(const [path,entry] of Object.entries(lock.packages)){
 if(!path||entry.dev)continue;
 const pkg=JSON.parse(await readFile(path+'/package.json','utf8'));
 const names=(await readdir(path)).filter(n=>/^(licen[cs]e|copying|notice)(\.|$)/i.test(n));
 if(!names.length)throw Error('Missing license text for '+pkg.name);
 result+=`\n\n===== ${pkg.name} ${pkg.version} (${typeof pkg.license==='string'?pkg.license:'see below'}) =====\n`;
 for(const name of names)result+=await readFile(path+'/'+name,'utf8')+'\n';
}
await writeFile('THIRD-PARTY-NOTICES.txt',result.replace(/\r\n/g,'\n').trimEnd()+'\n');
