// Older Android/Fire WebViews need these worker-local standard APIs.
import 'core-js/actual/object/has-own.js';
import 'core-js/actual/string/replace-all.js';
import {checkSyntax} from './syntax.js';
import {createPythonChecker} from './python-syntax.js';
import {createCChecker} from './c-syntax.js';
const trace=__ATE_WORKER_VERIFICATION__?(...args)=>console.info('ATE_VERIFY_WORKER',...args):()=>{};
if(__ATE_WORKER_VERIFICATION__)self.addEventListener('unhandledrejection',event=>trace('unhandled rejection',event.reason?.stack||String(event.reason)));
const loadAsset=async name=>{
 trace('asset start',name);
 const response=await fetch(new URL(name,self.location.href));
 if(!response.ok)throw Error('Bundled C checker could not load');
 const bytes=new Uint8Array(await response.arrayBuffer());trace('asset loaded',name,bytes.length);return bytes;
};
const checkC=createCChecker(loadAsset,trace),checkPython=createPythonChecker(loadAsset);
self.onmessage=async({data})=>{
 trace('request',data.id,data.request.language);
 try{self.postMessage({id:data.id,result:data.request.language==='c'?await checkC(data.request):data.request.language==='python'?await checkPython(data.request):checkSyntax(data.request)})}
 catch(error){console.error('Bundled checker failed:',error?.name,error?.message);self.postMessage({id:data.id,result:{status:'unavailable',diagnostics:[],message:'The checker could not process this document. Editing and saving still work.'}})}
};
