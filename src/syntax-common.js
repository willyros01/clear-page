export const MAX_CHECK_LENGTH=512*1024;
export const checkableLanguages=new Set(['javascript','typescript','json','html','css','yaml','c']);
const limit=100;
export function diagnostic(text,from,to,message,severity='error') {
 from=Math.max(0,Math.min(text.length,from||0));
 to=Math.max(from,Math.min(text.length,to??from+1));
 const prefix=text.slice(0,from),line=prefix.split('\n').length,column=from-(prefix.lastIndexOf('\n')+1)+1;
 return {from,to,line,column,message,severity};
}
// Clang reports UTF-8 byte columns; CodeMirror uses UTF-16 offsets.
export function clangDiagnostics(text,output) {
 const diagnostics=[],external=[];
 for(const line of output.split(/\r?\n/)) {
  const match=line.match(/^(.*):(\d+):(\d+): (fatal error|error|warning|note): (.*)$/);
  if(!match)continue;
  const [,file,row,col,severity,message]=match;
  if(!['<stdin>','-'].includes(file)){external.push(`${file}:${row}:${col}: ${severity}: ${message}`);continue;}
  if(severity==='note')continue;
  const lines=text.split('\n'),lineIndex=Math.min(lines.length-1,Math.max(0,Number(row)-1));
  let from=lines.slice(0,lineIndex).reduce((n,s)=>n+s.length+1,0),bytes=0;
  for(const char of lines[lineIndex]){const length=new TextEncoder().encode(char).length;if(bytes+length>Number(col)-1)break;bytes+=length;from+=char.length;}
  diagnostics.push(diagnostic(text,from,from+1,message,severity==='warning'?'warning':'error'));
 }
 return {diagnostics:diagnostics.slice(0,limit),external:external.slice(0,20)};
}
