# ATE 0.8.3 (24) — iPhone and iPad

**Released to the existing internal TestFlight group on 15 November 2026.**

Tested source: `b4eee097274214c87afd133566de44435d354bb8` on `ios-tabs`.
Workflow: [43719685778](https://github.com/willyros01/clear-page/actions/runs/43719685778).

## Projects

- Full-page Projects follows the approved mockup, with an indented file tree and selected-folder highlight. Tap a folder name to select, its arrow to expand/collapse, or a filename to open it in the editor.
- Open project contains saved projects, Create new project, ZIP import/export and secondary Manage files. Close project keeps saved files and protects unsaved work with Cancel/Save/Discard choices.
- Selected-folder actions are Add file (Create file or Choose files), New folder and Delete folder. No scattered plus buttons, Your projects block or permanent filename/path form in the tree.
- Delete folder previews all affected contents, protects project root and unsaved affected tabs, detects changed contents, and restores bytes/membership if commit fails. Outside originals, sibling folders and other projects remain. Failed cleanup reports a staged recovery copy.
- Projects uses larger controls and file labels. The independent default 36px document font and current editor Close/Exit behavior are preserved.

## Release blockers resolved

Earlier pre-release runs found that stacked WebKit modal dialogs could leave Projects controls absent from the native accessibility tree after cancellation. Projects now uses one modal at a time, restoring selection, scroll and navigation focus on return. Native cancellation and repeated deletion tests pass.

A cold syntax worker could exhaust the former eight-second combined initialization/parsing limit. Initialization now has a separate 30-second budget and reports readiness; parsing remains bounded by an eight-second watchdog after readiness. Deterministic tests cover successful slow initialization, stuck parsing and missing initialization. Timeout results still fail native verification; none is accepted as a successful check.

The browser close/cancel test now waits for the dialog close event to restore the visible Projects page. Its assertions also require only one open dialog. These changes were verified in a fresh complete run at the source above; failed earlier runs do not count as release passes.

## Verification before signing/upload

| Gate | Result |
| --- | --- |
| Node tests | 59 passed |
| Chromium and WebKit production regression | Passed, including 320/390/768/1194px layouts and 100/200/300% controls |
| Native WKWebView parser/editor/tabs/filesystem/recovery checks | 286 passed per device |
| Focused production Projects layout and dialog-return case | Passed on iPhone and iPad |
| Full production XCUITest | All six functional cases passed on each device |
| Largest OS accessibility text | Both Projects layout/deletion and toolbar/Save cases passed on each device |
| Release archive | Identity, version, bundled assets, privacy manifest and signature verified |

Full functional coverage includes filename/menu return, Basic/Advanced preferences, project creation/save/reopen/ZIP, folder destinations, native Files cancellation, Close Cancel/Save/Discard, ordinary-tab preservation, real folder deletion Cancel/Confirm, independent tabs, native Share cancellation, forced relaunch, rotation/background and toolbar/Save visibility. Folder-store tests cover nested/unlisted bytes, sibling/other-project preservation, stale confirmation, rollback and cleanup recovery.

## Apple distribution

- Upload completed: 14:23 UTC on 15 November 2026.
- Processing: **VALID**.
- Apple build ID: `f496fa71-3eb5-4361-850c-ddd63904427c`.
- Existing internal tester group: **IN_BETA_TESTING**, verified at 09:24 America/Toronto (14:24 UTC).
- Workflow completed successfully; device-side TestFlight visibility is not independently verified.

## Physical acceptance

Simulator tests do not certify the owner's physical display settings or every Files provider. Owner acceptance remains for iPhone/iPad at preferred text/display zoom, real SQL/provider selection, and successful Save to Files/reopen. Other platform distributions were not rebuilt.
