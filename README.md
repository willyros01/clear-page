# Another Text Editor (ATE)

ATE **0.8.3 (24)** is available for iPhone/iPad TestFlight, universal Mac TestFlight, notarized universal Mac, Windows x64 and the web. Android 0.8.3 is in independent native verification. Tabs, Basic/Advanced tools and the approved Projects tree are shared across platforms. Document text keeps its **27pt / 36px default**, adjustable from 10 to 54pt. Menus retain 12pt controls; Projects uses larger controls, file labels and headings.

[Web app](https://www.cuberoot-systems.com/ate/app/) · [Downloads](https://www.cuberoot-systems.com/ate/) · [0.8.3 platform verification](RELEASE-0.8.3-PLATFORMS.md) · [iPhone/iPad verification](RELEASE-0.8.3.md) · [Projects guide](PROJECTS.md) · [Progress tracking](TODO.md)

## Build and verify

Use Node.js 22 or newer. Run `npm ci`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium webkit`, then `npm run test:browser`. Serve `dist/` using a static web server. CodeMirror, parser workers, C Wasm assets and license notices are bundled locally.

The iOS tabs workflow is `.github/workflows/ios-tabs.yml` on `ios-tabs`. Its accepted build 24 passed Node/browser, iPhone/iPad native-webview, full XCUITest and largest-text gates; see RELEASE-0.8.3.md.

Native desktop source was verified on `desktop`; `.github/workflows/release-desktop-083.yml` preserves its successful artifacts for TestFlight, notarization and publication without recompilation. Android now uses `.github/workflows/android-083.yml` on `android` and cannot cancel desktop releases. Browser/native gates, production-driver exclusion, signing and public hash checks are required. See RELEASE-0.8.3-PLATFORMS.md for the exact sources and evidence.

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

iPhone/iPad and universal Mac use the existing internal TestFlight groups. Mac, Windows and signed Android downloads use Cuberoot. TestFlight processing does not imply public App Store release or review approval. [RELEASE-0.8.3-PLATFORMS.md](RELEASE-0.8.3-PLATFORMS.md) records platform sources, build IDs, public hashes and remaining physical acceptance.

ATE remains proprietary; dependency licenses are included in `THIRD-PARTY-NOTICES.txt`. Regenerate with `node scripts/third-party-notices.mjs` after dependency changes. Platform details: [iOS](IOS-SETUP.md), [desktop](DESKTOP-SETUP.md), [Android](ANDROID-SETUP.md).
