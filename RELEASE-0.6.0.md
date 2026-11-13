# ATE 0.6.0 (19)

All packages use release.json: version 0.6.0, build 19. Native verification and publication are recorded separately from physical-device acceptance.

## Changes
- Preserve explicit and extensionless filenames. Removed automatic .txt appending and changed the unnamed-document default to Untitled. Discard does not write or rename the source file. The owner's earlier unsaved suffix report was not reproduced; no root cause is claimed for it.
- Android Save requests application/x-ate-document, an unmapped MIME type, so file providers do not infer an extra suffix from the type. The native picker may still choose a unique name if the destination already exists; ATE reports the actual saved name.
- Detect recognized extensions first, then inspect a bounded 32K-character sample for ambiguous names. Manual selection remains available and survives recovery and Save As. Automatic drafts are re-detected. Detection never renames the document.
- Python: bundled Ruff 0.6.9 Wasm parser targeting Python 3.13 syntax. No interpreter installation or execution; no imports, names, types or runtime checks. It does not promise CPython compilation equivalence.
- SQL: bundled node-sql-parser 5.4.0 SQLite grammar. No database or statement execution; other dialects and schema names are outside this check.
- Markdown: Lezer parser with warnings for duplicate headings, unclosed fenced code blocks and trailing whitespace. Two-space hard line breaks are allowed. This is selected linting, not the complete markdownlint ruleset.
- Existing JS/TS/JSON/HTML/CSS/YAML and Basic C remain bundled offline. Optional advanced desktop Clang is retained. Controls remain 12pt (headings max 14pt), independently of large document text.

## Automated verification
- 42 latest Node tests pass: parsers and offsets, exact Save names, cancellation/discard, automatic/manual recovery and Android worker reuse/isolation.
- All 23 valid/invalid files from the delivered validation ZIP pass the new checkers, across all ten supported code languages. These reference checks do not execute the programs.
- Chromium and WebKit pass under the desktop CSP; real worker diagnostics and existing layout/indentation/Vim checks are retained.
- iPad and Mac/Windows native gates passed in run 43333187409 on source ff78e63845c687efa46c2d340118600a43098116. Android in that run failed and is superseded; the overall run must not be described as entirely successful.
- Android keeps two persistent isolated worker engines (Python and ordinary/C). Requests are serialized per engine; only the newest queued request is retained and stale results are ignored. Discard clears per-document request state. Individual Rust parsers/workspaces are freed. Watchdogs still terminate a genuinely stuck worker. Non-Android worker behavior is unchanged.
- Final Android source be59892af32a31411537a06548b9cb762300adf0, run 43340101425: all native parser, layout/Vim, file-manager/cancellation, exact .c and extensionless save/reopen gates pass. Production excludes both verification drivers and worker timing probes; the permanent Android certificate is verified.

## iPhone/iPad and universal Mac TestFlight

Both were processed VALID and verified IN_BETA_TESTING in the existing internal tester group by the release scripts. This is not a public App Store release.

| Platform | Version/build | Apple build ID | Successful job |
| --- | --- | --- | --- |
| iPhone/iPad | 0.6.0 (19) | e7e2fe81-3ff1-4ea4-a21c-f0011627deaf | 131587934892 |
| Universal Mac | 0.6.0 (19) | a592e20c-f99b-4afa-b552-d4f73f3c3a3b | 131588573185 |

Physical update visibility and acceptance remain unverified.

## Public Mac and Windows downloads

Publisher run 43335634684 passed signature/provenance checks and independently verified the live public download bytes and SHA-256. Both packages originate from source ff78e63845c687efa46c2d340118600a43098116, native release run 43333187409.

| Package | Artifact ID | Public bytes | SHA-256 |
| --- | --- | --- | --- |
| Windows x64 | 13996911504 | 5052369 | 20f200c1eb0d095638dc766d094c2cd7c7485d1505dd67efa6b879b2f0f24540 |
| Universal Mac | 13997390531 | 11592872 | 05af50c97d7bc1e35a4e4a93d89ecabc21e77799456dd67b9dfe3082753f5afd |

Windows remains unsigned by the owner's prior decision; its exact installer was installed and launched in CI. Mac is Developer ID signed (team VXMLKHF72B), notarization Accepted and stapled, with Intel and Apple silicon slices verified.

## Public Android APK

Publisher run 43341439014 passed source/artifact provenance, permanent-signer and Android package checks, then verified the live public bytes and SHA-256.

- Source: be59892af32a31411537a06548b9cb762300adf0; native/build run: 43340101425; artifact: 14000020390.
- Version name 0.6.0; version code 19. Public file: /downloads/ate.apk; bytes: 7139484.
- APK SHA-256: c842951ba62d8929f50c8be7abfcd8ab07a7ebc97d2326d60b92743bc189ab53.
- Permanent signer SHA-256: ef654829950fdf9d59f061c7b0fdc80358373a619fc02fa10480816e0665d6e4.

## Compatibility findings

The first Android 11 gate rejected modern Ruff 0.17.5 Wasm reference types. Pinning the MVP-compatible Ruff 0.6.9 build fixed that loading failure on every platform. The old API reports Unicode scalar columns, which ATE converts to UTF-16 editor offsets. Android timing probes then measured C cold startup at about 9.9 seconds: asset fetch began at 00:54:52.775 UTC, bytes were ready at 00:55:00.047, runtime initialization finished at 00:55:02.428 and grammar loading at 00:55:02.646. The previous eight-second total allowance was too short. Android now has a 30-second allowance for first C/Python engine loading, with the eight-second watchdog retained for warm checks. The emulator also settles after boot. Persistent engine isolation and serialized newest-request tests cover repeat/switch behavior. Diagnostic probes are excluded from production. Failed verification builds were not published as APKs.

## Documentation and acceptance

Cuberoot documentation commit cd738dca52dc0b61eadda4162897a3eba4e07d99 updates the online Quick Start/Full User Guide, matching large-print PDFs and download-page capabilities. Live HTML and PDF bytes were verified against the prepared documents. The download-web check passed in run 43341438850.

All requested code/build/publication tasks are complete. Owner validation on physical iPad, Mac, Windows and Fire HD 8 remains separate; automated/native CI is not a physical-device acceptance claim.
