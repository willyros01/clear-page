"""Export genuine native captures to Apple's accepted dimensions, without altering UI."""
from pathlib import Path
from PIL import Image
import json,re,hashlib
root=Path('store/native-assets');out=Path('store/screenshots');out.mkdir(parents=True,exist_ok=True)
sets=[];evidence=[]
def candidates(value):
 if isinstance(value,dict):
  direct=[v for v in value.values() if isinstance(v,str)]
  names=[v for v in direct if re.search(r'store-0[1-4]-(editor|projects|syntax|menu)',v)]
  if names:
   for v in direct:
    if v.lower().endswith('.png'):yield names[0],v
  for v in value.values():yield from candidates(v)
 elif isinstance(value,list):
  for v in value:yield from candidates(v)
for kind,display,allowed in [('iPhone','APP_IPHONE_61',{(1206,2622),(1179,2556)}),('iPad','APP_IPAD_PRO_3GEN_129',{(2064,2752),(2048,2732)})]:
 source=root/kind;found={}
 for manifest in source.rglob('*.json'):
  try:data=json.loads(manifest.read_text())
  except (ValueError,UnicodeError):continue
  for name,file in candidates(data):
   m=re.search(r'store-(0[1-4]-(?:editor|projects|syntax|menu))',name)
   matches=list(source.rglob(Path(file).name))
   if m and matches:found.setdefault(m.group(1),matches[0])
 # Some exporter versions retain the human-readable attachment name as filename.
 for p in source.rglob('*.png'):
  m=re.search(r'store-(0[1-4]-(?:editor|projects|syntax|menu))',p.name)
  if m:found.setdefault(m.group(1),p)
 if '01-editor' not in found or '02-projects' not in found:raise ValueError(kind+' native screenshot attachment names missing; inspect exporter manifest')
 files=[]
 for name,src in sorted(found.items()):
  im=Image.open(src).convert('RGB')
  if im.size not in allowed:raise ValueError(kind+' unsupported actual screenshot size '+str(im.size))
  target=out/kind.lower()/(name+'.png');target.parent.mkdir(parents=True,exist_ok=True);im.save(target);files.append(str(target))
  evidence.append({'file':str(target),'nativeSource':str(src),'dimensions':im.size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'preparation':'Native production-app screenshot; converted to RGB only. No UI changes.'})
 sets.append({'platform':'IOS','displayType':display,'files':files})
files=[]
for name in ['01-editor','02-syntax']:
 matches=list((root/'Mac').rglob(name+'.png'))
 if not matches:raise ValueError('Native Mac capture missing '+name)
 src=matches[0];im=Image.open(src).convert('RGB');size=im.size;im.thumbnail((1280,800),Image.Resampling.LANCZOS)
 canvas=Image.new('RGB',(1280,800),'#f8f7f3' if name=='01-editor' else '#19201e');canvas.paste(im,((1280-im.width)//2,(800-im.height)//2))
 target=out/'mac'/(name+'.png');target.parent.mkdir(parents=True,exist_ok=True);canvas.save(target);files.append(str(target));evidence.append({'file':str(target),'nativeSource':str(src),'originalDimensions':size,'dimensions':[1280,800],'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'preparation':'Native app-window capture centred on accepted 16:10 canvas, RGB; UI unchanged.'})
sets.append({'platform':'MAC_OS','displayType':'APP_DESKTOP','files':files})
Path('store/prepared-assets.json').write_text(json.dumps(sets,indent=2)+'\n');Path('store/screenshot-provenance.json').write_text(json.dumps(evidence,indent=2)+'\n')
print('Prepared actual native screenshots:',[(s['displayType'],len(s['files'])) for s in sets])
