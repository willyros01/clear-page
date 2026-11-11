# iOS release resources

The TestFlight workflow verifies Swift on macOS before using these resources.

- make-icon.swift generates an opaque 1024px green paper app icon in the generated asset catalog.
- PrivacyInfo.xcprivacy declares no tracking or data collection and the Filesystem timestamp reason C617.1.
- package-privacy.swift places that manifest at the archived app-bundle root. The build then refreshes and verifies the ad-hoc archive signature before Apple distribution export signs the final package.

No generated .pbxproj text edits are used. Build evidence includes the generated icon and release logs. See IOS-SETUP.md for actual release status; source files alone are not proof of an accepted release.
