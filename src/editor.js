import {vim, Vim} from '@replit/codemirror-vim';
import {openSearchPanel, gotoLine} from '@codemirror/search';
import {basicSetup} from 'codemirror';
import {EditorState, Compartment} from '@codemirror/state';
import {EditorView, keymap, placeholder} from '@codemirror/view';
import {indentWithTab, indentMore, indentLess, selectAll} from '@codemirror/commands';
import {indentUnit} from '@codemirror/language';
import {javascript} from '@codemirror/lang-javascript';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {python} from '@codemirror/lang-python';
import {oneDark} from '@codemirror/theme-one-dark';
export const languages={plain:()=>[],javascript,html,css,python};
export function languageForName(name){return ({js:'javascript',mjs:'javascript',cjs:'javascript',html:'html',htm:'html',css:'css',py:'python'})[name.split('.').pop().toLowerCase()]||'plain'}
export function createEditor(parent,onChange){
 const language=new Compartment(),theme=new Compartment(),vimMode=new Compartment();
 let activeLanguage="plain",activeDark=false,activeVim=false;
 // Tauri nonces the bundled style element. Reuse that nonce for CodeMirror's
 // runtime styles instead of weakening the desktop Content Security Policy.
 const styleNonce=parent.ownerDocument.querySelector('style[nonce]')?.nonce;
 const extensions=[...(styleNonce?[EditorView.cspNonce.of(styleNonce)]:[]),vimMode.of([]),basicSetup,keymap.of([indentWithTab]),indentUnit.of('    '),EditorState.tabSize.of(4),language.of([]),theme.of([]),placeholder('Start writing here…'),EditorView.lineWrapping,EditorView.contentAttributes.of({'aria-label':'Text editor','aria-describedby':'keyboard-help',spellcheck:'false'}),EditorView.updateListener.of(u=>{if(u.docChanged)onChange()}),EditorView.theme({'&':{height:'100%',fontSize:'inherit'},'.cm-scroller':{overflow:'auto',fontFamily:'ui-monospace, Menlo, Consolas, monospace',lineHeight:'1.6'},'.cm-content':{padding:'24px 12px'},'.cm-gutters':{fontSize:'0.75em'},'.cm-cursor':{borderLeftWidth:'3px'},'.cm-panels':{fontSize:'22px'}})];
 const view=new EditorView({parent,state:EditorState.create({extensions})});
 return {get value(){return view.state.doc.toString()},set value(text){view.setState(EditorState.create({doc:text,extensions}));view.dispatch({effects:[language.reconfigure(languages[activeLanguage]()),theme.reconfigure(activeDark?oneDark:[]),vimMode.reconfigure(activeVim?vim({status:true}):[])]});},view,
 selectedText(){return view.state.selection.ranges.map(r=>view.state.sliceDoc(r.from,r.to)).join('\n')},selectAll(){selectAll(view);view.focus()},search(){openSearchPanel(view)},goToLine(){gotoLine(view)},setVim(enabled){activeVim=enabled;view.dispatch({effects:vimMode.reconfigure(enabled?vim({status:true}):[])})},commands(save,exit,saveExit){Vim.defineEx('write','w',save);Vim.defineEx('quit','q',exit);Vim.defineEx('wq','wq',saveExit)},
 replace(text){view.dispatch({changes:{from:0,to:view.state.doc.length,insert:text}})},focus(){view.focus()},setLanguage(id){activeLanguage=languages[id]?id:"plain";view.dispatch({effects:language.reconfigure((languages[id]||languages.plain)())})},setDark(dark){activeDark=dark;view.dispatch({effects:theme.reconfigure(dark?oneDark:[])})},indent(){indentMore(view);view.focus()},unindent(){indentLess(view);view.focus()}};
}
