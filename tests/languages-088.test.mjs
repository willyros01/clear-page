import test from 'node:test';
import assert from 'node:assert/strict';
import {checkSyntax} from '../src/syntax.js';
import {languageForName,languageForDocument,languageLabels} from '../src/languages.js';
import {languages} from '../src/editor.js';
import {previewDocument} from '../src/preview.js';

const lines=r=>r.diagnostics.map(d=>[d.line,d.column,d.severity]);

test('Java 21: valid modern source passes; a missing semicolon is reported at the end of its own line',()=>{
 const ok=checkSyntax({language:'java',text:'package a;\nimport java.util.*;\npublic record P(int x, int y) {}\nsealed interface S permits T {}\nfinal class T implements S {\n  String f(Object o) {\n    return switch (o) { case Integer i when i > 0 -> "pos"; default -> "other"; };\n  }\n  String t = """\n    text block\n    """;\n}\n'});
 assert.equal(ok.diagnostics.length,0,JSON.stringify(ok.diagnostics));
 assert.match(ok.message,/syntax only/i);
 const bad=checkSyntax({language:'java',text:'class A {\n  void f() {\n    int x = 1\n  }\n}\n'});
 assert.deepEqual(lines(bad),[[3,14,'error']]);
 assert.match(bad.diagnostics[0].message,/Missing ;/);
 const brace=checkSyntax({language:'java',text:'class A {\n  void f() {\n'});
 assert.equal(brace.diagnostics.length,1);
});

test('XML: well-formed documents pass; mismatched and unclosed tags are reported with their line',()=>{
 assert.equal(checkSyntax({language:'xml',text:'<?xml version="1.0"?>\n<a x="1"><b/><!-- c --><![CDATA[<x>]]></a>\n'}).diagnostics.length,0);
 const bad=checkSyntax({language:'xml',text:'<a>\n  <b></c>\n</a>\n'});
 assert.ok(bad.diagnostics.length>=1);
 assert.equal(bad.diagnostics[0].line,2);
 assert.match(bad.diagnostics[0].message,/tag mismatch/i);
 assert.equal(checkSyntax({language:'xml',text:'<a>\n<b>\n'}).diagnostics.length,1);
 assert.match(bad.message,/schemas/i);
});

test('TOML: valid files pass; duplicate tables and bad values are errors with lines',()=>{
 assert.equal(checkSyntax({language:'toml',text:'[package]\nname = "x"\nversion = "1"\n[dependencies]\nserde = { version = "1", features = ["derive"] }\n'}).diagnostics.length,0);
 assert.equal(checkSyntax({language:'toml',text:'[a]\nx = 1\n[a]\ny = 2\n'}).diagnostics[0].line,3);
 assert.equal(checkSyntax({language:'toml',text:'a = 1\nb = \n'}).diagnostics[0].line,2);
});

test('INI: sections, comments and blank lines pass; broken headers, bare lines and duplicates are reported',()=>{
 assert.equal(checkSyntax({language:'ini',text:'; c\n# c\n[s]\na = 1\nb: 2\n\n[t]\na=3\n'}).diagnostics.length,0);
 const bad=checkSyntax({language:'ini',text:'[s]\na=1\na=2\n[broken\njunk\n[s]\n'});
 assert.deepEqual(lines(bad),[[3,1,'warning'],[4,1,'error'],[5,1,'error'],[6,1,'warning']]);
});

test('14 new languages are listed, coloured, detected by extension, and the colour-only ones are not claimed as checked',()=>{
 const ids=['java','cpp','csharp','go','rust','php','ruby','swift','kotlin','xml','toml','ini','powershell','lua'];
 for(const id of ids){assert.ok(languageLabels[id],id);assert.equal(typeof languages[id],'function',id);assert.ok(languages[id](),id);}
 const ext={'A.java':'java','a.cpp':'cpp','a.hpp':'cpp','a.cs':'csharp','a.go':'go','a.rs':'rust','a.php':'php','a.rb':'ruby','a.swift':'swift','a.kt':'kotlin','pom.xml':'xml','Cargo.toml':'toml','a.ini':'ini','a.ps1':'powershell','a.lua':'lua','main.c':'c','x.h':'c','nginx.conf':'plain'};
 for(const [n,l] of Object.entries(ext))assert.equal(languageForName(n),l,n);
 assert.equal(languageForDocument('Contact.java.txt','class A {}'),'java');
 for(const id of ['cpp','csharp','go','rust','php','ruby','swift','kotlin','powershell','lua'])assert.equal(checkSyntax({language:id,text:'x'}).status,'unavailable',id);
});

test('content detection: XML declaration and Java packages; C programs stay C',()=>{
 assert.equal(languageForDocument('notes','<?xml version="1.0"?>\n<a/>'),'xml');
 assert.equal(languageForDocument('Untitled','package a.b;\n\npublic class Main {\n  public static void main(String[] args) {\n  }\n}\n'),'java');
 assert.equal(languageForDocument('Untitled','#include <stdio.h>\nint main(void) {\n  return 0;\n}\n'),'c');
 assert.equal(languageForDocument('Untitled','<!doctype html><p>x</p>'),'html');
});

test('Preview: Markdown is rendered with raw HTML shown as text; both kinds carry a no-network, no-script policy',()=>{
 const md=previewDocument('# Title\n\n**bold** and [link](https://example.com)\n\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n\n| a | b |\n|---|---|\n| 1 | 2 |\n','markdown');
 assert.match(md,/<h1[^>]*>Title<\/h1>/);
 assert.match(md,/<strong>bold<\/strong>/);
 assert.match(md,/<table>/);
 assert.doesNotMatch(md,/<script>/i);
 assert.doesNotMatch(md,/<img src=x/i);
 assert.match(md,/&lt;script&gt;/);
 assert.match(md,/default-src 'none'/);
 const html=previewDocument('<!doctype html><html><head><title>t</title></head><body><p>x</p></body></html>','html');
 assert.match(html,/<head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'/);
 assert.match(previewDocument('<p>fragment</p>','html'),/^<meta charset="utf-8"><meta http-equiv="Content-Security-Policy"/);
});
