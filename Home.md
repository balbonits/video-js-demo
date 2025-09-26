# Video Player Knowledgebase - Complete Index

This wiki serves as the navigation hub and glossary for the comprehensive video player development knowledgebase stored in the repository.

## 📚 Full Documentation Directory

### Knowledge Areas

#### 🖥️ Platform Development
- [**Platforms Overview**](knowledge/platforms/README.md) - Complete platform guide
  - Web Browsers - HTML5 video, MSE, EME, Video.js
  - iOS Development - AVKit, AVFoundation, SwiftUI
  - Android Development - ExoPlayer Media3, Jetpack Compose
  - Smart TV Platforms - Samsung Tizen, LG webOS, Roku
  - Chromecast - Receiver apps, Cast SDK
  - Game Consoles - PlayStation, Xbox integration
  - Desktop Applications - Electron, native apps

#### 📡 Streaming Protocols
- [**Protocols Overview**](knowledge/protocols/README.md) - Complete protocol guide
  - HLS - HTTP Live Streaming, M3U8, TS segments
  - DASH - Dynamic Adaptive Streaming, MPD manifests
  - WebRTC - Real-time communication, peer-to-peer
  - RTMP/RTSP - Legacy streaming, live ingestion
  - Progressive Download - HTTP range requests
  - SRT/RIST - Secure Reliable Transport

#### 🎬 Codecs & Formats
- [**Codecs Overview**](knowledge/codecs/README.md) - Complete codec guide
  - H.264/AVC - Universal compatibility
  - H.265/HEVC - 4K/8K video, HDR support
  - VP8/VP9 - Google codecs, royalty-free
  - AV1 - Next-gen codec, 30% better than HEVC
  - AAC/Opus - Audio streaming standards
  - Dolby/DTS - Surround sound formats

#### 🚀 Features & Capabilities
- [**Features Overview**](knowledge/features/README.md) - Complete features guide
  - Analytics & Metrics - QoE/QoS tracking
  - DRM Protection - Widevine, FairPlay, PlayReady
  - Live Chat - WebSocket implementation
  - Accessibility - Captions, WCAG compliance
  - Advertising - VAST/VMAP, CSAI/SSAI
  - Thumbnails - Sprite generation
  - Multi-language - Audio tracks, subtitles

#### 🏗️ Architecture Patterns
- [**Architecture Overview**](knowledge/architecture/README.md) - Design patterns guide
  - Plugin Architecture - Modular design
  - Event Systems - Pub/sub patterns
  - State Management - Player state machines
  - Buffer Management - Adaptive buffering
  - Error Recovery - Retry strategies
  - Performance - Optimization techniques
  - Security - Content protection

#### 🧪 Testing Strategies
- [**Testing Overview**](knowledge/testing/README.md) - Complete testing guide
  - Unit Testing - Component testing
  - Integration Testing - API testing
  - E2E Testing - Playwright, Selenium
  - Performance Testing - Load testing
  - Platform Testing - Device-specific
  - Streaming Testing - Network simulation

### 📋 Complete Project Blueprints

#### Player Implementations

##### Web Player
- [**Web Player Blueprint**](projects/players/web-player/blueprint.md) - Next.js + Video.js
  - Next.js 14, Video.js 8, TypeScript, Tailwind CSS
  - HLS/DASH support, analytics, keyboard/gamepad input
  - Docker deployment ready

##### iOS Player
- [**iOS Player Blueprint**](projects/players/ios-player/blueprint.md) - Swift + AVKit
  - Swift 5.9, iOS 17+, SwiftUI interface
  - PiP, AirPlay, SharePlay, live streaming with chat
  - TestFlight distribution ready

##### Android Player
- [**Android Player Blueprint**](projects/players/android-player/blueprint.md) - Kotlin + ExoPlayer
  - Kotlin 1.9, ExoPlayer Media3, Jetpack Compose
  - Chromecast integration, Material Design 3
  - Google Play ready

#### Backend Services

##### Streaming Service
- [**Streaming Service CLAUDE.md**](projects/services/streaming-service/CLAUDE.md) - Service documentation
- [**package.json**](projects/services/streaming-service/package.json) - Dependencies
- [**Dockerfile**](projects/services/streaming-service/Dockerfile) - Container setup
- Key files:
  - [index.ts](projects/services/streaming-service/src/index.ts) - Main server
  - [streamController.ts](projects/services/streaming-service/src/controllers/streamController.ts) - Stream handling
  - [transcodingService.ts](projects/services/streaming-service/src/services/transcodingService.ts) - FFmpeg integration

##### Analytics Service
- [**Analytics Service CLAUDE.md**](projects/services/analytics-service/CLAUDE.md) - Service documentation
- [**package.json**](projects/services/analytics-service/package.json) - Dependencies
- Key files:
  - [index.ts](projects/services/analytics-service/src/index.ts) - Main server
  - [analyticsService.ts](projects/services/analytics-service/src/services/analyticsService.ts) - Event processing

##### Chat Service
- [**Chat Service CLAUDE.md**](projects/services/chat-service/CLAUDE.md) - Service documentation
- [**package.json**](projects/services/chat-service/package.json) - Dependencies
- [**chatService.ts**](projects/services/chat-service/src/services/chatService.ts) - WebSocket handling

