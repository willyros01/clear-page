#!/usr/bin/env bash
set -euo pipefail
swift --version
node scripts/apple-preflight.mjs
VERSION=$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version")
BUILD="${ATE_BUILD_NUMBER:-$(node -p "require('./release.json').build")}"
RELEASE_DIR="${RUNNER_TEMP:?}/clear-page-release"
mkdir -p "$RELEASE_DIR"
export RELEASE_DIR VERSION BUILD
KEY_DIR=$(mktemp -d "$RUNNER_TEMP/clear-page-key.XXXXXX")
trap 'rm -rf "$KEY_DIR"' EXIT
export KEY_DIR
node --input-type=module <<'NODE'
import {writeFileSync} from 'node:fs';
for (const name of ['ASC_KEY_ID','ASC_ISSUER_ID','APPLE_TEAM_ID']) process.env[name] = process.env[name].trim();
writeFileSync(process.env.KEY_DIR + '/AuthKey_' + process.env.ASC_KEY_ID + '.p8', process.env.ASC_KEY_P8.trim() + '\n', {mode:0o600});
NODE
# IDs are non-secret identifiers; whitespace is never meaningful in them.
ASC_KEY_ID=$(printf '%s' "$ASC_KEY_ID" | tr -d '[:space:]')
ASC_ISSUER_ID=$(printf '%s' "$ASC_ISSUER_ID" | tr -d '[:space:]')
APPLE_TEAM_ID=$(printf '%s' "$APPLE_TEAM_ID" | tr -d '[:space:]')
export ASC_KEY_ID ASC_ISSUER_ID APPLE_TEAM_ID
KEY="$KEY_DIR/AuthKey_${ASC_KEY_ID}.p8"
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$KEY" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")

node scripts/prepare-ios.mjs
swift resources/make-icon.swift
cp ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png "$RELEASE_DIR/icon.png"
echo "Archiving ATE $VERSION ($BUILD)"
xcodebuild archive -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$RELEASE_DIR/ClearPage.xcarchive" \
  "${AUTH[@]}" DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CODE_SIGN_STYLE=Automatic \
  CODE_SIGN_IDENTITY="-" AD_HOC_CODE_SIGNING_ALLOWED=YES \
  MARKETING_VERSION="$VERSION" CURRENT_PROJECT_VERSION="$BUILD" \
  > "$RELEASE_DIR/archive.log" 2>&1 || { tail -80 "$RELEASE_DIR/archive.log"; exit 1; }
APP="$RELEASE_DIR/ClearPage.xcarchive/Products/Applications/App.app"
# Finalize the archive's root privacy resource before distribution signing.
# The generated Xcode project is never edited. Export re-signs this archive with
# Apple's managed distribution identity after all packaged files are verified.
swift resources/package-privacy.swift "$APP"
codesign --force --sign - --preserve-metadata=identifier,entitlements,flags "$APP"
codesign --verify --deep --strict "$APP"
plutil -lint "$APP/PrivacyInfo.xcprivacy"
python3 - <<'PY'
import os, plistlib, pathlib
app=pathlib.Path(os.environ['RELEASE_DIR'])/'ClearPage.xcarchive/Products/Applications/App.app'
with (app/'Info.plist').open('rb') as f: info=plistlib.load(f)
assert info['CFBundleIdentifier']=='io.github.willyros01.clearpage'
assert info['CFBundleShortVersionString']==os.environ['VERSION']
assert info['CFBundleVersion']==os.environ['BUILD']
assert info['UIDeviceFamily']==[1,2]
assert info['UIFileSharingEnabled'] is True
assert info['LSSupportsOpeningDocumentsInPlace'] is True
assert info['CFBundleDisplayName']=='ATE'
assert info['CFBundleIcons']['CFBundlePrimaryIcon']['CFBundleIconName']=='AppIcon'
assert (app/'Assets.car').is_file()
assert (app/'public/index.html').is_file()
import hashlib
for asset in ['app.js','syntax-worker.js','tree-sitter-c.wasm','tree-sitter-bash.wasm','web-tree-sitter.wasm','ruff_wasm_bg.wasm','THIRD-PARTY-NOTICES.txt']:
 actual=app/'public'/asset;expected=pathlib.Path('dist')/asset
 assert actual.is_file(), 'Missing bundled checker asset: '+asset
 assert hashlib.sha256(actual.read_bytes()).digest()==hashlib.sha256(expected.read_bytes()).digest(), 'Archive asset mismatch: '+asset
assert b'ATE_IPAD_SYNTAX_VERIFICATION_ONLY' not in (app/'public/app.js').read_bytes(), 'Test bridge in release assets'
with (app/'PrivacyInfo.xcprivacy').open('rb') as f: privacy=plistlib.load(f)
assert any(x['NSPrivacyAccessedAPIType']=='NSPrivacyAccessedAPICategoryFileTimestamp' and 'C617.1' in x['NSPrivacyAccessedAPITypeReasons'] for x in privacy['NSPrivacyAccessedAPITypes'])
print('PASS: archived iPhone/iPad app identity, version, assets, web bundle, privacy manifest and signature.')
export={'method':'app-store-connect','destination':'upload','teamID':os.environ['APPLE_TEAM_ID'],'signingStyle':'automatic','uploadSymbols':True,'manageAppVersionAndBuildNumber':False}
with open(os.environ['RELEASE_DIR']+'/ExportOptions.plist','wb') as f: plistlib.dump(export,f)
PY
xcodebuild -exportArchive -archivePath "$RELEASE_DIR/ClearPage.xcarchive" \
  -exportOptionsPlist "$RELEASE_DIR/ExportOptions.plist" -exportPath "$RELEASE_DIR/export" \
  "${AUTH[@]}" > "$RELEASE_DIR/export.log" 2>&1 || { tail -100 "$RELEASE_DIR/export.log"; exit 1; }
echo "PASS: ATE $VERSION ($BUILD) uploaded to App Store Connect." | tee -a "$GITHUB_STEP_SUMMARY"
node build/apple-build-status.mjs

