# Input Device Handling - Quick Reference

## Quick Setup

### 1. Install Required Libraries (All Free/MIT Licensed)

```bash
# Via NPM
npm install gamecontroller.js zingtouch

# Via CDN (add to HTML)
<script src="https://cdn.jsdelivr.net/npm/gamecontroller.js@latest/dist/gamecontroller.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/zingtouch@latest/dist/zingtouch.min.js"></script>
```

### 2. Basic Video.js Integration

```javascript
// Minimal setup for gamepad support
const player = videojs('video-player');

// Gamepad controls
gameControl.on('connect', (gamepad) => {
  gamepad.on('button0', () => player.paused() ? player.play() : player.pause());
  gamepad.on('l1', () => player.currentTime(player.currentTime() - 10));
  gamepad.on('r1', () => player.currentTime(player.currentTime() + 10));
  gamepad.on('up', () => player.volume(Math.min(1, player.volume() + 0.1)));
  gamepad.on('down', () => player.volume(Math.max(0, player.volume() - 0.1)));
});
```

## Input Device Support Matrix

| Device Type | Library/API | Size | Dependencies | License |
|------------|-------------|------|--------------|---------|
| **Gamepad** | gamecontroller.js | 6KB | None | MIT |
| **Gamepad** | Native Gamepad API | 0KB | None | Web Standard |
| **Touch** | ZingTouch | 14KB | None | MIT |
| **Touch** | Native Touch Events | 0KB | None | Web Standard |
| **Chromecast** | Cast Receiver SDK | Varies | Cast SDK | Free |
| **TV Remote** | Native Keyboard Events | 0KB | None | Web Standard |
| **Mouse/Keyboard** | Native DOM Events | 0KB | None | Web Standard |

## Standard Control Mappings

### Gamepad Controls
```javascript
// Xbox/PlayStation Standard Mapping
const GAMEPAD_MAP = {
  // Face buttons
  button0: 'A/X',        // Play/Pause
  button1: 'B/Circle',   // Back/Cancel
  button2: 'X/Square',   // Show info
  button3: 'Y/Triangle', // Settings menu

  // Shoulder buttons
  l1: 'LB/L1',          // Skip back 10s
  r1: 'RB/R1',          // Skip forward 10s
  l2: 'LT/L2',          // Previous video
  r2: 'RT/R2',          // Next video

  // Special buttons
  select: 'Select/Share',   // Quality settings
  start: 'Start/Options',   // Main menu
  leftStick: 'L3',         // Mute toggle
  rightStick: 'R3',        // Fullscreen toggle

  // D-pad
  up: 'Volume up',
  down: 'Volume down',
  left: 'Seek backward',
  right: 'Seek forward'
};
```

### Keyboard Shortcuts
```javascript
const KEYBOARD_MAP = {
  ' ': 'Play/Pause',
  'Enter': 'Play/Pause',
  'ArrowLeft': 'Seek -10s',
  'ArrowRight': 'Seek +10s',
  'ArrowUp': 'Volume +10%',
  'ArrowDown': 'Volume -10%',
  'f': 'Fullscreen toggle',
  'm': 'Mute toggle',
  'c': 'Captions toggle',
  's': 'Settings menu',
  '0-9': 'Seek to 0-90%',
  'Escape': 'Exit fullscreen',
  'Home': 'Seek to start',
  'End': 'Seek to end'
};
```

### Touch Gestures
```javascript
const TOUCH_GESTURES = {
  'tap': 'Play/Pause',
  'doubleTap': 'Fullscreen toggle',
  'swipeLeft': 'Seek backward 30s',
  'swipeRight': 'Seek forward 30s',
  'swipeUp': 'Volume increase',
  'swipeDown': 'Volume decrease',
  'pinchIn': 'Zoom out',
  'pinchOut': 'Zoom in',
  'longPress': 'Show context menu'
};
```

### TV Remote Keys
```javascript
const TV_REMOTE_KEYS = {
  13: 'OK/Enter - Play/Pause',
  37: 'Left - Seek backward',
  38: 'Up - Volume up/Menu navigate',
  39: 'Right - Seek forward',
  40: 'Down - Volume down/Menu navigate',
  8: 'Back - Exit/Previous',
  179: 'Play/Pause media key',
  227: 'Fast forward',
  228: 'Rewind',
  415: 'Play',
  19: 'Pause',
  413: 'Stop',
  417: 'Fast forward',
  412: 'Rewind'
};
```

## Minimal Implementation Examples

### Example 1: Gamepad Only
```html
<script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>
<script>
  const player = videojs('my-video');

  // Native Gamepad API (no library needed)
  function handleGamepad() {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];

    if (gp && gp.buttons[0].pressed) {
      player.paused() ? player.play() : player.pause();
    }

    requestAnimationFrame(handleGamepad);
  }

  window.addEventListener('gamepadconnected', handleGamepad);
</script>
```

### Example 2: Touch Gestures Only
```javascript
// Using native touch events (no library)
const videoEl = player.el();
let touchStart = { x: 0, y: 0 };

videoEl.addEventListener('touchstart', (e) => {
  touchStart.x = e.touches[0].clientX;
  touchStart.y = e.touches[0].clientY;
});

videoEl.addEventListener('touchend', (e) => {
  const deltaX = e.changedTouches[0].clientX - touchStart.x;

  if (Math.abs(deltaX) > 50) {
    // Swipe detected
    player.currentTime(player.currentTime() + (deltaX > 0 ? 30 : -30));
  } else {
    // Tap detected
    player.paused() ? player.play() : player.pause();
  }
});
```

