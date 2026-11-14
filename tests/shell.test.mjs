import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {languageForDocument,languageForName,scriptInterpreter,shellDialect} from '../src/languages.js';
import {createCChecker} from '../src/c-syntax.js';
test('shell filenames and interpreter headers defeat embedded Python without changing filenames',()=>{
 const embedded="python3 <<'PY'\ndef example():\n    print('hello')\nPY\n";
 for(const name of ['build.sh','BUILD.SH','script.bash','.bashrc','.profile','.zshrc','build.sh.txt'])assert.equal(languageForDocument(name,embedded),'shell',name);
 for(const header of ['#!/bin/sh','#!/usr/bin/env bash','#!/usr/bin/env -S bash -eu','#!/usr/bin/env --split-string=bash -e','#!/usr/bin/env -u PATH zsh','#!/bin/sh -c python3'])assert.equal(languageForDocument('build',header+'\n'+embedded),'shell',header);
 assert.equal(languageForDocument('build',embedded),'shell');assert.equal(languageForDocument('app','#!/usr/bin/env python3\ndef example():\n pass'),'python');
 assert.equal(languageForDocument('unknown','#!/usr/bin/ruby\ndef example():\n pass'),'plain');
 assert.equal(shellDialect('file.sh','#!/bin/zsh'),'zsh');assert.equal(shellDialect('file.fish',''),'fish');assert.equal(languageForName('src/run.ksh'),'shell');
});
test('bundled Bash grammar finds structural errors and never executes shell or embedded code',async()=>{
 const checker=createCChecker(async name=>new Uint8Array(await readFile(new URL('../node_modules/'+(name==='web-tree-sitter.wasm'?'web-tree-sitter/':'tree-sitter-bash/')+name,import.meta.url))),()=>{},'tree-sitter-bash.wasm','Shell');
 const valid="#!/bin/bash\nset -eu\nfor file in *.c; do\n  printf '%s\\n' \"$file\"\ndone\npython3 <<'PY'\ndef sample():\n    return 1\nPY\n";
 assert.equal((await checker({text:valid})).diagnostics.length,0);
 assert.ok((await checker({text:'#!/bin/sh\nif true; then\n echo hello\n'})).diagnostics.length>0);
 assert.match((await checker({text:'rm -rf /nonexistent-test-target\n'})).message,/never executed/);
});
