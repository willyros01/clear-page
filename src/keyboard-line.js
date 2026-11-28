// Touch devices: tell when the on-screen keyboard is up, so the bottom line can step aside.
// The visible height drops well below the tallest height seen for the current orientation.
// The orientation comes from the screen, never from the page's width and height: on a
// tablet such as the Fire HD 8, the keyboard makes the page wider than it is tall, and
// reading that as "turned sideways" used to reset the comparison so the keyboard was missed.
export function screenIsLandscape(win=globalThis){
  const type=win.screen?.orientation?.type;
  if(typeof type==='string'&&type)return type.startsWith('landscape');
  if(typeof win.orientation==='number')return Math.abs(win.orientation)===90;
  return (win.screen?.width||0)>(win.screen?.height||0);
}
// editing(): is a text field or the editor focused? The keyboard only comes up for one, so a smaller
// window with nothing to type in (another app's screen coming and going) never hides the bottom line.
export function createKeyboardWatch({height,landscape,onChange,log=null,editing=()=>true}){
  let base=0,land=landscape(),up=false;
  return ()=>{
    const now=landscape();
    if(now!==land){land=now;base=0}
    const h=height();base=Math.max(base,h);
    const next=h<base*0.75&&!!editing();
    log?.(`h=${Math.round(h)} base=${Math.round(base)} landscape=${land} keyboard=${next}`);
    if(next!==up){up=next;onChange(up)}
    return up;
  };
}
