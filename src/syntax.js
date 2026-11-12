import {parse as parseJS} from '@babel/parser';
import {parse as parseJSON, printParseErrorCode} from 'jsonc-parser';
import {parseAllDocuments} from 'yaml';
import {parse as parseCSS,tokenize,tokenTypes as T} from 'css-tree';
import {parse as parseHTML} from 'parse5';

import {MAX_CHECK_LENGTH,checkableLanguages,diagnostic} from './syntax-common.js';
const limit=100;
function javascript(text,typescript=false,jsx=false) {
 const convert=e=>diagnostic(text,e.pos,e.pos+1,e.message.replace(/ \(\d+:\d+\)$/,''));
 try {
  const ast=parseJS(text,{sourceType:'unambiguous',errorRecovery:true,plugins:[...(typescript?['typescript']:[]),...(jsx?['jsx']:[])]});
  return ast.errors.map(convert);
 } catch(e) { if(typeof e.pos!=='number')throw e; return [convert(e)]; }
}
function css(text) {
 const errors=[],stack=[];
 const pairs=new Map([[T.LeftCurlyBracket,[T.RightCurlyBracket,'}']],[T.LeftSquareBracket,[T.RightSquareBracket,']']],[T.LeftParenthesis,[T.RightParenthesis,')']],[T.Function,[T.RightParenthesis,')']]]);
 tokenize(text,(type,start,end)=>{
  if(pairs.has(type))stack.push({type,start});
  else if([T.RightCurlyBracket,T.RightSquareBracket,T.RightParenthesis].includes(type)){
   if(stack.length&&pairs.get(stack[stack.length-1].type)[0]===type)stack.pop();
   else errors.push(diagnostic(text,start,end,'Unexpected closing '+text.slice(start,end)));
  } else if(type===T.BadString||type===T.BadUrl)errors.push(diagnostic(text,start,end,'Malformed CSS string or URL'));
  else if(type===T.Comment&&!text.slice(start,end).endsWith('*/'))errors.push(diagnostic(text,start,end,'Unclosed CSS comment'));
 });
 for(const {type,start} of stack)errors.push(diagnostic(text,start,start+1,'Missing closing '+pairs.get(type)[1]));
 try {parseCSS(text,{positions:true,onParseError:e=>errors.push(diagnostic(text,e.offset,e.offset+1,e.message))});}
 catch(e) {if(typeof e.offset!=='number')throw e;errors.push(diagnostic(text,e.offset,e.offset+1,e.message));}
 return errors;
}
export function checkSyntax({text,language,name=''}) {
 if(text.length>MAX_CHECK_LENGTH)return {diagnostics:[],status:'skipped',message:'Syntax checking is limited to 512K characters. Editing and saving still work.'};
 if(!checkableLanguages.has(language)||language==='c')return {diagnostics:[],status:'unavailable',message:language==='c'?'C syntax checking needs a local desktop Clang compiler.':'No syntax checker is available for this language.'};
 let diagnostics=[],message='';
 if(language==='javascript'||language==='typescript') {
  diagnostics=javascript(text,language==='typescript',/\.[jt]sx$/i.test(name));
  if(language==='typescript')message='Syntax only; TypeScript type checking is not included.';
 } else if(language==='json') {
  const errors=[];parseJSON(text,errors,{allowTrailingComma:false,disallowComments:true,allowEmptyContent:false});
  diagnostics=errors.map(e=>diagnostic(text,e.offset,e.offset+e.length,printParseErrorCode(e.error).replace(/([a-z])([A-Z])/g,'$1 $2')));
 } else if(language==='yaml') {
  diagnostics=parseAllDocuments(text,{prettyErrors:false}).flatMap(doc=>[
   ...doc.errors.map(e=>diagnostic(text,e.pos[0],e.pos[1],e.message)),
   ...doc.warnings.map(e=>diagnostic(text,e.pos[0],e.pos[1],e.message,'warning'))]);
 } else if(language==='css') {
  diagnostics=css(text);message='CSS parser checks only; property names and browser support are not validated.';
 } else if(language==='html') {
  const root=parseHTML(text,{sourceCodeLocationInfo:true,onParseError:e=>{
   // Fragments are useful editor documents; a missing doctype is not an error here.
   if(e.code!=='missing-doctype')diagnostics.push(diagnostic(text,e.startOffset,e.endOffset,e.code.replaceAll('-',' ')));
  }});
  const visit=node=>{
   if(node.tagName==='script'||node.tagName==='style') {
    const body=node.childNodes?.find(n=>n.nodeName==='#text');
    const type=node.attrs?.find(a=>a.name==='type')?.value?.toLowerCase()||'';
    const supported=node.tagName==='style'?(!type||type==='text/css'):(!type||['module','text/javascript','application/javascript','application/json','importmap','speculationrules'].includes(type));
    if(body?.sourceCodeLocation&&supported){
     const source=text.slice(body.sourceCodeLocation.startOffset,body.sourceCodeLocation.endOffset);
     const embedded=node.tagName==='style'?css(source):['application/json','importmap','speculationrules'].includes(type)?checkSyntax({text:source,language:'json'}).diagnostics:javascript(source);
     const offset=body.sourceCodeLocation.startOffset;
     diagnostics.push(...embedded.map(d=>diagnostic(text,offset+d.from,offset+d.to,`${node.tagName}: ${d.message}`,d.severity)));
    }
   }
   for(const child of node.childNodes||[])visit(child);
   if(node.content)visit(node.content);
  };visit(root);
  message='HTML parser checks, plus inline JavaScript/JSON and CSS. HTML permits some omitted tags; external files and inline attributes are not checked.';
 }
 diagnostics.sort((a,b)=>a.from-b.from);
 const total=diagnostics.length;
 return {status:'checked',diagnostics:diagnostics.slice(0,limit),message:[message,total>limit?'Showing the first 100 issues.':''].filter(Boolean).join(' ')};
}
