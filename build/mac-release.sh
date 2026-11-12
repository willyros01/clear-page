#!/usr/bin/env bash
# Export the exact universal Tauri binary through Xcode's managed signing.
# Never publish an ad-hoc-signed preview as a public Mac installer.
set -euo pipefail
CHANNEL="${1:?testflight or website}"
case "$CHANNEL" in testflight|website) ;; *) exit 2;; esac
export VERSION="$(node -p "require('./package.json').version")"
export BUILD="${ATE_BUILD_NUMBER:-$(node -p "require('./release.json').build")}"
export RELEASE_DIR="$RUNNER_TEMP/ate-mac-$CHANNEL"
mkdir -p "$RELEASE_DIR"
KEY_DIR=$(mktemp -d "$RUNNER_TEMP/ate-mac-key.XXXXXX")
cleanup(){ if [ -f "$KEY_DIR/signing.keychain-db" ]; then security delete-keychain "$KEY_DIR/signing.keychain-db" >/dev/null 2>&1 || true; fi; rm -rf "$KEY_DIR"; }
trap cleanup EXIT
export KEY_DIR CHANNEL
node --input-type=module <<'JS'
import {writeFileSync} from 'node:fs';
for(const name of ['ASC_KEY_ID','ASC_ISSUER_ID','APPLE_TEAM_ID'])if(!process.env[name]?.trim())throw Error('Missing '+name);
writeFileSync(process.env.KEY_DIR+'/AuthKey_'+process.env.ASC_KEY_ID.trim()+'.p8',process.env.ASC_KEY_P8.trim()+'\n',{mode:0o600});
JS
ASC_KEY_ID=$(printf '%s' "$ASC_KEY_ID" | tr -d '[:space:]')
ASC_ISSUER_ID=$(printf '%s' "$ASC_ISSUER_ID" | tr -d '[:space:]')
APPLE_TEAM_ID=$(printf '%s' "$APPLE_TEAM_ID" | tr -d '[:space:]')
export ASC_KEY_ID ASC_ISSUER_ID APPLE_TEAM_ID
KEY="$KEY_DIR/AuthKey_$ASC_KEY_ID.p8"
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$KEY" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
ditto -x -k mac-input/ate-mac-app.zip "$RELEASE_DIR/input"
export APP="$RELEASE_DIR/ATE.xcarchive/Products/Applications/ATE.app"
mkdir -p "$(dirname "$APP")"
ditto "$RELEASE_DIR/input/ATE.app" "$APP"
EXECUTABLE=$(/usr/libexec/PlistBuddy -c "Print :CFBundleExecutable" "$APP/Contents/Info.plist")
lipo "$APP/Contents/MacOS/$EXECUTABLE" -verify_arch arm64 x86_64
cp resources/PrivacyInfo.xcprivacy "$APP/Contents/Resources/PrivacyInfo.xcprivacy"
python3 - <<'PY'
import os,plistlib,pathlib,datetime
app=pathlib.Path(os.environ['APP']);p=app/'Contents/Info.plist'
with p.open('rb') as f:d=plistlib.load(f)
assert d['CFBundleIdentifier']=='io.github.willyros01.clearpage'
d['CFBundleVersion']=os.environ['BUILD'];d['CFBundleShortVersionString']=os.environ['VERSION'];d['ITSAppUsesNonExemptEncryption']=False
with p.open('wb') as f:plistlib.dump(d,f)
entitlements={}
if os.environ['CHANNEL']=='testflight':
 entitlements={'com.apple.security.app-sandbox':True,'com.apple.security.files.user-selected.read-write':True,'com.apple.security.network.client':True,'com.apple.application-identifier':os.environ['APPLE_TEAM_ID']+'.io.github.willyros01.clearpage','com.apple.developer.team-identifier':os.environ['APPLE_TEAM_ID']}
with open(os.environ['RELEASE_DIR']+'/Entitlements.plist','wb') as f:plistlib.dump(entitlements,f)
archive={'ArchiveVersion':2,'CreationDate':datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),'Name':'ATE','SchemeName':'ATE','ApplicationProperties':{'ApplicationPath':'Applications/ATE.app','CFBundleIdentifier':d['CFBundleIdentifier'],'CFBundleShortVersionString':d['CFBundleShortVersionString'],'CFBundleVersion':d['CFBundleVersion'],'SigningIdentity':'-','Architectures':['arm64','x86_64']}}
with open(os.environ['RELEASE_DIR']+'/ATE.xcarchive/Info.plist','wb') as f:plistlib.dump(archive,f)
options={'method':'app-store-connect' if os.environ['CHANNEL']=='testflight' else 'developer-id','destination':'upload' if os.environ['CHANNEL']=='testflight' else 'export','teamID':os.environ['APPLE_TEAM_ID'],'signingStyle':'automatic','manageAppVersionAndBuildNumber':False,'uploadSymbols':False}
with open(os.environ['RELEASE_DIR']+'/ExportOptions.plist','wb') as f:plistlib.dump(options,f)
PY
codesign --force --sign - --options runtime --entitlements "$RELEASE_DIR/Entitlements.plist" "$APP"
codesign --verify --deep --strict "$APP"
if [ "$CHANNEL" = testflight ]; then node build/mac-platform.mjs; fi
if [ "$CHANNEL" = website ] && [ -n "${MAC_DEVELOPER_ID_SIGNING:-}" ]; then
 # This identity is a dedicated website signing certificate, kept only in the
 # repository secret. It is never logged, uploaded as an artifact or committed.
 node --input-type=module <<'JS'
