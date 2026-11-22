// Java 21 syntax checker, built as its own file (dist/java-check.js) and loaded on demand
// by the syntax worker the first time a Java document is checked. Nothing is executed.
import {parse as parseJava} from 'java-parser';
import {diagnostic} from './syntax-common.js';
function offset(text,line,column){const lines=text.split('\n');let n=0;for(let i=0;i<Math.min(line-1,lines.length-1);i++)n+=lines[i].length+1;return n+Math.max(0,column-1);}
export function javaDiagnostics(text){
 try{parseJava(text);return [];}catch(e){
  const m=String(e.message).match(/line: (\d+), column: (\d+)[\s\S]*?Expecting[\s\S]*?--> (.*?) <-- but found --> (.*?) <--/);
  if(!m){const p=String(e.message).match(/line: (\d+), column: (\d+)/);return [diagnostic(text,p?offset(text,+p[1],+p[2]):0,undefined,'Java syntax error')];}
  const found=(m[4]==="''"||m[4]===''?'end of file':m[4]).replace(/^'|'$/g,''),want=m[3].replace(/^'|'$/g,'');
  let at=offset(text,+m[1],+m[2]);
  // A missing ; or ) belongs at the end of the previous code, not on the next line's first token.
  if([';',')',']'].includes(want)){let i=at-1;while(i>0&&/\s/.test(text[i]))i--;return [diagnostic(text,i+1,i+2,`Missing ${want} here (found ${found} next)`)];}
  return [diagnostic(text,at,undefined,`Expected ${want} but found ${found}`)];
 }
}
globalThis.ateJavaDiagnostics=javaDiagnostics;
