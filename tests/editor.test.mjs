import test from 'node:test';
import assert from 'node:assert/strict';
import {EditorState} from '@codemirror/state';
import {getIndentation,indentUnit,IndentContext} from '@codemirror/language';
import {languages,languageForName} from '../src/editor.js';
test('file extensions select supported languages',()=>{assert.equal(languageForName('Example.PY'),'python');assert.equal(languageForName('app.js'),'javascript');assert.equal(languageForName('notes.txt'),'plain')});
for(const [id,doc] of [['javascript','function hello() {'],['python','def hello():']])test(id+' blocks use four-space indentation',()=>{const s=EditorState.create({doc,extensions:[languages[id](),indentUnit.of('    ')]});assert.equal(getIndentation(new IndentContext(s,{simulateBreak:s.doc.length}),s.doc.length),4)});
