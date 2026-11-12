use serde::Serialize;
use std::{io::{Read, Write}, path::PathBuf, process::{Command, Stdio}, sync::{atomic::{AtomicBool, Ordering}, Mutex}, time::{Duration, Instant}};

#[derive(Default)]
pub struct CTools {
    pub compiler: Mutex<Option<PathBuf>>,
    pub project: Mutex<Option<PathBuf>>,
    busy: AtomicBool,
}
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CResult { pub status: String, pub output: String, pub message: String }
fn unavailable(message: &str) -> CResult { CResult {status:"unavailable".into(), output:String::new(), message:message.into()} }
struct Busy<'a>(&'a AtomicBool);
impl Drop for Busy<'_> {fn drop(&mut self){self.0.store(false, Ordering::SeqCst)}}

pub fn check(tools: &CTools, text: String, standard: String, includes: Vec<String>, defines: Vec<String>) -> CResult {
    if tools.busy.swap(true, Ordering::SeqCst) { return unavailable("A C check is already running. Please check again shortly.") }
    let _busy=Busy(&tools.busy);
    if text.len()>2*1024*1024 {return unavailable("C checking is limited to 512K characters.")}
    if !["c99","c11","c17","c23"].contains(&standard.as_str()) {return unavailable("Choose a supported C standard.")}
    if includes.len()>32 || defines.len()>32 {return unavailable("Use at most 32 include paths and 32 macros.")}
    let project=tools.project.lock().unwrap().clone();
    let compiler=tools.compiler.lock().unwrap().clone().unwrap_or_else(||PathBuf::from("clang"));
    let mut command=Command::new(compiler);
    // No shell, object generation, linking, or execution of the user's program.
    command.args(["-x","c","-fsyntax-only","-Wall","-Wextra","-fno-color-diagnostics","-fno-caret-diagnostics","-ferror-limit=30","-fmessage-length=0","-fno-crash-diagnostics"]);
    command.arg(format!("-std={standard}"));
    if let Some(root)=&project {command.current_dir(root).arg("-iquote").arg(root);}
    for path in includes {
        if path.len()>4096 || path.contains('\0') {return unavailable("An include path is invalid.")}
        let mut path=PathBuf::from(path);
        if path.is_relative() {let Some(root)=&project else {return unavailable("Choose a C project folder before using relative include paths.")};path=root.join(path);}
        if !path.is_dir() {return unavailable("An include directory does not exist. Check C settings.")}
        command.arg("-I").arg(path);
    }
    for define in defines {
        let name=define.split('=').next().unwrap_or("");
        if name.is_empty() || !name.chars().enumerate().all(|(i,c)|c=='_' || c.is_ascii_alphabetic() || (i>0&&c.is_ascii_digit())) || define.len()>512 || define.chars().any(|c|c.is_control()) {
            return unavailable("Macros must use NAME or NAME=value, one per line.")
        }
        command.arg(format!("-D{define}"));
    }
    command.arg("-").stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::piped());
    #[cfg(windows)]
    {use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}
    let mut child=match command.spawn(){Ok(c)=>c,Err(_)=>return unavailable("Clang could not start. Install Apple Command Line Tools on Mac, or LLVM-MinGW on Windows, then select clang in C settings.")};
    let mut input=child.stdin.take().unwrap();
    let writer=std::thread::spawn(move||input.write_all(text.as_bytes()));
    let output=child.stderr.take().unwrap();
    let reader=std::thread::spawn(move||{let mut bytes=Vec::new();let _=output.take(256*1024).read_to_end(&mut bytes);bytes});
    let start=Instant::now();
    let status=loop {
        match child.try_wait() {
            Ok(Some(status))=>break Some(status),
            Ok(None) if start.elapsed()<Duration::from_secs(10)=>std::thread::sleep(Duration::from_millis(30)),
            _=>{let _=child.kill();let _=child.wait();break None}
        }
    };
    let write_result=writer.join();
    let output=String::from_utf8_lossy(&reader.join().unwrap_or_default()).into_owned();
    let Some(status)=status else{return unavailable("C syntax checking timed out after 10 seconds.")};
    if !matches!(write_result,Ok(Ok(()))) && status.success(){return unavailable("Clang did not receive the full document. Please check again.")}
    let checked=status.success() || output.contains("<stdin>:");
    CResult {status:if checked {"checked"}else{"unavailable"}.into(),output,message:if checked {"C syntax and compiler diagnostics only; the program was not built or run."}else{"Clang could not check this document. Check the compiler, C standard and header settings."}.into()}
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn rejects_compiler_options_in_macro_names(){let r=check(&CTools::default(),"".into(),"c17".into(),vec![],vec!["-include=bad".into()]);assert_eq!(r.status,"unavailable");assert!(r.message.contains("Macros"));}
    #[test] fn requires_project_for_relative_headers(){let r=check(&CTools::default(),"".into(),"c17".into(),vec!["include".into()],vec![]);assert!(r.message.contains("project folder"));}
    #[test] fn missing_compiler_is_setup_failure(){
        let tools=CTools::default();*tools.compiler.lock().unwrap()=Some(PathBuf::from("ate-compiler-that-does-not-exist"));
        let r=check(&tools,"int x;".into(),"c17".into(),vec![],vec![]);assert_eq!(r.status,"unavailable");assert!(r.message.contains("could not start"));
    }
    #[test] fn real_clang_resolves_project_and_additional_headers(){
        let root=std::env::temp_dir().join(format!("ate-c-test-{}-{}",std::process::id(),std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        std::fs::create_dir_all(root.join("include")).unwrap();
        std::fs::write(root.join("local.h"),"#define LOCAL_VALUE 1\n").unwrap();
        std::fs::write(root.join("include").join("extra.h"),"int declared_function(int value);\n").unwrap();
        let tools=CTools::default();*tools.project.lock().unwrap()=Some(root.clone());
        let result=check(&tools,"#include \"local.h\"\n#include <extra.h>\nint f(void) { return declared_function(LOCAL_VALUE); }".into(),"c17".into(),vec!["include".into()],vec![]);
        let _=std::fs::remove_dir_all(root);
        assert_eq!(result.status,"checked","{result:?}");assert!(!result.output.contains("error:"),"{result:?}");
    }
    #[test] fn real_clang_checks_headers_macros_and_unsaved_errors(){
        let tools=CTools::default();
        let r=check(&tools,"#include <stdio.h>\n#ifndef ATE_TEST\n#error Missing macro\n#endif\nint main(void) { puts(\"hello\"); return ATE_TEST; }".into(),"c17".into(),vec![],vec!["ATE_TEST=0".into()]);
        assert_eq!(r.status,"checked","{r:?}");assert!(!r.output.contains("error:"),"{r:?}");
        let r=check(&tools,"int main(void) { return 0 }".into(),"c17".into(),vec![],vec![]);
        assert_eq!(r.status,"checked");assert!(r.output.contains("expected ';'"),"{r:?}");
    }
}
