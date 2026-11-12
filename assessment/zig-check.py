"""Read-only compiler evaluation; never integrated into ATE or run on user documents."""
import argparse,hashlib,json,math,os,pathlib,platform,shutil,signal,subprocess,tarfile,time,urllib.request,zipfile
p=argparse.ArgumentParser();p.add_argument('--platform',required=True,choices=['aarch64-macos','x86_64-macos','x86_64-windows']);p.add_argument('--root',default='zig-evidence');a=p.parse_args();root=pathlib.Path(a.root).resolve();root.mkdir(exist_ok=True)
pins={
 'aarch64-macos':('tar.xz',54001240,'75f1bc7a1e9852f17ec9a0c1895f767c4ec56d46bc8a834920eece1d0359dd8d'),
 'x86_64-macos':('tar.xz',59496824,'9af07b20319fbd0c92ee46ad23e81d6a782b1aaea2cfb8dcbff35f1d2c7ddbb7'),
 'x86_64-windows':('zip',100343666,'b03f477a1943673e02aca0f570e8030dffd536ce1f45cbc4d3326ec31159562e')}
ext,size,sha=pins[a.platform];name='zig-'+a.platform+'-0.17.1';archive=root/(name+'.'+ext)
with urllib.request.urlopen('https://ziglang.org/download/0.17.1/'+archive.name,timeout=120) as response,archive.open('wb') as f:shutil.copyfileobj(response,f)
assert archive.stat().st_size==size and hashlib.file_digest(archive.open('rb'),'sha256').hexdigest()==sha,'Official archive integrity check failed'
if ext=='zip':
 with zipfile.ZipFile(archive) as z:z.extractall(root)
else:
 with tarfile.open(archive) as t:t.extractall(root,filter='data')
install=root/name;zig=install/('zig.exe' if os.name=='nt' else 'zig');zig.chmod(0o755)
def disk(path):
 files=[x for x in path.rglob('*') if x.is_file() and not x.is_symlink()] if path.exists() else []
 return {'regular_files':len(files),'logical_bytes':sum(x.stat().st_size for x in files),'rounded_4k_file_bytes':sum(math.ceil(x.stat().st_size/4096)*4096 for x in files),'allocated_bytes_native':sum(x.stat().st_blocks*512 for x in files) if os.name!='nt' else None}
env={**os.environ,'ZIG_GLOBAL_CACHE_DIR':str(root/'global-cache'),'ZIG_LOCAL_CACHE_DIR':str(root/'local-cache')}
def run(name,args,source='',expected=0,timeout=60):
 start=time.monotonic();out={'name':name,'args':list(map(str,args)),'expected_returncode':expected}
 try:
  child=subprocess.Popen(list(map(str,args)),cwd=root,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=(os.name!='nt'))
  try:stdout,stderr=child.communicate(source,timeout=timeout);out.update(returncode=child.returncode,stdout=stdout,stderr=stderr)
  except subprocess.TimeoutExpired:
   if os.name=='nt':subprocess.run(['taskkill','/F','/T','/PID',str(child.pid)],capture_output=True)
   else:os.killpg(child.pid,signal.SIGKILL)
   stdout,stderr=child.communicate();out.update(returncode='timeout',stdout=stdout,stderr=stderr)
 except Exception as error:out.update(returncode='launch-error',stderr=str(error),stdout='')
 out['seconds']=round(time.monotonic()-start,3);out['matched_expectation']=out['returncode']==expected if expected==0 else isinstance(out['returncode'],int) and out['returncode']!=0
 print('CASE '+json.dumps(out),flush=True);return out
