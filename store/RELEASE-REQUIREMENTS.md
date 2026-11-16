# ATE App Store release preparation

Special build: 0.8.7 (28). Platforms: iOS (iPhone + iPad) and native universal macOS (Intel + Apple silicon), under existing app Apple ID 6833284199 and bundle io.github.willyros01.clearpage. Do not create duplicate app records. Home-screen name ATE. Existing SKU and primary language were verified directly in Apple's current record; no duplicate app was created.

## Preparation status

- Completed: large-print Features To-Do PDF; six future enhancements remain on the backlog.
- Completed: first-use no-fault Terms acceptance and Help links implemented in special build source.
- Completed: Cuberoot Quick Start, full guide, Terms, Privacy and Support pages and guide PDFs published.
- Completed in App Store Connect: existing iOS/macOS draft versions set to 0.8.7, English-Canada copy, categories, privacy/support URLs, review contact, free pricing, manual release and current age questionnaire.
- Verified: app ID 6833284199; bundle io.github.willyros01.clearpage; primary locale en-CA; SKU clear-page-ios.
- Completed: native iPhone, iPad and universal Mac regression and functional gates passed. iPad includes 293 engine checks, native file-picker/share/tab recovery, both largest-text cases, and project destination/Close verification. The final project scenario passed with its corrected ten-minute XCTest allowance.
- Completed: actual native iPhone, 13-inch iPad and Mac screenshot captures, visually reviewed.
- Completed: iOS and Mac 0.8.7 (28) uploaded, processed VALID by Apple and assigned to internal TestFlight testing. Both exact builds are attached to their respective draft versions; all ten screenshots processed COMPLETE. Owner physical-device acceptance remains.
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
- Completed: all ten native screenshots uploaded and processed COMPLETE by Apple: four iPhone, four iPad and two Mac images. Draft screenshot preparation run 43867302801 passed; no app was submitted.
- Completed: original 1024x1024 RGB marketing icon prepared. Existing iOS and Mac icon sets remain in their native builds.
- Optional: App preview video is not required. A short review walkthrough can be recorded if Apple requests it.

## Apple settings and checks before submission

- Completed: existing app identity, editable iOS/macOS drafts, primary locale and SKU verified. Account agreements remain a final account check.
- Completed: validated 0.8.7 (28) iOS and Mac builds passed all required automated gates and Apple processing VALID, were assigned to internal TestFlight and attached to drafts. Owner testing remains required.
- Completed: categories, copy-ready metadata, privacy/support/marketing URLs, copyright, Free pricing and manual release saved in the iOS/macOS drafts.
- [ ] Confirm intended territories and public distribution against the current availability record before submission.
- Completed: current 24-field age-rating questionnaire saved based on actual local editing features; do not blindly copy another app's answers. No public content service, advertisements, chat, gambling, medical features or unrestricted web browser is included.
- [ ] Complete App Privacy with Data Not Collected only after verifying all integrated SDKs and developer collection behavior. Local processing and user-selected third-party sharing are described in the policy; website click tracking is separate.
- [ ] Confirm export compliance from bundled cryptography and actual functionality. ATE uses system HTTPS and local SHA-256 revision hashes, not an encrypted messaging service; preserve applicable exempt-encryption declaration only when accurate.
- [ ] Verify privacy manifests, required-reason APIs, sandbox entitlements, signatures and packaged offline assets. Mac Store edition hides external Clang; no code execution or compiler download is advertised for that edition.
- [ ] Complete accessibility declarations only for independently verified features. Adjustable document text and light/dark appearance exist; VoiceOver, Voice Control, reduced motion and other claims require actual acceptance, not inference.
- Completed: private App Review phone/contact maintained in both draft review records; the phone is excluded from this package and public code.
- [ ] Confirm DSA trader status and current agreement/tax/compliance requirements in the account before submission.
- Completed: correct processed platform builds and accepted screenshots attached. Pending: final App Store validation and owner review, then a separate submission instruction. Preparation does not mean submission or approval.

## Required tests

Terms: new install, mandatory checkbox, Escape/Back protection, no accidental Save before consent, acceptance persistence, revised terms re-prompt, storage failure, Help reopening, privacy/support links, existing draft preservation. Run full existing parser/editor/tab/project/file-picker/regression suites, real iPhone/iPad XCUITest and largest OS text, plus native universal Mac/sandbox checks. Physical-device acceptance remains separate. All platforms are coordinated to 0.8.7 (28), including web, Windows, Android and website universal Mac. Preserve each successful platform artifact independently; signing or publishing another platform must not cancel successful builds.

## Owner TestFlight acceptance

- First launch: read Terms, tick the agreement and continue. Restart; acceptance should remain. Help must reopen Terms and open Privacy, Support and both guides.
- Write a note, cancel Save and confirm the note remains. Complete Save to Files on iPhone/iPad or the native Mac Save dialog. Confirm the exact filename and extension; ATE must not add .txt to an extensionless name.
- At your largest iPhone/iPad text setting, open and close Menu, show and hide the keyboard, then rotate the screen. Menu, Close, Save and the filename must remain readable and reachable. Renaming must change the tab name rather than document content.
- Advanced > Projects: create and reopen a project, create src, then Add file to src using Create file or Choose files. Open a .sql file from the tree and edit it. Confirm folder selection and file hierarchy are clear.
- Test folder deletion with Keep folder and then confirmed deletion of disposable sample files. Test Close project with Keep open, Save and close, and Close without saving. Keep independent copies of any real files during acceptance.
- Enter SELECT FROM; in a .sql sample and check syntax. Correct to SELECT 1; and check again. Repeat one sample in each language you normally use. These checks do not execute code or replace a compiler.
- On Mac, test opening, saving, Help links and closing the app on both Intel and Apple silicon hardware when available. A universal architecture check does not replace physical testing on each processor family.

## Reference apps reviewed

Fairpot: terms.html, store/listing.json and store/apply.mjs on main (first-use checkbox, free/no-login, metadata structure). Scorecard: build/app-store.md (public/searchable, manual release, privacy/support routes, private review credentials). The Marker: Cuberoot marker/privacy (large-print policy pattern and support/guide navigation); app-specific service/retention claims are not copied into ATE.

## Official Apple requirements checked 16 November 2026

- https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/
- https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

