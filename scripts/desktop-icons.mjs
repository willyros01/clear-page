import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const png=Buffer.from(readFileSync('resources/stickman-icon.png.base64','utf8').replace(/\s/g,''),'base64');
if(png.readUInt32BE(16)!==1024||png.readUInt32BE(20)!==1024)throw Error('Expected approved 1024px ATE icon');
writeFileSync('resources/desktop-icon.png',png);
execFileSync(process.platform==='win32'?'npx.cmd':'npx',['--no-install','tauri','icon','resources/desktop-icon.png','--output','src-tauri/icons'],{stdio:'inherit',shell:process.platform==='win32'});
