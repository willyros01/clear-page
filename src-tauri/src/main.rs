#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;
use std::io::Write;
mod c_check;

#[tauri::command]
async fn check_c(app: tauri::AppHandle, text: String, standard: String, includes: Vec<String>, defines: Vec<String>) -> Result<c_check::CResult, String> {
    tauri::async_runtime::spawn_blocking(move || c_check::check(&app.state::<c_check::CTools>(), text, standard, includes, defines)).await.map_err(|_|"C checker could not complete".into())
}

#[tauri::command]
async fn choose_c_compiler(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let Some(file)=app.dialog().file().set_title("Choose your installed Clang compiler executable").blocking_pick_file() else{return Ok(None)};
    let path=file.into_path().map_err(|_|"Choose a local Clang executable")?;
    let display=path.to_string_lossy().into_owned();
    *app.state::<c_check::CTools>().compiler.lock().unwrap()=Some(path);
    Ok(Some(display))
}

#[tauri::command]
async fn choose_c_project(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let Some(folder)=app.dialog().file().set_title("Choose the C source folder for relative headers").blocking_pick_folder() else{return Ok(None)};
    let path=folder.into_path().map_err(|_|"Choose a local folder")?;
    let display=path.to_string_lossy().into_owned();
    *app.state::<c_check::CTools>().project.lock().unwrap()=Some(path);
    Ok(Some(display))
}

struct ExitAllowed(AtomicBool);

// The destination can only come from the native Save dialog. JavaScript cannot
// supply arbitrary filesystem paths, and cancelling never writes a file.
#[tauri::command]
async fn save_document(app: tauri::AppHandle, text: String, name: String) -> Result<Option<String>, String> {
    let safe_name: String = name.chars().map(|c| if c.is_control() || "/\\:".contains(c) { '_' } else { c }).collect();
    let file_name = if safe_name.trim().is_empty() { "Untitled.txt" } else { &safe_name };
    let selected = app.dialog().file().set_title("Save ATE document").set_file_name(file_name).blocking_save_file();
    let Some(selected) = selected else { return Ok(None) };
    let path = selected.into_path().map_err(|_| "Choose a local file destination".to_string())?;
    atomicwrites::AtomicFile::new(&path, atomicwrites::AllowOverwrite)
        .write(|file| file.write_all(text.as_bytes()))
        .map_err(|_| "Could not save the file; your recovery draft is kept".to_string())?;
    Ok(Some(path.file_name().unwrap_or_default().to_string_lossy().into_owned()))
}

#[tauri::command]
fn exit_editor(app: tauri::AppHandle) {
    app.state::<ExitAllowed>().0.store(true, Ordering::SeqCst);
    app.exit(0);
}

// The verification bridge is excluded from all distribution builds.
#[cfg(feature = "editor-verification")]
#[tauri::command]
fn editor_verification_result(app: tauri::AppHandle, passed: bool, report: String) {
    let path = std::env::var("ATE_VERIFICATION_REPORT").expect("Verification report path required");
    println!("{report}");
    let _ = std::fs::write(path, report);
    app.state::<ExitAllowed>().0.store(true, Ordering::SeqCst);
    app.exit(if passed { 0 } else { 1 });
}

fn main() {
    let builder = tauri::Builder::default()
        .manage(ExitAllowed(AtomicBool::new(false)))
        .manage(c_check::CTools::default())
        .plugin(tauri_plugin_dialog::init())
        ;
    #[cfg(feature = "editor-verification")]
    let builder = builder
        .invoke_handler(tauri::generate_handler![save_document, exit_editor, check_c, choose_c_compiler, choose_c_project, editor_verification_result])
        .on_page_load(|webview, payload| {
            if matches!(payload.event(), tauri::webview::PageLoadEvent::Finished) {
                let _ = webview.eval(include_str!("../../tests/native-editor.js"));
            }
        });
    #[cfg(not(feature = "editor-verification"))]
    let builder = builder.invoke_handler(tauri::generate_handler![save_document, exit_editor, check_c, choose_c_compiler, choose_c_project]);
    let app = builder
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if !window.state::<ExitAllowed>().0.load(Ordering::SeqCst) {
                    api.prevent_close();
                    let _ = window.emit("ate-exit-requested", ());
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("Could not start ATE");
    app.run(|handle, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event {
            if !handle.state::<ExitAllowed>().0.load(Ordering::SeqCst) {
                api.prevent_exit();
                let _ = handle.emit("ate-exit-requested", ());
            }
        }
    });
}
