# iOS release resources

resources/make-icon.swift generates an opaque green-and-paper 1024px release icon with AppKit on the Mac build runner.

PrivacyInfo.xcprivacy declares no tracking or developer data collection and file-timestamp use for app-managed text exports (C617.1). The manifest still needs to be linked into the native app's resource build phase and verified in the resulting signed archive before TestFlight release. Merely placing this source file in the repository does not complete that integration.

The Swift icon generator is prepared source and has not yet been executed on a Mac.
