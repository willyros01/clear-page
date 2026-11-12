import {checkSyntax} from './syntax.js';
self.onmessage=({data})=>{
 try{self.postMessage({id:data.id,result:checkSyntax(data.request)})}
 catch{self.postMessage({id:data.id,result:{status:'unavailable',diagnostics:[],message:'The checker could not process this document. Editing and saving still work.'}})}
};
