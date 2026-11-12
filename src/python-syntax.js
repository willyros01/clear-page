import init,{Workspace} from '@astral-sh/ruff-wasm-web';
import {diagnostic,MAX_CHECK_LENGTH} from './syntax-common.js';

// Ruff's Python parser runs inside the bundled worker. Never execute source.
export function createPythonChecker(loadAsset){
 let ready;
 return async({text})=>{
  if(text.length>MAX_CHECK_LENGTH)return {status:'skipped',diagnostics:[],message:'Checking is limited to 512K characters.'};
  ready??=loadAsset('ruff_wasm_bg.wasm').then(bytes=>init({module_or_path:bytes}));
  await ready;
  const workspace=new Workspace({'target-version':'py313',lint:{select:[]}});
  try{
   const starts=[0];for(let i=0;i<text.length;i++)if(text[i]==='\n')starts.push(i+1);
   const lines=text.split('\n');
   // This compatibility build reports Unicode scalar columns, not UTF-16 units.
   const offset=position=>Math.min(text.length,(starts[position.row-1]??text.length)+Array.from(lines[position.row-1]||'').slice(0,Math.max(0,position.column-1)).join('').length);
   const all=workspace.check(text);
   return {status:'checked',diagnostics:all.slice(0,100).map(d=>diagnostic(text,offset(d.location),Math.max(offset(d.location)+1,offset(d.end_location)),d.message)),message:'Offline Python 3.13 syntax parser. Code is not run; imports, names, types and runtime behavior are not checked.'+(all.length>100?' Showing the first 100 issues.':'')};
  }finally{workspace.free()}
 };
}
