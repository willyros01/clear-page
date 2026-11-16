# ATE App Store release preparation

Special build: 0.8.7 (28). Platforms: iOS (iPhone + iPad) and native universal macOS (Intel + Apple silicon), under existing app Apple ID 6833284199 and bundle io.github.willyros01.clearpage. Do not create duplicate app records. Home-screen name ATE. Existing SKU and primary language were verified directly in Apple's current record; no duplicate app was created.

## Preparation status

- Completed: large-print Features To-Do PDF; six future enhancements remain on the backlog.
- Completed: first-use no-fault Terms acceptance and Help links implemented in special build source.
- Completed: Cuberoot Quick Start, full guide, Terms, Privacy and Support pages and guide PDFs published.
- Completed in App Store Connect: existing iOS/macOS draft versions set to 0.8.7, English-Canada copy, categories, privacy/support URLs, review contact, free pricing, manual release and current age questionnaire.
- Verified: app ID 6833284199; bundle io.github.willyros01.clearpage; primary locale en-CA; SKU clear-page-ios.
- Native iPhone and universal Mac checks passed. iPad native engine checks passed (293 checks); final native picker/tab and largest-text repair cases are running.
- Completed: actual native iPhone, 13-inch iPad and Mac screenshot captures, visually reviewed.
- Pending: remaining isolated iPad tests, TestFlight upload/Apple processing, build attachment and Apple screenshot delivery.
- No App Review submission or public release has been requested.

## Prepared content

- Copy-ready description, subtitle, keywords, promotional text, review instructions and URLs: listing.json.
- Free, public searchable distribution and manual release after approval follow the current Scorecard reference. English-Canada draft follows Fairpot's listing. Primary Productivity, secondary Developer Tools reflect ATE rather than copying unrelated Golf/Finance categories.
- Copyright 2026 Wilfredo Rosales. Review contact Wilfredo Rosales, willyros01@gmail.com. Reuse the existing privately maintained review phone; never commit it.
- Public privacy/support/terms and updated Quick Start/full guides on Cuberoot.
- Supplementary no-fault Terms acceptance in the app; Apple's Standard EULA remains the store license. This is a limitation-of-warranty/liability statement to the extent permitted by law, not an assurance that all legal liability is excluded.

## App Store asset checklist

- Completed native iPhone captures: editor/tabs, Projects, syntax results, display/menu controls. Capture supported native simulator/device; no mockups or invented features.
- Completed native 13-inch iPad captures: editor, Projects, syntax results, menu controls.
- Completed native Mac captures: editor and syntax results; 16:10 canvas at accepted dimensions. Never use iPad screenshots for the native Mac listing.
- Completed: all native screenshots visually reviewed and exported as RGB without alpha at accepted dimensions: iPhone 1206x2622; iPad 2064x2752; Mac 1280x800.
- [ ] Deliver screenshot sets to Apple and confirm every uploaded image finishes processing. Four iPhone, four iPad and two Mac images are prepared.
- Completed: original 1024x1024 RGB marketing icon prepared. Existing iOS and Mac icon sets remain in their native builds.
- Optional: App preview video is not required. A short review walkthrough can be recorded if Apple requests it.

## Apple settings and checks before submission

- Completed: existing app identity, editable iOS/macOS drafts, primary locale and SKU verified. Account agreements remain a final account check.
- [ ] Use the validated 0.8.7 (28) build for each platform only after full automated gates and Apple processing VALID; confirm internal TestFlight assignment and owner testing.
- Completed: categories, copy-ready metadata, privacy/support/marketing URLs, copyright, Free pricing and manual release saved in the iOS/macOS drafts.
- [ ] Confirm intended territories and public distribution against the current availability record before submission.
- Completed: current 24-field age-rating questionnaire saved based on actual local editing features; do not blindly copy another app's answers. No public content service, advertisements, chat, gambling, medical features or unrestricted web browser is included.
- [ ] Complete App Privacy with Data Not Collected only after verifying all integrated SDKs and developer collection behavior. Local processing and user-selected third-party sharing are described in the policy; website click tracking is separate.
- [ ] Confirm export compliance from bundled cryptography and actual functionality. ATE uses system HTTPS and local SHA-256 revision hashes, not an encrypted messaging service; preserve applicable exempt-encryption declaration only when accurate.
- [ ] Verify privacy manifests, required-reason APIs, sandbox entitlements, signatures and packaged offline assets. Mac Store edition hides external Clang; no code execution or compiler download is advertised for that edition.
- [ ] Complete accessibility declarations only for independently verified features. Adjustable document text and light/dark appearance exist; VoiceOver, Voice Control, reduced motion and other claims require actual acceptance, not inference.
- Completed: private App Review phone/contact maintained in both draft review records; the phone is excluded from this package and public code.
- [ ] Confirm DSA trader status and current agreement/tax/compliance requirements in the account before submission.
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
