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

The workflow reports missing Apple secret names only; it does not print secret values. It does not upload to TestFlight yet.
