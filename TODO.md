# ATE syntax checking TODO

Last updated: 2026-11-11 (America/Toronto).

## Progress

Implementation is committed on `syntax-checking`, reviewed through [PR #1](https://github.com/willyros01/clear-page/pull/1). **11 of 12 tasks verified within their documented scope**. SYN-12 remains in progress for installer/iPad/physical acceptance and release. Production downloads remain 0.4.1.

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
| SYN-01 | Detect language from extension and provide a manual selector for new/ambiguous files. | Verified | Node/Chromium/WebKit and Save As tests pass; manual choice survives recovery and native Save As. |
| SYN-02 | Add readable error underlines, line/column messages, error list and jump-to-error. | Verified | Chromium/WebKit and native Mac/Windows diagnostics, underlines, jump, themes/Vim pass; narrow layout inspected. |
| SYN-03 | Add Check Syntax command and debounced checks while typing. | Verified | Worker and native queue cancellation tests pass; manual/automatic checks, limits and unavailable states verified. |
| SYN-04 | Implement JavaScript and JSON checking. | Verified | Valid/invalid JS/JSON fixtures and live diagnostics pass; JSX file modes and non-execution tested. |
| SYN-05 | Implement HTML and CSS checking. | Verified | HTML inline JS/JSON/CSS and malformed CSS fixtures pass; parser limitations documented. |
| SYN-06 | Implement YAML checking. | Verified | YAML malformed flows, duplicate keys and multi-document fixtures pass. |
| SYN-07 | Add C highlighting, indentation and C-standard selection. | Verified | C extension/standard controls and four-space indentation tested; native C diagnostics work. |
| SYN-08 | Integrate desktop Clang syntax-only checking on Mac and Windows. | Verified | Native Mac/Windows and Mac sandbox probe pass with installed Clang; distributed app acceptance remains under SYN-12. |
| SYN-09 | Support C headers, include paths, macros and project compiler settings. | Verified | Five native Rust tests pass on both OSes, including project/local/additional headers and macros. |
| SYN-10 | Decide compiler setup/distribution and document licenses. | Verified | Decision: user-installed tools; no compiler/SDK bundle. JS notices bundled and proprietary ATE licensing retained. |
| SYN-11 | Assess TypeScript, Python, SQL, Markdown and iPad C checking. | Verified (assessment) | TypeScript syntax implemented; Python ast.parse and Markdown lint candidates assessed; SQL dialect and iPad C deferred explicitly. |
| SYN-12 | Verify, document and release approved changes across platforms. | In progress | Record automated results, native Mac/Windows checks and physical acceptance separately; update Help, ROADMAP and CHANGELOG before publication. |

## Acceptance record

[Verification run 43134841430](https://github.com/willyros01/clear-page/actions/runs/43134841430) passed all three jobs on code commit `75a55d599d493a4c3071ef5e438e736b2c51b899`:

- 23 Node tests: parsers, error locations, mixed HTML, Unicode Clang columns, language selection, cancellation, serialization, Save As/manual override, close/save regressions and C indentation.
- Chromium and WebKit: built assets under desktop nonce CSP; actual worker diagnostics, correction/clearing, language overrides/recovery, stale results, manual checks, settings persistence, narrow-screen layout, 36px text and Vim regressions. Screenshots inspected.
- Five Rust tests on each native OS: actual Clang with standard/project headers, additional include paths, macros, missing compiler, invalid macro configuration and malformed C.
- Real Mac and Windows native webviews: JavaScript underlines, error selection, correction, Clang diagnostics in the unsaved buffer, existing editing/layout/Vim tests.
- Mac App Sandbox probe: signed verification executable passed the same native UI tests and a Clang syntax-error check with sandbox entitlements. This is not acceptance of a distributed TestFlight app or arbitrary project/header access.

No physical-device syntax-checking acceptance yet. Existing Windows 0.4.1 acceptance covers indentation, highlighting and Vim only. Native Windows CI used its installed Clang toolchain; the recommended LLVM-MinGW download/setup still needs a clean-machine acceptance check.

## Progress log

| Date | Update | Evidence |
| --- | --- | --- |
| 2026-11-11 | Implementation and feasibility tasks SYN-01 through SYN-11 verified; release task remains open. | Runs 43133614516, 43134348229 and final 43134841430 passed; final run also passed the Mac sandbox probe. |
| 2026-11-11 | Implementation authorized; added parser workers, diagnostics UI, C adapter/settings and verification workflow. | Local tests pass; native/browser CI pending. |
| 2026-11-11 | Created tracked plan at the owner's request; selected Clang/LLVM as the recommended free desktop C compiler approach. | Planning only; all 12 implementation tasks Pending. |

## Technical references

- [Clang syntax-only checking](https://clang.llvm.org/get_started.html)
- [Apple Command Line Tools](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools)
- [LLVM-MinGW toolchain options](https://www.mingw-w64.org/downloads/)
- [LLVM license and redistribution policy](https://llvm.org/docs/DeveloperPolicy.html)

## Implementation notes

- SYN-01–06: language detection/manual selection, 26px issue list with jump-to-error, underlines, debounced worker checks, manual checks, stale-result cancellation and size/time limits are implemented. JavaScript/TypeScript/JSON/YAML/HTML/CSS use bundled offline parsers.
- SYN-07–09: C mode/standard and native Clang syntax-only adapter are implemented, with stdin for unsaved text, optional source folder, include directories and macros. Native checks are serialized and bounded; no source files or executables are produced. Five Rust integration tests cover real standard/project headers, macros, invalid code and setup validation. Compiler/project selection is session-only.
- SYN-10: use an existing user-installed compiler for this release. Mac: Apple Command Line Tools; Windows: LLVM-MinGW. No compiler or SDK is redistributed and no paid signing service is activated. ATE remains proprietary. Bundled JS package licenses are recorded in THIRD-PARTY-NOTICES.txt and included in the app assets.
- SYN-11: TypeScript syntax checking implemented; type checking deferred. Python candidate: a user-installed CPython `ast.parse` adapter (must parse the buffer without executing it). SQL requires a chosen dialect and matching validator before a checker can be promised. Markdown candidate: markdownlint, with selected document-style rules rather than compiler syntax checks. These three retain highlighting only. iPad C needs an evaluated on-device compiler/runtime; no remote service or embedded compiler added.
- SYN-12: version 0.5.0 prepared; Help updated; isolated browser/native verification workflow added. Release and physical acceptance remain outstanding.

## Remaining release gates (SYN-12)

- [ ] Validate the recommended LLVM-MinGW setup on a clean Windows machine.
- [ ] Build/verify the iPhone/iPad package and its offline worker behavior.
- [ ] Integrate the reviewed feature into the release branch, build installers, sign/notarize Mac and verify exact download checksums.
- [ ] Obtain physical-device acceptance for syntax checking, project headers, large text and Vim. Test the distributed Mac TestFlight edition separately from the website edition.
- [ ] Publish the accepted release and update the release record.

No 0.5.0 installer, TestFlight upload or website publication has been performed by this implementation task.
