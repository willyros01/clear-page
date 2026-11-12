import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkSyntax} from '../src/syntax.js';
import {createPythonChecker} from '../src/python-syntax.js';
const checkPython=createPythonChecker(async()=>new Uint8Array(readFileSync(new URL('../node_modules/@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm',import.meta.url))));
test('bundled Python parser accepts valid modern Python without executing code',async()=>{
 for(const text of ['def greet(name):\n    return f"Hello {name}"\n','match value:\n    case 1:\n        pass\n','import nonexistent_module\nraise Exception("must not execute")\n']){
  const result=await checkPython({text});assert.equal(result.status,'checked');assert.deepEqual(result.diagnostics,[]);
 }
});
test('Python diagnoses missing colon, indentation, unclosed strings and expressions with UTF-16 positions',async()=>{
 for(const text of ['def greet(name)\n    return name','def f():\nreturn 1','if True:\n  x=1\n y=2','text = "unclosed','value = (1 +','text="👋é"; value =\n']){
  const result=await checkPython({text});assert.ok(result.diagnostics.length,text);
  for(const d of result.diagnostics)assert.ok(d.from>=0&&d.to>=d.from&&d.to<=text.length);
 }
 const r=await checkPython({text:'text="👋é"; value =\n'});assert.equal(r.diagnostics[0].column,20);
});
test('offline SQLite parser checks statements without a database or executing them',()=>{
 const text='CREATE TABLE people (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO people VALUES (1, \'Willy\'); SELECT name FROM people; DROP TABLE people;';
 const result=checkSyntax({language:'sql',text});assert.equal(result.status,'checked');assert.deepEqual(result.diagnostics,[]);assert.match(result.message,/SQLite/);
 for(const text of ['SELECT x FROM WHERE x=1;','CREATE TABLE people (','INSERT INTO people VALUES (1, );'])assert.ok(checkSyntax({language:'sql',text}).diagnostics.length,text);
});
test('Markdown lint accepts valid text and warns about duplicate headings and unclosed fences',()=>{
 assert.deepEqual(checkSyntax({language:'markdown',text:'# Title\n\n- item\n\n```py\nprint(1)\n```\n'}).diagnostics,[]);
 const result=checkSyntax({language:'markdown',text:'## Title\n\n## Title\n\n```py\nprint(1)\n'});
 assert.ok(result.diagnostics.some(d=>/Duplicate/.test(d.message)));assert.ok(result.diagnostics.some(d=>/Unclosed/.test(d.message)));assert.ok(result.diagnostics.every(d=>d.severity==='warning'));
 assert.equal(checkSyntax({language:'markdown',text:'Break here.  \nNext line.\n'}).diagnostics.length,0);
 assert.equal(checkSyntax({language:'markdown',text:'Unexpected space. \n'}).diagnostics.length,1);
});
