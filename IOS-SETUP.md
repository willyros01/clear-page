# Clear Page iOS — first build

Branch: ios. Main and the hosted web editor are unchanged.

- App name: Clear Page
- Bundle ID: io.github.willyros01.clearpage
- Shared version: 0.3.1
- Targets: iPhone and iPad, iOS 15+
- Shell: Capacitor 8, Swift Package Manager, Xcode 26
- Generate locally on a Mac: npm ci; npm run build; node scripts/prepare-ios.mjs; npx cap open ios
- CI generates the native project from locked npm dependencies; generated ios/ is ignored.
- Native Save opens the iOS share sheet. Choose Save to Files. Cancellation/error preserves the draft. Open uses the native browser file chooser. Device validation is pending.

## First gate
The iOS build workflow compiles a simulator app, installs and launches it in an iPad simulator, and retains build artifacts/logs. This does not produce a signed IPA or a TestFlight release.

## Before TestFlight
1. Register the bundle ID and create a Clear Page app record in App Store Connect.
2. Configure repository secrets ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8, APPLE_TEAM_ID using the same Apple account as the other apps. Values must never be committed.
3. Add release app icon and validate required privacy manifest entries for Capacitor Filesystem (file timestamps, C617.1).
4. Configure and verify signed archive/export/upload, then verify Apple processing.
5. Perform physical iPad/iPhone acceptance for keyboard, Vim, text sizing, safe areas, opening, Save to Files, draft recovery, and exit.

The simulator workflow remains separate. The Clear Page TestFlight workflow now signs, uploads and verifies Apple processing; it never prints key or token values.

## Verified first run
- GitHub run: https://github.com/willyros01/clear-page/actions/runs/42947198796
- Tested source commit: 31aeb0e99fcfbc2d23599765b16d684cc28443f4
- Workflow conclusion: SUCCESS.
- npm checks, web build, generated native project, iPhone/iPad simulator compilation, iPad installation and launch: PASS.
- Simulator app and build-log artifacts retained by the run.
- At the first simulator run, Apple credentials had not yet been configured. See the latest credential checkpoint below.
- No signed IPA or TestFlight upload was produced. Release icon, privacy manifest, Apple registration/signing, and physical-device acceptance remain pending.

## Apple registration progress
- Bundle ID io.github.willyros01.clearpage registered and verified in Apple Developer.
- App Store Connect new-app form prepared: Clear Page, iOS, English (Canada), SKU clear-page-ios.
- User explicitly approved Full Access. The Clear Page app record has now been created and verified in App Store Connect.
- Apple app ID: 6833284199.
- App URL: https://appstoreconnect.apple.com/apps/6833284199/distribution
- Initial Apple listing version: 1.0 (Prepare for Submission). No signed build uploaded yet.
- Release icon generator and privacy manifest source saved under resources/. Icon generation, root privacy-manifest packaging, distribution signing and upload passed in the first TestFlight release.

## Apple credential checkpoint — 2026-11-11
- All four repository secret names verified in GitHub after the user saved the P8 directly. The private key was not read back or committed.
- Added scripts/apple-preflight.mjs and a lightweight Apple access workflow to parse the key, authenticate using a five-minute ES256 token, and read only the Clear Page app record. Tokens and key contents are never logged.
- API preflight run: https://github.com/willyros01/clear-page/actions/runs/42972316734 (attempt 2: SUCCESS after the user replaced the saved value; Apple authenticated the key and confirmed Clear Page app access).
- Signed archive/export/upload and release-resource packaging subsequently passed; physical-device acceptance remains pending.

- P8 blocker resolved: key parsing, ES256 token signing, and Apple app lookup passed on attempt 2, job 130366015171. No credential or token values were printed. The first attempt failed parsing; its exact character-level cause cannot be determined because GitHub does not reveal saved secret values.

## Signed release pipeline — 2026-11-11
- Clear Page TestFlight workflow uses macOS/Xcode, locked npm dependencies, editor checks and web bundling before archiving.
- Build version comes from package.json; build number comes from the release workflow run number.
- Swift is checked on the Mac runner before native resource work. The icon is generated as an opaque 1024px PNG.
- The privacy manifest is placed at the archived app-bundle root, before refreshing the ad-hoc archive signature and before Apple distribution export/signing. No raw Xcode project edits are used.
- Archive checks enforce the bundle ID, version, build number, iPhone+iPad targets, bundled editor assets, privacy reason and valid archive signature.
- Export uses automatic Apple cloud-managed distribution signing and uploads to App Store Connect. The API then polls for the matching version/build processing result.
- Release run: https://github.com/willyros01/clear-page/actions/runs/42973630845 (SUCCESS). Apple returned VALID.
- Physical-device acceptance and tester group assignment are separate steps.

## Verified TestFlight release — 2026-11-11
- Version/build: 0.3.1 (1).
- Tested source commit: 1daa0e5d6f0ba2be7afe6bb03ab1cba74ba5d1a4.
- Workflow: https://github.com/willyros01/clear-page/actions/runs/42973630845 — SUCCESS.
- Mac Swift 6.3.3, npm checks, web bundle, release icon generation, iPhone/iPad archive checks, privacy manifest and archive signature: PASS.
- Automatic distribution signing and upload: PASS at 06:40 UTC.
- Apple processing: VALID at 06:42 UTC.
- Apple build ID: 9e20063f-4c91-44ef-a608-9c1fd961e126.
- Release evidence artifact: Clear-Page-release-evidence (13833934525).
- No physical-device acceptance or tester group assignment has been claimed. Next: enable the intended internal tester and verify Open/Save to Files, Vim commands, keyboard, large text, draft recovery and exit on iPad/iPhone.

## Internal TestFlight access — 2026-11-11
- Resolved the sole Apple account holder as Wilfredo Rosales using Apple's current user roster, then used that account's exact address to create the app-specific internal tester record. No address or credential was printed.
- Created Clear Page Internal, group a310eafe-4a60-4759-ba9e-a4db47551732.
- Verified account-holder membership (tester 3f2d5a7d-11fe-406f-bab2-c1fea0f8a692) and build 0.3.1 (1) assignment.
- Apple internalBuildState: IN_BETA_TESTING; autoNotifyEnabled: true.
- Successful setup run: https://github.com/willyros01/clear-page/actions/runs/42975190510.
- User must accept the invitation in TestFlight; actual email delivery and physical-device installation remain unverified.
- build/internal-testing.mjs is idempotent and pinned to this app/build/account. Review its constants before reusing for another release.
