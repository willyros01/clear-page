import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCChecker} from '../src/c-syntax.js';
const check=createCChecker(async name=>new Uint8Array(await readFile(new URL('../node_modules/'+(name==='tree-sitter-c.wasm'?'tree-sitter-c/':'web-tree-sitter/')+name,import.meta.url))));
test('bundled C grammar catches missing semicolons, braces and broken expressions',async()=>{
 for(const text of ['int main(void) { return 0 }','int main(void) {','int x = ;']){
  const result=await check({text});assert.equal(result.status,'checked');assert.ok(result.diagnostics.length,text);
 }
});
test('valid C with include, typedefs, structs, comments, strings and macros parses offline',async()=>{
 const text='#include <stdio.h>\n#define VALUE 1\ntypedef struct Item { int x; } Item;\nint main(void) { Item item = {VALUE}; /* } */ puts("hello"); return item.x; }';
 assert.deepEqual((await check({text})).diagnostics,[]);
});
test('C offsets match editor UTF-16 positions after accented and astral characters',async()=>{
 const text='// é 😀\nint main(void) { return 0 }';
 const result=await check({text}),d=result.diagnostics[0];assert.equal(d.line,2);assert.equal(d.from,text.lastIndexOf('0')+1);assert.equal(d.message,'Missing ";"');
});
test('basic C results disclose the absence of header, type and macro checks',async()=>{
 const result=await check({text:'int main(void) { return not_declared; }'});
 assert.deepEqual(result.diagnostics,[]);assert.match(result.message,/Headers, macros, types/);
});
