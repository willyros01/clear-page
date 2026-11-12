// Each new request terminates the previous parser worker. C invocations are
// serialized by the native adapter; the UI also ignores obsolete results.
export function createCheckRunner({workerFactory,nativeCheck}) {
 let worker=null,pending=null,sequence=0,timer=null,nativeQueue=Promise.resolve();
 const cancel=()=>{sequence++;clearTimeout(timer);worker?.terminate();worker=null;pending?.({status:'cancelled',diagnostics:[]});pending=null};
 async function run(request) {
  cancel();const id=sequence;
  if(request.language==='c'&&nativeCheck) {
   const task=nativeQueue.then(()=>id===sequence?nativeCheck(request):{status:'cancelled',diagnostics:[]});
   nativeQueue=task.catch(()=>{});return task;
  }
  return new Promise(resolve=>{
   pending=resolve;
   const finish=result=>{if(id!==sequence)return;clearTimeout(timer);worker?.terminate();worker=null;pending=null;resolve(result)};
   try{
    worker=workerFactory();
    worker.onmessage=({data})=>{if(data.id===id)finish(data.result)};
    worker.onerror=event=>{event.preventDefault?.();finish({status:'unavailable',diagnostics:[],message:'Syntax checker could not start. Editing and saving still work.'})};
    timer=setTimeout(()=>finish({status:'skipped',diagnostics:[],message:'Syntax checking timed out. Simplify the document or check again.'}),8000);
    worker.postMessage({id,request});
   }catch{finish({status:'unavailable',diagnostics:[],message:'Syntax checker is unavailable on this device.'})}
  });
 }
 return {run,cancel};
}
