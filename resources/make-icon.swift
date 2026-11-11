import AppKit
import Foundation
let size = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:size,pixelsHigh:size,bitsPerSample:8,samplesPerPixel:3,hasAlpha:false,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:bitmap)
NSColor(red:0.13,green:0.36,blue:0.28,alpha:1).setFill()
NSBezierPath(rect:NSRect(x:0,y:0,width:size,height:size)).fill()
NSColor(red:1,green:0.996,blue:0.98,alpha:1).setFill()
NSBezierPath(roundedRect:NSRect(x:230,y:160,width:564,height:704),xRadius:32,yRadius:32).fill()
NSColor(red:0.13,green:0.36,blue:0.28,alpha:1).setStroke()
for y in [680,560,440,320] { let p=NSBezierPath();p.lineWidth=30;p.lineCapStyle = .round;p.move(to:NSPoint(x:330,y:y));p.line(to:NSPoint(x:694,y:y));p.stroke() }
NSGraphicsContext.restoreGraphicsState()
let out=URL(fileURLWithPath:"ios/App/App/Assets.xcassets/AppIcon.appiconset")
try FileManager.default.createDirectory(at:out,withIntermediateDirectories:true)
try bitmap.representation(using:.png,properties:[:])!.write(to:out.appendingPathComponent("AppIcon-1024.png"))
let manifest = """
{"images":[{"filename":"AppIcon-1024.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}}
"""
try manifest.write(to:out.appendingPathComponent("Contents.json"),atomically:true,encoding:.utf8)
print("PASS: opaque 1024px Clear Page icon generated")
