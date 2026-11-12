import init,{Workspace,PositionEncoding} from '@astral-sh/ruff-wasm-web';
import {diagnostic,MAX_CHECK_LENGTH} from './syntax-common.js';

// Ruff's Python parser runs inside the bundled worker. Never execute source.
export function createPythonChecker(loadAsset){
 let ready;
 return async({text})=>{
  if(text.length>MAX_CHECK_LENGTH)return {status:'skipped',diagnostics:[],message:'Checking is limited to 512K characters.'};
  ready??=loadAsset('ruff_wasm_bg.wasm').then(bytes=>init({module_or_path:bytes}));
  await ready;
  const workspace=new Workspace({'target-version':'py314',lint:{select:[]}},PositionEncoding.Utf16);
  try{
   const starts=[0];for(let i=0;i<text.length;i++)if(text[i]==='\n')starts.push(i+1);
   const offset=position=>Math.min(text.length,(starts[position.row-1]??text.length)+Math.max(0,position.column-1));
   const all=workspace.check(text);
   return {status:'checked',diagnostics:all.slice(0,100).map(d=>diagnostic(text,offset(d.start_location),Math.max(offset(d.start_location)+1,offset(d.end_location)),d.message)),message:'Offline Python 3.14 syntax parser. Code is not run; imports, names, types and runtime behavior are not checked.'+(all.length>100?' Showing the first 100 issues.':'')};
  }finally{workspace.free()}
 };
}
