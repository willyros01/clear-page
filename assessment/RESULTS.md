# Zig 0.17.1: C compatibility and disk assessment

Assessed 12 November 2026 (America/Toronto). This is an evaluation, not integration into the shipped ATE app.

## Verdict

Zig includes **Clang 22.1.8**. It is a credible smaller optional C toolchain, but **not a drop-in replacement for ATE's current Clang invocation**.

The adapted direct Clang frontend passed 44 focused fixtures across native Windows x64, Intel Mac and Apple silicon. These covered C99/C11/C17 modes, selected C23 features, standard headers, project headers/macros, syntax/type errors, missing headers and platform headers. All 21 comparisons against the available system Clang compilers agreed on the tested valid/invalid language fixtures.

This is **not** a complete ISO conformance suite or a guarantee of 100% compatibility. Clang itself documents incomplete/partial features, particularly newer standards. Target ABI, bundled C library, SDK availability, compiler version and vendor extensions differ between Zig, Apple Clang, LLVM-MinGW and MSVC-targeted Clang.

## Native evidence

[Assessment run 43216011773](https://github.com/willyros01/clear-page/actions/runs/43216011773), script source `02470eeddeb07c667b1680753404c48dfda8daf9`.

| Native host | Zig Clang | System comparator | Direct frontend checks |
| --- | --- | --- | --- |
| Windows Server 2025 x64 | 22.1.8 | LLVM Clang 20.1.8, MSVC target | 14/14 |
| macOS 15.7.9 Intel | 22.1.8 | Apple Clang 17.0.0 | 15/15 |
| macOS 26.7.2 Apple silicon | 22.1.8 | Apple Clang 21.0.0 | 15/15 |

The Mac extra fixture confirmed that CoreFoundation framework headers are not bundled. The direct frontend uses `-nostdinc` and explicit Zig package include/resource paths, so these successful standard-C checks did not depend on Apple SDK or Windows SDK headers.

Raw evidence: [native-results.json](native-results.json). Reproducer: [zig-check.py](zig-check.py). Native artifact IDs: Apple silicon 13944345516; Intel Mac 13943293067; Windows 13943791972.

## Important invocation issue

ATE currently sends an unsaved buffer through stdin with `-fsyntax-only`, its warning/diagnostic flags and a selected C standard.

- `zig cc` accepted these flags but failed on valid code on both Macs: an internal object-file cache rename returned FileNotFound. First calls took about 18 and 36 seconds, also exceeding ATE's current 10-second limit.
- The same normal driver did not finish within 60 seconds on Windows and was terminated. No clean result was claimed.
- On Linux, file input, stdin and an explicit null output destination reproduced the cache failure. `-fno-emit-bin` was rejected.
- `zig clang` bypassed the problematic driver path and passed all 44 native fixtures with explicit resource/target/header configuration. Its diagnostics retained the `<stdin>:line:column` form ATE expects.
- This direct frontend command is not listed in the main help menu. Any integration should pin the tested version/layout and retain native regression gates; it cannot rely on arbitrary Zig updates remaining identical.

## Disk footprint

All archives were fetched from the official Zig 0.17.1 release and checked against its published SHA-256 and byte length. MB below means decimal megabytes, not MiB.

| Package | Download MB | Extracted file bytes, MB | File allocation on disk, MB |
| --- | ---: | ---: | ---: |
| Mac Apple silicon | 54.0 | 388.1 | 442.2, measured on native Mac |
| Mac Intel | 59.5 | 398.5 | 458.5, measured on native Mac |
| Windows x64 | 100.3 | 379.0 | 430.3, estimated using 4 KB allocation |

There are 19,520 regular files in each package. Allocation varies with filesystem, cluster size, compression and metadata; the Windows figure is an estimate, not a native allocation measurement. Independent archive extraction on Linux matched the exact logical file totals.

Normal-driver trials added roughly 50–60 MB of cache. The direct syntax-frontend tests added no further cache files or bytes. General compilation/project caches can grow beyond this sample, so there is no universal fixed maximum.

**Practical fresh-install budget:** about **600 MB for the toolchain plus the measured cache**, with **1 GB free** to accommodate download/extraction and working room. Remove the compressed download after successful setup. This is a planning allowance, not a guaranteed cache cap or an upgrade-staging requirement.

## ATE implications and remaining work

- Ordinary C checking with bundled headers is feasible without installing full Xcode or Apple Command Line Tools.
- Apple-specific frameworks still require the relevant SDK. Header availability and target ABI remain part of what a compiler can validate.
- The shipped ATE 0.5.2 Choose Clang path does not implement a Zig adapter. Integration needs executable-kind handling, prefix arguments, target/header/resource selection, verified optional download, diagnostics/cancellation and cold-start checks.
- Mac TestFlight sandbox/downloaded-tool acceptance and physical-device acceptance remain separate from native CLI evidence.
- No ATE application code, existing compiler installation, public installer or TestFlight binary was changed by this assessment.

## Primary references

- [Official release index and checksums](https://ziglang.org/download/index.json)
- [Zig 0.17 release notes](https://ziglang.org/download/0.17.0/release-notes.html)
- [Clang C standard implementation status](https://clang.llvm.org/c_status.html)
