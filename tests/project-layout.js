// Geometry checks shared by browser and native WKWebView fixtures.
export function checkProjectLayout([scale=1]){
 const dialog=document.getElementById('projects'),body=dialog.querySelector('.project-body'),tree=document.getElementById('projectTree'),wasOpen=dialog.open,oldScroll=body.scrollTop;
 const style=document.createElement('style');style.nonce=document.querySelector('style[nonce]')?.nonce||'';
 style.textContent=`#projects,#projects button,#projects input,#projects select,#projects label,#projects summary{font-size:${16*scale}px!important}#projects h2,#projects h3{font-size:${18.67*scale}px!important}`;
 document.head.append(style);if(!wasOpen)dialog.showModal();
 try{
  const rows=[...tree.querySelectorAll('.project-file')];if(rows.length<2)throw Error('Project layout fixture needs root and nested files');
  const boxes=rows.map(row=>row.querySelector('.project-file-open').getBoundingClientRect());
  if(boxes.some(b=>Math.abs(b.left-boxes[0].left)>1||Math.abs(b.right-boxes[0].right)>1))throw Error('Root and nested project file boxes must share both edges');
  for(const element of [dialog,body,tree])if(element.scrollWidth>element.clientWidth+1)throw Error('Project controls widen the screen at '+scale*100+'%');
  const last=rows.at(-1),target=last.querySelector('.project-file-remove');
  target.scrollIntoView({block:'end'});
  const b=target.getBoundingClientRect(),v=body.getBoundingClientRect(),d=dialog.getBoundingClientRect(),back=document.getElementById('closeProjects').getBoundingClientRect();
  if(b.height<44||b.width<44||b.bottom>Math.min(v.bottom,d.bottom)+1||b.top<Math.max(v.top,back.bottom)-1)throw Error('The last project row must scroll fully into view: '+JSON.stringify({b:b.toJSON(),v:v.toJSON()}));
  const hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);if(!target.contains(hit))throw Error('The last Remove target is covered');
  if(back.top<d.top||back.bottom>d.bottom||back.left<d.left||back.right>d.right)throw Error('Back to editor must stay inside the fixed project header');
  return `Aligned root/nested file boxes and reachable last row at ${innerWidth}px / ${scale*100}% controls`;
 }finally{style.remove();body.scrollTop=oldScroll;if(!wasOpen)dialog.close()}
}
