#!/usr/bin/env bash
set -euo pipefail
adb install android/app/build/outputs/apk/debug/app-debug.apk
adb install android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am start -n io.github.willyros01.clearpage/.MainActivity
# Validate recovery after a real app-process restart before instrumentation,
# whose own target process must remain alive while native picker tests run.
finished=false
for attempt in {1..600}; do
 if adb shell run-as io.github.willyros01.clearpage test -f files/ate-ipad-syntax-verification.json; then finished=true; break; fi
 if adb shell run-as io.github.willyros01.clearpage test -f files/ate-ipad-restart-ready.json; then
  adb shell run-as io.github.willyros01.clearpage rm files/ate-ipad-restart-ready.json
  adb shell am force-stop io.github.willyros01.clearpage
  adb shell am start -n io.github.willyros01.clearpage/.MainActivity
 fi
 sleep 1
done
if [ "$finished" != true ]; then adb logcat -d > android-logcat.txt; echo 'Android native verification report missing'; exit 1; fi
adb shell run-as io.github.willyros01.clearpage cat files/ate-ipad-syntax-verification.json > android-webview-report.json
node -e 'const r=JSON.parse(require("fs").readFileSync("android-webview-report.json"));console.log(r.checks.map(x=>"PASS: "+x).join("\n"));if(!r.passed)throw Error(r.error);'
adb shell am instrument -w -e class io.github.willyros01.clearpage.DocumentSaveTest io.github.willyros01.clearpage.test/androidx.test.runner.AndroidJUnitRunner | tee android-instrumentation.txt
adb logcat -d > android-logcat.txt
adb shell uiautomator dump /sdcard/ate-ui.xml
adb pull /sdcard/ate-ui.xml android-ui.xml
grep -q 'OK (2 tests)' android-instrumentation.txt
adb pull /sdcard/Download/ate-storage-check.c android-saved.c
adb pull /sdcard/Download/ate-no-extension android-saved-extensionless
cmp android-saved.c android-saved-extensionless
node -e 'const s=require("fs").readFileSync("android-saved.c","utf8");if(s!=="int main(void) { return 0 }")throw Error("Saved text differs");'
adb shell screencap -p /sdcard/ate-native.png
adb pull /sdcard/ate-native.png android-native.png
