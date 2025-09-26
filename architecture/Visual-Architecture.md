# Visual Architecture

Clear visual diagrams showing the project structure and module relationships using Mermaid diagrams.

## 1. Simple Package Tree Structure

The complete folder and package structure organized as a clear tree:

```mermaid
graph TD
    ROOT[Video Player Project]

    ROOT --> CORE[core/]
    CORE --> CORE_PKG[@video-player/core]

    ROOT --> PLAYERS[players/]
    PLAYERS --> WEB[@video-player/web]
    PLAYERS --> CHROMECAST[@video-player/chromecast]
    PLAYERS --> WEBVIEW[@video-player/webview]
    PLAYERS --> REACT[@video-player/react]
    PLAYERS --> EMBED[@video-player/embed]

    ROOT --> PROTOCOLS[protocols/]
    PROTOCOLS --> HLS[@video-player/hls]
    PROTOCOLS --> DASH[@video-player/dash]
    PROTOCOLS --> WEBRTC[@video-player/webrtc]
    PROTOCOLS --> RTMP[@video-player/rtmp]

    ROOT --> CODECS[codecs/]
    CODECS --> H264[@video-player/h264]
    CODECS --> H265[@video-player/h265]
    CODECS --> AV1[@video-player/av1]
    CODECS --> VP9[@video-player/vp9]

    ROOT --> FEATURES[features/]
    FEATURES --> ANALYTICS[@video-player/analytics]
    FEATURES --> CONTROLS[@video-player/controls]
    FEATURES --> DRM[@video-player/drm]
    FEATURES --> CAPTIONS[@video-player/captions]

    ROOT --> INPUT[input/]
    INPUT --> KEYBOARD[@video-player/keyboard]
    INPUT --> GAMEPAD[@video-player/gamepad]
    INPUT --> TOUCH[@video-player/touch]

    ROOT --> PLAYGROUND[playground/]
    PLAYGROUND --> EXPLORER[component-explorer/]
    PLAYGROUND --> TESTER[protocol-tester/]
```

## 2. How Modules Connect

Simple flowchart showing how modules plug together in your application:

```mermaid
flowchart TD
    APP[Your App] --> CORE[@video-player/core]

    CORE --> PLAYER[Choose Player]
    PLAYER --> WEB[Web Player]
    PLAYER --> CAST[Chromecast Player]

    CORE --> PROTOCOL[Choose Protocol]
    PROTOCOL --> HLS[HLS Streaming]
    PROTOCOL --> DASH[DASH Streaming]

    CORE --> FEATURES[Add Features]
    FEATURES --> ANALYTICS[Analytics Plugin]
    FEATURES --> CONTROLS[Controls Plugin]
    FEATURES --> DRM[DRM Plugin]

    WEB --> VIDEO[Playing Video!]
    HLS --> VIDEO
    ANALYTICS --> VIDEO
```

## 3. Module Development View

Shows how each module is developed and published independently:

```mermaid
graph LR
    subgraph "HLS Module"
        HLS_CODE[Source Code]
        HLS_TEST[Tests]
        HLS_DOCS[Documentation]
        HLS_DEMO[Demo]
    end

    subgraph "Analytics Module"
        ANA_CODE[Source Code]
        ANA_TEST[Tests]
        ANA_DOCS[Documentation]
        ANA_DEMO[Demo]
    end

    subgraph "Controls Module"
        CTL_CODE[Source Code]
        CTL_TEST[Tests]
        CTL_DOCS[Documentation]
        CTL_DEMO[Demo]
    end

    HLS_CODE --> PUBLISH[npm publish @video-player/hls]
    ANA_CODE --> PUBLISH2[npm publish @video-player/analytics]
    CTL_CODE --> PUBLISH3[npm publish @video-player/controls]
```

## 4. Usage Example

Sequence showing how a developer would use the modules:

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant NPM as npm
    participant Core as Core Engine
    participant HLS as HLS Protocol
    participant Analytics as Analytics Plugin

    Dev->>NPM: npm install @video-player/core
    Dev->>NPM: npm install @video-player/hls
    Dev->>NPM: npm install @video-player/analytics

    Dev->>Core: import VideoPlayer
    Dev->>HLS: import HLSProtocol
    Dev->>Analytics: import AnalyticsPlugin

    Core->>HLS: Register protocol
    Core->>Analytics: Register plugin

    Dev->>Core: player.load video source
    Core->>HLS: Handle HLS stream
    Core->>Analytics: Track play event
```

## 5. Component Interaction Flow

Detailed view of how components interact during video playback:

```mermaid
flowchart TB
    USER[User Action] --> CONTROLS[Controls Component]
    CONTROLS --> CORE[Core Player]

    CORE --> PROTOCOL{Protocol Handler}
    PROTOCOL -->|HLS| HLS_MOD[HLS Module]
    PROTOCOL -->|DASH| DASH_MOD[DASH Module]
    PROTOCOL -->|WebRTC| RTC_MOD[WebRTC Module]

    HLS_MOD --> CODEC{Codec Handler}
    DASH_MOD --> CODEC
    RTC_MOD --> CODEC

    CODEC -->|H264| H264_MOD[H264 Decoder]
    CODEC -->|H265| H265_MOD[H265 Decoder]
    CODEC -->|AV1| AV1_MOD[AV1 Decoder]

    H264_MOD --> RENDER[Video Renderer]
    H265_MOD --> RENDER
    AV1_MOD --> RENDER

    RENDER --> DISPLAY[Display Video]

    CORE --> FEATURES[Feature Plugins]
    FEATURES --> ANALYTICS_FEAT[Analytics]
    FEATURES --> DRM_FEAT[DRM]
    FEATURES --> CAPTIONS_FEAT[Captions]

    ANALYTICS_FEAT --> TRACKING[Event Tracking]
    DRM_FEAT --> DECRYPT[Content Decryption]
    CAPTIONS_FEAT --> SUBTITLES[Subtitle Display]
```

## 6. Plugin System Architecture

Shows how plugins extend the core functionality:

```mermaid
graph TD
    CORE_ENGINE[Core Player Engine] --> PLUGIN_MANAGER[Plugin Manager]

    PLUGIN_MANAGER --> LIFECYCLE[Plugin Lifecycle]
    LIFECYCLE --> INIT[Initialize]
    LIFECYCLE --> LOAD[Load]
    LIFECYCLE --> PLAY[Play]
    LIFECYCLE --> PAUSE[Pause]
    LIFECYCLE --> DISPOSE[Dispose]

    PLUGIN_MANAGER --> EVENT_BUS[Event Bus]
    EVENT_BUS --> CORE_EVENTS[Core Events]
    EVENT_BUS --> CUSTOM_EVENTS[Custom Events]

    PLUGIN_MANAGER --> REGISTRY[Plugin Registry]
    REGISTRY --> ANALYTICS_P[Analytics Plugin]
    REGISTRY --> CONTROLS_P[Controls Plugin]
    REGISTRY --> DRM_P[DRM Plugin]
    REGISTRY --> CAPTIONS_P[Captions Plugin]
    REGISTRY --> QUALITY_P[Quality Plugin]

    ANALYTICS_P --> THIRD_PARTY[3rd Party Services]
    DRM_P --> DRM_SERVICES[DRM Services]
    CAPTIONS_P --> CC_PARSER[Caption Parser]
```

These diagrams provide a clear visual understanding of the project structure, making it easy to see how modules are organized and how they interact with each other.