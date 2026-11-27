#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;
use std::io::Write;
mod c_check;
mod projects;
use projects::{project_io,save_project_zip};
mod compiler_setup;
use compiler_setup::{compiler_setup_info,install_c_compiler,cancel_compiler_setup};

// GitHub pages ATE's GitHub screen links to: the sign-in code page, the page that gives ATE
// repositories, and one Actions job page. Nothing else on github.com, and never a command.
fn github_link_ok(url: &str) -> bool {
    if url == "https://github.com/login/device" || url == "https://github.com/apps/ate-another-text-editor/installations/new" { return true; }
    let Some(path) = url.strip_prefix("https://github.com/") else { return false };
    let parts: Vec<&str> = path.split('/').collect();
    let name_ok = |s: &str, max: usize| !s.is_empty() && s.len() <= max && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.') && s != "." && s != "..";
    let digits = |s: &str| !s.is_empty() && s.len() <= 20 && s.chars().all(|c| c.is_ascii_digit());
    parts.len() == 7 && name_ok(parts[0], 39) && name_ok(parts[1], 100) && parts[2] == "actions" && parts[3] == "runs" && digits(parts[4]) && parts[5] == "job" && digits(parts[6])
}

// Open only the fixed public help/legal destinations, never a user-supplied command.
#[tauri::command]
fn open_public_link(url: String) -> Result<(), String> {
    let allowed = [
        "https://www.cuberoot-systems.com/ate/privacy/",
        "https://www.cuberoot-systems.com/ate/support/",
        "https://www.cuberoot-systems.com/ate/quick-start/",
        "https://www.cuberoot-systems.com/ate/guide/",
        "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
    ];
    if !allowed.contains(&url.as_str()) && !github_link_ok(&url) { return Err("Unsupported help link".into()); }
    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("/usr/bin/open").arg(&url).spawn();
    #[cfg(target_os = "windows")]
    let result = std::process::Command::new("rundll32.exe").args(["url.dll,FileProtocolHandler", &url]).spawn();
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let result = std::process::Command::new("xdg-open").arg(&url).spawn();
    result.map(|_| ()).map_err(|_| "Could not open browser".into())
}

