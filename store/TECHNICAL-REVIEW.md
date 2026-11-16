# ATE 0.8.7 (28) technical release review

Reviewed 16 November 2026. Production application source: 23f352a4ceb3ad99a5f112a564253f0f0dd9ea9e; later desktop commits only adjust tests, CI and preparation. No app code or binary was changed for this metadata update.

## Privacy and data handling

Reviewed application source and locked direct dependencies: CodeMirror and optional Vim bindings, local syntax parsers, Capacitor core/app/filesystem/share, Tauri/dialog and local ZIP/hash utilities. No analytics, advertising or crash-reporting service is integrated in the audited app entry points. The syntax worker fetches packaged local Wasm assets. Documents, project membership, terms acceptance and recovery stay in local storage/files. Native save/share uses the destination chosen by the user. Help/legal links open the public website only when requested; that site's ordinary requests and download tracking are separate from app telemetry.

Proposed App Privacy answer across the Apple platforms: No, we do not collect data from this app. This is the result of the code/dependency review, not a claim that Apple's website questionnaire has been published. The owner must confirm and publish that answer in App Store Connect. Chosen cloud file providers and sharing destinations have their own data handling.

Root resources/PrivacyInfo.xcprivacy: NSPrivacyTracking=false; NSPrivacyCollectedDataTypes empty; file-timestamp access reason C617.1 for document metadata. Capacitor and CapacitorCordova bundled manifests also declare no tracking/collected data. A scan of installed Capacitor native sources found document creation/modification timestamp handling and no UserDefaults, system-uptime or disk-capacity required-reason use in those sources. This is a scoped source review, not Apple's final submission validation.

## Actual build evidence

Apple preparation run 43874608409 passed all required regression/native gates. iOS upload job 133332274433 logs confirm root privacy resource packaged, plist validation, exact identity/version, bundled checker asset hashes, absence of the test bridge and codesign verification before distribution export. Apple processed build 11dc17dd-cc04-44d0-a505-4051f32e9f61 VALID and assigned it to internal testing.

Mac upload job 133332274508 used the exact retained universal app tested in run 43810798310. build/mac-release.sh verifies arm64/x86_64, adds the privacy resource and sets app-sandbox, user-selected read/write and network-client entitlements before managed App Store export. Apple processed build 9a2dfbfe-7bb2-48c6-b2e6-b0cb0f170601 VALID and assigned it to internal testing. A final exported-package entitlement dump was not retained; this review relies on the signed export configuration, successful export and Apple's processing rather than claiming a new post-export binary inspection.

The website Mac is separately Developer ID signed, notarized, stapled and published. Its website publisher independently verified signature, both architectures and Gatekeeper acceptance. Website builds do not replace the Mac App Store sandboxed build.

## Encryption

iOS prepare-ios and Mac export set ITSAppUsesNonExemptEncryption=false. Both exact attached Apple build records were read back with usesNonExemptEncryption=false. ATE uses operating-system HTTPS for requested help pages and local SHA-256 document revision hashes. It does not provide an encrypted messaging/storage service or ship a custom encryption feature. No extra non-exempt encryption declaration was created.

## Accessibility

Native engine and browser checks exercise document size controls and dark appearance; iPhone/iPad native tests include largest OS text and keyboard/viewport cases. The UI's approved compact menu sizes do not establish 200% enlargement throughout every common task. No Apple Larger Text badge is claimed. Dark mode is described as an app feature, but no Dark Interface badge is published without complete common-task evidence, including system dialogs and first launch. No VoiceOver, Voice Control, contrast, motion or audio labels are inferred from code. Accessibility nutrition labels are optional; existing API declarations are empty.

## API preparation results

Run 43936400560: both drafts remain PREPARE_FOR_SUBMISSION, releaseType AFTER_APPROVAL, exact build 28 attached, internal state IN_BETA_TESTING. Ten screenshot assets COMPLETE. Revised copy includes the built-in offline syntax checker. Free pricing and 175 territories match the reference settings. All six API readiness groups passed. The app remains unreleased; territory status arrays include the unreleased-app state and cannot be treated as final clearance.

Apple's current downloaded OpenAPI specification reports version 4.6. It exposes availability, encryption/build attributes and accessibility declarations, but no App Privacy questionnaire or account-holder tax/trader/agreement acceptance operations. No review-submission or release-request endpoint was called.

## Remaining steps

Owner testing on physical iPhone/iPad/Mac; confirm and publish App Privacy in App Store Connect; confirm current account agreements and applicable tax/DSA trader declarations; discuss and authorize submission. Apple's full submission validation is still pending. Automatic release after approval is already configured for both platforms.
