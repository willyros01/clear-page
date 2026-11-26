import {EditorSelection} from '@codemirror/state';
// Shared workspace: one editor view, independent immutable CodeMirror states per tab.
export const workspaceKey='clear-page-workspace-v1';
export function createDocumentTabs({editor,storage,getMeta,setMeta,changed,render,status,preserveScroll=false}){
 let tabs=[],active=0,serial=0,recoveryBlocked=false,restoreToken=0,pendingScroll=null;
 const make=(text='',name='Untitled',language='plain',manual=false,dirty=false,projectRef=null)=>({projectRef,id:++serial,text,name,language,manual,dirty,savedText:dirty?null:text,savedName:dirty?null:name,state:null,scroll:0,scrollSnapshot:null});
 function capture(){const t=tabs[active];if(!t)return;Object.assign(t,getMeta(),{text:editor.value,state:editor.view.state});if(pendingScroll?.id!==t.id){t.scroll=editor.view.scrollDOM.scrollTop;if(preserveScroll)t.scrollSnapshot=editor.view.scrollSnapshot();}}
 function cancelScrollRestore(){pendingScroll=null;restoreToken++;}
 if(preserveScroll)for(const type of ['wheel','touchstart','pointerdown','keydown','beforeinput'])editor.view.scrollDOM.addEventListener(type,cancelScrollRestore,{capture:true,passive:true});
 function restoreScroll(t){
  if(!preserveScroll)return;
  const pending=pendingScroll={id:t.id,token:++restoreToken,top:t.scroll||0,snapshot:t.scrollSnapshot};
  const valid=()=>pendingScroll===pending&&tabs[active]?.id===pending.id&&restoreToken===pending.token;
  // Old Android WebViews clamp scrollTop while CodeMirror rebuilds a long
  // document. Restore its document anchor after layout and focus settle.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(!valid())return;
   if(pending.snapshot)editor.view.dispatch({effects:pending.snapshot});else editor.view.scrollDOM.scrollTop=pending.top;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{if(valid()){pendingScroll=null;persist()}}));
  }));
 }

 function list(){return tabs.map(({id,name,dirty})=>({id,name,dirty,active:id===tabs[active]?.id}));}
 function paint(){render(list());}
 function persist(){capture();if(recoveryBlocked){status(false);paint();return false}let ok=true;try{storage.setItem(workspaceKey,JSON.stringify({version:1,active:tabs[active].id,tabs:tabs.map(({state,scroll,scrollSnapshot,savedText,savedName,...t})=>({...t,selection:state?.selection.toJSON(),scroll}))}));status(true)}catch{ok=false;status(false)}paint();return ok;}
 function show(){const t=tabs[active];restoreScroll(t);setMeta(t);if(t.state)editor.view.setState(t.state);else{editor.value=t.text;if(t.selection)try{editor.view.dispatch({selection:EditorSelection.fromJSON(t.selection)})}catch{}}setMeta(t);editor.view.scrollDOM.scrollTop=t.scroll||0;changed();paint();}
 function init(fallback){let raw;try{raw=storage.getItem(workspaceKey);const data=JSON.parse(raw);if(data?.version===1&&Array.isArray(data.tabs)&&data.tabs.length>0&&data.tabs.length<=12&&data.tabs.every(t=>typeof t.text==='string'&&typeof t.name==='string'&&Number.isSafeInteger(t.id)&&t.id>0)&&new Set(data.tabs.map(t=>t.id)).size===data.tabs.length){tabs=data.tabs.map(t=>({...make(t.text,t.name,t.language,t.manual,t.dirty),...t,state:null,scrollSnapshot:null}));serial=Math.max(...tabs.map(t=>t.id));active=Math.max(0,tabs.findIndex(t=>t.id===data.active));show();return}if(raw)throw Error("Invalid workspace")}catch{recoveryBlocked=!!raw;status(false)}tabs=[make(fallback.text,fallback.name,fallback.language,fallback.manual,!!fallback.text||fallback.name!=='Untitled')];paint();}
 function activate(id){capture();const index=tabs.findIndex(t=>t.id===id);if(index<0)return;active=index;show();persist();editor.focus();}
 function add(text='',name='Untitled',language='plain',projectRef=null){if(tabs.length>=12)return false;capture();tabs.push(make(text,name,language,false,false,projectRef));active=tabs.length-1;show();persist();editor.focus();return true;}
 function edit(){capture();const t=tabs[active];t.dirty=t.text!==t.savedText||t.name!==t.savedName;persist();}
 function saved(id,text,name,projectRef){const t=tabs.find(t=>t.id===id);if(!t)return;if(projectRef)t.projectRef=projectRef;t.savedText=text;t.savedName=name;if(t.id===tabs[active].id){capture();}else t.name=name;t.dirty=t.text!==text||t.name!==name;persist();}
 function closeMany(ids,{focus=true}={}){const removing=new Set(ids);if(!tabs.some(t=>removing.has(t.id)))return;capture();const activeId=tabs[active].id,before=tabs.slice(0,active).filter(t=>!removing.has(t.id)).length;tabs=tabs.filter(t=>!removing.has(t.id));if(!tabs.length)tabs=[make()];const kept=tabs.findIndex(t=>t.id===activeId);active=kept>=0?kept:Math.min(before,tabs.length-1);show();persist();if(focus)editor.focus();}
 function close(id){closeMany([id])}
 function clear({keepRecovery=false}={}){cancelScrollRestore();tabs=[make()];active=0;recoveryBlocked=false;show();cancelScrollRestore();if(!keepRecovery)try{storage.removeItem(workspaceKey)}catch{status(false)}}
 return {init,activate,add,edit,saved,close,closeMany,clear,persist,list,documents(){capture();return tabs.map(({state,scrollSnapshot,...t})=>({...t}))},get current(){capture();return tabs[active]}};
}
