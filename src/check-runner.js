// Each new request terminates the previous parser worker. C invocations are
// serialized by the native adapter; the UI also ignores obsolete results.
export function createCheckRunner({workerFactory,nativeCheck,keepIdleWorker=false}) {
 let worker=null,pending=null,sequence=0,timer=null,nativeQueue=Promise.resolve();
 const release=()=>{worker?.terminate();worker=null};
 const cancel=()=>{sequence++;clearTimeout(timer);if(pending||!keepIdleWorker)release();pending?.({status:'cancelled',diagnostics:[]});pending=null};
 const dispose=()=>{cancel();release()};
 async function run(request) {
  cancel();const id=sequence;
  if(request.language==='c'&&request.cChecker==='clang'&&nativeCheck) {
   const task=nativeQueue.then(()=>id===sequence?nativeCheck(request):{status:'cancelled',diagnostics:[]});
   nativeQueue=task.catch(()=>{});return task;
  }
  return new Promise(resolve=>{
   pending=resolve;
   const finish=(result,failed=false)=>{if(id!==sequence)return;clearTimeout(timer);if(failed||!keepIdleWorker)release();pending=null;resolve(result)};
   try{
    worker??=workerFactory();
    worker.onmessage=({data})=>{if(data.id===id)finish(data.result)};
    worker.onerror=event=>{event.preventDefault?.();finish({status:'unavailable',diagnostics:[],message:'Syntax checker could not start. Editing and saving still work.'},true)};
    timer=setTimeout(()=>finish({status:'skipped',diagnostics:[],message:'Syntax checking timed out. Simplify the document or check again.'},true),8000);
    worker.postMessage({id,request});
   }catch{finish({status:'unavailable',diagnostics:[],message:'Syntax checker is unavailable on this device.'},true)}
  });
 }
 return {run,cancel,dispose};
}
