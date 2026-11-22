// Read-only preview of HTML and Markdown. The frame is fully sandboxed: no scripts, forms, pop-ups or network loads.
import {marked} from 'marked';
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:">';
const base='<style>body{font:17px/1.55 -apple-system,system-ui,Segoe UI,sans-serif;margin:16px;color:#1d1d1f;background:#fff;overflow-wrap:anywhere}pre,code{font:14px ui-monospace,Menlo,Consolas,monospace;background:#f2f2f5;border-radius:4px}pre{padding:10px;overflow:auto}code{padding:1px 4px}pre code{padding:0;background:none}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px}blockquote{border-left:4px solid #ccc;margin-left:0;padding-left:12px;color:#555}img{max-width:100%}</style>';
export function previewDocument(text,language){
 if(language==='markdown'){
  const renderer=new marked.Renderer();
  renderer.html=({text:raw})=>esc(raw);
  return `<!doctype html><html><head><meta charset="utf-8">${csp}${base}</head><body>${marked.parse(text,{renderer,gfm:true,async:false})}</body></html>`;
 }
 const head=`<meta charset="utf-8">${csp}`;
 return /<head[^>]*>/i.test(text)?text.replace(/<head[^>]*>/i,m=>m+head):head+text;
}
export function setupPreview({document,$,editor,getLanguage,getName}){
 const update=()=>{$('preview').hidden=!['html','markdown'].includes(getLanguage());};
 // The sandboxed frame exists only while Preview is open, then is removed with its rendered copy.
 $('preview').onclick=()=>{
  $('menu').close();
  $('previewTitle').textContent='Preview · '+getName();
  const frame=document.createElement('iframe');
  frame.id='previewFrame';frame.title='Document preview';frame.setAttribute('sandbox','');frame.setAttribute('referrerpolicy','no-referrer');
  frame.srcdoc=previewDocument(editor.value,getLanguage());
  $('previewFrame')?.remove();$('previewDialog').append(frame);
  $('previewDialog').showModal();
 };
 $('closePreview').onclick=()=>{$('previewDialog').close();$('previewFrame')?.remove();editor.focus();};
 // Escape also closes the dialog.
 $('previewDialog').addEventListener('close',()=>$('previewFrame')?.remove());
 return {update};
}
