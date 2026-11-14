// Shared browser/WKWebView layout regression. Amplification supplements real
// simulator Dynamic Type tests; it does not pretend to change the OS setting.
export function checkToolbarLayout([scale, icons]) {
 const header=document.querySelector('header'),notice=document.getElementById('notice');
 const oldNotice={text:notice.textContent,hidden:notice.hidden},wasIcons=document.body.classList.contains('icons');
 const style=document.createElement('style');style.nonce=document.querySelector('style[nonce]')?.nonce||'';
 style.textContent=`header,header button,#notice{font-size:${16*scale}px!important}header .brand{font-size:${18.67*scale}px!important}header .control-icon{width:${22*scale}px;height:${22*scale}px}`;
 document.head.append(style);document.body.classList.toggle('icons',icons);
 notice.textContent='Save was cancelled or could not complete. Your draft is kept. '+ 'LongExtensionlessFileName'.repeat(6);notice.hidden=false;
 try{
  const width=document.documentElement.clientWidth,rect=e=>e.getBoundingClientRect();
  const buttons=['menuButton','exit','save'].map(id=>document.getElementById(id));
  for(const button of buttons){
   const b=rect(button);
   if(b.left<0||b.right>width+1||b.width<44||b.height<44)throw Error(`Clipped or small toolbar target ${button.id}: ${JSON.stringify(b.toJSON())}`);
   const hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
   if(!button.contains(hit))throw Error(`Toolbar target covered: ${button.id}`);
  }
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
   const a=rect(buttons[i]),b=rect(buttons[j]);
   if(Math.min(a.right,b.right)>Math.max(a.left,b.left)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1)throw Error('Overlapping toolbar buttons');
  }
  if(document.documentElement.scrollWidth>width+1||notice.scrollWidth>notice.clientWidth+1)throw Error('Toolbar or save message widens the screen');
  const h=rect(header),n=rect(notice);
  if(n.top<h.bottom-1)throw Error('Save message overlaps the toolbar');
  return `Toolbar visible at ${width}px, ${scale*100}% controls, ${icons?'icons':'text'}; wrapped notice, 44px targets and no horizontal overflow`;
 }finally{style.remove();notice.textContent=oldNotice.text;notice.hidden=oldNotice.hidden;document.body.classList.toggle('icons',wasIcons)}
}
