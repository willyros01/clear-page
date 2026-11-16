#!/usr/bin/env bash
set -euo pipefail
export ATE_VERIFICATION_REPORT="$RUNNER_TEMP/mac-store-native.txt"
export ATE_STORE_CAPTURE_DIR="$RUNNER_TEMP/ate-store-mac"
mkdir -p "$ATE_STORE_CAPTURE_DIR"
swiftc store/window-id.swift -o "$RUNNER_TEMP/ate-window-id"
src-tauri/target/universal-apple-darwin/release/ate-desktop &
ATE_PID=$!
for attempt in {1..360}; do
 if [ -f "$ATE_VERIFICATION_REPORT" ]; then cat "$ATE_VERIFICATION_REPORT"; wait "$ATE_PID"; exit $?; fi
 if [ -f "$ATE_STORE_CAPTURE_DIR/ready" ]; then
  LABEL=$(cat "$ATE_STORE_CAPTURE_DIR/ready")
  case "$LABEL" in 01-editor|02-syntax|03-projects) ;; *) echo 'Unexpected capture label'; exit 1;; esac
  if [ ! -f "$ATE_STORE_CAPTURE_DIR/$LABEL.done" ]; then
   WINDOW=$("$RUNNER_TEMP/ate-window-id" "$ATE_PID")
   screencapture -x -o -l "$WINDOW" "$ATE_STORE_CAPTURE_DIR/$LABEL.png"
   test -s "$ATE_STORE_CAPTURE_DIR/$LABEL.png"
   touch "$ATE_STORE_CAPTURE_DIR/$LABEL.done"
  fi
 fi
 sleep 1
done
kill "$ATE_PID" || true
echo 'Native verification/capture timed out'; exit 1
