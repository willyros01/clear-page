export const languageLabels = {plain:'Plain text',javascript:'JavaScript',typescript:'TypeScript',json:'JSON',html:'HTML',css:'CSS',yaml:'YAML',c:'C',python:'Python',sql:'SQL',markdown:'Markdown'};
export function languageForName(name='') {
 return ({js:'javascript',mjs:'javascript',cjs:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',mts:'typescript',cts:'typescript',json:'json',html:'html',htm:'html',css:'css',yaml:'yaml',yml:'yaml',c:'c',h:'c',py:'python',sql:'sql',md:'markdown',markdown:'markdown'})[name.split('.').pop().toLowerCase()] || 'plain';
}
