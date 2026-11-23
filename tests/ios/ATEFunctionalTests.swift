import XCTest

final class ATEFunctionalTests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "io.github.willyros01.clearpage")
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.terminate()
        app.launch()
        let accept = app.buttons["Accept and continue"]
        let terms = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "ATE Terms of Use")).firstMatch
        let menuButton = app.buttons["Menu"]
        let ready = Date().addingTimeInterval(60)
        var agreementRequired = false
        // Retain a positive Terms observation. A cold WebKit AX snapshot can
        // briefly disappear between queries; Menu behind a modal is not ready.
        while Date() < ready {
            if terms.exists { agreementRequired = true; break }
            if menuButton.exists && menuButton.isHittable { break }
            RunLoop.current.run(until: Date().addingTimeInterval(0.2))
        }
        if agreementRequired {
            XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30), app.debugDescription)
            // Off-screen WebKit buttons may not be in the native AX snapshot.
            // Detect the visible modal, then scroll to its actual agreement box.
            let agree = app.switches["I have read and agree to the Terms of Use"]
            for _ in 0..<15 {
                if agree.exists && agree.isHittable && app.frame.contains(agree.frame) { break }
                app.webViews.firstMatch.swipeUp()
            }
            XCTAssertTrue(agree.waitForExistence(timeout: 10), app.debugDescription)
            XCTAssertTrue(agree.isHittable && app.frame.contains(agree.frame), app.debugDescription)
            XCTAssertFalse(accept.isEnabled, "The terms require an explicit agreement")
            agree.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0)).withOffset(CGVector(dx: 14, dy: 16)).tap()
            let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: accept)
            XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 5), .completed, app.debugDescription)
            for _ in 0..<6 { if accept.isHittable && app.frame.contains(accept.frame) { break }; app.webViews.firstMatch.swipeUp() }
            XCTAssertTrue(accept.isEnabled && accept.isHittable, app.debugDescription)
            accept.tap()
            XCTAssertTrue(waitForGone(accept, timeout: 10), app.debugDescription)
        }
        XCTAssertTrue(menuButton.waitForExistence(timeout: 30), app.debugDescription)
        let usableMenu = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: menuButton)
        XCTAssertEqual(XCTWaiter.wait(for: [usableMenu], timeout: 15), .completed, app.debugDescription)
    }
    override func tearDownWithError() throws {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    var menuSafeTop: CGFloat = 0
    func menu() {
        let button = app.buttons["Menu"]
        XCTAssertTrue(button.waitForExistence(timeout: 15), app.debugDescription)
        XCTAssertTrue(button.isHittable, app.debugDescription)
        menuSafeTop = max(0, button.frame.minY)
        button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.staticTexts["Editor menu"].waitForExistence(timeout: 10), app.debugDescription)
    }
    func rename(_ name: String) {
        menu()
        let field = app.textFields["File name"]
        XCTAssertTrue(field.waitForExistence(timeout: 10), app.debugDescription)
        field.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        let old = field.value as? String ?? ""
        field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: old.count))
        field.typeText(name)
        finishMenu()
    }
    func dismissKeyboard() {
        // A fresh iPhone simulator can show Apple's slide-to-type introduction.
        // Dismiss that native overlay before using its keyboard Done accessory.
        let introduction = app.otherElements["UIContinuousPathIntroductionView"].firstMatch
        if introduction.exists {
            let proceed = introduction.buttons["Continue"].firstMatch
            if proceed.waitForExistence(timeout: 3) && proceed.isHittable {
                proceed.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
            }
        }
        let keyboardDone = app.toolbars.buttons["Done"].firstMatch
        if keyboardDone.exists && keyboardDone.isHittable {
            keyboardDone.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
        let hide = app.buttons["Hide keyboard"].firstMatch
        if hide.exists && hide.isHittable { hide.tap() }
        _ = waitForGone(app.keyboards.firstMatch, timeout: 5)
    }
    func finishMenu() {
        let done = app.webViews.buttons["Done"].firstMatch
        XCTAssertTrue(done.waitForExistence(timeout: 10), app.debugDescription)
        let panel = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Editor menu,")).firstMatch
        func fullyVisible() -> Bool {
            let viewport = panel.exists ? panel.frame.intersection(app.frame) : app.frame
            return done.isHittable && viewport.contains(done.frame) && done.frame.minY >= menuSafeTop
        }
        func revealDone() {
            let target = panel.exists ? panel : app.webViews.firstMatch
            if done.frame.minY < target.frame.minY { target.swipeDown() } else { target.swipeUp() }
        }
        for _ in 0..<6 {
            if fullyVisible() { break }
            revealDone()
        }
        if !fullyVisible() {
            dismissKeyboard()
            for _ in 0..<4 {
                if fullyVisible() { break }
                revealDone()
            }
        }
        XCTAssertTrue(fullyVisible(), app.debugDescription)
        done.tap()
        XCTAssertTrue(waitForGone(app.staticTexts["Editor menu"], timeout: 10), app.debugDescription)
    }
    func visibleProjectButton(_ label: String) -> XCUIElement {
        // aria-pressed folder selections are exposed as native switches.
        let button = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
        XCTAssertTrue(button.waitForExistence(timeout: 15), app.debugDescription)
        let picker = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Open project, web dialog")).firstMatch
        let panel = picker.exists ? picker : app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Projects,")).firstMatch
        XCTAssertTrue(panel.waitForExistence(timeout: 15), app.debugDescription)
        let region = ["Add file", "New folder", "Delete folder"].contains(label) ? "Selected folder actions" : "Project contents"
        let contents = picker.exists ? picker : app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", region)).firstMatch
        XCTAssertTrue(contents.waitForExistence(timeout: 15), app.debugDescription)
        func fullyVisible() -> Bool {
            let viewport = contents.frame.intersection(panel.frame).intersection(app.frame)
            let headerBottom = picker.exists ? panel.frame.minY : app.buttons["Back to editor"].frame.maxY
            return !viewport.isEmpty && viewport.contains(button.frame) && button.frame.minY >= headerBottom && button.isHittable
        }
        if !fullyVisible() { dismissKeyboard() }
        for _ in 0..<8 {
            if fullyVisible() { break }
            if app.otherElements["UIContinuousPathIntroductionView"].firstMatch.exists {
                dismissKeyboard()
            } else if button.frame.minY < contents.frame.minY {
                contents.swipeDown()
            } else {
                contents.swipeUp()
            }
        }
        // A keyboard tutorial can appear during a gesture on a fresh simulator.
        // Recheck after dismissing it; still require the entire target on screen.
        if !fullyVisible() { dismissKeyboard() }
        XCTAssertTrue(fullyVisible(), app.debugDescription)

        return button
    }
    func projectButton(_ label: String) {
        visibleProjectButton(label).coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }
    func assertWord(_ word: String) {
        XCTAssertTrue(editor().staticTexts.matching(NSPredicate(format: "label CONTAINS %@", word)).firstMatch.exists, app.debugDescription)
    }
    func setMode(_ name: String) {
        // aria-pressed controls may be exposed as native toggles rather than buttons.
        let control = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", name + " mode")).firstMatch
        XCTAssertTrue(control.waitForExistence(timeout: 15), app.debugDescription)
        if !control.isHittable { dismissKeyboard(); app.webViews.firstMatch.swipeDown() }
        control.tap()
    }
    func cancelDocumentPicker() {
        let choose = app.buttons.matching(NSPredicate(format: "label IN %@", ["Choose File", "Choose Files"])).firstMatch
        if choose.waitForExistence(timeout: 5) { choose.tap() }
        let cancel = app.buttons["Cancel"].firstMatch
        let popup = app.otherElements["PopoverDismissRegion"].firstMatch
        // A cold simulator can take well over 5 seconds to present the system picker.
        // Wait for whichever form of the picker appears instead of giving up early.
        let deadline = Date().addingTimeInterval(30)
        while Date() < deadline && !cancel.exists && !popup.exists {
            RunLoop.current.run(until: Date().addingTimeInterval(0.25))
        }
        if cancel.exists {
            cancel.tap()
            XCTAssertTrue(waitForGone(cancel, timeout: 10), app.debugDescription)
        } else {
            // iPadOS 26's 13-inch multi-file browser has an X and supports
            // outside dismissal; its remote controls are absent from app AX.
            XCTAssertTrue(min(app.frame.width, app.frame.height) > 600 && popup.exists, app.debugDescription)
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.1)).tap()
            XCTAssertTrue(waitForGone(popup, timeout: 10), app.debugDescription)
        }
        if popup.exists { XCTAssertTrue(waitForGone(popup, timeout: 10), app.debugDescription) }
    }
    func dismissShareSheet() {
        // The iOS 26 share sheet does not always expose a "Close" button
        // (the ZIP export sheet shows only its share and action rows).
        // Wait for the sheet itself, then close it the way a person would.
        let close = app.buttons["Close"].firstMatch
        let sheet = app.otherElements["ActivityListView"]
        let copy = app.cells.matching(NSPredicate(format: "label == %@", "Copy")).firstMatch
        let shown = { close.exists || sheet.exists || copy.exists }
        let deadline = Date().addingTimeInterval(15)
        while !shown() && Date() < deadline { RunLoop.current.run(until: Date().addingTimeInterval(0.25)) }
        XCTAssertTrue(shown(), app.debugDescription)
        let tablet = min(app.frame.width, app.frame.height) > 600
        if close.exists && close.isHittable {
            close.tap()
        } else if tablet {
            // Tap clear of the anchored popover, including at large text sizes.
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.05, dy: 0.1)).tap()
        } else {
            // Large-text iPhone sheets can cover the former outside-tap point.
            app.swipeDown()
        }
        if !waitForGone(sheet, timeout: 5) {
            if tablet {
                app.coordinate(withNormalizedOffset: CGVector(dx: 0.05, dy: 0.1)).tap()
            } else {
                app.swipeDown()
            }
        }
        XCTAssertTrue(waitForGone(copy, timeout: 10), app.debugDescription)
        XCTAssertTrue(waitForGone(sheet, timeout: 10), "Native share sheet must finish dismissing")
        XCTAssertTrue(waitForGone(close, timeout: 10), "Native share Close must disappear")
    }
    func waitForGone(_ element: XCUIElement, timeout: TimeInterval) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while element.exists && Date() < deadline { RunLoop.current.run(until: Date().addingTimeInterval(0.25)) }
        return !element.exists
    }
    func exerciseModesAndProjects() {
        editor().tap(); editor().typeText("Keep this note")
        menu(); XCTAssertFalse(app.buttons["Projects"].exists)
        setMode("Advanced"); XCTAssertTrue(app.buttons["Projects"].exists)
        setMode("Basic"); XCTAssertFalse(app.buttons["Projects"].exists)
        finishMenu(); assertWord("Keep")
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30)); assertWord("Keep")
        menu(); XCTAssertFalse(app.buttons["Projects"].exists)
        setMode("Advanced"); app.buttons["Projects"].tap()
        projectButton("Open project")
        let projectName = app.textFields["New project name"]
        XCTAssertTrue(projectName.waitForExistence(timeout: 15)); projectName.tap(); projectName.typeText("Native project")
        projectButton("Create new project")
        projectButton("Add file")
        let filename = app.textFields["New file or folder name"]
        XCTAssertTrue(filename.waitForExistence(timeout: 15)); filename.tap(); filename.typeText("run.sh")
        projectButton("Create file")
        editor().tap(); editor().typeText("#!/bin/sh\necho hello\n")
        app.buttons["Save file"].tap()
        let saved = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Saved in project")).firstMatch
        XCTAssertTrue(saved.waitForExistence(timeout: 15), app.debugDescription)
        menu(); setMode("Basic"); finishMenu()
        app.terminate(); app.launch(); XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30)); assertWord("echo")
        menu(); XCTAssertFalse(app.buttons["Projects"].exists); setMode("Advanced"); app.buttons["Projects"].tap()
        projectButton("Open project"); projectButton("Export project ZIP")
        dismissShareSheet()
        projectButton("Manage files")
        projectButton("Remove run.sh from project")
        // Remove runs as a background save; the Projects panel ignores Close until it finishes.
        let removed = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Removed run.sh")).firstMatch
        XCTAssertTrue(removed.waitForExistence(timeout: 15), app.debugDescription)
        projectButton("Back to project")
        // Back must remain available after scrolling the project list; no swipe workaround.
        let closeProjects = app.buttons["Back to editor"].firstMatch
        XCTAssertTrue(closeProjects.waitForExistence(timeout: 15), app.debugDescription)
        XCTAssertTrue(closeProjects.isHittable, app.debugDescription)
        closeProjects.tap()
        XCTAssertTrue(app.buttons["Close current tab"].waitForExistence(timeout: 15), app.debugDescription)
        app.buttons["Close current tab"].tap()
        app.buttons["Close current tab"].tap()
        let discard = app.buttons["Close without saving"]
        if discard.waitForExistence(timeout: 5) { discard.tap() }
        menu(); setMode("Basic"); finishMenu()
        print("PASS native UI: Basic/Advanced preserve text and preferences; project create/save/reopen/ZIP share/remove work")
    }
    func editor() -> XCUIElement {
        let field = app.webViews.textViews.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 10), app.debugDescription)
        return field
    }
    func assertCText(file: StaticString = #filePath, line: UInt = #line) {
        // WKWebView's value may contain only the first syntax-highlighted span.
        // Inspect the rendered descendants; the in-webview suite verifies exact bytes.
        let text = editor()
        XCTAssertTrue(text.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "main")).firstMatch.exists, app.debugDescription, file: file, line: line)
        XCTAssertTrue(text.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "return")).firstMatch.exists, app.debugDescription, file: file, line: line)
    }
    func assertToolbarVisible() {
        let buttons = [app.buttons["Menu"], app.buttons["Close current tab"], app.buttons["Save file"]]
        for button in buttons {
            XCTAssertTrue(button.waitForExistence(timeout: 15), app.debugDescription)
            XCTAssertTrue(button.isHittable, app.debugDescription)
            XCTAssertTrue(app.frame.contains(button.frame), "Toolbar button clipped: \(button.label) \(button.frame)")
            XCTAssertGreaterThanOrEqual(button.frame.width, 44)
            XCTAssertGreaterThanOrEqual(button.frame.height, 44)
            let status = app.statusBars.firstMatch
            if status.exists && status.frame.width > 0 {
                XCTAssertGreaterThanOrEqual(button.frame.minY, status.frame.maxY, "Toolbar overlaps status bar")
            }
        }
        for i in 0..<buttons.count {
            for j in (i+1)..<buttons.count {
                XCTAssertFalse(buttons[i].frame.intersects(buttons[j].frame), "Toolbar buttons overlap")
            }
        }
    }
    func rotateToLandscape(_ landscape: Bool) {
        XCUIDevice.shared.orientation = landscape ? .landscapeLeft : .portrait
        let settled = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let frame = self.app.frame
            return landscape ? frame.width > frame.height : frame.height > frame.width
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [settled], timeout: 10), .completed)
        // Allow the final screen-compositing frame before screenshot capture.
        RunLoop.current.run(until: Date().addingTimeInterval(1))
    }
    func testToolbarAndSaveVisibility() {
        // This test checks ordinary-file sharing, regardless of previous project/photo tests.
        menu(); app.buttons["New"].tap()
        rotateToLandscape(false)
        assertToolbarVisible()
        editor().tap(); editor().typeText("Large text save check")
        assertToolbarVisible()
        // 0.8.5: the word-count line gives its space to the editor while the keyboard is up.
        let counts = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "characters")).firstMatch
        if app.keyboards.count > 0 {
            XCTAssertFalse(counts.exists && counts.isHittable, app.debugDescription)
            let typing = XCTAttachment(screenshot: app.screenshot())
            typing.name = "Editor with keyboard up"
            typing.lifetime = .keepAlways; add(typing)
        }
        app.buttons["Save file"].tap()
        dismissShareSheet()
        assertWord("Large")
        assertToolbarVisible()
        let portrait = XCTAttachment(screenshot: app.screenshot())
        portrait.name = "Toolbar portrait after save cancellation"
        portrait.lifetime = .keepAlways; add(portrait)
        rotateToLandscape(true)
        assertToolbarVisible()
        let landscape = XCTAttachment(screenshot: app.screenshot())
        landscape.name = "Toolbar landscape"
        landscape.lifetime = .keepAlways; add(landscape)
        rotateToLandscape(false)
        menu(); finishMenu()
        assertToolbarVisible()
        if app.keyboards.count == 0 { XCTAssertTrue(counts.waitForExistence(timeout: 10), app.debugDescription) }
        print("PASS native UI: Menu, Close and Save fully visible, status bar clear, bottom line hidden while typing, native Save cancellation and rotation")
    }
    func projectWorkspace() {
        menu(); setMode("Advanced"); app.buttons["Projects"].tap()
        XCTAssertTrue(app.buttons["Back to editor"].waitForExistence(timeout: 15), app.debugDescription)
    }
    func testProjectDestinationsAndClose() {
        editor().tap(); editor().typeText("Protected ordinary note")
        // Create this case's own project; do not rely on another test's disk state.
        projectWorkspace(); projectButton("Open project")
        let projectName = app.textFields["New project name"]
        XCTAssertTrue(projectName.waitForExistence(timeout: 15), app.debugDescription)
        projectName.tap(); projectName.typeText("Destination project")
        projectButton("Create new project")
        projectButton("Select folder Project root"); projectButton("New folder")
        let filename = app.textFields["New file or folder name"]
        XCTAssertTrue(filename.waitForExistence(timeout: 15), app.debugDescription)
        filename.tap(); filename.typeText("src"); projectButton("Create folder")
        projectButton("Add file"); filename.tap(); filename.typeText("draft.txt"); projectButton("Create file")
        editor().tap(); editor().typeText("Project content")
        projectWorkspace(); projectButton("Select folder src"); projectButton("Add file")
        let destination = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Add to src")).firstMatch
        XCTAssertTrue(destination.waitForExistence(timeout: 10), app.debugDescription)
        projectButton("Choose files…")
        cancelDocumentPicker()
        XCTAssertTrue(destination.waitForExistence(timeout: 10), "Picker cancellation preserves selected destination")
        projectButton("Cancel adding")
        projectButton("Close project")
        XCTAssertTrue(app.buttons["Keep project open"].waitForExistence(timeout: 10), app.debugDescription)
        app.buttons["Keep project open"].tap()
        projectButton("Close project"); app.buttons["Save and close project"].tap()
        let closed = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Closed Destination project.")).firstMatch
        XCTAssertTrue(closed.waitForExistence(timeout: 15), app.debugDescription)
        app.buttons["Back to editor"].tap(); assertWord("Protected")
        projectWorkspace(); projectButton("Open project"); projectButton("Open project Destination project"); projectButton("Open project file src/draft.txt"); assertWord("Project")
        editor().tap(); editor().typeText(" discard this")
        projectWorkspace(); projectButton("Close project"); app.buttons["Close without saving"].tap()
        XCTAssertTrue(closed.waitForExistence(timeout: 15), app.debugDescription)
        projectButton("Open project"); projectButton("Open project Destination project"); projectButton("Open project file src/draft.txt"); assertWord("Project")
        XCTAssertFalse(editor().staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "discard")).firstMatch.exists, app.debugDescription)
        projectWorkspace(); projectButton("Close project"); XCTAssertTrue(closed.waitForExistence(timeout: 15), app.debugDescription)
        app.buttons["Back to editor"].tap(); assertWord("Protected")
        app.buttons["Close current tab"].tap(); app.buttons["Close without saving"].tap()
        menu(); setMode("Basic"); finishMenu()
        print("PASS native UI: folder selection/destination, actual Add files picker cancellation, project Close Cancel/Save/Discard/reopen and ordinary-note preservation")
    }
    func testProjectLayoutAccessibility() {
        projectWorkspace()
        projectButton("Open project")
        let name = app.textFields["New project name"]
        if !name.exists {
            let create = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "New project")).firstMatch
            XCTAssertTrue(create.waitForExistence(timeout: 10), app.debugDescription); create.tap()
        }
        XCTAssertTrue(name.waitForExistence(timeout: 15), app.debugDescription)
        name.tap(); name.typeText("Layout test"); projectButton("Create new project"); projectButton("New folder")
        let filename = app.textFields["New file or folder name"]
        XCTAssertTrue(filename.waitForExistence(timeout: 15)); filename.tap(); filename.typeText("src"); projectButton("Create folder")
        projectButton("Add file"); filename.tap(); filename.typeText("code.c"); projectButton("Create file")
        editor().tap(); editor().typeText("int value;"); app.buttons["Save file"].tap()
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Saved in project")).firstMatch.waitForExistence(timeout: 15))
        projectWorkspace(); projectButton("Select folder Project root"); projectButton("Add file")
        filename.tap(); filename.typeText("settings.json"); projectButton("Create file")
        editor().tap(); editor().typeText("{}"); app.buttons["Save file"].tap()
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "settings.json")).matching(NSPredicate(format: "label BEGINSWITH %@", "Saved in project")).firstMatch.waitForExistence(timeout: 15))
        projectWorkspace()
        let last = visibleProjectButton("Open project file settings.json")
        XCTAssertGreaterThanOrEqual(last.frame.height, 44); XCTAssertGreaterThanOrEqual(last.frame.width, 44)
        let nested = app.buttons["Open project file src/code.c"], root = app.buttons["Open project file settings.json"]
        XCTAssertGreaterThan(nested.frame.minX, root.frame.minX, "Nested filenames must be visibly indented")
        XCTAssertEqual(nested.frame.maxX, root.frame.maxX, accuracy: 1, "Root and nested file boxes must align on the right")
        XCTAssertTrue(app.buttons["Back to editor"].isHittable, app.debugDescription)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Aligned project root and nested rows"; shot.lifetime = .keepAlways; add(shot)
        projectButton("Select folder src"); projectButton("Delete folder")
        XCTAssertTrue(app.buttons["Keep folder"].waitForExistence(timeout: 10), app.debugDescription); app.buttons["Keep folder"].tap()
        projectButton("Delete folder"); app.buttons["Delete folder and contents"].tap()
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Deleted folder src.")).firstMatch.waitForExistence(timeout: 15), app.debugDescription)
        XCTAssertFalse(app.buttons["Select folder src"].exists, app.debugDescription)
        XCTAssertTrue(app.buttons["Open project file settings.json"].exists, app.debugDescription)
        projectButton("Close project")
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Closed Layout test.")).firstMatch.waitForExistence(timeout: 15), app.debugDescription)
        app.buttons["Back to editor"].tap(); menu(); setMode("Basic"); finishMenu()
        print("PASS native UI: file hierarchy is indented, last file target is visible, folder deletion cancels/confirms safely, Back stays reachable and project closes")
    }
    func testFilenameMenuReturn() {
        editor().tap(); editor().typeText("Filename regression content")
        rename("Qzzzzzzz.sql")
        assertWord("Filename regression content")
        XCTAssertFalse(editor().staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Qzzzzzzz")).firstMatch.exists, app.debugDescription)
        XCTAssertTrue(app.buttons["Save file"].isHittable, app.debugDescription)
        XCTAssertTrue(app.frame.contains(app.buttons["Save file"].frame), app.debugDescription)
        XCTAssertTrue(app.staticTexts["Open files"].exists, app.debugDescription)
        menu()
        XCTAssertEqual(app.textFields["File name"].value as? String, "Qzzzzzzz.sql")
        finishMenu()
        assertWord("Filename regression content")
        app.buttons["Close current tab"].tap()
        app.buttons["Close without saving"].tap()
        print("PASS native UI: filename metadata stays separate from document text; menu return preserves readable toolbar and Open files label")
    }
    // Named to run after every existing case (XCTest runs cases alphabetically), so it cannot change their starting mode.
    func testZPreviewAndNewCheckers() {
        // 0.8.8: Markdown Preview fills the screen, renders the text and returns; Java errors are found offline.
        menu(); setMode("Advanced"); finishMenu()
        menu(); app.buttons["New"].tap()
        rename("preview-notes.md")
        editor().tap(); editor().typeText("# Preview heading")
        menu()
        let preview = app.buttons["Preview"]
        XCTAssertTrue(preview.waitForExistence(timeout: 10), app.debugDescription)
        preview.tap()
        let back = app.buttons["Back to editor"]
        XCTAssertTrue(back.waitForExistence(timeout: 10) && back.isHittable, app.debugDescription)
        let heading = app.staticTexts.matching(NSPredicate(format: "label == %@", "Preview heading")).firstMatch
        XCTAssertTrue(heading.waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertFalse(app.staticTexts["Editor menu"].exists, app.debugDescription)
        back.tap()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 10) && app.buttons["Menu"].isHittable, app.debugDescription)
        assertWord("Preview heading")
        menu(); app.buttons["New"].tap()
        rename("Broken.java")
        editor().tap(); editor().typeText("class A { void f() { int x = 1 } }")
        menu(); app.buttons["Check syntax"].tap()
        let issue = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", "Missing ;")).firstMatch
        XCTAssertTrue(issue.waitForExistence(timeout: 20), app.debugDescription)
        app.buttons["Back to editor"].firstMatch.tap()
        for _ in 0..<2 {
            app.buttons["Close current tab"].tap()
            let discard = app.buttons["Close without saving"]
            if discard.waitForExistence(timeout: 5) { discard.tap() }
        }
        print("PASS native UI: Markdown Preview opens full screen, shows the rendered heading and returns; Java syntax error found offline")
    }
    func testModesAndProjects() {
        exerciseModesAndProjects()
    }
    func testTabsNativePickersAndRelaunch() {
        menu(); app.buttons["New"].tap()
        rename("native.c")
        let first = editor()
        first.tap(); first.typeText("int main(void) { return 0; }")
        menu(); app.buttons["New"].tap()
        rename("native.py")
        editor().tap(); editor().typeText("print(42)")
        // ARIA tabs are exposed as buttons by WebKit; match their accessible label.
        let cTab = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "native.c, unsaved changes")).firstMatch
        XCTAssertTrue(cTab.waitForExistence(timeout: 10), app.debugDescription)
        cTab.tap()
        assertCText()
        app.buttons["Close current tab"].tap()
        XCTAssertTrue(app.buttons["Keep editing"].waitForExistence(timeout: 10))
        app.buttons["Keep editing"].tap()
        assertCText()
        print("PASS native UI: typed two files, switched tabs, cancelled close")
        // Exercise the actual iOS document picker and cancel it.
        menu(); app.buttons["Open"].tap()
        cancelDocumentPicker()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 10))
        assertCText()
        print("PASS native UI: actual document picker cancellation preserves C tab")
        // Exercise the actual native Share/Save sheet and cancel without losing text.
        app.buttons["Save file"].tap()
        dismissShareSheet()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 10), app.debugDescription)
        assertCText()
        print("PASS native UI: actual share cancellation preserves C tab")
        // Force process restart, rather than merely reloading the web page.
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30))
        assertCText()
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "native.py, unsaved changes")).firstMatch.waitForExistence(timeout: 15), app.debugDescription)
        print("PASS native UI: forced process restart restores both files")
        rotateToLandscape(true)
        XCTAssertTrue(app.buttons["Menu"].exists)
        rotateToLandscape(false)
        XCUIDevice.shared.press(.home); app.activate()
        assertCText()
        print("PASS native UI: rotation and background/resume preserve C tab")
    }
    func testFirstUseTermsAndPersistence() {
        XCTAssertTrue(app.buttons["Menu"].isHittable)
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30), "Accepted terms survive a native restart")
        menu(); app.buttons["Help"].tap()
        let show = app.buttons["Terms of Use"]
        for _ in 0..<10 { if show.isHittable { break }; app.webViews.firstMatch.swipeUp() }
        XCTAssertTrue(show.isHittable, app.debugDescription); show.tap()
        XCTAssertTrue(app.staticTexts["ATE Terms of Use"].waitForExistence(timeout: 10))
        let back = app.buttons["Back to editor"]
        for _ in 0..<15 { if back.exists && back.isHittable && app.frame.contains(back.frame) { break }; app.webViews.firstMatch.swipeUp() }
        XCTAssertTrue(back.isHittable, app.debugDescription); back.tap()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 10))
        print("PASS native UI: explicit terms consent, native restart persistence and Help reopening")
    }

}
