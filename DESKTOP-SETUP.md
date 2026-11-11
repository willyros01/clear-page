# ATE desktop release

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
- macOS: `npm run tauri -- build --target universal-apple-darwin --bundles dmg`
- Windows: `npm run tauri -- build --target x86_64-pc-windows-msvc --bundles nsis`
- Generated icons, native targets, credentials and provisioning profiles are ignored.

Release evidence and website availability are recorded below only after verification.
