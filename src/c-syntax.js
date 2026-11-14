import {Parser,Language} from 'web-tree-sitter';
import {diagnostic,MAX_CHECK_LENGTH} from './syntax-common.js';

// This grammar checks C structure only. It is not a compiler, preprocessor,
// header resolver or type checker. Both Wasm modules ship inside the app.
export function createCChecker(loadAsset,trace=()=>{},grammarAsset='tree-sitter-c.wasm',kind='C') {
 let ready;
 return async ({text})=>{
  if(text.length>MAX_CHECK_LENGTH)return {status:'skipped',diagnostics:[],message:'Checking is limited to 512K characters.'};
  ready??=Promise.all([loadAsset('web-tree-sitter.wasm'),loadAsset(grammarAsset)]).then(async([runtime,grammar])=>{
   // The bytes are already bundled/loaded. Avoid import.meta URL resolution in
   // the classic worker bundle, including Capacitor's custom app URL scheme.
   trace('C runtime initialize');
   await Parser.init({wasmBinary:runtime,locateFile:name=>name,onAbort:message=>trace('C abort',String(message)),monitorRunDependencies:count=>trace('C dependencies',count)});
   trace('C runtime initialized');
   const language=await Language.load(grammar);trace('C grammar loaded');return language;
  });
  const language=await ready,parser=new Parser();
  let tree;
  try {
   parser.setLanguage(language);
   tree=parser.parse(text);
   if(!tree)throw Error('C parser did not finish');
   const diagnostics=[],stack=[tree.rootNode];
   while(stack.length&&diagnostics.length<100){
    const node=stack.pop();
    if(node.isMissing||node.isError){
     diagnostics.push(diagnostic(text,node.startIndex,Math.min(node.startIndex+Math.max(1,node.endIndex-node.startIndex),node.startIndex+80),node.isMissing?`Missing ${JSON.stringify(node.type)}`:'Unexpected '+kind+' syntax'));
     // An ERROR may contain a useful missing token, but report its range once.
     if(node.isError)continue;
    }
    if(node.hasError)for(let i=node.childCount-1;i>=0;i--)stack.push(node.child(i));
   }
   return {status:'checked',diagnostics,message:kind==='Shell'?'Basic POSIX/Bash structure check only. Commands, expansions, dialect portability and runtime behavior are not validated; scripts are never executed.':'Basic C syntax check only. Headers, macros, types and C-standard conformance are not checked. No compiler is needed, and the program is not built or run.'};
  } finally {tree?.delete();parser.delete()}
 };
}