import {writeFileSync} from 'node:fs';
let m;try{m=JSON.parse(process.env.MAC_DEVELOPER_ID_SIGNING)}catch{throw Error('Mac signing package could not be parsed')}
if(typeof m?.p12!=='string'||typeof m?.password!=='string'||m.password.length<20)throw Error('Invalid Mac signing package');
writeFileSync(process.env.KEY_DIR+'/certificate.p12',Buffer.from(m.p12,'base64'),{mode:0o600});
writeFileSync(process.env.KEY_DIR+'/password',m.password,{mode:0o600});
JS
 KEYCHAIN_PASSWORD=$(openssl rand -hex 32)
 KEYCHAIN="$KEY_DIR/signing.keychain-db"
 CERT_PASSWORD=$(cat "$KEY_DIR/password")
 security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN" >/dev/null
 security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
 security set-keychain-settings -lut 3600 "$KEYCHAIN"
 security list-keychains -d user -s "$KEYCHAIN"
 security default-keychain -d user -s "$KEYCHAIN"
 # Normalize OpenSSL 3 PKCS#12 encryption to the format supported by macOS
 # Keychain. An incorrect package password still fails before any import.
 umask 077
 openssl pkcs12 -in "$KEY_DIR/certificate.p12" -passin "file:$KEY_DIR/password" \
  -nodes -out "$KEY_DIR/identity.pem" 2> "$KEY_DIR/p12-check.log" || { echo 'Mac signing package cannot be decrypted with its supplied password.'; exit 1; }
 openssl pkcs12 -export -in "$KEY_DIR/identity.pem" -out "$KEY_DIR/keychain-compatible.p12" \
  -passout "file:$KEY_DIR/password" -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1
 rm -f "$KEY_DIR/identity.pem"
 security import "$KEY_DIR/keychain-compatible.p12" -k "$KEYCHAIN" -P "$CERT_PASSWORD" -T /usr/bin/codesign >/dev/null
 curl --max-time 60 -fsSL https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer -o "$KEY_DIR/intermediate.cer"
 security import "$KEY_DIR/intermediate.cer" -k "$KEYCHAIN" >/dev/null
 security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN" >/dev/null
 IDENTITY=$(security find-identity -v -p codesigning "$KEYCHAIN" | awk '/Developer ID Application:.*\(VXMLKHF72B\)/ {print $2}')
 test -n "$IDENTITY"
 test "$(printf '%s\n' "$IDENTITY" | wc -l | tr -d ' ')" = 1
 mkdir -p "$RELEASE_DIR/export"
 ditto "$APP" "$RELEASE_DIR/export/ATE.app"
 codesign --force --sign "$IDENTITY" --keychain "$KEYCHAIN" --timestamp --options runtime "$RELEASE_DIR/export/ATE.app"
 codesign --verify --deep --strict "$RELEASE_DIR/export/ATE.app"
 unset CERT_PASSWORD KEYCHAIN_PASSWORD
else
 xcodebuild -exportArchive -archivePath "$RELEASE_DIR/ATE.xcarchive" -exportPath "$RELEASE_DIR/export" \
  -exportOptionsPlist "$RELEASE_DIR/ExportOptions.plist" "${AUTH[@]}" > "$RELEASE_DIR/export.log" 2>&1 || { tail -90 "$RELEASE_DIR/export.log"; exit 1; }
fi
if [ "$CHANNEL" = testflight ]; then
 export APPLE_PLATFORM=MAC_OS
 node build/apple-build-status.mjs
 echo 'PASS: universal Mac uploaded and Apple processing verified.' >> "$GITHUB_STEP_SUMMARY"
else
 SIGNED_APP="$RELEASE_DIR/export/ATE.app"
 test -d "$SIGNED_APP"
 codesign --verify --deep --strict "$SIGNED_APP"
 codesign -d --verbose=4 "$SIGNED_APP" 2> "$RELEASE_DIR/signature.txt"
 grep -q 'Authority=Developer ID Application:' "$RELEASE_DIR/signature.txt" || { cat "$RELEASE_DIR/signature.txt"; echo 'Developer ID authority verification failed'; exit 1; }
 grep -q "TeamIdentifier=$APPLE_TEAM_ID" "$RELEASE_DIR/signature.txt"
 mkdir -p public-desktop
 DMG="public-desktop/ATE-$VERSION-universal.dmg"
 hdiutil create -volname ATE -srcfolder "$SIGNED_APP" -ov -format UDZO "$DMG"
 xcrun notarytool submit "$DMG" --key "$KEY" --key-id "$ASC_KEY_ID" --issuer "$ASC_ISSUER_ID" --wait --timeout 20m --output-format json > "$RELEASE_DIR/notary.json"
 node -e 'if(require(process.argv[1]).status!=="Accepted")throw Error("Notarization was not accepted")' "$RELEASE_DIR/notary.json"
 xcrun stapler staple "$DMG"
 xcrun stapler validate "$DMG"
 node --input-type=module <<'JS'
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const name='ATE-'+process.env.VERSION+'-universal.dmg',bytes=readFileSync('public-desktop/'+name);
writeFileSync('public-desktop/manifest.json',JSON.stringify({app:'ATE',platform:'mac-universal',version:process.env.VERSION,build:Number(process.env.BUILD),run_id:Number(process.env.GITHUB_RUN_ID),source_sha:process.env.GITHUB_SHA,file:name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,team_id:process.env.APPLE_TEAM_ID,signature:'developer-id',notarization:'Accepted',stapled:true},null,2)+'\n');
JS
 echo 'PASS: Developer ID-signed universal Mac DMG notarized and stapled.' >> "$GITHUB_STEP_SUMMARY"
fi
