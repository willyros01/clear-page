import {checkSyntax} from './syntax.js';
import {createCChecker} from './c-syntax.js';
const checkC=createCChecker(async name=>{
 const response=await fetch(new URL(name,self.location.href));
 if(!response.ok)throw Error('Bundled C checker could not load');
 return new Uint8Array(await response.arrayBuffer());
});
self.onmessage=async({data})=>{
 try{self.postMessage({id:data.id,result:data.request.language==='c'?await checkC(data.request):checkSyntax(data.request)})}
 catch{self.postMessage({id:data.id,result:{status:'unavailable',diagnostics:[],message:'The checker could not process this document. Editing and saving still work.'}})}
};
