# ATE projects and Basic/Advanced tools

In iOS Menu → Tools choose Basic or Advanced. Basic retains ordinary open/edit/save, tabs, search, appearance and document sizing. Advanced adds language/syntax/indentation/Vim controls and Projects. Switching modes does not change document contents, names or unsaved edits. The choice is remembered. Existing installations migrate to Advanced; new installations start in Basic.

## Project workflow

1. Advanced → Projects → enter a name → Create project.
2. Create a folder or file using a relative name, such as `src/main.c`; choose a folder before Add files. Added files are copies of the selected files.
3. Open a file from the tree to edit a project tab. Save file writes that project copy directly. Export copy shares a separate file and does not mark unsaved project edits saved.
4. Changing a project tab's filename before Save creates a new project file and keeps the old one; ATE refuses to replace another existing file. File extensions are never invented.
5. Remove only removes membership. The stored file and open tab remain. Add files can re-add an unchanged retained file; different contents require a new name.
6. Save unsaved project tabs before Export project ZIP. ZIP exports contain saved members, not unsaved buffers or removed members. Import project ZIP creates a separate project and preserves existing projects/files.

Project files live in Files → On My iPad/iPhone → ATE → ATEProjects, in a named project folder with a unique suffix. They remain ordinary UTF-8 source/configuration/text files. Each folder contains `project.ateproj`. A manifest alone lists files but does not contain their contents; ZIP is the complete transfer format. Local recovery remembers project-bound editor tabs across app restarts.

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

Current limits: 200 member files, 100 folders, 10 MB per file and 20 MB of member text. Binary assets are not supported. Recovery uses local device storage and can fail if quota is exhausted; a visible warning requests an explicit file save. Project files use native storage separately from recovery drafts.

Existing files are compared against the tab's SHA-256 revision before saving. If another tab or outside editor changed the stored file, reopen it or use Export copy; ATE keeps the unsaved editor text. Backups/compare, folder-wide search, formatting and full project compilation remain separate planned features.

## Shell scripts

Shell extensions, common startup files and interpreter headers identify Unix scripts before embedded Python is examined. `env`, `env -S` and common shell paths are recognized. Highlighting uses the shell tokenizer. Offline structural checking uses the Bash grammar for sh/Bash/dash/ash; it does not enforce POSIX portability, resolve commands/expansions, or run scripts. Recognized zsh/ksh/fish/csh-family scripts are not passed off as successfully checked Bash. Explicit source extensions still take precedence when selecting a language; detection never renames a file.

## Verification

The release workflow runs Node integration tests and Chromium/WebKit regression before iPhone/iPad simulator tests. Native tests cover real project storage, UTF-8/CRLF bytes, exact extensionless names, ZIP transfer, mode/recovery, shell diagnostics and earlier editor/tab behavior. XCUITest exercises actual mode/project controls, saving, share/picker cancellation, restart, rotation and background/resume against production assets. Physical device acceptance remains separate.
