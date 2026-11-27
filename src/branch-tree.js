// Branch tree: works out which branch each branch was most likely made from, using
// each branch's recent history (newest change first). GitHub does not record this,
// so it is a best guess. A branch that shares no history with any other branch was
// brought in from another repository (ATE copies files, not history).
//
// histories: Map name -> array of change ids, newest first (the head is element 0).
// Returns [{name, parent, note, depth}] in display order (parents before children).
export function buildBranchTree(names,histories,mainBranch){
  const parent=new Map(),note=new Map();
  const head=n=>histories.get(n)?.[0];
  const sets=new Map(names.map(n=>[n,new Set(histories.get(n)||[])]));
  for(const b of names){
    if(b===mainBranch)continue;
    let best=null,contained=null;
    for(const p of names){
      if(p===b)continue;
      const hist=histories.get(b)||[],ps=sets.get(p);
      const at=hist.findIndex(id=>ps.has(id));
      if(at<0)continue; // no shared history with p
      // p already contains all of b and more: p grew out of b (or moved on since b was made).
      if(at===0&&head(p)!==head(b)){if(!contained||p===mainBranch)contained=p;continue}
      // Two identical branches would each pick the other: only the main branch,
      // or the earlier name, may be the parent of an identical twin.
      if(head(p)===head(b)&&p!==mainBranch&&(b===mainBranch||p>b))continue;
      const score=[at,head(p)===hist[at]?0:1,p===mainBranch?0:1,p];
      if(!best||less(score,best.score))best={p,score,at,same:head(p)===head(b)};
    }
    if(!best&&contained){parent.set(b,contained);note.set(b,'made from '+contained+', no changes yet');continue}
    if(!best){parent.set(b,null);note.set(b,'brought in from another repository');continue}
    parent.set(b,best.p);note.set(b,best.same?'same as '+best.p:'made from '+best.p);
  }
  // Safety: break any loop by hanging the branch under the main branch.
  for(const b of names){
    const seen=new Set([b]);let p=parent.get(b);
    while(p){if(seen.has(p)){parent.set(b,names.includes(mainBranch)&&b!==mainBranch?mainBranch:null);note.set(b,parent.get(b)?'made from '+mainBranch:'');break}seen.add(p);p=parent.get(p)}
  }
  const kids=new Map();
  for(const b of names){const p=parent.get(b)??null;if(!kids.has(p))kids.set(p,[]);kids.get(p).push(b)}
  const out=[];
  const walk=(n,depth)=>{out.push({name:n,parent:parent.get(n)??null,note:note.get(n)||'',depth});for(const c of (kids.get(n)||[]).sort())walk(c,depth+1)};
  const roots=(kids.get(null)||[]).sort((a,b)=>(a===mainBranch?-1:b===mainBranch?1:0)||(note.get(a)?1:0)-(note.get(b)?1:0)||a.localeCompare(b));
  for(const r of roots)walk(r,0);
  return out;
}
function less(a,b){for(let i=0;i<a.length;i++){if(a[i]<b[i])return true;if(a[i]>b[i])return false}return false}
