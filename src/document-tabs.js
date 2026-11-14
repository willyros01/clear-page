import {EditorSelection} from '@codemirror/state';
// iOS workspace: one editor view, independent immutable CodeMirror states per tab.
export const workspaceKey='clear-page-workspace-v1';
export function createDocumentTabs({editor,storage,getMeta,setMeta,changed,render,status}){
 let tabs=[],active=0,serial=0,recoveryBlocked=false;
 const make=(text='',name='Untitled',language='plain',manual=false,dirty=false)=>({id:++serial,text,name,language,manual,dirty,savedText:dirty?null:text,savedName:dirty?null:name,state:null,scroll:0});
 function capture(){const t=tabs[active];if(!t)return;Object.assign(t,getMeta(),{text:editor.value,state:editor.view.state,scroll:editor.view.scrollDOM.scrollTop});}
 function list(){return tabs.map(({id,name,dirty})=>({id,name,dirty,active:id===tabs[active]?.id}));}
 function paint(){render(list());}
 function persist(){capture();if(recoveryBlocked){status(false);paint();return false}let ok=true;try{storage.setItem(workspaceKey,JSON.stringify({version:1,active:tabs[active].id,tabs:tabs.map(({state,scroll,savedText,savedName,...t})=>({...t,selection:state?.selection.toJSON(),scroll}))}));status(true)}catch{ok=false;status(false)}paint();return ok;}
 function show(){const t=tabs[active];setMeta(t);if(t.state)editor.view.setState(t.state);else{editor.value=t.text;if(t.selection)try{editor.view.dispatch({selection:EditorSelection.fromJSON(t.selection)})}catch{}}setMeta(t);editor.view.scrollDOM.scrollTop=t.scroll||0;changed();paint();}
 function init(fallback){let raw;try{raw=storage.getItem(workspaceKey);const data=JSON.parse(raw);if(data?.version===1&&Array.isArray(data.tabs)&&data.tabs.length>0&&data.tabs.length<=12&&data.tabs.every(t=>typeof t.text==='string'&&typeof t.name==='string'&&Number.isSafeInteger(t.id)&&t.id>0)&&new Set(data.tabs.map(t=>t.id)).size===data.tabs.length){tabs=data.tabs.map(t=>({...make(t.text,t.name,t.language,t.manual,t.dirty),...t,state:null}));serial=Math.max(...tabs.map(t=>t.id));active=Math.max(0,tabs.findIndex(t=>t.id===data.active));show();return}if(raw)throw Error("Invalid workspace")}catch{recoveryBlocked=!!raw;status(false)}tabs=[make(fallback.text,fallback.name,fallback.language,fallback.manual,!!fallback.text||fallback.name!=='Untitled')];paint();}
 function activate(id){capture();const index=tabs.findIndex(t=>t.id===id);if(index<0)return;active=index;show();persist();editor.focus();}
 function add(text='',name='Untitled',language='plain'){if(tabs.length>=12)return false;capture();tabs.push(make(text,name,language));active=tabs.length-1;show();persist();editor.focus();return true;}
 function edit(){capture();const t=tabs[active];t.dirty=t.text!==t.savedText||t.name!==t.savedName;persist();}
 function saved(id,text,name){const t=tabs.find(t=>t.id===id);if(!t)return;t.savedText=text;t.savedName=name;if(t.id===tabs[active].id){capture();}t.dirty=t.text!==text||t.name!==name;persist();}
 function close(id){const i=tabs.findIndex(t=>t.id===id);if(i<0)return;capture();tabs.splice(i,1);if(!tabs.length)tabs=[make()];active=Math.max(0,Math.min(active-(i<active?1:0),tabs.length-1));show();persist();editor.focus();}
 return {init,activate,add,edit,saved,close,persist,list,get current(){capture();return tabs[active]}};
}
