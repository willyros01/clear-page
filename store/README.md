# ATE App Store metadata preparation

This folder prepares the existing ATE iOS and native universal macOS draft listings. Special build 0.8.7 (28) uses application source 23f352a4ceb3ad99a5f112a564253f0f0dd9ea9e on `desktop`. Test automation and preparation repairs are pinned at aa690766ebd7ed0d7938f102e06374b8749b3369, preparation run 43874608409. No production application source changed in those test repairs.

The workflow on `main` prepares metadata only; it never builds the older application code on `main`, submits for App Review or releases an app. The first job delivers reviewed native screenshot sets to the existing drafts using `ATE_DRAFT_STAGE=assets` and `ATE_ONLY=assets`. The second job waits for all required native gates and both Apple upload/processing jobs, then attaches only the exact VALID 0.8.7 (28) build for each platform using `ATE_ONLY=builds`.

Text, policy links, categories, Free pricing, manual release, age-rating answers and private review contact were prepared separately. The copy workflow runs on explicit dispatch or changes to its listing/preparation files; it does not build or submit the app. No private telephone or signing credential is committed or exported. Final App Privacy/account checks and owner physical-device acceptance remain before submission.

On 16 November 2026 the owner authorized automatic release after approval and revised positioning. Listing/readiness run 43936400560 saved and read back AFTER_APPROVAL for both drafts, the notepad/Vim/syntax-checker/project copy, exact attached build 28, all screenshots, Free pricing and 175 territories. No App Review submission was created. The API completion evidence and technical review identify the remaining owner/website steps.