result={'platform':a.platform,'host':platform.platform(),'architecture':platform.machine(),'version':'0.17.1','archive_bytes':size,'sha256':sha,'installed':disk(install),'cases':[]}
result['identity']=run('identity',[zig,'cc','--version'])
iswin=a.platform.endswith('windows');triple='x86_64-w64-windows-gnu' if iswin else ('arm64-apple-macos13' if a.platform.startswith('aarch64') else 'x86_64-apple-macos13');zigtarget='x86_64-windows-gnu' if iswin else a.platform.replace('-macos','-macos.13.0')
flags=['-x','c','-fsyntax-only','-Wall','-Wextra','-fno-color-diagnostics','-fno-caret-diagnostics','-ferror-limit=30','-fmessage-length=0','-fno-crash-diagnostics']
valid='#include <stdio.h>\n#include <stdlib.h>\n#include <stdint.h>\nint main(void) { puts("hello"); return 0; }\n'
result['cases'].append(run('ate-flags-through-zig-cc',[zig,'cc','-target',zigtarget,*flags,'-std=c17','-'],valid))
result['cache_after_driver']={'global':disk(root/'global-cache'),'local':disk(root/'local-cache')}
base=[zig,'clang','-target',triple,'-nostdinc','-resource-dir',install/'lib','-isystem',install/'lib/include','-isystem',install/'lib/libc/include'/('any-windows-any' if iswin else 'any-darwin-any'),*flags]
fixtures=[
 ('c99','c99-features','struct S { int x,y; }; int f(void){ struct S s=(struct S){.y=2,.x=1}; for(int i=0;i<2;i++)s.x+=i; return s.x; }\n',0),
 ('c11','c11-features','_Static_assert(sizeof(int)>=2,"int"); _Atomic(int) x; int f(void){ return _Generic(x,int:1,default:0); }\n',0),
 ('c17','c17-mode','_Static_assert(__STDC_VERSION__==201710L,"C17"); int f(void){ return 0; }\n',0),
 ('c23','c23-features','static_assert(__STDC_VERSION__==202311L); _BitInt(17) value=0b101; typeof(value) other; bool yes=true; void *p=nullptr;\n',0),
 ('c99','c99-library-headers',valid,0),('c11','c11-library-headers',valid,0),('c17','c17-library-headers',valid,0),('c23','c23-library-headers',valid,0),
 ('c17','missing-semicolon','int f(void){ return 1 }\n',1),
 ('c17','undeclared-name','int f(void){return no_such_value;}\n',1),
 ('c17','type-error','struct S {int x;}; int f(void){ struct S s={0}; return s+1; }\n',1),
 ('c17','broken-header','#include <header_that_does_not_exist.h>\n',1)]
(root/'include').mkdir(exist_ok=True);(root/'include/local.h').write_text('#define LOCAL_VALUE 7\n')
fixtures.append(('c17','project-headers-and-macros','#include "local.h"\n#ifndef ATE_PROBE\n#error Missing macro\n#endif\nint f(void){return LOCAL_VALUE+ATE_PROBE;}\n',0))
for standard,name,source,expected in fixtures:
 args=[*base,'-std='+standard]
 if name=='project-headers-and-macros':args+=['-iquote',root/'include','-I',root/'include','-DATE_PROBE=4']
 result['cases'].append(run(name,[*args,'-'],source,expected))
platformsrc='#include <windows.h>\nDWORD x;\n' if iswin else '#include <unistd.h>\npid_t x;\n'
result['cases'].append(run('bundled-platform-headers',[*base,'-std=c17','-'],platformsrc))
if not iswin:result['cases'].append(run('apple-framework-not-bundled',[*base,'-std=c17','-'],'#include <CoreFoundation/CoreFoundation.h>\n',1))
baseline=shutil.which('clang')
if baseline:
 result['system_clang_identity']=run('system-clang-identity',[baseline,'--version'])
 for standard,name,source,expected in fixtures[:4]+fixtures[8:11]:result['cases'].append(run('system-clang-'+name,[baseline,*flags,'-std='+standard,'-'],source,expected))
result['cache_after_all_checks']={'global':disk(root/'global-cache'),'local':disk(root/'local-cache')};result['syntax_frontend_cases_matched']=all(x['matched_expectation'] for x in result['cases'] if x['name']!='ate-flags-through-zig-cc' and not x['name'].startswith('system-clang-'))
(root/'report.json').write_text(json.dumps(result,indent=2)+'\n');print('SUMMARY '+json.dumps({k:v for k,v in result.items() if k not in ['cases','identity','system_clang_identity']}),flush=True)