##### DRM Service
- [**DRM Service CLAUDE.md**](projects/services/drm-service/CLAUDE.md) - Service documentation
- [**package.json**](projects/services/drm-service/package.json) - Dependencies
- [**drmService.ts**](projects/services/drm-service/src/services/drmService.ts) - License handling

### 🚀 Quick Start Tutorials

- [**Building Your First Web Player**](quick-starts/Building-Your-First-Web-Player.md) - 30-minute tutorial

### 📖 Technical Specifications

#### Core Specifications
- [**Core Engine Specification**](development/Core-Engine-Specification.md) - Plugin system, lifecycle
- [**Input Framework Specification**](development/Input-Framework-Specification.md) - Keyboard, gamepad, touch
- [**Progressive Protocol Specification**](development/Progressive-Protocol-Specification.md) - HTTP streaming

#### Architecture Documents
- [**Backend Services Architecture**](architecture/Backend-Services-Architecture.md) - Microservices design
- [**Micro-Modular Architecture**](architecture/Micro-Modular-Architecture.md) - 86+ module system
- [**Module Interfaces**](development/Module-Interfaces.md) - TypeScript definitions
- [**TDD/SDD Methodology**](development/TDD-SDD-Methodology.md) - Development approach
- [**Test Specifications**](testing/Test-Specifications.md) - Testing patterns

### 🔧 References & Tools

#### API Documentation
- [**API Contracts**](references/API-Contracts.md) - TypeScript interfaces
- [**Event Schemas**](references/Event-Schemas.md) - Analytics events
- [**Glossary**](references/Glossary.md) - A-Z terminology

#### Development Tools
- [**Project Initializer Script**](tools/init-project.sh) - Bootstrap projects
- [**Tool Documentation**](tools/README.md) - Usage guide

### 🎭 Subagent Definitions

#### Shared Agents (All Projects)
- [**Code Monkey**](.claude/agents/code-monkey.md) - Coding, CI/CD, Docker
- [**Tester**](.claude/agents/tester.md) - Testing, security auditing
- [**Product Guy**](.claude/agents/product-guy.md) - Documentation, specs
- [**API SDK Expert**](.claude/agents/api-sdk-expert.md) - External integrations

#### Player-Specific Agents
- [**UX Guy**](.claude/agents/ux-guy.md) - UI/UX design, accessibility
- [**Platform Specialist**](.claude/agents/platform-specialist.md) - Codec expertise

#### Service-Specific Agents
- [**DB Manager**](.claude/agents/db-manager.md) - Database architecture

## 📊 Wiki Pages

### Available Documentation
- [[Home]] - This index page
- [[Product Vision|Product-Vision]] - Strategic overview
- [[Product Strategy|Product-Strategy]] - Implementation approach
- [[Project Requirements|Project-Requirements]] - Detailed specifications
- [[User Vision|User-Vision]] - User experience goals

### Research & Analysis
- [[Video.js Technical Research|videojs-technical-research]] - Framework evaluation
- [[Test Video Sources|test-video-sources]] - Sample content URLs
- [[Free Analytics Tools Guide|free-video-analytics-tools-guide]] - Analytics options

## 🚀 Getting Started

### Option 1: Quick Project Setup
```bash
# Clone the wiki repository
git clone https://github.com/balbonits/video-js-demo.wiki.git

# Navigate to tools
cd video-js-demo.wiki/tools/

# Create a new project
./init-project.sh --type=web-player --name=my-streaming-app --install
```

### Option 2: Manual Blueprint Usage
1. Navigate to `/projects/` in the repository
2. Choose your platform (web-player, ios-player, android-player)
3. Copy the blueprint to your project
4. Follow the setup instructions in CLAUDE.md

### Option 3: Knowledge Exploration
1. Start with `/knowledge/platforms/` for your target platform
2. Learn protocols in `/knowledge/protocols/`
3. Implement features from `/knowledge/features/`
4. Use `/references/` for API documentation

## 📁 Repository Structure

```
video-js-demo.wiki/
├── knowledge/               # Comprehensive guides
│   ├── platforms/          # Platform-specific development
│   ├── protocols/          # Streaming protocol details
│   ├── codecs/            # Video/audio codec information
│   ├── features/          # Feature implementation guides
│   ├── architecture/      # Design patterns
│   └── testing/           # Testing strategies
├── projects/               # Complete project blueprints
│   ├── players/           # Player implementations
│   └── services/          # Backend services
├── quick-starts/          # Step-by-step tutorials
├── references/            # API docs and schemas
├── .claude/agents/        # AI agent definitions
├── tools/                 # Automation scripts
└── development/           # Technical specifications
```

## 🔗 External Resources

### Official Documentation
- [Video.js Documentation](https://videojs.com/guides/)
- [Apple AVKit](https://developer.apple.com/documentation/avkit)
- [Android ExoPlayer](https://developer.android.com/media/media3/exoplayer)
- [MDN Web Video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)

### Specifications
- [HLS RFC 8216](https://datatracker.ietf.org/doc/html/rfc8216)
- [DASH ISO/IEC 23009-1](https://www.iso.org/standard/79329.html)
- [WebRTC W3C](https://www.w3.org/TR/webrtc/)

---

**Navigation Note**: GitHub Wiki flattens the file structure. All detailed documentation, blueprints, and code are organized in the repository folders. Use this page as your index to navigate to specific resources in the repository.