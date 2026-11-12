import test from 'node:test';
import assert from 'node:assert/strict';
import {languageForDocument} from '../src/languages.js';

test('source extensions win over contents, including uppercase C and trailing whitespace',()=>{
 for(const name of ['program.c','PROGRAM.C','program.h','program.c '])assert.equal(languageForDocument(name,'plain text'),'c');
 assert.equal(languageForDocument('sample.py','int main(void) { return 0; }'),'python');
});
test('C wrapped in txt and unnamed C code are detected without changing the name',()=>{
 const name='program.c.txt';assert.equal(languageForDocument(name,''),'c');assert.equal(name,'program.c.txt');
 for(const name of ['Untitled.txt','program','source.unknown']){
  assert.equal(languageForDocument(name,'int main(void) { return 0; }'),'c');
  assert.equal(languageForDocument(name,'#include <stdio.h>\nvoid hello(void) { puts("hello"); }'),'c');
  assert.equal(languageForDocument(name,'static int add(int a, int b) { return a + b; }'),'c');
 }
});
test('ordinary text, comments, ambiguous fragments and code beyond the scan limit stay plain',()=>{
 for(const text of ['Hello world','return 0;', '"int main(void) { return 0; }"','// int main(void) { return 0; }','/* int main(void) { return 0; } */',' '.repeat(32768)+'int main(void) { return 0; }'])assert.equal(languageForDocument('notes.txt',text),'plain');
});
test('strong Python, HTML and JavaScript signatures are recognized locally',()=>{
 assert.equal(languageForDocument('script','def hello():\n    pass'),'python');
 assert.equal(languageForDocument('page','<!doctype html><html></html>'),'html');
 assert.equal(languageForDocument('script','function hello() { return 1; }'),'javascript');
});

const fixtures={
 c:['int main(void) { return 0; }','c'],
 javascript:['const greet = (name) => name;','js'],
 typescript:['interface Person { name: string; }','ts'],
 json:['{"name":"ATE","version":1}','json'],
 html:['<section><p>Hello</p></section>','html'],
 css:['.note { color: red; padding: 4px; }','css'],
 yaml:['name: ATE\nversion: 1\n','yaml'],
 python:['def hello():\n    return 1','py'],
 sql:['SELECT name FROM people WHERE active = 1;','sql'],
 markdown:['# Read me\n\n- First item\n- Second item','md']
};
test('every supported code language has extension, wrapped-extension and content detection',()=>{
 for(const [id,[text,extension]] of Object.entries(fixtures)){
  assert.equal(languageForDocument('document.'+extension.toUpperCase(),''),id,id+' extension');
  assert.equal(languageForDocument('document.'+extension+'.txt',''),id,id+' wrapped extension');
  assert.equal(languageForDocument('document',text),id,id+' extensionless');
  assert.equal(languageForDocument('document.txt',text),id,id+' text extension');
 }
});
test('ambiguous ordinary text is not forced into a language',()=>{
 for(const text of ['# Shopping list','Name: Willy','1','true','null','[unfinished note','Please SELECT a language FROM the menu.','int value;'])assert.equal(languageForDocument('notes.txt',text),'plain',text);
});
