# C syntax checking in ATE

iPad/iPhone TestFlight **0.5.0 (15)** includes a basic C syntax checker. It is bundled in the app and needs no compiler download. It catches structural syntax errors such as missing semicolons/braces; it does not resolve headers, expand macros, check types, enforce a C standard or build/run code. Choose Menu → Check syntax, or enable Check while typing.

The following compiler setup instructions apply to the desktop edition, which uses installed Clang. The desktop 0.5.0 release remains pending. See TODO.md for platform status.

## Free compiler setup

ATE uses a compiler already installed on your computer. The compiler and platform SDK are not bundled with this release, and no paid service or account is required by ATE.

- **Mac:** Install Apple's Command Line Tools (`xcode-select --install` in Terminal). Full Xcode is not required. ATE tries `clang` on PATH.
- **Windows:** Install/extract an official LLVM-MinGW toolchain matching your Windows architecture. Select its `bin/clang.exe` in ATE if it is not on PATH. A standalone LLVM package may need additional headers/SDK setup; LLVM-MinGW includes the Windows development headers and libraries.

Download tools from their official sources:

- https://developer.apple.com/documentation/xcode/installing-the-command-line-tools
- https://www.mingw-w64.org/downloads/
- https://github.com/mstorsjo/llvm-mingw

## Use in ATE

1. Open a `.c` or `.h` file, or choose **Language → C** in Menu.
2. Open **Menu → C settings**. Select your installed Clang compiler if needed. C17 is the default; C99, C11 and C23 are also selectable. Older Clang versions may not accept C23.
3. For quoted relative headers, choose the folder containing the current source file. Enter additional include directories one per line; relative entries resolve from this selected folder.
4. Enter any preprocessor macros one per line, using `NAME` or `NAME=value`.
5. Choose **Menu → Check syntax**, or enable **Check while typing**. Select an issue to jump to its line.

Only the editor buffer is passed to the compiler, through standard input. Included headers are read from disk; unsaved changes in other files are not available. Compiler/project-folder selections last for the current app session. Standard/include/macro preferences are kept on this device.

## Limits and diagnostic meaning

- ATE invokes Clang with `-fsyntax-only`; it does not create object files, link, or run your program.
- Clang may report warnings and semantic compiler errors as well as syntax errors.
- “No syntax errors found” is not proof that the program works. Runtime bugs and link errors are outside this check.
- Missing compiler, missing headers, unsupported standards and errors in included files are shown as setup/context issues. They must not be treated as a clean result.
- Checks are limited to 512K characters, 32 include directories, 32 macros, 10 seconds of compiler time and bounded diagnostic output. Stale results are ignored, and requests are serialized.
- No arbitrary compiler flags, shell commands, plugins or build scripts are accepted by this integration. A compiler selected through the native file chooser must be a trusted local executable.
- Checks stay on the device. ATE does not send source text to a remote compiler.
- iPad/web basic structural C checks are being added with bundled Tree-sitter C/Wasm. No compiler download is needed there. Header resolution, macro expansion, type checking and C-standard conformance remain desktop compiler features.

## Licensing

ATE remains proprietary. This version uses the user's compiler rather than redistributing Clang or an Apple/Windows SDK. The bundled JavaScript packages retain their own licenses, included in THIRD-PARTY-NOTICES.txt. Any future compiler bundle needs a separate review of the exact compiler, runtime, headers, SDK and notices before distribution.

## Planned optional setup
The owner approved adding a Get free C compiler action when Clang is missing. Mac setup will use Apple’s official installation flow; Windows setup will use a verified official LLVM-MinGW download, with progress/cancel and subsequent compiler detection. Later keeps editing available without a compiler. This optional setup is not implemented yet; see SYN-13 in TODO.md.
