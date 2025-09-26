# TDD/SDD Methodology for Video Player Development

> **Living Document**: This methodology guide evolves with our development practices
> **Last Updated**: 2025-09-26
> **Version**: 1.0.0

## Table of Contents

1. [TDD/SDD Philosophy for Video Player](#1-tddsdd-philosophy-for-video-player)
2. [Development Workflow](#2-development-workflow)
3. [Specification Templates](#3-specification-templates)
4. [Test Categories for Video Player](#4-test-categories-for-video-player)
5. [Specification Areas](#5-specification-areas)
6. [Collaboration Process](#6-collaboration-process)
7. [Living Documentation](#7-living-documentation)
8. [Tools and Implementation](#8-tools-and-implementation)
9. [Best Practices](#9-best-practices)

---

## 1. TDD/SDD Philosophy for Video Player

### Why TDD/SDD for Video Streaming Applications

Video streaming applications present unique challenges that make TDD/SDD particularly valuable:

- **Complex State Management**: Video players manage multiple states (loading, playing, paused, buffering, error)
- **Cross-Platform Compatibility**: Must work across browsers, devices, and casting technologies
- **Performance Critical**: Streaming performance directly impacts user experience
- **Accessibility Requirements**: Video content must be accessible to all users
- **Analytics Precision**: Every interaction must be accurately tracked for business intelligence

### Core Benefits

#### 🎯 Catch Streaming Issues Early
- Detect buffering problems before production
- Identify codec compatibility issues
- Catch memory leaks in long-running sessions
- Prevent playback sync issues

#### 📱 Ensure Cross-Device Compatibility
- Test on multiple screen sizes
- Verify input device support (mouse, keyboard, remote, touch)
- Validate Chromecast and WebView behaviors
- Ensure consistent experience across platforms

#### 🔄 The Workflow: Spec → Test → Code → Refactor

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    SPEC     │────>│    TEST     │────>│    CODE     │────>│  REFACTOR   │
│   Define    │     │   Validate  │     │  Implement  │     │   Optimize  │
│ Requirements│     │   Behavior  │     │   Feature   │     │   Solution  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ↑                                                            │
       └────────────────────────────────────────────────────────────┘
                              Continuous Feedback
```

### Key Principles

1. **No Code Without Tests**: Every feature starts with specifications and tests
2. **Tests Drive Design**: Let failing tests guide implementation decisions
3. **Refactor with Confidence**: Comprehensive tests enable safe refactoring
4. **Documentation as Code**: Specifications are executable and verifiable

---

## 2. Development Workflow

### Role-Based Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT CYCLE                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Product Owner/Docs Manager: Write Specifications            │
│     └─> Define user stories, acceptance criteria, behaviors     │
│                                                                  │
│  2. Test Writer: Create Test Cases from Specs                   │
│     └─> Unit tests, integration tests, E2E scenarios            │
│                                                                  │
│  3. Engineer/Architect: Build to Pass Tests                     │
│     └─> Implement features, optimize performance                │
│                                                                  │
│  4. All Team Members: Review and Iterate                        │
│     └─> Code review, test review, specification updates         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Workflow Steps

#### Step 1: Specification Creation
- **Owner**: Product Owner / Documentation Manager
- **Output**: Feature specifications, user stories, acceptance criteria
- **Tools**: Markdown files, Gherkin syntax, diagrams
- **Duration**: 1-2 days per feature

#### Step 2: Test Development
- **Owner**: Test Writer / QA Engineer
- **Output**: Test suites covering all acceptance criteria
- **Tools**: Jest, Cypress, Video.js test utilities
- **Duration**: 2-3 days per feature

#### Step 3: Implementation
- **Owner**: Software Engineer / Architect
- **Output**: Working code that passes all tests
- **Tools**: TypeScript, Video.js, React components
- **Duration**: 3-5 days per feature

#### Step 4: Review Cycle
- **Owner**: Entire team
- **Output**: Approved, tested, documented feature
- **Tools**: GitHub PR reviews, CI/CD pipelines
- **Duration**: 1 day

---

## 3. Specification Templates

### Feature Specification Template

```markdown
## Feature: [Feature Name]

### Feature ID: [FEAT-XXX]
### Priority: [High/Medium/Low]
### Sprint: [Sprint Number]

### User Story
As a [user type]
I want to [action/goal]
So that [benefit/value]

### Acceptance Criteria
- [ ] Given [initial context/state]
      When [action is performed]
      Then [expected outcome]

- [ ] Performance Requirements:
      - Load time: < [X] seconds
      - Response time: < [X] milliseconds
      - Memory usage: < [X] MB

- [ ] Accessibility Requirements:
      - Keyboard navigation: [requirements]
      - Screen reader support: [requirements]
      - WCAG compliance: [level A/AA/AAA]

### Test Scenarios

#### 1. Happy Path
- Description: [Normal user flow]
- Steps:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- Expected Result: [Outcome]

#### 2. Edge Cases
- [Edge case 1]: [Expected behavior]
- [Edge case 2]: [Expected behavior]
- [Edge case 3]: [Expected behavior]

#### 3. Error Conditions
- [Error condition 1]: [Error handling]
- [Error condition 2]: [Error handling]
- [Error condition 3]: [Error handling]

### Technical Specifications
- API Endpoints: [Required endpoints]
- Data Models: [Schemas/interfaces]
- Dependencies: [External libraries/services]
- Browser Support: [Minimum versions]

### Analytics Requirements
- Events to Track:
  - [Event 1]: [Data points]
  - [Event 2]: [Data points]
- Success Metrics:
  - [Metric 1]: [Target value]
  - [Metric 2]: [Target value]
```

### Behavior Specification Template (Gherkin)

```gherkin
Feature: Video Playback Control
  As a viewer
  I want to control video playback
  So that I can watch content at my own pace

  Background:
    Given the video player is initialized
    And a valid video source is loaded

  Scenario: User starts playback
    Given the video is in paused state
    And the video has finished loading metadata
    When the user clicks the play button
    Then the video should start playing
    And the play button should change to pause icon
    And the playback timer should start incrementing
    And analytics should track "play" event with timestamp

  Scenario: User pauses playback
    Given the video is currently playing
    When the user clicks the pause button
    Then the video should pause
    And the pause button should change to play icon
    And the playback timer should stop incrementing
    And analytics should track "pause" event with timestamp

  Scenario: Playback with network interruption
    Given the video is playing
    When the network connection is lost
    Then the video should show buffering indicator
    And playback should pause after 5 seconds
    And an error message should display "Connection lost"
    And analytics should track "error" event with type "network"

  Scenario Outline: Keyboard controls
    Given the video player has focus
    When the user presses "<key>"
    Then the player should "<action>"

    Examples:
      | key       | action                    |
      | Space     | toggle play/pause         |
      | ArrowLeft | seek backward 10 seconds  |
      | ArrowRight| seek forward 10 seconds   |
      | ArrowUp   | increase volume by 10%    |
      | ArrowDown | decrease volume by 10%    |
      | M         | toggle mute               |
      | F         | toggle fullscreen         |
```

### API Specification Template

```markdown
## API: [Endpoint Name]

### Endpoint Details
- **Method**: [GET/POST/PUT/DELETE]
- **Path**: `/api/v1/[resource]`
- **Authentication**: [Required/Optional]
- **Rate Limit**: [Requests per minute]

### Request
```json
{
  "field1": "string",
  "field2": 123,
  "field3": {
    "nested": "value"
  }
}
```

### Response Success (200)
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "result": "value"
  }
}
```

### Response Error (4xx/5xx)
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Test Cases
1. Valid request returns expected data
2. Missing authentication returns 401
3. Invalid input returns 400 with validation errors
4. Server error returns 503 with retry information
```

---

## 4. Test Categories for Video Player

### Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲
                 ╱ Tests ╲
                ╱─────────╲
               ╱Integration╲
              ╱   Tests     ╲
             ╱───────────────╲
            ╱   Unit Tests    ╲
           ╱───────────────────╲
          ╱─────────────────────╲
```

### Unit Tests

#### Component Rendering Tests
```javascript
// Example: PlayButton.test.tsx
describe('PlayButton Component', () => {
  it('renders with correct initial state', () => {
    const { getByRole } = render(<PlayButton />);
    expect(getByRole('button')).toHaveAttribute('aria-label', 'Play');
  });

  it('toggles state on click', () => {
    const onToggle = jest.fn();
    const { getByRole } = render(<PlayButton onToggle={onToggle} />);
    fireEvent.click(getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
```

#### Utility Function Tests
```javascript
// Example: timeFormatter.test.ts
describe('Time Formatter', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatTime(125)).toBe('2:05');
    expect(formatTime(3661)).toBe('1:01:01');
  });
});
```

#### State Management Tests
```javascript
// Example: playerStore.test.ts
describe('Player Store', () => {
  it('updates playback state', () => {
    const store = createPlayerStore();
    store.dispatch(setPlaying(true));
    expect(store.getState().isPlaying).toBe(true);
  });
});
```

#### Event Handler Tests
```javascript
// Example: keyboardHandler.test.ts
describe('Keyboard Handler', () => {
  it('handles spacebar for play/pause', () => {
    const handler = createKeyboardHandler();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    handler.handle(event);
    expect(mockPlayer.paused()).toBe(false);
  });
});
```

### Integration Tests

#### Video.js Plugin Integration
```javascript
describe('Custom Video.js Plugin', () => {
  let player;

  beforeEach(() => {
    player = videojs('test-video');
    player.customPlugin();
  });

  it('registers custom components', () => {
    expect(player.controlBar.customButton).toBeDefined();
  });

  it('handles quality switching', async () => {
    await player.customPlugin.switchQuality('1080p');
    expect(player.currentSource().label).toBe('1080p');
  });
});
```

#### API Communication Tests
```javascript
describe('Video API Integration', () => {
  it('fetches video metadata', async () => {
    const metadata = await fetchVideoMetadata('video-123');
    expect(metadata).toHaveProperty('duration');
    expect(metadata).toHaveProperty('title');
  });

  it('handles API errors gracefully', async () => {
    server.use(errorHandler);
    const result = await fetchVideoMetadata('invalid');
    expect(result.error).toBe('Video not found');
  });
});
```

#### Analytics Tracking Tests
```javascript
describe('Analytics Integration', () => {
  it('tracks play event', () => {
    player.trigger('play');
    expect(analytics.track).toHaveBeenCalledWith('video_play', {
      videoId: 'test-123',
      timestamp: expect.any(Number),
      position: 0
    });
  });
});
```

#### Input Device Handling Tests
```javascript
describe('Input Device Support', () => {
  it('handles remote control navigation', () => {
    const event = new KeyboardEvent('keydown', { keyCode: 38 }); // Up arrow
    document.dispatchEvent(event);
    expect(player.volume()).toBe(0.8);
  });

  it('handles touch gestures', () => {
    const touchStart = new TouchEvent('touchstart', { touches: [{ pageX: 100 }] });
    const touchEnd = new TouchEvent('touchend', { touches: [{ pageX: 200 }] });
    player.el().dispatchEvent(touchStart);
    player.el().dispatchEvent(touchEnd);
    expect(player.currentTime()).toBeGreaterThan(0);
  });
});
```

### E2E Tests

#### User Workflow Tests
```javascript
// Example: cypress/e2e/playback-flow.cy.js
describe('Complete Playback Flow', () => {
  it('user watches video from start to finish', () => {
    cy.visit('/video/test-123');
    cy.get('[data-test="play-button"]').click();
    cy.get('video').should('have.prop', 'paused', false);

    // Skip to near end
    cy.get('[data-test="progress-bar"]').click('right');

    // Wait for video to end
    cy.get('[data-test="replay-button"]', { timeout: 10000 })
      .should('be.visible');

    // Verify analytics
    cy.window().its('analytics.events').should('include', 'video_complete');
  });
});
```

#### Cross-Browser Compatibility Tests
```javascript
describe('Browser Compatibility', () => {
  ['chrome', 'firefox', 'safari', 'edge'].forEach(browser => {
    it(`plays video in ${browser}`, { browser }, () => {
      cy.visit('/video/test');
      cy.get('[data-test="play-button"]').click();
      cy.get('video').should('have.prop', 'paused', false);
    });
  });
});
```

#### Device-Specific Behavior Tests
```javascript
describe('Mobile Device Tests', () => {
  it('shows mobile controls on touch devices', () => {
    cy.viewport('iphone-x');
    cy.visit('/video/test');
    cy.get('[data-test="mobile-controls"]').should('be.visible');
    cy.get('[data-test="desktop-controls"]').should('not.exist');
  });
});
```

#### Performance Benchmark Tests
```javascript
describe('Performance Benchmarks', () => {
  it('loads video within performance budget', () => {
    cy.visit('/video/test');
    cy.window().its('performance.timing').then(timing => {
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      expect(loadTime).to.be.lessThan(3000); // 3 seconds
    });
  });

  it('maintains smooth playback', () => {
    cy.get('video').then($video => {
      const video = $video[0];
      cy.wrap(video).should('have.prop', 'droppedVideoFrames')
        .and('be.lessThan', 10);
    });
  });
});
```

### Test Coverage Requirements

| Category | Minimum Coverage | Target Coverage |
|----------|-----------------|-----------------|
| Unit Tests | 80% | 95% |
| Integration Tests | 70% | 85% |
| E2E Tests | 60% | 75% |
| Overall | 75% | 90% |

---

## 5. Specification Areas

### Core Specifications

#### Playback Behavior Specifications
- **Start/Stop**: Player initialization and teardown sequences
- **Play/Pause**: State transitions and UI updates
- **Seeking**: Timeline navigation and buffering behavior
- **Speed Control**: Playback rate adjustments (0.5x - 2x)
- **Loop/Repeat**: End-of-video behavior options

#### Control Interaction Specifications
- **Control Bar**: Button layouts and responsive behavior
- **Context Menu**: Right-click options and shortcuts
- **Hover States**: Tooltips and preview thumbnails
- **Focus Management**: Tab order and accessibility
- **Gesture Support**: Touch, swipe, and pinch interactions

#### Error Handling Specifications
- **Network Errors**: Connection loss and retry logic
- **Media Errors**: Codec issues and fallback sources
- **DRM Errors**: License failures and recovery
- **User Errors**: Invalid inputs and guidance
- **System Errors**: Memory and resource constraints

#### Performance Requirements
- **Initial Load**: < 3 seconds to first frame
- **Seek Time**: < 1 second for buffered content
- **Quality Switch**: < 2 seconds for resolution change
- **Memory Usage**: < 200MB for 1080p playback
- **CPU Usage**: < 30% on modern hardware

### Platform Specifications

#### Desktop Browser Behavior
```markdown
## Chrome/Edge (Chromium)
- Codec Support: H.264, VP9, AV1
- DRM: Widevine L1/L3
- Max Resolution: 4K (hardware dependent)
- Special Features: Picture-in-Picture

## Firefox
- Codec Support: H.264, VP9
- DRM: Widevine L3
- Max Resolution: 1080p
- Special Features: Enhanced tracking protection

## Safari
- Codec Support: H.264, HEVC
- DRM: FairPlay
- Max Resolution: 4K (Mac only)
- Special Features: AirPlay support
```

#### Chromecast Requirements
- **Discovery**: mDNS device detection
- **Handoff**: Seamless transition to cast
- **Queue Management**: Playlist synchronization
- **Remote Control**: Phone as remote functionality
- **Reconnection**: Session recovery after disconnection

#### WebView Constraints
- **iOS WebView**: No fullscreen, inline playback only
- **Android WebView**: Variable codec support
- **Embedded Players**: Limited API access
- **Cookie Handling**: Third-party restrictions
- **Performance**: Reduced compared to native

#### Input Device Mappings

| Device | Action | Player Response |
|--------|--------|-----------------|
| **Keyboard** | | |
| Space | Press | Toggle play/pause |
| Arrow Left | Press | Seek -10 seconds |
| Arrow Right | Press | Seek +10 seconds |
| Arrow Up | Press | Volume +10% |
| Arrow Down | Press | Volume -10% |
| **Remote Control** | | |
| OK/Select | Press | Toggle play/pause |
| Left | Press | Seek -30 seconds |
| Right | Press | Seek +30 seconds |
| Back | Press | Exit fullscreen |
| **Touch** | | |
| Tap | Single | Toggle controls |
| Tap | Double | Toggle play/pause |
| Swipe | Horizontal | Seek forward/back |
| Pinch | In/Out | Zoom video |

### Analytics Specifications

#### Event Definitions
```javascript
// Core Events
{
  video_load: { videoId, source, duration },
  video_play: { videoId, position, isResume },
  video_pause: { videoId, position, duration },
  video_complete: { videoId, watchTime, completion },
  video_error: { videoId, errorCode, errorMessage }
}

// Quality Events
{
  quality_change: { from, to, trigger },
  buffering_start: { position, networkSpeed },
  buffering_end: { duration, bytesLoaded }
}

// Interaction Events
{
  control_click: { control, position },
  seek: { from, to, method },
  volume_change: { from, to, muted },
  fullscreen_toggle: { enter, trigger }
}
```

#### Metric Calculations
- **Watch Time**: Actual seconds of video consumed
- **Completion Rate**: (Watch Time / Duration) × 100
- **Engagement Score**: Interactions per minute
- **Buffer Ratio**: Buffer Time / Watch Time
- **Quality Score**: Time in HD / Total Time

#### Data Schemas
```typescript
interface VideoSession {
  sessionId: string;
  videoId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  events: AnalyticsEvent[];
  metrics: SessionMetrics;
}

interface SessionMetrics {
  watchTime: number;
  bufferTime: number;
  seekCount: number;
  qualityChanges: number;
  errorCount: number;
  completionRate: number;
}
```

#### Privacy Requirements
- **Data Minimization**: Collect only necessary data
- **Anonymization**: Hash user identifiers
- **Consent Management**: GDPR/CCPA compliance
- **Data Retention**: 90-day maximum storage
- **Right to Deletion**: User data purge API

---

## 6. Collaboration Process

### Visual Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      SPECS      │────>│      TESTS      │────>│      CODE       │
│  (Docs Manager) │     │  (Test Writer)  │     │   (Engineer)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ↑                                                ↓
         │                 ┌─────────────┐               │
         └─────────────────│   FEEDBACK   │───────────────┘
                          │     LOOP      │
                          └─────────────────┘
```

### Communication Channels

#### Specification Reviews
- **Platform**: GitHub Pull Requests
- **Participants**: Product Owner, Test Writer, Engineers
- **Frequency**: Before each sprint
- **Output**: Approved specifications

#### Test Plan Reviews
- **Platform**: Test management tool (e.g., TestRail)
- **Participants**: Test Writer, Engineers, QA Lead
- **Frequency**: After specification approval
- **Output**: Test coverage matrix

#### Implementation Reviews
- **Platform**: GitHub Pull Requests
- **Participants**: Engineers, Architects, Test Writers
- **Frequency**: Continuous during development
- **Output**: Merged code with passing tests

#### Sprint Retrospectives
- **Platform**: Video conference
- **Participants**: Entire team
- **Frequency**: End of each sprint
- **Output**: Process improvements

### Feedback Loop Guidelines

1. **Specification Feedback**
   - Engineers can suggest technical constraints
   - Test Writers can identify untestable requirements
   - Updates require re-approval

2. **Test Feedback**
   - Engineers report flaky or incorrect tests
   - Product Owners verify test coverage
   - Tests updated based on implementation learnings

3. **Implementation Feedback**
   - Test failures guide code corrections
   - Performance issues trigger specification updates
   - User feedback influences future specifications

### Collaboration Tools

| Purpose | Tool | Usage |
|---------|------|-------|
| Specifications | Confluence/Wiki | Living documentation |
| Test Management | TestRail/Xray | Test case tracking |
| Code Repository | GitHub/GitLab | Version control |
| CI/CD | Jenkins/GitHub Actions | Automated testing |
| Communication | Slack/Teams | Real-time discussion |
| Issue Tracking | Jira/Linear | Bug and feature tracking |

---

## 7. Living Documentation

### Principles of Living Documentation

#### Documentation as Code
- Store documentation alongside code
- Version control all specifications
- Review documentation in pull requests
- Automate documentation generation

#### Single Source of Truth
- Specifications drive all artifacts
- Tests validate specifications
- Code implements specifications
- Documentation reflects current state

#### Continuous Updates
- Update specs when requirements change
- Modify tests when behavior changes
- Refactor code when needed
- Keep documentation current

### Documentation Lifecycle

```
┌──────────────┐
│   CREATION   │ Initial specification writing
└──────┬───────┘
       ↓
┌──────────────┐
│  VALIDATION  │ Test creation validates specs
└──────┬───────┘
       ↓
┌──────────────┐
│IMPLEMENTATION│ Code realizes specifications
└──────┬───────┘
       ↓
┌──────────────┐
│  MAINTENANCE │ Ongoing updates and refinements
└──────┬───────┘
       ↓
┌──────────────┐
│  DEPRECATION │ Obsolete features removed
└──────────────┘
```

### Documentation Standards

#### File Organization
```
/docs
├── /specifications
│   ├── /features       # Feature specifications
│   ├── /api           # API specifications
│   └── /architecture  # System design docs
├── /test-plans
│   ├── /unit          # Unit test plans
│   ├── /integration   # Integration test plans
│   └── /e2e           # End-to-end test plans
├── /guides
│   ├── developer.md   # Developer guide
│   ├── testing.md     # Testing guide
│   └── deployment.md  # Deployment guide
└── /archive           # Deprecated documentation
```

#### Versioning Strategy
- Use semantic versioning for specifications
- Tag releases in version control
- Maintain changelog for significant updates
- Archive obsolete documentation

#### Review Process
1. **Draft Stage**: Initial specification creation
2. **Review Stage**: Team feedback and iterations
3. **Approved Stage**: Ready for implementation
4. **Active Stage**: Currently implemented
5. **Deprecated Stage**: Marked for removal

### Automated Documentation

#### Generated from Code
```javascript
// JSDoc example for auto-documentation
/**
 * Initializes the video player with given configuration
 * @param {HTMLElement} element - Container element
 * @param {PlayerConfig} config - Player configuration
 * @returns {VideoPlayer} Initialized player instance
 * @example
 * const player = initPlayer(document.getElementById('video'), {
 *   autoplay: false,
 *   controls: true
 * });
 */
function initPlayer(element, config) {
  // Implementation
}
```

#### Generated from Tests
```javascript
// Test descriptions become documentation
describe('Video Player Initialization', () => {
  it('should create player instance with default config', () => {
    // This test validates the default initialization behavior
  });

  it('should override defaults with custom config', () => {
    // This test documents configuration precedence
  });
});
```

#### API Documentation
- Generate from OpenAPI/Swagger specs
- Include request/response examples
- Document error codes and meanings
- Provide interactive testing tools

---

## 8. Tools and Implementation

### Testing Framework Stack

#### Unit Testing
- **Framework**: Jest
- **Utilities**: React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: Istanbul/nyc

#### Integration Testing
- **Framework**: Jest + Supertest
- **Database**: Test containers
- **API Mocking**: Nock
- **Video.js Testing**: video.js test utilities

#### E2E Testing
- **Framework**: Cypress/Playwright
- **Visual Testing**: Percy/Chromatic
- **Performance**: Lighthouse CI
- **Accessibility**: axe-core

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: TDD/SDD Pipeline

on: [push, pull_request]

jobs:
  specifications:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Specifications
        run: npm run validate:specs

  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Unit Tests
        run: npm run test:unit
      - name: Run Integration Tests
        run: npm run test:integration
      - name: Generate Coverage Report
        run: npm run coverage

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run E2E Tests
        run: npm run test:e2e
      - name: Performance Tests
        run: npm run test:performance
```

### Development Environment Setup

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm run test:unit -- --grep "PlayButton"

# Generate coverage report
npm run coverage

# Run E2E tests
npm run cypress:open

# Validate specifications
npm run validate:specs

# Generate documentation
npm run docs:generate
```

### Specification Validation Tools

#### Gherkin Linter
```json
{
  "gherkinlint": {
    "rules": {
      "no-duplicate-features": "error",
      "no-empty-scenarios": "error",
      "no-undefined-steps": "error"
    }
  }
}
```

#### API Contract Testing
```javascript
// Using Pact for contract testing
describe('Video API Contract', () => {
  it('validates video metadata endpoint', () => {
    return provider.verify({
      providerBaseUrl: 'http://localhost:3000',
      pactUrls: ['./pacts/consumer-provider.json']
    });
  });
});
```

---

## 9. Best Practices

### Writing Effective Specifications

#### DO's
- ✅ Write from the user's perspective
- ✅ Include clear acceptance criteria
- ✅ Define edge cases and error scenarios
- ✅ Specify performance requirements
- ✅ Include mockups or diagrams when helpful

#### DON'Ts
- ❌ Include implementation details
- ❌ Use technical jargon without explanation
- ❌ Write ambiguous requirements
- ❌ Skip accessibility considerations
- ❌ Forget about error handling

### Creating Maintainable Tests

#### Test Organization
```javascript
describe('Feature: Video Playback', () => {
  describe('Component: PlayButton', () => {
    describe('when video is paused', () => {
      it('should display play icon', () => {});
      it('should have correct aria-label', () => {});
    });

    describe('when video is playing', () => {
      it('should display pause icon', () => {});
      it('should have correct aria-label', () => {});
    });
  });
});
```

#### Test Data Management
```javascript
// fixtures/video-data.js
export const testVideos = {
  valid: {
    id: 'test-123',
    url: 'https://example.com/video.mp4',
    duration: 120
  },
  invalid: {
    id: 'test-invalid',
    url: 'https://example.com/404.mp4'
  }
};
```

#### Test Helpers
```javascript
// helpers/player-helpers.js
export function createMockPlayer(overrides = {}) {
  return {
    play: jest.fn(),
    pause: jest.fn(),
    currentTime: jest.fn(() => 0),
    duration: jest.fn(() => 100),
    ...overrides
  };
}
```

### Code Implementation Guidelines

#### Follow the Tests
- Let failing tests guide your implementation
- Write minimal code to pass tests
- Refactor only when tests are green
- Add new tests for discovered edge cases

#### Refactoring Checklist
- [ ] All tests still pass
- [ ] Code coverage maintained or improved
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] No new linting warnings

### Review Checklist

#### Specification Review
- [ ] User story is clear and valuable
- [ ] Acceptance criteria are testable
- [ ] Edge cases are identified
- [ ] Performance requirements specified
- [ ] Accessibility requirements included

#### Test Review
- [ ] Tests cover all acceptance criteria
- [ ] Test names are descriptive
- [ ] Tests are isolated and independent
- [ ] Mocks are appropriate and minimal
- [ ] Performance tests included where needed

#### Code Review
- [ ] All tests pass
- [ ] Code follows team standards
- [ ] Documentation is updated
- [ ] No unnecessary complexity
- [ ] Security considerations addressed

### Common Pitfalls to Avoid

1. **Testing Implementation Instead of Behavior**
   ```javascript
   // ❌ Bad: Testing implementation details
   expect(component.state.isPlaying).toBe(true);

   // ✅ Good: Testing behavior
   expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
   ```

2. **Writing Tests After Code**
   - Always write tests first
   - Let tests drive the design
   - Refactor with confidence

3. **Ignoring Flaky Tests**
   - Fix flaky tests immediately
   - Use proper async handling
   - Mock external dependencies

4. **Skipping Documentation Updates**
   - Update specs when requirements change
   - Keep test descriptions current
   - Document breaking changes

5. **Over-Engineering Solutions**
   - Start with simplest solution
   - Add complexity only when needed
   - Let tests guide refactoring

---

## Appendix A: Quick Reference

### TDD/SDD Cycle Commands

```bash
# Start new feature
npm run spec:new feature-name

# Generate tests from spec
npm run test:generate feature-name

# Run tests in watch mode
npm run test:watch

# Implement feature (tests will guide you)
# ... write code ...

# Validate implementation
npm run test:all

# Generate documentation
npm run docs:generate

# Create pull request
npm run pr:create
```

### Specification Template Generator

```bash
# Generate feature spec
npm run generate:spec -- --type feature --name "Video Quality Selector"

# Generate API spec
npm run generate:spec -- --type api --endpoint "/api/videos"

# Generate test plan
npm run generate:test-plan -- --feature "Video Quality Selector"
```

---

## Appendix B: Resources

### External Resources
- [Video.js Documentation](https://videojs.com/guides/)
- [Jest Testing Best Practices](https://jestjs.io/docs/best-practices)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)

### Internal Resources
- [Team Coding Standards](/docs/coding-standards.md)
- [Architecture Decision Records](/docs/adr/)
- [API Documentation](/docs/api/)
- [Component Library](/docs/components/)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-09-26 | Team | Initial TDD/SDD methodology |

---

*This is a living document. Please submit updates via pull request with appropriate review and approval.*