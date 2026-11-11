#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;
use std::io::Write;

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

fn main() {
    let app = tauri::Builder::default()
        .manage(ExitAllowed(AtomicBool::new(false)))
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_document, exit_editor])
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
