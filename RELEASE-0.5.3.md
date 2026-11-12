# ATE 0.5.3 desktop release verification

Updated 12 November 2026 (UTC). The owner approved using the existing iOS offline C parser as the desktop default, with installed Clang retained as an optional advanced checker.

## Behavior

- Mac and Windows default to **Basic offline parser**, including upgrades whose saved preferences do not name a checker. No compiler setup, download or compiler invocation is needed in this mode.
- **Menu → C settings → C checking → Advanced: installed Clang** explicitly enables the existing native Clang integration. The choice is remembered. Switching back to Basic cancels stale checks and hides compiler settings and download offers.
- Basic checks cover structural C syntax. They do not resolve headers, expand macros, check types or certify C-standard conformance. Neither mode builds or runs the program.
- Windows retains optional, integrity-checked LLVM-MinGW setup. Mac can use an existing compatible Clang. No Zig or TinyCC integration was added.
- Controls retain 12pt text, headings at most 14pt, and the independently adjustable 36px default document font.
- iOS and Android remain **0.5.2 (17)** and already include the offline C parser; no mobile rebuild is part of this release.

## Verification

Source: `f79c1c7542837ec8f02761d19124ff9d68cdaba2`.
[Desktop release run 43222957484](https://github.com/willyros01/clear-page/actions/runs/43222957484).

The first attempt, run 43221783652, stopped at a verification-only JavaScript call counter that could not intercept the native bridge. Both platforms had already passed real offline C parsing and returned Clang diagnostics. The corrected verification build counts native checks in Rust; its counter and reporting commands are excluded from public builds.

30 Node tests, Chromium/WebKit, five native compiler/settings tests on each desktop OS, and both actual native editor webview gates passed. The native gates cover Basic C/Wasm under the real desktop CSP, zero compiler calls in Basic mode, explicit Advanced Clang diagnostics, preference persistence, 12pt controls, 36px document text, indentation, highlighting and Vim. Public apps are rebuilt without the verification bridge.

| Distribution | Verified result |
| --- | --- |
| Universal Mac TestFlight | 0.5.3 (18), Apple VALID, IN_BETA_TESTING and assigned to the existing internal tester group. Build `eace5c46-af45-4aa1-8559-15fe6ac3c4fe`. |
| Universal Mac website | 0.5.3, Developer ID team VXMLKHF72B, notarization Accepted, stapled ticket and publisher Gatekeeper acceptance. Artifact `13947389686`. |
| Windows website | x64 installer installed and launched in CI. Optional compiler setup/cancellation/integrity and native detection passed. Artifact `13947042687`; unsigned by the owner's existing decision. |

## Public download integrity

[Cuberoot publisher 43226821763](https://github.com/willyros01/Cuberoot/actions/runs/43226821763) verified the exact release artifacts, Mac signature/universal architectures/stapling/Gatekeeper and Windows installer provenance. It requested Pages deployment, then fetched both live downloads and matched their lengths and SHA-256 hashes. Independent public downloads matched the same values. The publisher now reads the report through GitHub's authenticated contents API, avoiding the older cached raw-report result seen in its first publication check.

| Public file | Bytes | SHA-256 |
| --- | ---: | --- |
| `ate-windows.exe` | 2,609,281 | `ffd4a26f7eff4ac4bbee98d9b7f3f1d9194c3a935fc58a6b57411592ef30f68c` |
| `ate-mac.dmg` | 6,667,344 | `310258e7697ca366ed4f0ff8ec1641776dcddb12ef40385cc3f066a13443297e` |

[ATE downloads and guides](https://www.cuberoot-systems.com/ate/). Guide commit `6360d174f9761cfba75885b86c1dd85106aa3ce2` updates both online guides and both large-print PDFs for compiler-free Basic checks and opt-in Clang. All 20 PDF pages were rendered and visually reviewed. Live guide text and both PDF hashes were independently verified after Pages deployment.

The iOS 0.5.2 (17) and Android 0.5.2 (17) binaries and their public metadata were not rebuilt or replaced. Their evidence remains in RELEASE-0.5.2.md.

## Physical acceptance

CI native webview checks establish behavior in their named environments. Installation/update visibility and keyboard, file and syntax behavior on the owner's physical Mac and Windows machines remain separate acceptance items. Apple processing/internal TestFlight availability does not establish a public App Store release.
