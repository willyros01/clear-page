# ATE iOS release resources

- stickman-icon.png.base64 stores the approved opaque 1024px PNG as text for repository transport. Decode it as base64 to inspect the image. It is the selected first faceless minimalist figure with bent arms, upright flat paper and a simple pen. Original image generated with the built-in image tool; resized/quantized for app packaging.
- make-icon.swift decodes that PNG directly, validates dimensions, opacity and nonblank color samples, and installs it into the generated AppIcon asset catalog. No off-screen drawing is used.
- PrivacyInfo.xcprivacy declares no tracking/data collection and Filesystem timestamp reason C617.1.
- package-privacy.swift places the manifest at the archived app root before archive-signature refresh and Apple distribution signing.

The Mac workflow verifies Swift first. No raw .pbxproj text edits are used. See IOS-SETUP.md for actual release verification.