#[tauri::command]
async fn check_c(app: tauri::AppHandle, text: String, standard: String, includes: Vec<String>, defines: Vec<String>) -> Result<c_check::CResult, String> {
    #[cfg(feature = "editor-verification")]
    app.state::<CVerificationCalls>().0.fetch_add(1, Ordering::SeqCst);
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
    let file_name = if safe_name.trim().is_empty() { "Untitled" } else { &safe_name };
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
struct CVerificationCalls(std::sync::atomic::AtomicUsize);

#[cfg(feature = "editor-verification")]
#[tauri::command]
fn c_verification_calls(app: tauri::AppHandle) -> usize {
    app.state::<CVerificationCalls>().0.load(Ordering::SeqCst)
}

#[cfg(feature = "editor-verification")]
#[tauri::command]
fn editor_verification_result(app: tauri::AppHandle, passed: bool, report: String) {
    let path = std::env::var("ATE_VERIFICATION_REPORT").expect("Verification report path required");
    println!("{report}");
    let _ = std::fs::write(path, report);
    app.state::<ExitAllowed>().0.store(true, Ordering::SeqCst);
    app.exit(if passed { 0 } else { 1 });
}

// True inside the Mac App Store sandbox, where macOS refuses to start Clang.
#[tauri::command]
fn app_sandboxed() -> bool { std::env::var_os("APP_SANDBOX_CONTAINER_ID").is_some() }

// Open the window no larger than the screen it is on (above the taskbar or Dock),
// so the bottom line and the right-hand buttons are never off-screen.
fn fit_to_screen(window: &tauri::WebviewWindow) {
    let Some(monitor) = window.current_monitor().ok().flatten().or_else(|| window.primary_monitor().ok().flatten()) else { return };
    let (Ok(outer), Ok(inner), Ok(pos)) = (window.outer_size(), window.inner_size(), window.outer_position()) else { return };
    // A window not yet shown may report no frame size; then its frame is treated as zero.
    let outer = if outer.width < inner.width || outer.height < inner.height { inner } else { outer };
    let area = monitor.work_area();
    let (ax, ay, aw, ah) = (area.position.x, area.position.y, area.size.width, area.size.height);
    let (w, h) = (outer.width.min(aw), outer.height.min(ah));
    if (w, h) != (outer.width, outer.height) {
        let frame_w = outer.width.saturating_sub(inner.width);
        let frame_h = outer.height.saturating_sub(inner.height);
        let _ = window.set_size(tauri::PhysicalSize::new(w.saturating_sub(frame_w), h.saturating_sub(frame_h)));
        let _ = window.set_position(tauri::PhysicalPosition::new(ax + ((aw - w) / 2) as i32, ay + ((ah - h) / 2) as i32));
    } else {
        // Same size, but keep the whole window on the screen.
        let x = pos.x.clamp(ax, ax + (aw - w) as i32);
        let y = pos.y.clamp(ay, ay + (ah - h) as i32);
        if (x, y) != (pos.x, pos.y) { let _ = window.set_position(tauri::PhysicalPosition::new(x, y)); }
    }
}

#[cfg(feature = "editor-verification")]
#[tauri::command]
fn window_fit_report(window: tauri::WebviewWindow) -> String {
    let monitor = window.current_monitor().ok().flatten();
    let (Some(m), Ok(pos), Ok(size)) = (monitor, window.outer_position(), window.outer_size()) else {
        return r#"{"fits":false,"error":"window or screen size unavailable"}"#.into();
    };
    let a = m.work_area();
    let fits = pos.x >= a.position.x && pos.y >= a.position.y
        && pos.x + size.width as i32 <= a.position.x + a.size.width as i32
        && pos.y + size.height as i32 <= a.position.y + a.size.height as i32;
    format!(r#"{{"fits":{},"window":[{},{},{},{}],"screen":[{},{},{},{}]}}"#, fits, pos.x, pos.y, size.width, size.height,
        a.position.x, a.position.y, a.size.width, a.size.height)
}

#[cfg(feature = "editor-verification")]
#[tauri::command]
async fn store_capture(label: String) -> Result<(), String> {
    if !["01-editor", "02-syntax", "03-projects"].contains(&label.as_str()) { return Err("Invalid capture label".into()); }
    let Some(root) = std::env::var_os("ATE_STORE_CAPTURE_DIR") else { return Ok(()) };
    tauri::async_runtime::spawn_blocking(move || {
        let root = std::path::PathBuf::from(root);
        std::fs::write(root.join("ready"), &label).map_err(|e| e.to_string())?;
        for _ in 0..120 { if root.join(format!("{}.done", label)).exists() { return Ok(()); } std::thread::sleep(std::time::Duration::from_millis(500)); }
        Err("Native screenshot capture timed out".to_string())
    }).await.map_err(|e| e.to_string())?
}

fn main() {
    let builder = tauri::Builder::default()
        .manage(compiler_setup::SetupState::default())
        .manage(ExitAllowed(AtomicBool::new(false)))
        .manage(c_check::CTools::default())
        .plugin(tauri_plugin_dialog::init())
        ;
    #[cfg(feature = "editor-verification")]
    let builder = builder
        .manage(CVerificationCalls(std::sync::atomic::AtomicUsize::new(0)))
        .invoke_handler(tauri::generate_handler![open_public_link, project_io, save_project_zip, save_document, exit_editor, check_c, choose_c_compiler, choose_c_project, compiler_setup_info, install_c_compiler, cancel_compiler_setup, app_sandboxed, editor_verification_result, store_capture, c_verification_calls, window_fit_report])
        .on_page_load(|webview, payload| {
            if matches!(payload.event(), tauri::webview::PageLoadEvent::Finished) {
                let _ = webview.eval(include_str!("../../tests/native-editor.js"));
            }
        });
    #[cfg(not(feature = "editor-verification"))]
    let builder = builder.invoke_handler(tauri::generate_handler![open_public_link, project_io, save_project_zip, save_document, exit_editor, check_c, choose_c_compiler, choose_c_project, compiler_setup_info, install_c_compiler, cancel_compiler_setup, app_sandboxed]);
    let app = builder
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if !window.state::<ExitAllowed>().0.load(Ordering::SeqCst) {
                    api.prevent_close();
                    let _ = window.emit("ate-exit-requested", ());
                }
            }
        })
        .setup(|app| {
                    if let Some(window) = app.get_webview_window("main") {
                fit_to_screen(&window);
                let _ = window.show();
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Could not start ATE");
    if let Some(compiler)=compiler_setup::installed(app.handle()) { *app.state::<c_check::CTools>().compiler.lock().unwrap()=Some(compiler); }
    app.run(|handle, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event {
            if !handle.state::<ExitAllowed>().0.load(Ordering::SeqCst) {
                api.prevent_exit();
                let _ = handle.emit("ate-exit-requested", ());
            }
        }
    });
}
