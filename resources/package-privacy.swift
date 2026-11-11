import Foundation
guard CommandLine.arguments.count == 2 else { fatalError("Expected archived app path") }
let source = URL(fileURLWithPath: "resources/PrivacyInfo.xcprivacy")
let destination = URL(fileURLWithPath: CommandLine.arguments[1]).appendingPathComponent("PrivacyInfo.xcprivacy")
let data = try Data(contentsOf: source)
_ = try PropertyListSerialization.propertyList(from: data, format: nil)
if FileManager.default.fileExists(atPath: destination.path) {
    guard try Data(contentsOf: destination) == data else {
        fatalError("Archive already contains a different manifest; merge must be reviewed")
    }
} else {
    try data.write(to: destination, options: .atomic)
}
print("PASS: required privacy manifest packaged at app-bundle root")
