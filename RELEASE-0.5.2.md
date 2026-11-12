# ATE 0.5.2 release verification

Updated 12 November 2026 (UTC). Owner authorized rebuilding and publishing every existing platform distribution.

## Changes

- Menus, search, configuration, syntax messages and compiler setup use 12pt controls, headings at most 14pt, and touch targets at least 44px. Document text retains its independent 36px default and 10–54pt adjustment.
- Android/Fire Open and Save use ACTION_OPEN_DOCUMENT and ACTION_CREATE_DOCUMENT. The user chooses a filename and destination in the system file manager. Cancellation/errors preserve the draft; Save confirms the actual UTF-8 write.
- Older Android WebView workers receive Object.hasOwn/String.replaceAll fallbacks; clearing issue lists avoids unsupported replaceChildren. Bundles target Chrome 80 or Safari 15 syntax.
- Syntax checks, indentation, Vim, appearance and optional Windows LLVM-MinGW setup are retained. No paid Windows signing service was activated.

## Apple and desktop

Source: `74e92a55837c90546e80b7249166f1262a27fc2f`.
[Coordinated run 43168469203](https://github.com/willyros01/clear-page/actions/runs/43168469203).

| Distribution | Verified result |
| --- | --- |
| iPhone/iPad TestFlight | 0.5.2 (17), Apple VALID, assigned to the existing internal tester group. Build `81ffd03e-0758-480d-acb0-372cf2e4b712`. |
| Universal Mac TestFlight | 0.5.2 (17), Apple VALID, assigned to the existing internal tester group. Build `b8cbbf95-9e20-4324-9a9a-2ca2843538dd`. Intel and Apple silicon verified. |
| Universal Mac website | 0.5.2, Developer ID team VXMLKHF72B, notarization Accepted, ticket stapled, Gatekeeper passed. |
| Windows website | 0.5.2 x64, installed and launched in CI. Optional official LLVM-MinGW installation, cancellation, checksum rejection, detection and standard headers passed. Installer remains unsigned by the owner's decision. |

29 Node tests, Chromium/WebKit and actual iPad/Mac/Windows webview gates passed, including sizing, syntax, indentation and Vim. Rust/Clang gates passed on both desktop OSes. Distribution assets exclude the verification driver. The initial Android attempt in the coordinated run failed and was superseded by the separately successful Android run below; the original full run is not claimed successful.

## Android

[Native and release run 43175083674](https://github.com/willyros01/clear-page/actions/runs/43175083674) succeeded at source `33b071f5510d322e149d2286d5fb1da1866af794`.

- 29 parser/editor tests and Chromium/WebKit passed.
- Android 11 emulator passed all 141 shared mobile webview assertions, including 12pt controls, basic C and the other checkers, indentation and Vim.
- Actual DocumentsUI cancellation preserved the draft; destination/filename selection, UTF-8 save, independently pulled exact file bytes and native reopen passed.
- Picker automation waits for navigation/focus changes and retries activation only while the native Save control remains present.
- Production was rebuilt without the verification driver and signed with the permanent certificate; versionCode 17, versionName 0.5.2. Artifact 13923384375.
- Permanent signer SHA-256: `ef654829950fdf9d59f061c7b0fdc80358373a619fc02fa10480816e0665d6e4`.

## Public download integrity

[Cuberoot desktop publisher 43171332242](https://github.com/willyros01/Cuberoot/actions/runs/43171332242) verified the exact Windows and notarized Mac artifacts. Independently downloaded both live files and matched these lengths/hashes.

[Cuberoot Android publisher 43176173587](https://github.com/willyros01/Cuberoot/actions/runs/43176173587) verified source/run/job provenance, Android identity and permanent signature before publication. Its public-download gate fetched the live APK after Pages deployment and compared its bytes/hash to the signed release metadata.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `ate-windows.exe` | 2,600,415 | `047dbbfa67329aab670f91f26f212ec1c3f45590ae17641bcf54d38ebb7a2ab2` |
| `ate-mac.dmg` | 6,668,916 | `54400b5bba7ae41199281dd9214fe3a939a2065a5cd26f4fbda23bb1151f7ae1` |
| `ate.apk` | 4,112,463 | `a81ad1c096ce479bfdf56467a8109687e18c456e5da4f8c8d394fd32f45051c9` |

[Downloads and current user guides](https://www.cuberoot-systems.com/ate/). Online and large-print PDF guides describe 12pt controls, syntax checking and the Android file-manager flow.

## Physical acceptance

Automated native checks establish results for their named environments. They do not establish acceptance on the owner's physical Fire HD 8, iPad/iPhone, Mac or Windows device. Install/update, Android storage-provider behavior, touch/hardware-keyboard editing, save/reopen and syntax checks remain physical acceptance items. TestFlight processing and internal availability do not imply a public App Store release or Apple review approval.

Mac guided compiler installation and separately planned language checkers remain tracked in TODO.md.

## TestFlight availability recheck — 12 November 2026

After the owner reported no new build appearing, [read-only Apple audit 43211972237](https://github.com/willyros01/clear-page/actions/runs/43211972237) confirmed both 0.5.2 (17) builds remain VALID, unexpired, assigned to Clear Page Internal, and IN_BETA_TESTING. The existing tester is INSTALLED; autoNotifyEnabled is true for both builds. This verifies Apple-side availability, not notification delivery or visibility on the owner's devices. The next device check is TestFlight → ATE → version 0.5.2 (17) under the registered tester Apple Account.
