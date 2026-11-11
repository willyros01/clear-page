# ATE Android build and Cuberoot publication

Branch: android, based on the tested ios editor at version 0.3.2. The Apple app and bundle identifiers remain unchanged. Android package: io.github.willyros01.clearpage; device label ATE.

- Capacitor Android 8.6.0 and App plugin 8.1.1; locked npm dependencies, Node 22 and Java 21.
- Shared editor, native Open/system share Save, approved launcher icon in legacy and adaptive resources.
- Android Back closes an open dialog first or opens Close choices. Confirming Close clears the document and leaves the Android activity through Capacitor App.
- Workflow: ATE Android APK, .github/workflows/android-apk.yml. It runs tests, creates the web bundle, generates Android and compiles a release APK before signing.
- First compile: https://github.com/willyros01/clear-page/actions/runs/42980450400. Compilation and four editor/regression checks passed. Signing intentionally stopped because its one-time repository secret is absent. The retained unsigned APK is evidence only, not an installable public release.

## Permanent signing
Add ONE repository Actions secret: ATE_ANDROID_SIGNING. Its value is the complete private JSON signing package supplied separately to the owner. It contains the PKCS12 keystore, password, alias ate and certificate digest. Never commit that value or print it in a workflow.

Public certificate SHA-256: ef654829950fdf9d59f061c7b0fdc80358373a619fc02fa10480816e0665d6e4.

The signing script decodes the key only in the runner temporary directory, uses an environment password, verifies the final APK signature against the pinned public digest and removes temporary signing material. There is no debug-key fallback. Preserve the private signing package for future update compatibility.

After the owner saves the secret, rerun the failed APK job. Verify signed artifact and successful ate-last-run.json report on apk-releases.

## Automatic publication
Cuberoot main contains build/publish-ate.sh and .github/workflows/publish-ate-apk.yml. The publisher checks for a new successful artifact on a five-minute schedule (GitHub may delay schedules). It downloads the exact artifact, verifies ZIP structure, Android package/version/display name and permanent signature, then commits downloads/ate.apk, checksum and provenance metadata together. It never rebuilds or re-signs.

The landing page and home app card reveal the Android download only after a valid published manifest exists. Mac/Windows are labelled coming; iPhone/iPad remains invitation-only TestFlight. No public TestFlight join link or App Store availability is claimed.

## Documentation
Cuberoot publishes /ate/, /ate/quick-start/, /ate/guide/ and two large-print PDFs under /guides/ate/. The full guide covers Open/Save, local recovery, settings, indentation, search/replace, copying, hardware shortcuts, Vim, Close and troubleshooting.

## Remaining acceptance
Signed build/public APK publication is pending the one secret. Physical Android/Fire tablet acceptance is pending: install/update, icon, rotation, file picker, share destinations, keyboard, Vim, search, draft recovery and Back/Close.
