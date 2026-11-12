import SQLite from 'node-sql-parser/build/sqlite.js';
import {parser as markdownParser} from '@lezer/markdown';
import {diagnostic} from './syntax-common.js';

const sqlParser=new SQLite.Parser();
export function sqlDiagnostics(text){
 try{sqlParser.astify(text,{database:'sqlite'});return []}
 catch(error){
  if(!error.location)throw error;
  const start=error.location.start.offset,end=error.location.end.offset;
  // PEG's full expected-token lists can overwhelm a small screen.
  const found=error.found===null?'end of file':JSON.stringify(error.found);
  return [diagnostic(text,start,Math.max(start+1,end),'Unexpected '+found+' in SQLite SQL')];
 }
}

export function markdownDiagnostics(text){
 const issues=[],headings=new Set();
 markdownParser.parse(text).iterate({enter(node){
  if(/^(?:ATX|Setext)Heading\d$/.test(node.name)){
   const title=text.slice(node.from,node.to).replace(/^#{1,6}\s+|\s+#+\s*$|\n[=-]+\s*$/g,'').trim().toLowerCase();
   if(headings.has(title))issues.push(diagnostic(text,node.from,node.to,'Duplicate heading','warning'));
   headings.add(title);
  }
  if(node.name==='FencedCode'){
   const markers=[];const cursor=node.node.cursor();
   if(cursor.firstChild())do{if(cursor.name==='CodeMark')markers.push([cursor.from,cursor.to])}while(cursor.nextSibling());
   if(markers.length<2)issues.push(diagnostic(text,node.from,Math.min(node.from+3,text.length),'Unclosed fenced code block','warning'));
  }
 }});
 let offset=0;for(const line of text.split('\n')){
  const clean=line.replace(/\r$/,'');const trailing=/[ \t]+$/.exec(clean);
  // Two spaces are an intentional Markdown hard line break.
  if(trailing&&trailing[0]!=='  ')issues.push(diagnostic(text,offset+trailing.index,offset+clean.length,'Trailing whitespace (two spaces for a hard line break are allowed)','warning'));
  offset+=line.length+1;
 }
 return issues;
}
