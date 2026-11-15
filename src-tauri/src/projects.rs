use serde::{Deserialize,Serialize};
use std::{fs,io::Write,path::{Path,PathBuf},time::UNIX_EPOCH};
use tauri::{Manager};
use tauri_plugin_dialog::DialogExt;

#[derive(Deserialize)]
pub struct Request {op:String,#[serde(default)] id:String,#[serde(default)] path:String,#[serde(default)] to:String,#[serde(default)] text:String}
#[derive(Default,Serialize)]
pub struct Reply {ids:Vec<String>,text:Option<String>,entries:Vec<Entry>}
#[derive(Serialize)]
pub struct Entry {path:String,#[serde(rename="type")] kind:String,size:u64,mtime:u64}
fn safe_id(id:&str)->bool{id.starts_with("p-")&&id.len()<100&&id.bytes().all(|b|b.is_ascii_alphanumeric()||b==b'-')}
fn safe_path(path:&str)->bool{!path.is_empty()&&path.len()<=512&&path.split('/').all(|p|!p.is_empty()&&p!="."&&p!=".."&&p==p.trim()&&!p.ends_with('.')&&!p.chars().any(|c|c.is_control()||"\\:%#<>\"|?*".contains(c)))}
// Reject links in every existing component. All script-supplied paths stay
// inside ATE's private projects directory, never arbitrary user paths.
fn contained(root:&Path,id:&str,path:&str)->Result<PathBuf,String>{
 if !safe_id(id)||(!path.is_empty()&&!safe_path(path)){return Err("Invalid project path".into())}
 let result=root.join(id).join(path);let relative=Path::new(id).join(path);let mut part=root.to_path_buf();
 for component in relative.components(){part.push(component.as_os_str());match fs::symlink_metadata(&part){Ok(m) if m.file_type().is_symlink()=>return Err("Project links are not supported".into()),Ok(_)=>{},Err(e) if e.kind()==std::io::ErrorKind::NotFound=>{},Err(_)=>return Err("Project path could not be inspected".into())}}
 Ok(result)
}
fn error(e:std::io::Error)->String{format!("Project storage operation failed: {e}")}
fn walk(root:&Path,folder:&Path,out:&mut Vec<Entry>)->Result<(),String>{
 for item in fs::read_dir(folder).map_err(error)?{let item=item.map_err(error)?;let m=fs::symlink_metadata(item.path()).map_err(error)?;if m.file_type().is_symlink()||(!m.is_dir()&&!m.is_file()){return Err("Unexpected project folder item".into())}let path=item.path().strip_prefix(root).map_err(|_|"Invalid project entry")?.to_string_lossy().replace('\\',"/");if !safe_path(&path){return Err("Invalid project entry".into())}out.push(Entry{path,kind:if m.is_dir(){"directory"}else{"file"}.into(),size:if m.is_file(){m.len()}else{0},mtime:m.modified().ok().and_then(|t|t.duration_since(UNIX_EPOCH).ok()).map(|t|t.as_millis() as u64).unwrap_or(0)});if out.len()>10000{return Err("Too many folder items to review".into())}if m.is_dir(){walk(root,&item.path(),out)?}}
 Ok(())
}
fn operate(root:&Path,r:Request)->Result<Reply,String>{
 fs::create_dir_all(root).map_err(error)?;
 if fs::symlink_metadata(root).map_err(error)?.file_type().is_symlink(){return Err("Project storage cannot be a link".into())}
 let canonical=fs::canonicalize(root).map_err(error)?;let root=canonical.as_path();
 let mut result=Reply::default();
 if r.op=="list"{for entry in fs::read_dir(root).map_err(error)?{let entry=entry.map_err(error)?;let name=entry.file_name().to_string_lossy().into_owned();if safe_id(&name)&&entry.file_type().map_err(error)?.is_dir(){contained(root,&name,"")?;result.ids.push(name)}}return Ok(result)}
 let path=contained(root,&r.id,&r.path)?;
 match r.op.as_str(){
  "read"=>{match fs::read(&path){Ok(bytes)=>{if bytes.len()>10*1024*1024{return Err("Project file exceeds 10 MB".into())}result.text=Some(String::from_utf8(bytes).map_err(|_|"Project file is not UTF-8 text")?)},Err(e) if e.kind()==std::io::ErrorKind::NotFound=>{},Err(e)=>return Err(error(e))}},
  "write"=>{if r.path.is_empty()||r.text.len()>10*1024*1024||r.text.contains('\0'){return Err("Invalid project text file".into())}let parent=path.parent().ok_or("Invalid project parent")?;fs::create_dir_all(parent).map_err(error)?;let name=path.file_name().ok_or("Invalid project filename")?.to_string_lossy();for e in fs::read_dir(parent).map_err(error)?{let existing=e.map_err(error)?.file_name().to_string_lossy().into_owned();if existing.to_lowercase()==name.to_lowercase()&&existing!=name{return Err("An existing file differs only by case".into())}}atomicwrites::AtomicFile::new(&path,atomicwrites::AllowOverwrite).write(|f|f.write_all(r.text.as_bytes())).map_err(|_|"Project file could not be saved")?;},
  "mkdir"=>{fs::create_dir_all(path).map_err(error)?;},
  "entries"=>{if r.path.is_empty(){return Err("Select a project folder".into())}walk(&root.join(&r.id),&path,&mut result.entries)?;},
  "rename"=>{if r.path.is_empty()||r.to.is_empty()||r.to.starts_with(&(r.path.clone()+"/")){return Err("Project root cannot be moved".into())}let target=contained(root,&r.id,&r.to)?;if target.exists()||!path.is_dir(){return Err("Project folder cannot be moved".into())}fs::rename(path,target).map_err(error)?;},
  "remove"=>{if r.path.is_empty(){return Err("Project root cannot be deleted".into())}let mut reviewed=Vec::new();walk(&root.join(&r.id),&path,&mut reviewed)?;fs::remove_dir_all(path).map_err(error)?;},
  _=>return Err("Unsupported project operation".into())
 }
 Ok(result)
}
#[tauri::command]
pub async fn project_io(app:tauri::AppHandle,request:Request)->Result<Reply,String>{let root=app.path().app_data_dir().map_err(|_|"Project storage is unavailable")?.join("ATEProjects");tauri::async_runtime::spawn_blocking(move||operate(&root,request)).await.map_err(|_|"Project operation could not complete")?}
#[tauri::command]
pub async fn save_project_zip(app:tauri::AppHandle,name:String,bytes:Vec<u8>)->Result<bool,String>{
 if bytes.len()>24*1024*1024{return Err("Project ZIP exceeds the size limit".into())}
 let safe:String=name.chars().map(|c|if c.is_control()||"/\\:".contains(c){'_'}else{c}).collect();
 let Some(file)=app.dialog().file().set_title("Export ATE project ZIP").set_file_name(&safe).blocking_save_file()else{return Ok(false)};
 let path=file.into_path().map_err(|_|"Choose a local ZIP destination")?;
 atomicwrites::AtomicFile::new(&path,atomicwrites::AllowOverwrite).write(|f|f.write_all(&bytes)).map_err(|_|"Project ZIP could not be saved")?;Ok(true)
}
#[cfg(test)]
mod tests{
 use super::*;
 fn request(op:&str,path:&str)->Request{Request{op:op.into(),id:"p-test".into(),path:path.into(),to:String::new(),text:String::new()}}
 fn temporary()->PathBuf{let p=std::env::temp_dir().join(format!("ate-project-test-{}-{}",std::process::id(),std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()));fs::create_dir_all(&p).unwrap();p}
 #[test]fn private_storage_round_trip_and_subtree_deletion(){let root=temporary();let mut write=request("write","src/query.sql");write.text="SELECT 'café';\r\n".into();operate(&root,write).unwrap();assert_eq!(operate(&root,request("read","src/query.sql")).unwrap().text.unwrap(),"SELECT 'café';\r\n");let mut sibling=request("write","keep.sql");sibling.text="SELECT 2;".into();operate(&root,sibling).unwrap();assert_eq!(operate(&root,request("entries","src")).unwrap().entries.len(),1);let mut rename=request("rename","src");rename.to=".ate-delete-123".into();operate(&root,rename).unwrap();operate(&root,request("remove",".ate-delete-123")).unwrap();assert_eq!(operate(&root,request("read","keep.sql")).unwrap().text.unwrap(),"SELECT 2;");assert!(!root.join("p-test/src").exists());fs::remove_dir_all(root).unwrap();}
 #[test]fn paths_and_project_root_are_protected(){let root=temporary();for path in ["../outside","/absolute","src/../../outside","src\\file","src//file"]{assert!(operate(&root,request("write",path)).is_err())}assert!(operate(&root,request("remove","")).is_err());let mut bad=request("write","file");bad.id="../outside".into();assert!(operate(&root,bad).is_err());fs::remove_dir_all(root).unwrap();}
 #[cfg(unix)]#[test]fn symlink_escape_is_rejected(){use std::os::unix::fs::symlink;let root=temporary();let outside=temporary();fs::create_dir_all(root.join("p-test")).unwrap();symlink(&outside,root.join("p-test/link")).unwrap();assert!(operate(&root,request("write","link/leak")).is_err());assert!(!outside.join("leak").exists());fs::remove_dir_all(root).unwrap();fs::remove_dir_all(outside).unwrap();}
}
