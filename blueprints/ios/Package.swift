// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "__PROJECT_NAME__",
    platforms: [
        .iOS(.v15),
        .tvOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "__PROJECT_NAME__",
            targets: ["__PROJECT_NAME__"]
        )
    ],
    dependencies: [
        // Add your dependencies here
    ],
    targets: [
        .target(
            name: "__PROJECT_NAME__",
            dependencies: [],
            path: "Sources"
        ),
        .testTarget(
            name: "__PROJECT_NAME__Tests",
            dependencies: ["__PROJECT_NAME__"],
            path: "Tests"
        )
    ]
)