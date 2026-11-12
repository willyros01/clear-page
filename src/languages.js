export const languageLabels = {plain:'Plain text',javascript:'JavaScript',typescript:'TypeScript',json:'JSON',html:'HTML',css:'CSS',yaml:'YAML',c:'C',python:'Python',sql:'SQL',markdown:'Markdown'};
export function languageForName(name='') {
 return ({js:'javascript',mjs:'javascript',cjs:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',mts:'typescript',cts:'typescript',json:'json',html:'html',htm:'html',css:'css',yaml:'yaml',yml:'yaml',c:'c',h:'c',py:'python',sql:'sql',md:'markdown',markdown:'markdown'})[name.trim().split('.').pop().toLowerCase()] || 'plain';
}

// Bounded, local detection only: never execute text or change the document name.
export function languageForDocument(name='',text='') {
 const named=languageForName(name);
 if(named!=='plain')return named;
 // Recognize source files wrapped in .txt without stripping it from the filename.
 const sourceName=name.trim().replace(/\.txt$/i,'');
 const wrapped=sourceName!==name.trim()?languageForName(sourceName):'plain';
 if(wrapped!=='plain')return wrapped;
 const sample=text.slice(0,32768).replace(/^\uFEFF/,'').trim();
 const trimmed=sample.trim();
 // Require a JSON object/array, rather than classifying ordinary numbers or prose.
 if(/^(?:\{|\[)/.test(trimmed))try{JSON.parse(trimmed);return 'json'}catch{}
 // Ignore comments when looking for code signatures; preserve quoted strings.
 const code=sample.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,match=>/^\//.test(match)?' ':match);
 const cCode=code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,' ');
 const typedFunction=/^\s*(?:(?:static|extern|inline|const|unsigned|signed)\s+)*(?:void|int|char|float|double|short|long|size_t)\b[\w\s*]*\b\w+\s*\([^;{}]*\)\s*\{/m.test(cCode);
 const include=/^\s*#\s*include\s*[<"]/m.test(code);
 const main=/\b(?:int|void)\s+main\s*\([^;{}]*\)\s*\{/m.test(cCode);
 if(main||(typedFunction&&(include||/\breturn\b[^;{}]*;/.test(code))))return 'c';
 if(/^#![^\n]*\bpython[\d.]*(?:\s|$)/.test(sample)||/^\s*(?:async\s+)?def\s+\w+\([^\n]*\)\s*(?:->[^:\n]+)?\s*:/m.test(code))return 'python';
 if(/^\s*(?:<!doctype\s+html\b|<(?:html|head|body)\b)/i.test(sample)||/<([a-z][\w-]*)\b[^>]*>[\s\S]*?<\/\1\s*>/i.test(sample))return 'html';
 if(/^\s*(?:export\s+)?(?:interface\s+\w+(?:\s+extends[^{}]+)?\s*\{|type\s+\w+(?:<[^>]+>)?\s*=)/m.test(code)||/^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*:\s*(?:string|number|boolean|\w+\[\])\s*=/m.test(code))return 'typescript';
 if(/^\s*(?:SELECT\b[\s\S]+?\bFROM\s+[\w"`[]|INSERT\s+INTO\b|CREATE\s+TABLE\b|UPDATE\s+\w+\s+SET\b|DELETE\s+FROM\b|ALTER\s+TABLE\b)/im.test(code))return 'sql';
 if(/(?:^|[}\n])\s*[^{}\n]+\{\s*(?:--[\w-]+|color|background(?:-color)?|font(?:-size|-family|-weight)?|display|margin(?:-\w+)?|padding(?:-\w+)?|width|height|border(?:-\w+)?|position)\s*:[^{}]+[;}]/m.test(code)||/^\s*@(?:media|supports|keyframes|import|charset)\b/m.test(code))return 'css';
 if(/^#![^\n]*\bnode(?:\s|$)/.test(sample)||/^\s*(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*\{/m.test(code)||/^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*[^\n]*(?:=>|;\s*$)/m.test(code)||/^\s*import\s+.+\s+from\s+['"]/m.test(code))return 'javascript';
 const yamlPairs=code.match(/^ *(?:[\w.-]+|["'][^\n]+["']) *: *(?:[^\n]*)$/gm)||[];
 if(yamlPairs.length>=2||/^---\s*\n(?=[\s\S]*^\w[\w.-]* *:)/m.test(code))return 'yaml';
 const headings=/^ {0,3}#{1,6} +\S/m.test(sample);
 const fences=/^ {0,3}(?:```|~~~)[\w-]*\s*\n[\s\S]*?^ {0,3}(?:```|~~~)\s*$/m.test(sample);
 const markup=/\[[^\]\n]+\]\([^)\n]+\)|\*\*[^*\n]+\*\*/.test(sample);
 const list=/^ {0,3}(?:[-*+] |\d+\. )\S/m.test(sample);
 if(fences||(headings&&(markup||list)))return 'markdown';
 return 'plain';
}
