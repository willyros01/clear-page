import {registerPlugin} from '@capacitor/core';
const files=registerPlugin('DocumentFiles');
export const openAndroid=()=>files.openDocument();
export async function saveAndroid(text,name){
 const result=await files.saveDocument({text,name});
 if(!result?.name)throw Error('Save did not complete');
 return {name:result.name,message:'Saved '+result.name+'. Your recovery draft is kept on this device.'};
}
