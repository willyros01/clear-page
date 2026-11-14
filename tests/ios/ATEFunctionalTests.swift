import XCTest

final class ATEFunctionalTests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "io.github.willyros01.clearpage")
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30), app.debugDescription)
    }
    override func tearDownWithError() throws {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    func menu() { app.buttons["Menu"].tap() }
    func rename(_ name: String) {
        menu()
        let field = app.textFields["File name"]
        XCTAssertTrue(field.waitForExistence(timeout: 10), app.debugDescription)
        field.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        let old = field.value as? String ?? ""
        field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: old.count))
        field.typeText(name)
        // iPhone has a second Done button in the native keyboard toolbar.
        let keyboardDone = app.toolbars.buttons["Done"].firstMatch
        if keyboardDone.exists { keyboardDone.tap() }
        let hideKeyboard = app.buttons["Hide keyboard"].firstMatch
        if hideKeyboard.exists { hideKeyboard.tap() }
        let done = app.webViews.buttons["Done"].firstMatch
        if !done.isHittable { app.webViews.firstMatch.swipeDown() }
        done.tap()
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
        let sheet = app.otherElements["ActivityListView"]
        let close = app.buttons["Close"].firstMatch
        XCTAssertTrue(close.waitForExistence(timeout: 15) || sheet.exists, app.debugDescription)
        if close.exists { close.tap() } else { app.swipeDown() }
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 10), app.debugDescription)
        assertCText()
        print("PASS native UI: actual share cancellation preserves C tab")
        // Force process restart, rather than merely reloading the web page.
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30))
        assertCText()
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "native.py, unsaved changes")).firstMatch.exists)
        print("PASS native UI: forced process restart restores both files")
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.buttons["Menu"].exists)
        XCUIDevice.shared.orientation = .portrait
        XCUIDevice.shared.press(.home); app.activate()
        assertCText()
        print("PASS native UI: rotation and background/resume preserve C tab")
    }
}
