# ATE Android build and Cuberoot publication

Current coordinated release: 0.5.2 (17), built from desktop. The original Android release history is retained below. The Apple app and bundle identifiers remain unchanged. Android package: io.github.willyros01.clearpage; device label ATE.

- Capacitor Android 8.6.0 and App plugin 8.1.1; locked npm dependencies, Node 22 and Java 21.
- Shared editor, native ACTION_OPEN_DOCUMENT / ACTION_CREATE_DOCUMENT file-manager Open/Save, approved launcher icon in legacy and adaptive resources.
- Android Back closes an open dialog first or opens Close choices. Confirming Close clears the document and leaves the Android activity through Capacitor App.
- Canonical workflow: .github/workflows/all-platforms.yml; Android-only verification: .github/workflows/android-052.yml. Browser/parser and Android 11 native save/cancel/reopen gates precede production rebuilding and permanent signing.
- First compile: https://github.com/willyros01/clear-page/actions/runs/42980450400. Compilation and four editor/regression checks passed. The initial attempt stopped at the signing gate; attempt 2 passed after the owner saved the secret. The permanent signed APK is now published.

## Permanent signing
Add ONE repository Actions secret: ATE_ANDROID_SIGNING. Its value is the complete private JSON signing package supplied separately to the owner. It contains the PKCS12 keystore, password, alias ate and certificate digest. Never commit that value or print it in a workflow.

Public certificate SHA-256: ef654829950fdf9d59f061c7b0fdc80358373a619fc02fa10480816e0665d6e4.

The signing script decodes the key only in the runner temporary directory, uses an environment password, verifies the final APK signature against the pinned public digest and removes temporary signing material. There is no debug-key fallback. Preserve the private signing package for future update compatibility.

After the owner saves the secret, rerun the failed APK job. Verify signed artifact and successful ate-last-run.json report on apk-releases.

## Automatic publication
Cuberoot main contains build/publish-ate.sh and .github/workflows/publish-ate-apk.yml. The publisher checks for a new successful artifact on a five-minute schedule (GitHub may delay schedules). It downloads the exact artifact, verifies ZIP structure, Android package/version/display name and permanent signature, then commits downloads/ate.apk, checksum and provenance metadata together. It never rebuilds or re-signs.

The landing page and home app card reveal the Android download only after a valid published manifest exists. Mac/Windows downloads are available; iPhone/iPad and universal Mac remain invitation-only TestFlight. No public TestFlight join link or App Store availability is claimed.

## Documentation
Cuberoot publishes /ate/, /ate/quick-start/, /ate/guide/ and two large-print PDFs under /guides/ate/. The full guide covers Open/Save, local recovery, settings, indentation, search/replace, copying, hardware shortcuts, Vim, Close and troubleshooting.

## Remaining acceptance
Physical Android/Fire tablet acceptance is pending: install/update, icon, rotation, file picker, file-manager destinations, keyboard, Vim, search, draft recovery and Back/Close.

## Verified release — 11 November 2026
- ATE 0.3.2, Android versionCode 1; source 82f10e0521b7df338357a027e7f0027b78895aa6.
- Build run 42980450400, attempt 2: SUCCESS. Signed artifact 13838516529.
- Cuberoot publisher run 42983705702: SUCCESS. Permanent signature, package, version and ATE label verified before publication.
- Live APK: https://www.cuberoot-systems.com/downloads/ate.apk?build=42980450400 .
- APK bytes: 3628818; SHA-256: 54377685830065153a0ce46ac5bf3f23ed1f11b7532047686bdf54326673810c.
- Downloaded live APK and independently matched bytes/hash to the signed release metadata. Landing page and Cuberoot home card display active Android-logo downloads.
- Automatic publisher remains scheduled every five minutes; GitHub scheduling delays may affect timing. Future successful signed Android builds update this same website download.
- Physical Android/Fire device acceptance is still pending.

## Current Android 0.5.2 (17) release

Native Android 11 run 43175083674 passed all 141 shared mobile webview assertions plus actual DocumentsUI save/cancel/reopen and exact saved bytes. Production assets exclude the driver. The permanently signed APK is published by Cuberoot run 43176173587 and its live bytes/hash verified. Source `33b071f5510d322e149d2286d5fb1da1866af794`; APK 4112463 bytes, SHA-256 `a81ad1c096ce479bfdf56467a8109687e18c456e5da4f8c8d394fd32f45051c9`. Physical Fire HD 8 acceptance remains pending. See RELEASE-0.5.2.md.
