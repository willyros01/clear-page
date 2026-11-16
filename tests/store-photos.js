// ATE_STORE_SCREENSHOT_ONLY: genuine native app UI with generated sample files.
// Imported only by the verification entry; never bundled into a production app.
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {EditorView} from '@codemirror/view';
export async function captureStoreShots(){
 const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(fn,label)=>{for(let n=0;n<450&&!fn();n++)await wait(100);if(!fn())throw Error(label)};
 await until(()=>!!document.querySelector('.cm-content'),'Native editor did not initialize');
 if($('termsDialog').open){$('termsCheck').checked=true;$('termsCheck').dispatchEvent(new Event('change'));$('acceptTerms').click();if($('termsDialog').open)throw Error('Terms were not accepted')}
 $('advancedMode').click();
 const view=EditorView.findFromDOM(document.querySelector('.cm-editor'));
 const text=value=>view.dispatch({changes:{from:0,to:view.state.doc.length,insert:value}});
 const ready=()=>!$('createProject').disabled;
 async function shot(label){document.activeElement?.blur();await wait(700);await Filesystem.writeFile({path:'ate-store-ready.json',directory:Directory.Documents,encoding:Encoding.UTF8,data:JSON.stringify({label})});for(let n=0;n<300;n++){try{await Filesystem.stat({path:'ate-store-ack-'+label,directory:Directory.Documents});return}catch{}await wait(200)}throw Error('Native capture acknowledgement missing '+label)}
 $('new').click();$('name').value='welcome.md';$('name').dispatchEvent(new Event('change'));text('# A clear space to write\n\nNotes, code and local projects.\nYour work stays on your device.');
 await shot('01-editor');
 $('projectsButton').click();await until(()=>$('projects').open&&ready(),'Projects unavailable');$('openProjectPicker').click();await until(()=>$('projectPicker').open,'Project picker unavailable');$('projectName').value='My writing project';await $('createProject').onclick();await until(()=>$('projects').open&&ready(),'Project creation failed');
 $('showProjectFolder').click();$('projectFileName').value='src';await $('newProjectFolder').onclick();await until(()=>ready()&&$('projectComposer').hidden,'Folder creation incomplete');
 $('showProjectAdd').click();$('projectFileName').value='example.sql';await $('newProjectFile').onclick();await until(()=>$('name').value==='src/example.sql','Native project file did not open');text('SELECT 1;');if(!await $('save').onclick())throw Error('Native project save failed');
 $('projectsButton').click();await until(()=>$('projects').open&&ready(),'Native project tree unavailable');await shot('02-projects');$('closeProjects').click();
 text('SELECT 1;\nSELECT FROM;');$('checkSyntax').click();await until(()=>$('syntaxIssues').children.length>0,'SQLite diagnostic did not arrive');await shot('03-syntax');$('closeSyntax').click();$('menuButton').click();await shot('04-menu');
 await Filesystem.writeFile({path:'ate-store-photos-done.json',directory:Directory.Documents,encoding:Encoding.UTF8,data:JSON.stringify({passed:true,source:'native production UI, generated sample content, no UI image edits'})});
}
