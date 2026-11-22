// Offline syntax checks added in 0.8.8: Java (syntax only), XML, TOML, INI. Nothing is executed.
import {parse as parseToml} from 'smol-toml';
import {DOMParser} from '@xmldom/xmldom';
import {diagnostic} from './syntax-common.js';
function offset(text,line,column){const lines=text.split('\n');let n=0;for(let i=0;i<Math.min(line-1,lines.length-1);i++)n+=lines[i].length+1;return n+Math.max(0,column-1);}
// The Java grammar is large, so it is loaded only when a Java file is first checked.
export function javaDiagnostics(text){
 let check=globalThis.ateJavaDiagnostics;
 if(!check&&typeof importScripts==='function'){importScripts('java-check.js');check=globalThis.ateJavaDiagnostics;}
 if(typeof check!=='function')throw Error('Java checker unavailable');
 return check(text);
}
export function xmlDiagnostics(text){
 // Well-formedness only; schemas (XSD/DTD) are not validated. Nothing is fetched.
 const out=[],seen=new Set();
 const add=(level,msg,ctx)=>{
  const loc=ctx?.locator||{},m=String(msg).split('\n')[0].replace(/^\[xmldom \w+\]\s*/,'').replace(/[.!]$/,''),k=(loc.lineNumber||1)+':'+(loc.columnNumber||1)+m;
  if(seen.has(k)||out.length>=100)return;seen.add(k);
  out.push(diagnostic(text,offset(text,loc.lineNumber||1,loc.columnNumber||1),undefined,m.charAt(0).toUpperCase()+m.slice(1),level==='warning'?'warning':'error'));
 };
 try{new DOMParser({onError:add}).parseFromString(text,'text/xml');}catch{}
 return out;
}
export function tomlDiagnostics(text){
 try{parseToml(text);return [];}catch(e){
  const msg=String(e.message).split('\n')[0].replace(/^Invalid TOML document: /,'');
  return [diagnostic(text,offset(text,e.line||1,e.column||1),undefined,msg.charAt(0).toUpperCase()+msg.slice(1))];
 }
}
export function iniDiagnostics(text){
 const out=[],sections=new Map();let at=0,section='',keys=new Map();
 text.split('\n').forEach((raw,i)=>{
  const line=raw.replace(/\r$/,''),t=line.trim(),start=at+line.indexOf(t);at+=raw.length+1;
  if(!t||/^[;#]/.test(t))return;
  if(t.startsWith('[')){
   if(!/^\[[^\[\]]+\]\s*(?:[;#].*)?$/.test(t)){out.push(diagnostic(text,start,start+t.length,'Section header must look like [name]'));return;}
   section=t.slice(1,t.indexOf(']')).trim();
   if(sections.has(section))out.push(diagnostic(text,start,start+t.length,`Duplicate section [${section}] (first on line ${sections.get(section)})`,'warning'));
   else sections.set(section,i+1);
   keys=new Map();return;
  }
  const m=t.match(/^([^=:]+?)\s*[=:]/);
  if(!m){out.push(diagnostic(text,start,start+t.length,'Expected key = value'));return;}
  const key=m[1].trim().toLowerCase();
  if(keys.has(key))out.push(diagnostic(text,start,start+m[1].length,`Duplicate key ${m[1].trim()}${section?` in [${section}]`:''} (first on line ${keys.get(key)})`,'warning'));
  else keys.set(key,i+1);
 });
 return out;
}
