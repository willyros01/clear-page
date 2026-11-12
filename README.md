# Another Text Editor (ATE)

Current desktop release: **0.5.3 (Mac TestFlight build 18)** with the built-in C parser as default and Clang as an optional advanced mode. iOS and Android remain **0.5.2 (17)**. Menus, configuration, search and syntax messages use **12pt text**, headings at most **14pt**. Document text keeps an independent **27pt / 36px default**, adjustable from 10 to 54pt.

[Downloads](https://www.cuberoot-systems.com/ate/) · [Release verification](RELEASE-0.5.3.md) · [Progress tracking](TODO.md)

## Build and verify

Use Node.js 22 or newer. Run `npm ci`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium webkit`, then `npm run test:browser`. Serve `dist/` using a static web server. CodeMirror, parser workers, C Wasm assets and license notices are bundled locally.

Desktop-only release workflow: `.github/workflows/desktop-basic.yml` (Mac TestFlight/website and Windows website). The coordinated workflow is `.github/workflows/all-platforms.yml` on desktop; Android is included in the coordinated release workflow. Native iPad/Mac/Windows webviews and Android file-manager tests gate production packaging. Verification drivers are excluded from release assets. Before a new Apple release, increment the version/build number; Version/build are synchronized by release.json; the next coordinated release is 0.6.0 (19). Automated evidence does not replace physical-device acceptance.

## Editing and files

Language detection uses the filename first and a bounded local content scan for ambiguous files. Explicit menu choices persist. Detection never renames the document. Save preserves an extensionless filename; new unnamed documents default to `Untitled`. Discard does not write or rename the source file.

CodeMirror provides keyword colors, four-space indentation, line numbers, bracket matching, undo/redo and search/replace. Menu includes language, theme, document size, optional Vim, Copy, Help and C settings. Text or icon controls retain accessible labels and touch targets of at least 44px.

Android/Fire Open and Save use the system file manager. Choose a folder and filename; cancellation preserves the draft, and Save confirms the completed UTF-8 write. Mac/Windows use native dialogs. iOS Save uses the share sheet's Save to Files action; web Save starts a download. Open accepts UTF-8 text/code files up to 10 MB and rejects null characters.

Close/Exit offers Keep editing, Save and close/exit, or discard. Discard clears the active document and recovery draft without an extra closing page. Android closes the activity, desktop quits, and iOS uses the Home gesture to leave the app.

Recovery/preferences stay on this device; no ATE account or cloud synchronization is used. Keep independent file copies before clearing app/site data or uninstalling.

## Code checking and Vim

Menu → Check syntax opens line/column issues; select an issue to jump to it. Check while typing is optional. JavaScript, TypeScript syntax, JSON, YAML, HTML and CSS use bundled offline parsers. Python has a bundled Ruff/WebAssembly Python 3.13 syntax parser, without executing source or resolving imports/types. SQL uses the bundled SQLite grammar, without connecting to a database or executing statements. Markdown uses the Lezer Markdown parser with warnings for duplicate headings, unclosed fenced code and trailing whitespace (two-space hard breaks allowed).

C on iPad/iPhone, Android and web uses a bundled structural parser, without header resolution, macro expansion, type checks or compiler-standard enforcement. Desktop C uses the same bundled structural parser by default. Choose C settings → C checking → Advanced: installed Clang for local Clang with `-fsyntax-only`, project/include/macro settings and an optional verified Windows LLVM-MinGW download. See [C-CHECKING.md](C-CHECKING.md). Checks stay local and never run user programs or send source to a remote compiler.

Optional Vim works best with a hardware keyboard: `i` inserts, Escape returns to Normal, `/word` searches, `n/N` repeats, `:` opens commands, `:25` jumps, `:%s/old/new/g` replaces, `:w` saves, `:q` opens closing choices and `:wq` saves then closes. Vim's yank register is separate from the system clipboard; use Menu → Copy for another app.

## Distribution and licensing

iPhone/iPad and universal Mac use the existing internal TestFlight groups. Mac, Windows and signed Android downloads use Cuberoot. TestFlight processing does not imply public App Store release or review approval. [RELEASE-0.5.3.md](RELEASE-0.5.3.md) records current desktop sources, build IDs, public hashes and remaining physical acceptance. Mobile evidence remains in [RELEASE-0.5.2.md](RELEASE-0.5.2.md).

ATE remains proprietary; dependency licenses are included in `THIRD-PARTY-NOTICES.txt`. Regenerate with `node scripts/third-party-notices.mjs` after dependency changes. Platform details: [iOS](IOS-SETUP.md), [desktop](DESKTOP-SETUP.md), [Android](ANDROID-SETUP.md).
