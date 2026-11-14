import XCTest

final class ATEFunctionalTests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "io.github.willyros01.clearpage")
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30), app.debugDescription)
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
        let keyboardDone = app.toolbars.buttons["Done"].firstMatch
        if keyboardDone.exists { keyboardDone.tap() }
        let hide = app.buttons["Hide keyboard"].firstMatch
        if hide.exists { hide.tap() }
    }
    func finishMenu() {
        let done = app.webViews.buttons["Done"].firstMatch
        XCTAssertTrue(done.waitForExistence(timeout: 10), app.debugDescription)
        func fullyVisible() -> Bool {
            return done.isHittable && app.frame.contains(done.frame) && done.frame.minY >= menuSafeTop
        }
        // WebKit can report a partially clipped button as hittable. Scroll the
        // actual dialog instead of repeatedly toggling the software keyboard.
        for _ in 0..<5 {
            if fullyVisible() { break }
            app.webViews.firstMatch.swipeDown()
        }
        if !fullyVisible() {
            // On iPhone the focused filename can pan the entire web viewport;
            // only dismiss the keyboard when scrolling cannot reveal Done.
            dismissKeyboard()
            for _ in 0..<3 {
                if fullyVisible() { break }
                app.webViews.firstMatch.swipeDown()
            }
        }
        XCTAssertTrue(fullyVisible(), app.debugDescription)
        done.tap()
        XCTAssertTrue(waitForGone(app.staticTexts["Editor menu"], timeout: 10), app.debugDescription)
    }
    func projectButton(_ label: String) {
        dismissKeyboard()
        let button = app.webViews.buttons[label].firstMatch
        XCTAssertTrue(button.waitForExistence(timeout: 15), app.debugDescription)
        let contents = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Project contents")).firstMatch
        XCTAssertTrue(contents.waitForExistence(timeout: 15), app.debugDescription)
        let panel = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Projects,")).firstMatch
        XCTAssertTrue(panel.waitForExistence(timeout: 15), app.debugDescription)
        func fullyVisible() -> Bool {
            let viewport = contents.frame.intersection(panel.frame).intersection(app.frame)
            let headerBottom = app.buttons["Close projects"].frame.maxY
            return !viewport.isEmpty && viewport.contains(button.frame) && button.frame.minY >= headerBottom && button.isHittable
        }
        for _ in 0..<6 {
            if fullyVisible() { break }
            if button.frame.minY < contents.frame.minY { contents.swipeDown() } else { contents.swipeUp() }
        }
        XCTAssertTrue(fullyVisible(), app.debugDescription)

        button.tap()
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
        let projectName = app.textFields["New project name"]
        XCTAssertTrue(projectName.waitForExistence(timeout: 15)); projectName.tap(); projectName.typeText("Native project")
        projectButton("Create project")
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
        projectButton("Export project ZIP")
        dismissShareSheet()
        projectButton("Remove run.sh from project")
        // Remove runs as a background save; the Projects panel ignores Close until it finishes.
        let removed = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Removed run.sh")).firstMatch
        XCTAssertTrue(removed.waitForExistence(timeout: 15), app.debugDescription)
        // Back must remain available after scrolling the project list; no swipe workaround.
        let closeProjects = app.buttons["Close projects"].firstMatch
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
        rotateToLandscape(false)
        assertToolbarVisible()
        editor().tap(); editor().typeText("Large text save check")
        assertToolbarVisible()
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
        print("PASS native UI: Menu, Close and Save fully visible, status bar clear, keyboard, native Save cancellation and rotation")
    }
    func testModesAndProjects() {
        exerciseModesAndProjects()
    }
    func testTabsNativePickersAndRelaunch() {
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
        let cancel = app.buttons["Cancel"].firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 15), app.debugDescription)
        cancel.tap()
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
}
