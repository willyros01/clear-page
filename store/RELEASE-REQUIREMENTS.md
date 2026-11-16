# ATE App Store release preparation

Special build: 0.8.7 (28). Platforms: iOS (iPhone + iPad) and native universal macOS (Intel + Apple silicon), under existing app Apple ID 6833284199 and bundle io.github.willyros01.clearpage. Do not create duplicate app records. Home-screen name ATE. Existing SKU/primary language are immutable: inspect current Apple record before applying metadata.

## Prepared content

- Copy-ready description, subtitle, keywords, promotional text, review instructions and URLs: listing.json.
- Free, public searchable distribution and manual release after approval follow the current Scorecard reference. English-Canada draft follows Fairpot's listing. Primary Productivity, secondary Developer Tools reflect ATE rather than copying unrelated Golf/Finance categories.
- Copyright 2026 Wilfredo Rosales. Review contact Wilfredo Rosales, willyros01@gmail.com. Reuse the existing privately maintained review phone; never commit it.
- Public privacy/support/terms and updated Quick Start/full guides on Cuberoot.
- Supplementary no-fault Terms acceptance in the app; Apple's Standard EULA remains the store license. This is a limitation-of-warranty/liability statement to the extent permitted by law, not an assurance that all legal liability is excluded.

## App Store asset checklist

- [ ] Actual special-build iPhone screenshots: editor/tabs, Projects, syntax results, display/menu controls. Capture supported native simulator/device; no mockups or invented features.
- [ ] Actual special-build 13-inch iPad screenshots: editor, Projects, syntax results, menu controls.
- [ ] Actual native Mac screenshots: editor, Projects, syntax results; 16:10 canvas at accepted dimensions. Never use iPad screenshots for the native Mac listing.
- [ ] Review captured screenshots visually, confirm dimensions and remove alpha. At least one and at most 10 per supported size. The pipeline collects native screenshot evidence; final upload requires accepted processed sets.
- [ ] Existing original app icon is packaged for both targets. Verify iOS 1024x1024 marketing icon and native Mac icon set; no new logo required.
- [ ] App preview video is optional. A short review walkthrough can be recorded if Apple requests it.

## Apple settings and checks before submission

- [ ] Inspect existing app record and editable iOS/macOS versions, app name availability, platform associations, primary locale/SKU and current agreements.
- [ ] Use the validated 0.8.7 (28) build for each platform only after full automated gates and Apple processing VALID; confirm internal TestFlight assignment and owner testing.
- [ ] Set categories, copy-ready metadata, privacy/support/marketing URLs, copyright, Free pricing, intended territories, public distribution and manual release. Inspect current availability rather than assume an existing configuration covers future territories.
- [ ] Complete current age-rating questionnaire based on actual local editing features; do not blindly copy another app's answers. No public content service, advertisements, chat, gambling, medical features or unrestricted web browser is included.
- [ ] Complete App Privacy with Data Not Collected only after verifying all integrated SDKs and developer collection behavior. Local processing and user-selected third-party sharing are described in the policy; website click tracking is separate.
- [ ] Confirm export compliance from bundled cryptography and actual functionality. ATE uses system HTTPS and local SHA-256 revision hashes, not an encrypted messaging service; preserve applicable exempt-encryption declaration only when accurate.
- [ ] Verify privacy manifests, required-reason APIs, sandbox entitlements, signatures and packaged offline assets. Mac Store edition hides external Clang; no code execution or compiler download is advertised for that edition.
- [ ] Complete accessibility declarations only for independently verified features. Adjustable document text and light/dark appearance exist; VoiceOver, Voice Control, reduced motion and other claims require actual acceptance, not inference.
- [ ] Private App Review phone/contact, DSA trader status and any agreement/tax/compliance requirements must be valid in the account. Do not put private contact data in public sources.
- [ ] Attach correct processed builds and accepted screenshots, run final App Store validation, review the complete package with the owner, then submit. Preparation does not mean submission or approval.

## Required tests

Terms: new install, mandatory checkbox, Escape/Back protection, no accidental Save before consent, acceptance persistence, revised terms re-prompt, storage failure, Help reopening, privacy/support links, existing draft preservation. Run full existing parser/editor/tab/project/file-picker/regression suites, real iPhone/iPad XCUITest and largest OS text, plus native universal Mac/sandbox checks. Physical-device acceptance remains separate. Special Apple build is isolated from existing public Windows/Android/Mac installers; do not cancel or rebuild those to prepare this submission.

## Reference apps reviewed

Fairpot: terms.html, store/listing.json and store/apply.mjs on main (first-use checkbox, free/no-login, metadata structure). Scorecard: build/app-store.md (public/searchable, manual release, privacy/support routes, private review credentials). The Marker: Cuberoot marker/privacy (large-print policy pattern and support/guide navigation); app-specific service/retention claims are not copied into ATE.

## Official Apple requirements checked 16 November 2026

- https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/
- https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Apple screenshot specifications can change; use the accepted dimensions/display types reported by the live App Store Connect account at upload time. No request has been submitted for App Review by this document.
