# ATE syntax checking TODO

Last updated: 2026-11-11 (America/Toronto).

## Progress

Implementation started on `syntax-checking`. **0 of 12 tasks verified**; 10 implemented and awaiting platform verification, 1 assessed, 1 in progress.

Statuses: Pending → In progress → Implemented → Verified. Assessed records a documented feasibility decision. Use Blocked when a dependency prevents work. Mark a task Verified only with evidence; automated checks and physical-device acceptance must be recorded separately. Update this table and the progress log with each change.

## Scope and decisions

- Add code checking based on document language, distinct from syntax highlighting and indentation already available in several modes.
- Initial target: JavaScript, JSON, HTML, CSS, YAML and C. Additional candidates: TypeScript, Python, SQL and Markdown.
- C desktop recommendation: Clang/LLVM; Apple Command Line Tools on Mac, LLVM-MinGW on Windows. Tools are free. Compiler integration, packaging and licensing review remain pending.
- Keep ATE proprietary. Retain required third-party licenses/notices; do not change ATE's license.
- Prefer local/offline checking. Do not execute user programs as part of checking or upload document contents.
- Keep shared editor behavior with thin native adapters. Preserve 36px default text, adjustable sizing, themes and Vim behavior.
- The owner authorized implementation on 11 November 2026. Changes are verified on `syntax-checking` before integration into the release branch; production downloads remain 0.4.1 until release verification.

## Tracked tasks

| ID | Work | Status | Completion evidence / next step |
| --- | --- | --- | --- |
| SYN-01 | Detect language from extension and provide a manual selector for new/ambiguous files. | Implemented | Define supported extensions and override behavior; verify open, new and Save As. |
| SYN-02 | Add readable error underlines, line/column messages, error list and jump-to-error. | Implemented | Verify large text, keyboard/touch, light/dark themes and Vim coexistence. |
| SYN-03 | Add Check Syntax command and debounced checks while typing. | Implemented | Cancel/ignore stale results; handle large files and unavailable checkers; never run user code. |
| SYN-04 | Implement JavaScript and JSON checking. | Implemented | Select parsers; verify valid/invalid fixtures, modern JS and precise error positions. |
| SYN-05 | Implement HTML and CSS checking. | Implemented | Select validators; define error/warning scope, including mixed-language documents. |
| SYN-06 | Implement YAML checking. | Implemented | Select parser; verify indentation/structure errors and useful diagnostics. |
| SYN-07 | Add C highlighting, indentation and C-standard selection. | Implemented | Verify .c/.h language selection, comments, strings, preprocessor and Vim editing. |
| SYN-08 | Integrate desktop Clang syntax-only checking on Mac and Windows. | Implemented | Use -fsyntax-only; map diagnostics to the current unsaved buffer; verify both native platforms. |
| SYN-09 | Support C headers, include paths, macros and project compiler settings. | Implemented | Verify standard headers and a multi-file project; distinguish missing setup from code errors. |
| SYN-10 | Decide compiler setup/distribution and document licenses. | Implemented | Evaluate detecting existing tools versus optional bundling; include all required headers/libraries/notices and assess download size. No paid services. |
| SYN-11 | Assess TypeScript, Python, SQL, Markdown and iPad C checking. | Assessed | Record a suitable checker and limitations per language/platform. SQL needs a dialect; Markdown checks are linting. iPad C requires a separate feasibility decision. |
| SYN-12 | Verify, document and release approved changes across platforms. | In progress | Record automated results, native Mac/Windows checks and physical acceptance separately; update Help, ROADMAP and CHANGELOG before publication. |

## Acceptance record

Local Node checks pass for valid/invalid parser fixtures, mixed HTML, Unicode Clang diagnostics, language detection, worker cancellation and native request serialization; existing close/save regressions pass. Browser launch is restricted in this workspace, so Chromium/WebKit and real native Mac/Windows checks run in CI. No physical-device syntax-checking acceptance yet. Existing Windows 0.4.1 acceptance covers indentation, highlighting and Vim only.

## Progress log

| Date | Update | Evidence |
| --- | --- | --- |
| 2026-11-11 | Implementation authorized; added parser workers, diagnostics UI, C adapter/settings and verification workflow. | Local tests pass; native/browser CI pending. |
| 2026-11-11 | Created tracked plan at the owner's request; selected Clang/LLVM as the recommended free desktop C compiler approach. | Planning only; all 12 implementation tasks Pending. |

## Technical references

- [Clang syntax-only checking](https://clang.llvm.org/get_started.html)
- [Apple Command Line Tools](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools)
- [LLVM-MinGW toolchain options](https://www.mingw-w64.org/downloads/)
- [LLVM license and redistribution policy](https://llvm.org/docs/DeveloperPolicy.html)

## Implementation notes

- SYN-01–06: language detection/manual selection, 26px issue list with jump-to-error, underlines, debounced worker checks, manual checks, stale-result cancellation and size/time limits are implemented. JavaScript/TypeScript/JSON/YAML/HTML/CSS use bundled offline parsers.
- SYN-07–09: C mode/standard and native Clang syntax-only adapter are implemented, with stdin for unsaved text, optional source folder, include directories and macros. Native checks are serialized and bounded; no source files or executables are produced. Six Rust integration tests cover real standard/project headers, macros, invalid code and setup validation. Compiler/project selection is session-only.
- SYN-10: use an existing user-installed compiler for this release. Mac: Apple Command Line Tools; Windows: LLVM-MinGW. No compiler or SDK is redistributed and no paid signing service is activated. ATE remains proprietary. Bundled JS package licenses are recorded in THIRD-PARTY-NOTICES.txt and included in the app assets.
- SYN-11: TypeScript syntax checking implemented; type checking deferred. Python candidate: a user-installed CPython `ast.parse` adapter (must parse the buffer without executing it). SQL requires a chosen dialect and matching validator before a checker can be promised. Markdown candidate: markdownlint, with selected document-style rules rather than compiler syntax checks. These three retain highlighting only. iPad C needs an evaluated on-device compiler/runtime; no remote service or embedded compiler added.
- SYN-12: version 0.5.0 prepared; Help updated; isolated browser/native verification workflow added. Release and physical acceptance remain outstanding.
