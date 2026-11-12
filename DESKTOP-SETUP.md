# ATE desktop release

Desktop 0.5.3 uses the bundled offline C parser by default. Installed Clang is an optional Advanced mode under Menu → C settings → C checking. No compiler installation is needed for Basic checks. Release verification is tracked in [RELEASE-0.5.3.md](RELEASE-0.5.3.md); older checkpoints below are historical.

The `desktop` branch starts from the accepted iOS 0.3.2 editor. Version 0.4.0 keeps CodeMirror, Vim, search/replace, large text and help in the shared `src/` code. Capacitor remains the iPhone/iPad shell; Tauri is the Windows and macOS shell. Existing Android releases remain on `android` until the shared release is reconciled there.

## One coordinated workflow

`ATE Apple and Desktop` runs on changes to desktop source/build files and manually:

1. Shared editor tests and bundled assets.
2. Windows x64 NSIS installer, silent installation and launch check.
3. Universal Mac binary (arm64 and x86_64), signature/launch checks and preview DMG.
4. iPhone/iPad archive, managed signing, TestFlight upload, processing and existing internal group assignment.
5. The exact universal Mac app is exported through Xcode twice: sandboxed Mac App Store/TestFlight distribution and Developer ID website distribution. Website export is notarized and stapled before it is eligible for publication.

Mac App Store and website packages have different signing/entitlements but share the same compiled editor. Mac App Store setup adds macOS to the existing ATE record if missing. It does not submit App Review or release the app publicly. Processing lookup distinguishes IOS from MAC_OS so equal build numbers cannot be confused.

## Files and closing

Desktop Save opens a native destination dialog; Cancel/failure keeps the editor and recovery draft. Native code accepts only text and a suggested filename, never a path from JavaScript. The selected destination is written atomically so a failed save does not truncate an existing document. Open uses the existing plain-text file chooser and 10 MB validation. Exit, window close and Quit use the existing Save/Discard/Keep choices. Only a confirmed exit allows the application to quit.

## Signing and release gates

The workflow first attempts Apple's cloud-managed signing with the existing ASC key and team; it does not create/revoke certificates itself or log credential contents. Read-only inventory records whether Apple permits certificate access. If managed export cannot sign, the exact error is retained and the missing signing requirement must be resolved before public Mac distribution. The ad-hoc Mac preview must never be presented as a signed/notarized public installer.

Windows builds are initially unsigned: CI installation/launch is distinct from physical Windows acceptance and a trusted publisher signature. Website publication must label that clearly. A physical Windows PC and both Mac architectures still require editing, save/cancel/overwrite, clipboard, Vim, offline recovery and exit acceptance. CI launch alone does not certify those flows.

## Development

- `npm ci && npm test && npm run build`
- Install the official Rust stable toolchain and platform prerequisites.
- `npm run desktop:icons` derives native icons from the approved ATE image.
- macOS: `npm run tauri -- build --target universal-apple-darwin --bundles app,dmg`
- Windows: `npm run tauri -- build --target x86_64-pc-windows-msvc --bundles nsis`
- Generated icons, native targets, credentials and provisioning profiles are ignored.

Release evidence and website availability are recorded below only after verification.

## Verified checkpoint — 11 November 2026

- Shared editor: 5 automated tests pass, including native Save cancellation/error and Save-and-Exit sequencing.
- First coordinated run: https://github.com/willyros01/clear-page/actions/runs/43044237574
- iPhone/iPad ATE 0.4.0 (1): uploaded, Apple VALID, assigned to the existing internal group. Build ID `e496280a-28d1-4569-a50a-ce2e9cf574b6`.
- Windows x64: compilation, NSIS installation and installed-process launch passed in the first run. Physical-device acceptance remains pending.
- macos-14 runner was cancelled before execution; corrected to macos-26. Follow-up run: https://github.com/willyros01/clear-page/actions/runs/43044688913
- Apple read-only inventory succeeded; no existing Mac App Store version. Cloud-managed Mac export will be attempted; no certificate was revoked.

## Current release result

- Universal Mac build, arm64/x86_64 verification, ad-hoc signature verification and launch all PASS in run 43048900046.
- Native Mac TestFlight 0.4.0 (5): Apple VALID and assigned to the existing internal group. Build ID `c0d6b164-554d-499d-a995-90ac0df192a8`. macOS was added to the existing ATE app; App Review was not submitted.
- Windows 0.4.0: installed/launched in CI and automatically published on Cuberoot. The installer is unsigned and labelled accordingly.
- Website Mac export: BLOCKED by `Cloud signing permission error` / missing `Developer ID Application` certificate. No unsigned preview is linked publicly.
- A manual website-signing path now accepts one repository secret, `MAC_DEVELOPER_ID_SIGNING`, containing JSON fields `p12` (base64 PKCS#12 certificate/private key) and `password`. It imports only into an ephemeral keychain, verifies a Developer ID Application identity for team VXMLKHF72B, signs with hardened runtime, then requires notarization and stapling. Existing ASC credentials handle notarization.
- Apple Developer certificate form is prepared with the public ATE CSR. Creation of the new signing credential and storing its private signing package as a GitHub repository secret require the user's explicit confirmation before those browser actions. No certificate has been created at this checkpoint.
- After the secret is configured, a normal `[desktop-only]` workflow change rebuilds/verifies both architectures and exports both Mac channels. `[signing-setup]` commits validate shared tests while skipping native rebuilds and report replacement.
- Physical iPad, Windows and Mac acceptance remain distinct from CI launch and automated editor tests.

## Developer ID credential issued

The user explicitly authorized credential creation. Developer ID Application certificate `YVJFC97Q96` was issued in the Apple Developer portal and its public key was verified against the prepared private key. An encrypted PKCS#12 signing package and private backup are prepared. The repository secret has NOT been uploaded: automatic approval review requires a separate explicit authorization to transmit the private signing package to `willyros01/clear-page` as `MAC_DEVELOPER_ID_SIGNING`. The GitHub form is prepared with that name and an empty Secret field. No website Mac installer has been published. The iPad and universal Mac TestFlight releases and the public Windows installer remain available.

## Approved signing upload completed

The user explicitly authorized upload of the private signing package to the named Mac GitHub Actions secret. GitHub confirmed `MAC_DEVELOPER_ID_SIGNING` was added to `willyros01/clear-page`. Coordinated release run `43055226935`, source `8669c38a87810d6b88a1ad8d10e3b94436379bb7`, is using the approved package for the website channel. Private key material is not committed to this repository or included in public artifacts.

## 0.5.3 desktop release — 12 November 2026

Run 43222957484 passed native Mac/Windows editor gates and production packaging. Universal Mac TestFlight 0.5.3 (18) is VALID, IN_BETA_TESTING and assigned to the existing internal group. Mac website signing/notarization/stapling and publisher Gatekeeper checks passed. Windows installed/launched in CI. Publisher 43226821763 verified both public installer hashes and lengths. See RELEASE-0.5.3.md; physical-device acceptance remains separate. iOS/Android remain 0.5.2 (17).
