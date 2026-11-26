// Line-by-line comparison (Myers' algorithm) for showing what changed.
// Returns [{type:'same'|'add'|'del', text}] in order.
export function lineDiff(oldText,newText,{maxEdits=4000}={}){
 const a=split(oldText),b=split(newText),n=a.length,m=b.length,max=n+m;
 const v=new Map([[1,0]]),trace=[];
 let found=false;
 for(let d=0;d<=max&&d<=maxEdits;d++){
  trace.push(new Map(v));
  for(let k=-d;k<=d;k+=2){
   let x=(k===-d||(k!==d&&(v.get(k-1)??-1)<(v.get(k+1)??-1)))?(v.get(k+1)??0):(v.get(k-1)??0)+1;
   let y=x-k;
   while(x<n&&y<m&&a[x]===b[y]){x++;y++}
   v.set(k,x);
   if(x>=n&&y>=m){found=true;break}
  }
  if(found)break;
 }
 if(!found)return null; // too different to show line by line
 const out=[];let x=n,y=m;
 for(let d=trace.length-1;d>=0;d--){
  const vd=trace[d],k=x-y;
  const prevK=(k===-d||(k!==d&&(vd.get(k-1)??-1)<(vd.get(k+1)??-1)))?k+1:k-1;
  const prevX=vd.get(prevK)??0,prevY=prevX-prevK;
  while(x>prevX&&y>prevY){out.push({type:'same',text:a[x-1]});x--;y--}
  if(d>0){if(x===prevX)out.push({type:'add',text:b[y-1]});else out.push({type:'del',text:a[x-1]})}
  x=prevX;y=prevY;
 }
 return out.reverse();
}
function split(t){const s=String(t??'').replace(/\r\n?/g,'\n');if(s==='')return [];const lines=s.split('\n');if(lines.at(-1)==='')lines.pop();return lines;}

// Keep only changed lines plus a few lines of context; long unchanged runs become a gap marker.
export function withContext(diff,context=3){
 if(!diff)return null;
 const keep=diff.map(()=>false);
 diff.forEach((d,i)=>{if(d.type!=='same')for(let j=Math.max(0,i-context);j<=Math.min(diff.length-1,i+context);j++)keep[j]=true});
 const out=[];let gap=0;
 diff.forEach((d,i)=>{if(keep[i]){if(gap){out.push({type:'gap',count:gap});gap=0}out.push(d)}else gap++});
 if(gap&&out.length)out.push({type:'gap',count:gap});
 return out;
}

// GitHub's unified "patch" text → the same line shape.
export function parsePatch(patch){
 if(!patch)return [];
 return patch.split('\n').map(l=>l.startsWith('@@')?{type:'gap',text:l}:l.startsWith('+')?{type:'add',text:l.slice(1)}:l.startsWith('-')?{type:'del',text:l.slice(1)}:{type:'same',text:l.startsWith(' ')?l.slice(1):l});
}