### Example 3: TV Remote Support
```javascript
// TV remote navigation (works with arrow keys)
document.addEventListener('keydown', (e) => {
  switch(e.keyCode) {
    case 13: // OK button
      player.paused() ? player.play() : player.pause();
      break;
    case 37: // Left arrow
      player.currentTime(player.currentTime() - 10);
      break;
    case 39: // Right arrow
      player.currentTime(player.currentTime() + 10);
      break;
    case 38: // Up arrow
      player.volume(Math.min(1, player.volume() + 0.1));
      break;
    case 40: // Down arrow
      player.volume(Math.max(0, player.volume() - 0.1));
      break;
  }
});
```

### Example 4: Chromecast Receiver
```javascript
// Basic Chromecast receiver setup
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

// Handle play command from remote
playerManager.setMessageInterceptor(
  cast.framework.messages.MessageType.PLAY,
  request => {
    player.play();
    return request;
  }
);

// Handle pause command
playerManager.setMessageInterceptor(
  cast.framework.messages.MessageType.PAUSE,
  request => {
    player.pause();
    return request;
  }
);

context.start();
```

## Testing Without Physical Devices

### 1. Gamepad Testing
```javascript
// Virtual gamepad for testing
class VirtualGamepad {
  constructor() {
    this.buttons = Array(17).fill({ pressed: false, value: 0 });
    this.axes = [0, 0, 0, 0];
  }

  press(buttonIndex) {
    this.buttons[buttonIndex] = { pressed: true, value: 1 };
    window.dispatchEvent(new CustomEvent('gamepadbutton', {
      detail: { button: buttonIndex, gamepad: this }
    }));
  }

  release(buttonIndex) {
    this.buttons[buttonIndex] = { pressed: false, value: 0 };
  }
}

// Use in tests
const virtualGP = new VirtualGamepad();
virtualGP.press(0); // Simulate A button press
```

### 2. Touch Testing in Chrome DevTools
```javascript
// Enable touch simulation
// Chrome DevTools > Device Mode > Touch: Device-based

// Or programmatically dispatch touch events
const touchEvent = new TouchEvent('touchstart', {
  touches: [new Touch({
    identifier: 1,
    target: videoEl,
    clientX: 100,
    clientY: 100
  })]
});
videoEl.dispatchEvent(touchEvent);
```

### 3. TV Remote Testing
```javascript
// Simulate TV remote keys
function simulateTVRemote(action) {
  const keyMap = {
    'ok': 13,
    'left': 37,
    'right': 39,
    'up': 38,
    'down': 40,
    'back': 8,
    'play': 415,
    'pause': 19
  };

  const event = new KeyboardEvent('keydown', {
    keyCode: keyMap[action],
    which: keyMap[action]
  });

  document.dispatchEvent(event);
}

// Use in tests
simulateTVRemote('ok'); // Simulate OK button press
```

## Performance Tips

### 1. Throttle Continuous Inputs
```javascript
const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

const throttledSeek = throttle((time) => {
  player.currentTime(time);
}, 100);
```

### 2. Debounce Rapid Actions
```javascript
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

const debouncedVolumeChange = debounce((volume) => {
  player.volume(volume);
  showVolumeIndicator(volume);
}, 300);
```

### 3. Use requestAnimationFrame for Polling
```javascript
let rafId;
function pollInputs() {
  // Check gamepad state
  const gamepads = navigator.getGamepads();
  processGamepadInput(gamepads[0]);

  rafId = requestAnimationFrame(pollInputs);
}

// Start/stop polling based on visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
  } else {
    pollInputs();
  }
});
```

## Common Issues and Solutions

### Issue 1: Gamepad Not Detected
```javascript
// Solution: Require button press to activate
let gamepadConnected = false;

window.addEventListener('gamepadconnected', (e) => {
  console.log('Gamepad connected:', e.gamepad);
  gamepadConnected = true;

  // Some browsers require user interaction
  document.addEventListener('click', () => {
    if (!gamepadConnected) {
      alert('Press any button on your gamepad to connect');
    }
  }, { once: true });
});
```

### Issue 2: Touch Events Conflict with Controls
```javascript
// Solution: Prevent default on player controls
player.controlBar.on('touchstart', (e) => {
  e.stopPropagation();
});

// Only handle touches on video element
player.tech().on('touchstart', handleTouch);
```

### Issue 3: TV Remote Keys Not Working
```javascript
// Solution: Handle both keyCode and key
document.addEventListener('keydown', (e) => {
  // Support both old and new key event properties
  const code = e.keyCode || e.which;
  const key = e.key;

  // Map both standards
  if (code === 13 || key === 'Enter' || key === 'OK') {
    player.paused() ? player.play() : player.pause();
  }
});
```

## Links and Resources

- **Main Documentation**: [Input Device Handling](Input-Device-Handling.md)
- **Gamepad API Tester**: https://gamepad-tester.com/
- **Touch Event Tester**: https://patrickhlauke.github.io/touch/tests/results/
- **Chrome DevTools Guide**: https://developer.chrome.com/docs/devtools/
- **Video.js Plugins**: https://videojs.com/plugins/

## License Information

All recommended libraries are MIT licensed and free for commercial use:
- gamecontroller.js - MIT
- ZingTouch - MIT
- Hammer.js - MIT
- Native Web APIs - W3C Standards (Free)

No licensing costs required for any of the solutions presented.