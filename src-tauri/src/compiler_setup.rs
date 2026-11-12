use serde::Serialize;
use std::{path::PathBuf, sync::{Mutex, atomic::{AtomicBool, Ordering}}};
use tauri::Manager;
const ROOT: &str = "llvm-mingw-20261104-ucrt-x86_64";
const SHA: &str = "552191b5754c49a5a20723276a6fc56541ea1922c4c50b7b669022333fc1b40f";
#[derive(Default)]
pub struct SetupState { busy: AtomicBool, cancel: AtomicBool, status: Mutex<String> }
#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct SetupInfo { supported: bool, busy: bool, message: String, destination: String, bytes: u64, ready: bool }
fn toolchains(app: &tauri::AppHandle) -> Result<PathBuf,String> { app.path().app_local_data_dir().map(|p|p.join("toolchains")).map_err(|_|"The compiler install folder is unavailable.".into()) }
pub fn installed(app: &tauri::AppHandle) -> Option<PathBuf> {
    if !cfg!(all(windows,target_arch="x86_64")) {return None}
    let root=toolchains(app).ok()?.join(ROOT);
    if std::fs::read_to_string(root.join("ate-verified.txt")).ok()?.trim()!=SHA {return None}
    let compiler=root.join("bin").join("clang.exe");
    compiler.is_file().then_some(compiler)
}
#[tauri::command]
pub fn compiler_setup_info(app: tauri::AppHandle) -> SetupInfo {
    let state=app.state::<SetupState>();
    let busy=state.busy.load(Ordering::SeqCst);
    let mut message=state.status.lock().unwrap().clone();
    let root=toolchains(&app).ok();
    if busy {if let Some(root)=&root {if let Ok(progress)=std::fs::read_to_string(root.join("setup-status.txt")){if progress.len()<2048 {message=progress}}}}
    SetupInfo {supported:cfg!(all(windows,target_arch="x86_64")),busy,message,destination:root.map(|r|r.join(ROOT).display().to_string()).unwrap_or_default(),bytes:191037046,ready:installed(&app).is_some()}
}
#[tauri::command]
pub fn cancel_compiler_setup(app: tauri::AppHandle) -> Result<(),String> {
    let state=app.state::<SetupState>();
    if state.busy.load(Ordering::SeqCst) {state.cancel.store(true,Ordering::SeqCst);std::fs::write(toolchains(&app)?.join("setup-cancel"),b"cancel").map_err(|_|"Cancellation could not be requested. Please retry.".to_string())?;}
    Ok(())
}
#[tauri::command]
pub async fn install_c_compiler(app: tauri::AppHandle) -> Result<String,String> {
    if !cfg!(all(windows,target_arch="x86_64")) {return Err("Optional compiler setup is available in the Windows x64 app. On Mac, use Apple's Command Line Tools.".into())}
    let state=app.state::<SetupState>();
    if state.busy.swap(true,Ordering::SeqCst) {return Err("Compiler setup is already running.".into())}
    state.cancel.store(false,Ordering::SeqCst);
    *state.status.lock().unwrap()="Preparing C compiler setup...".into();
    let handle=app.clone();
    let result=tauri::async_runtime::spawn_blocking(move||run_setup(&handle)).await.unwrap_or_else(|_|Err("Compiler setup could not complete. Please retry.".into()));
    if result.is_ok() {if let Some(path)=installed(&app){*app.state::<crate::c_check::CTools>().compiler.lock().unwrap()=Some(path);}}
    *state.status.lock().unwrap()=result.clone().unwrap_or_else(|e|e);
    state.busy.store(false,Ordering::SeqCst);
    result
}
fn run_setup(app: &tauri::AppHandle) -> Result<String,String> {
    if installed(app).is_some() {return Ok("C compiler is ready.".into())}
    let root=toolchains(app)?;
    std::fs::create_dir_all(&root).map_err(|_|"The compiler folder could not be created. Check free space and folder permissions.")?;
    let script=root.join("install-compiler.ps1");
    let status=root.join("setup-status.txt");
    let cancel=root.join("setup-cancel");
    let _=std::fs::remove_file(&cancel);
    let _=std::fs::remove_file(&status);
    std::fs::write(&script,include_str!("../../scripts/install-windows-compiler.ps1")).map_err(|_|"The compiler setup file could not be saved.")?;
    // Paths and the script are app-owned. No document text, URLs or commands come from JavaScript.
    let shell=PathBuf::from(std::env::var_os("SystemRoot").unwrap_or_else(||"C:\\Windows".into())).join("System32/WindowsPowerShell/v1.0/powershell.exe");
    let mut command=std::process::Command::new(shell);
    command.args(["-NoLogo","-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File"]).arg(&script).arg("-Destination").arg(&root).arg("-StatusPath").arg(&status).arg("-CancelPath").arg(&cancel);
    command.stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).stdin(std::process::Stdio::null());
    #[cfg(windows)] {use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}
    let outcome=(||{
        let mut child=command.spawn().map_err(|_|"Windows compiler setup could not start. Windows PowerShell is required.".to_string())?;
        let started=std::time::Instant::now();
        let mut cancelled_at=None;
        loop {
            if app.state::<SetupState>().cancel.load(Ordering::SeqCst) {
                let _=std::fs::write(&cancel,b"cancel");
                let when=cancelled_at.get_or_insert_with(std::time::Instant::now);
                if when.elapsed()>std::time::Duration::from_secs(10) {let _=child.kill();let _=child.wait();return Err("Setup cancelled. Your document is kept.".into())}
            }
            match child.try_wait() {
                Ok(Some(exit))=>{
                    if app.state::<SetupState>().cancel.load(Ordering::SeqCst) {return Err("Setup cancelled. Your document is kept.".into())}
                    if exit.success()&&installed(app).is_some(){return Ok("C compiler ready. Standard headers verified.".into())}
                    return Err(std::fs::read_to_string(&status).ok().filter(|s|!s.is_empty()&&s.len()<2048).unwrap_or_else(||"Compiler setup failed. Please retry; your document is kept.".into()))
                },
                Ok(None) if started.elapsed()<std::time::Duration::from_secs(1200)=>std::thread::sleep(std::time::Duration::from_millis(100)),
                _=>{let _=child.kill();let _=child.wait();return Err("Compiler setup timed out. Check your connection and disk space, then retry.".into())}
            }
        }
    })();
    let _=std::fs::remove_file(&script);
    let _=std::fs::remove_file(&cancel);
    let _=std::fs::remove_dir_all(root.join(".compiler-setup"));
    outcome
}
