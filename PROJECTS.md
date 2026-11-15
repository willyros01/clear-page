# ATE projects and Basic/Advanced tools

In Menu → Tools choose Basic or Advanced. Basic retains ordinary open/edit/save, tabs, search, appearance and document sizing. Advanced adds language/syntax/indentation/Vim controls and Projects. Switching modes does not change document contents, names or unsaved edits. The choice is remembered. Existing installations migrate to Advanced; new installations start in Basic.

## Project workflow

1. Menu → Advanced → Projects. Choose Open project → Create new project, enter a name and create it.
2. Select a folder name in the visible tree; its arrow expands/collapses. The selected-folder action bar contains Add file, New folder and Delete folder.
3. Add file offers Create file or Choose files. The chosen destination is shown. Added files are copies; outside originals stay unchanged.
4. Tap a filename in the tree to open an editor tab. Save file writes the project copy directly. Export copy uses the platform save/export flow without marking the project file saved.
5. Changing a project tab's filename before Save creates a new project file and keeps the old one. ATE refuses to replace another existing file or invent an extension.
6. Open project also contains Import/Export project ZIP and secondary Manage files. Remove from the list only removes membership; the stored file and open tab remain.
7. Save unsaved project tabs before Export project ZIP. ZIP contains saved members and ordinary folders, not unsaved buffers or removed members. Import ZIP creates a separate copy.
8. Close project closes only its project tabs. Unsaved changes offer Save, Discard or Cancel. Back to editor dismisses the page without closing the project.
9. Delete folder previews all affected contents and requires confirmation. Project root and folders with unsaved affected tabs are protected. Sibling folders, other projects and outside originals remain.

| Platform | Project storage |
| --- | --- |
| iPhone/iPad | Files → On My iPhone/iPad → ATE → ATEProjects |
| Android | Private local app storage, separate from recovery drafts |
| Mac/Windows | Scoped local app-data filesystem; Mac TestFlight uses its sandbox |
| Web | IndexedDB for this browser and site, separate from limited tab recovery |

Export ZIP backups before clearing app/browser data or moving devices. ZIP preserves ordinary UTF-8 source/configuration files and relative folders for other IDEs. ATE's JSON `project.ateproj` manifest lists files but does not contain their contents. ATE does not generate Xcode projects, compiler targets or build settings. No project code is executed.

Local tab recovery remembers project associations across restarts. The tab × closes one file; Mac/Windows/Android Exit keeps a separate whole-app confirmation. Cancelling a save while exiting keeps all tabs and drafts. Web Exit clears the editor without deleting saved projects; downloads cannot be independently confirmed, so saved recovery is retained.

## Manifest version 1

```json
{
  "format": "ate-project",
  "version": 1,
  "name": "C example",
  "folders": ["src"],
  "files": ["src/main.c", "src/main.h", "build.sh"]
}
```

Paths are relative, exact names, with `/` folder separators. Unsafe/absolute/traversing paths, percent-encoded/fragment names, reserved metadata paths, case-only collisions and names incompatible with portable file storage are rejected rather than silently renamed. ZIP imports validate paths before extracting into a new ATE-owned folder. Symlinks/executable permissions are not restored; source is stored as text, never executed.

Current limits: 200 member files, 100 folders, 10 MB per file and 20 MB of member text. Binary assets are not supported. Recovery uses local device storage and can fail if quota is exhausted; a visible warning requests an explicit file save. Project files use the platform storage shown above, separately from recovery drafts. Browser/site-data deletion can remove IndexedDB projects; ZIP is the independent backup.

Existing files are compared against the tab's SHA-256 revision before saving. If another tab or outside editor changed the stored file, reopen it or use Export copy; ATE keeps the unsaved editor text. Backups/compare, folder-wide search, formatting and full project compilation remain separate planned features.

## Shell scripts

Shell extensions, common startup files and interpreter headers identify Unix scripts before embedded Python is examined. `env`, `env -S` and common shell paths are recognized. Highlighting uses the shell tokenizer. Offline structural checking uses the Bash grammar for sh/Bash/dash/ash; it does not enforce POSIX portability, resolve commands/expansions, or run scripts. Recognized zsh/ksh/fish/csh-family scripts are not passed off as successfully checked Bash. Explicit source extensions still take precedence when selecting a language; detection never renames a file.

## Verification

The release workflow runs Node integration tests and Chromium/WebKit regression before iPhone/iPad simulator tests. Native tests cover real project storage, UTF-8/CRLF bytes, exact extensionless names, ZIP transfer, mode/recovery, shell diagnostics and earlier editor/tab behavior. XCUITest exercises actual mode/project controls, saving, share/picker cancellation, restart, rotation and background/resume against production assets. Physical device acceptance remains separate.
