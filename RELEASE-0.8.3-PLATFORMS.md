# ATE 0.8.3 (24) — platform release record

## Available releases

| Platform | Verified status |
| --- | --- |
| iPhone/iPad | Existing accepted TestFlight build remains unchanged; Apple build `f496fa71-3eb5-4361-850c-ddd63904427c` |
| Mac TestFlight | VALID / IN_BETA_TESTING; Apple build `baa2893b-a90b-4785-9785-091735c21119` |
| Universal Mac installer | Developer ID-signed, notarization Accepted and stapled; Intel and Apple silicon architectures verified |
| Windows x64 installer | Exact tested installer installed/launched and published; optional LLVM-MinGW setup verified |
| Web | Published with exact asset hashes and a live browser smoke test |
| Android APK | Independent native verification in progress on branch `android`; previous public APK is preserved |

- [Web app](https://www.cuberoot-systems.com/ate/app/)
- [Universal Mac download](https://www.cuberoot-systems.com/downloads/ate-mac.dmg?build=43734007478)
- [Windows download](https://www.cuberoot-systems.com/downloads/ate-windows.exe?build=43734007478)
- [ATE download page](https://www.cuberoot-systems.com/ate/)

## Preserved successful desktop artifacts

Application source `f52d12ec97793e34c3b2471509b0d0094d6ae9b7` passed the individual browser, Mac and Windows jobs in [native build 43732522398](https://github.com/willyros01/clear-page/actions/runs/43732522398). Android failed in that run; the overall run is not described as passing.

At the owner's direction, Mac and Windows were separated from Android rather than repeatedly rebuilt. [Release 43734007478](https://github.com/willyros01/clear-page/actions/runs/43734007478), source `bf28c25f0a8bf917e9fcd26c12ebded3cb033dc8`, reused the exact successful artifacts. Provenance checks allow only the new release workflow/helper to differ from the tested application source. The Windows executable and web assets were not recompiled or modified; their copied manifests retain `verified_build_run_id` and `verified_build_source_sha`. The Mac app was exported from its existing universal archive for managed TestFlight signing and Developer ID notarization.

All 59 Node tests, Chromium/WebKit regression, real IndexedDB/ZIP/recovery tests, native Mac/Windows parser/editor/project filesystem checks, Rust tests and Windows installer checks passed for those artifacts. Mac runtime verification ran on the CI Mac host; the universal executable includes both arm64 and x86_64. Physical Intel acceptance is not claimed.

## Public byte verification

[Publication job 132874525383](https://github.com/willyros01/Cuberoot/actions/runs/43734647145/job/132874525383) verified both public installers at 11:19 America/Toronto on 15 November 2026.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| ate-mac.dmg | 12017736 | `525e102a24c847a8e2637d4e3535a1d6c4aac95fea4a932dfd7bbbe95bdf9e8f` |
| ate-windows.exe | 5256427 | `33f0669044a8fa2914276ac9cd01039aa02ce20e17401d7498c9cf47c20186d7` |

[Web publication 43734921336](https://github.com/willyros01/Cuberoot/actions/runs/43734921336) verified every public asset, version 0.8.3 (24), SQL checking, tabs and real browser project creation at 11:21 America/Toronto. The download page uses release-specific query strings and updated manifests.

## Shared behavior and storage

All ports carry tabs, Basic/Advanced tools, filename and syntax-check help, Shell recognition, and the approved Projects tree with Open/Create/Close project, selected-folder Add file/Create file/Choose files, New folder and guarded Delete folder. Mobile uses the native filesystem, desktop uses scoped app-data filesystem commands, and browsers use IndexedDB. ZIP preserves ordinary source files/folders for transfer to other IDEs; ATE does not generate compiler targets or Xcode projects.

Desktop/Android Exit remains a whole-app confirmation. A cancelled save keeps open work; tab close is separate. The document default stays 36px with independent font sizing, and Projects keeps its larger labels and controls.

## Android follow-up

Android is isolated in `.github/workflows/android-083.yml` on branch `android`. Its changes do not cancel, rebuild or delay the published desktop/web releases. It retains required Node/browser, Android 11 tablet and Android 15 phone native tests, process recovery, real document-provider save/cancel/reopen, project file-picker cancellation and large-text checks before signing with the permanent certificate.

The older WebView required the main-app Object.hasOwn/String.replaceAll shims; the Android-specific tab path restores scroll after asynchronous layout/focus; syntax dialog opening is idempotent for the older modal implementation. The Array.at failure was in the layout test helper, which now uses compatible indexing. Startup/runtime errors fail promptly with logs/screenshots and verification emits progress. No timeout or failed assertion is counted as a pass.

## Acceptance limits

Automated CI is not physical-device acceptance. In particular, owner display/zoom settings, third-party file providers, actual Mac Intel runtime and successful physical-device saves remain owner checks. The accepted iPhone/iPad binary was not rebuilt by this platform work.
