// Older Android WebViews can stall when a Wasm worker is repeatedly destroyed.
// Keep two isolated engines alive: Ruff/Python and the ordinary/C worker.
// Only the latest queued request is retained; stale results never reach the UI.
export function createAndroidCheckRunner({workerFactory,timeoutMs=8000}){
 const slots=[{worker:null,current:null,queued:null,timer:null},{worker:null,current:null,queued:null,timer:null}];
 let sequence=0,pending=null;
 const cancel=()=>{
  sequence++;pending?.resolve({status:'cancelled',diagnostics:[]});pending=null;
  for(const slot of slots)slot.queued=null;
 };
 function finish(slot,result,failed=false){
  clearTimeout(slot.timer);const current=slot.current;slot.current=null;
  if(failed){slot.worker?.terminate();slot.worker=null;}
  if(current&&pending?.id===current.id){const {resolve}=pending;pending=null;resolve(result);}
  start(slot);
 }
 function ensure(slot){
  if(slot.worker)return;
  slot.worker=workerFactory();
  slot.worker.onmessage=({data})=>{if(slot.current?.id===data.id)finish(slot,data.result);};
  slot.worker.onerror=event=>{event.preventDefault?.();finish(slot,{status:'unavailable',diagnostics:[],message:'Syntax checker could not start. Editing and saving still work.'},true);};
 }
 function start(slot){
  if(slot.current||!slot.queued)return;
  const task=slot.queued;slot.queued=null;if(task.id!==sequence)return;
  slot.current=task;
  try{
   ensure(slot);
   slot.timer=setTimeout(()=>finish(slot,{status:'skipped',diagnostics:[],message:'Syntax checking timed out. Simplify the document or check again.'},true),timeoutMs);
   slot.worker.postMessage(task);
  }catch{finish(slot,{status:'unavailable',diagnostics:[],message:'Syntax checker is unavailable on this device.'},true);}
 }
 function run(request){
  cancel();const id=sequence;
  return new Promise(resolve=>{
   pending={id,resolve};
   try{
    // Start both before loading either Wasm engine, rather than creating a
    // worker immediately after destroying an initialized Wasm worker.
    for(const slot of slots)ensure(slot);
    const slot=slots[request.language==='python'?0:1];slot.queued={id,request};start(slot);
   }catch{pending=null;resolve({status:'unavailable',diagnostics:[],message:'Syntax checker is unavailable on this device.'});}
  });
 }
 // Clear per-document requests. Completed parser engines contain no retained
 // document objects; individual Rust parsers/workspaces are explicitly freed.
 // Android's Close also exits the activity. Avoid forced mid-Wasm teardown.
 return {run,cancel,dispose:cancel};
}
