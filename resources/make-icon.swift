import AppKit
import Foundation
let encoded = try String(contentsOfFile: "resources/stickman-icon.png.base64", encoding: .utf8)
    .components(separatedBy: .whitespacesAndNewlines).joined()
guard let data = Data(base64Encoded: encoded), let bitmap = NSBitmapImageRep(data: data),
      bitmap.pixelsWide == 1024, bitmap.pixelsHigh == 1024, !bitmap.hasAlpha else {
    fatalError("Release icon must be an opaque 1024px PNG")
}
var colors = Set<String>()
for y in stride(from: 0, to: 1024, by: 16) {
    for x in stride(from: 0, to: 1024, by: 16) {
        if let color = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) {
            colors.insert("\(Int(color.redComponent * 255)),\(Int(color.greenComponent * 255)),\(Int(color.blueComponent * 255))")
        }
    }
}
guard colors.count > 1 else { fatalError("Release icon is blank") }
let out = URL(fileURLWithPath: "ios/App/App/Assets.xcassets/AppIcon.appiconset")
try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)
try data.write(to: out.appendingPathComponent("AppIcon-1024.png"))
let manifest = """
{"images":[{"filename":"AppIcon-1024.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}}
"""
try manifest.write(to: out.appendingPathComponent("Contents.json"), atomically: true, encoding: .utf8)
print("PASS: nonblank opaque 1024px minimalist stick-figure icon installed")

