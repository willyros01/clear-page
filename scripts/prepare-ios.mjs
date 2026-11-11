import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
if(!existsSync('ios/App/App.xcodeproj'))execFileSync('npx',['--no-install','cap','add','ios'],{stdio:'inherit'});
execFileSync('npx',['--no-install','cap','sync','ios'],{stdio:'inherit'});
const code=`import plistlib
p='ios/App/App/Info.plist'
with open(p,'rb') as f: d=plistlib.load(f)
d['CFBundleDisplayName']='ATE'
d['ITSAppUsesNonExemptEncryption']=False
with open(p,'wb') as f: plistlib.dump(d,f)
`;
execFileSync('python3',['-c',code],{stdio:'inherit'});

