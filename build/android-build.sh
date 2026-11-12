#!/usr/bin/env bash
set -euo pipefail
npm ci
npm test
npm run build
node build/prepare-android.mjs
(cd android && chmod +x gradlew && ./gradlew --no-daemon --console=plain assembleRelease)
mkdir -p out
cp android/app/build/outputs/apk/release/app-release-unsigned.apk out/ate-unsigned.apk
unzip -tqq out/ate-unsigned.apk
