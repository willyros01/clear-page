# ATE App Store metadata preparation

This folder prepares the existing ATE iOS and native universal macOS draft listings. Special build 0.8.7 (28) uses application source 23f352a4ceb3ad99a5f112a564253f0f0dd9ea9e on `desktop`. Test automation and preparation repairs are pinned at 4407aac3774148fee391b049b3118e68af5a9edd, preparation run 43866159579. No production application source changed in those test repairs.

The workflow on `main` prepares metadata only; it never builds the older application code on `main`, submits for App Review or releases an app. The first job delivers reviewed native screenshot sets to the existing drafts using `ATE_DRAFT_STAGE=assets` and `ATE_ONLY=assets`. The second job waits for all required native gates and both Apple upload/processing jobs, then attaches only the exact VALID 0.8.7 (28) build for each platform using `ATE_ONLY=builds`.

Text, policy links, categories, Free pricing, manual release, age-rating answers and private review contact were prepared separately. The copy workflow is now explicit-dispatch only. No private telephone or signing credential is committed or exported. Final App Privacy/account checks and owner physical-device acceptance remain before submission.
