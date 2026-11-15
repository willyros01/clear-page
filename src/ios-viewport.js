// Keep the native iOS shell inside the visible WKWebView viewport, including
// keyboard panning and user zoom. Document scrolling stays inside CodeMirror.
export function setupIOSViewport(win=window,doc=document){
 const root=doc.documentElement,viewport=win.visualViewport;
 let frame=0,restoreTimer=0,disposed=false;
 root.classList.add('ios-app');
 const number=(value,fallback)=>Number.isFinite(value)&&value>0?value:fallback;
 function update(){
  frame=0;if(disposed)return;
  const width=number(viewport?.width,win.innerWidth),height=number(viewport?.height,win.innerHeight);
  root.style.setProperty('--ios-visible-width',width+'px');root.style.setProperty('--ios-visible-height',height+'px');
  root.style.setProperty('--ios-visible-left',Math.max(0,Number(viewport?.offsetLeft)||0)+'px');root.style.setProperty('--ios-visible-top',Math.max(0,Number(viewport?.offsetTop)||0)+'px');
 }
 function schedule(){if(!frame&&!disposed)frame=win.requestAnimationFrame(update)}
 function origin(){
  const scroller=doc.scrollingElement||root;scroller.scrollTop=0;scroller.scrollLeft=0;
  // Reset the page pan left by a menu input; never alter editor scroll, zoom,
  // font preferences, selection, or the text in an open document.
  win.scrollTo(0,0);schedule();
 }
 function restore(){if(disposed)return;origin();win.clearTimeout(restoreTimer);restoreTimer=win.setTimeout(()=>{origin();update()},350)}
 viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);win.addEventListener('resize',schedule);win.addEventListener('orientationchange',schedule);update();
 return {restore,dispose(){disposed=true;win.cancelAnimationFrame(frame);win.clearTimeout(restoreTimer);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);win.removeEventListener('resize',schedule);win.removeEventListener('orientationchange',schedule);root.classList.remove('ios-app');for(const name of ['width','height','left','top'])root.style.removeProperty('--ios-visible-'+name)}};
}
