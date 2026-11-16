import terms from '../resources/terms.json' with {type:'json'};
export const TERMS_KEY='ate-terms-accepted-v1';
export function setupLegal({document,storage,openLink}){
 const $=id=>document.getElementById(id),dialog=$('termsDialog');
 let accepted=false,reviewing=false;
 try{accepted=storage.getItem(TERMS_KEY)===terms.version}catch{}
 $('termsVersion').textContent='Version '+terms.version+' - Effective '+terms.effectiveDate;
 for(const [title,text] of terms.sections){const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=text;$('termsContent').append(h,p)}
 function show(){reviewing=accepted;$('termsCheck').checked=false;$('acceptTerms').disabled=true;$('closeTerms').hidden=!accepted;$('termsStorageError').hidden=true;if(!dialog.open)dialog.showModal();dialog.scrollTop=0}
 $('termsCheck').onchange=()=>{$('acceptTerms').disabled=!$('termsCheck').checked};
 $('acceptTerms').onclick=()=>{if(!$('termsCheck').checked)return;try{storage.setItem(TERMS_KEY,terms.version)}catch{$('termsStorageError').hidden=false;return}accepted=true;dialog.close()};
 $('closeTerms').onclick=()=>{if(accepted)dialog.close()};
 dialog.addEventListener('cancel',e=>{if(!accepted)e.preventDefault()});
 $('showTerms').onclick=()=>{$('help').close();show()};
 for(const link of document.querySelectorAll('[data-public-link]'))link.addEventListener('click',e=>{if(openLink){e.preventDefault();openLink(link.href).catch(()=>{$('legalLinkError').hidden=false})}});
 if(!accepted)show();
 return {required:()=>!accepted,show};
}
