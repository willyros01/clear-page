// Geometry checks shared by browser and native WKWebView fixtures.
export function checkProjectLayout([scale=1]){
 const dialog=document.getElementById('projects'),body=dialog.querySelector('.project-body'),tree=document.getElementById('projectTree'),wasOpen=dialog.open,oldScroll=body.scrollTop;
 const style=document.createElement('style');style.nonce=document.querySelector('style[nonce]')?.nonce||'';
 style.textContent=`#projects,#projects button,#projects input,#projects select,#projects label,#projects summary{font-size:${20*scale}px!important}#projects h2{font-size:${(innerWidth<600?20:26)*scale}px!important}#projects h3{font-size:${26*scale}px!important}`;
 document.head.append(style);if(!wasOpen)dialog.showModal();
 try{
  const rows=[...tree.querySelectorAll('.project-file')];if(rows.length<2)throw Error('Project layout fixture needs root and nested files');
  const boxes=rows.map(row=>row.querySelector('.project-file-open').getBoundingClientRect());
  const root=rows.find(row=>!row.dataset.path.includes('/')),nested=rows.find(row=>row.dataset.path.includes('/'));
  if(!root||!nested)throw Error('Missing root/nested fixture');const r=root.querySelector('button').getBoundingClientRect(),n=nested.querySelector('button').getBoundingClientRect();
  if(n.left<=r.left+1||Math.abs(n.right-r.right)>1)throw Error('Nested filenames must be visibly indented with a shared right edge');
  for(const element of [dialog,body,tree])if(element.scrollWidth>element.clientWidth+1)throw Error('Project controls widen the screen at '+scale*100+'%');
  const last=rows.at(-1),target=last.querySelector('.project-file-open');
  target.scrollIntoView({block:'end'});
  const b=target.getBoundingClientRect(),v=body.getBoundingClientRect(),d=dialog.getBoundingClientRect(),back=document.getElementById('closeProjects').getBoundingClientRect();
  if(b.height<44||b.width<44||b.bottom>Math.min(v.bottom,d.bottom)+1||b.top<Math.max(v.top,back.bottom)-1)throw Error('The last project row must scroll fully into view: '+JSON.stringify({b:b.toJSON(),v:v.toJSON()}));
  const hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);if(!target.contains(hit))throw Error('The last file target is covered');
  if(back.top<d.top||back.bottom>d.bottom||back.left<d.left||back.right>d.right)throw Error('Back to editor must stay inside the fixed project header');
  const actions=document.getElementById('projectFolderActions');
  for(const button of actions.querySelectorAll('button:not([hidden])')){
   button.scrollIntoView({block:'end'});const b=button.getBoundingClientRect(),a=actions.getBoundingClientRect();
   if(b.height<44||b.width<44||b.top<a.top-1||b.bottom>a.bottom+1||!button.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)))throw Error('Selected-folder action must be fully reachable: '+button.textContent);
  }
  return `Indented file hierarchy and reachable last row at ${innerWidth}px / ${scale*100}% controls`;
 }finally{style.remove();body.scrollTop=oldScroll;if(!wasOpen)dialog.close()}
}
