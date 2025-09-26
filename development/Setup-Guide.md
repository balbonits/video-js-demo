# Development Setup Guide

## Overview

This guide provides comprehensive instructions for setting up the development environment for our Video.js-based video player project with Next.js.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Required Tools and Versions](#required-tools-and-versions)
3. [Project Initialization](#project-initialization)
4. [Environment Setup](#environment-setup)
5. [Local Development Workflow](#local-development-workflow)
6. [IDE Configuration](#ide-configuration)
7. [Debugging Setup](#debugging-setup)
8. [Common Setup Issues](#common-setup-issues)

## System Requirements

### Minimum Requirements

- **CPU**: 2+ cores (4+ recommended for development)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **OS**: macOS 10.15+, Windows 10/11, Ubuntu 20.04+

### Network Requirements

- Stable internet connection for package installation
- Access to npm registry (or configured private registry)
- Access to CDN endpoints for video testing

## Required Tools and Versions

### Core Dependencies

```bash
# Node.js (v18.17.0 or higher)
node --version
# v18.17.0

# npm (v9.0.0 or higher) or yarn (v1.22.0+) or pnpm (v8.0.0+)
npm --version
# 9.6.7

# Git
git --version
# git version 2.39.0
```

### Installation Scripts

#### macOS (using Homebrew)

```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install other tools
brew install git
brew install ffmpeg  # For video processing utilities
brew install watchman  # For better file watching
```

#### Windows (using Chocolatey)

```powershell
# Install Chocolatey (Run as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required tools
choco install nodejs-lts
choco install git
choco install ffmpeg
choco install vscode
```

#### Linux (Ubuntu/Debian)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional tools
sudo apt-get install -y git build-essential ffmpeg

# Install yarn (optional)
npm install -g yarn
```

## Project Initialization

### Step 1: Create Next.js Application

```bash
# Using create-next-app with TypeScript
npx create-next-app@latest video-player-app \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd video-player-app
```

### Step 2: Install Video.js and Dependencies

```bash
# Core Video.js packages
npm install video.js @types/video.js

# Video.js plugins
npm install \
  videojs-contrib-quality-levels \
  videojs-hls-quality-selector \
  @videojs/http-streaming \
  videojs-vtt-thumbnails \
  videojs-hotkeys \
  videojs-markers

# Additional development dependencies
npm install -D \
  @videojs/themes \
  sass \
  eslint-plugin-jsx-a11y \
  prettier \
  husky \
  lint-staged \
  @testing-library/react \
  @testing-library/jest-dom \
  @playwright/test
```

### Step 3: Project Structure Setup

```bash
# Create project structure
mkdir -p src/{components,hooks,utils,styles,lib,types,services,config}
mkdir -p src/components/{VideoPlayer,Controls,Overlays}
mkdir -p public/{videos,thumbnails}
mkdir -p tests/{unit,integration,e2e}

# Create configuration files
touch .env.local .env.development .env.production
touch src/config/{video.config.ts,app.config.ts}
touch src/types/{video.types.ts,global.d.ts}
```

### Resulting Project Structure

```
video-player-app/
├── public/
│   ├── videos/           # Sample video files
│   └── thumbnails/       # Video thumbnails
├── src/
│   ├── app/             # Next.js app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── video/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── components/
│   │   ├── VideoPlayer/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoPlayer.module.css
│   │   │   └── index.ts
│   │   ├── Controls/
│   │   └── Overlays/
│   ├── hooks/
│   │   ├── useVideoPlayer.ts
│   │   └── useVideoAnalytics.ts
│   ├── utils/
│   │   ├── video-helpers.ts
│   │   └── format.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── videojs-theme.scss
│   ├── lib/
│   │   └── videojs-setup.ts
│   ├── types/
│   │   ├── video.types.ts
│   │   └── global.d.ts
│   ├── services/
│   │   └── video.service.ts
│   └── config/
│       ├── video.config.ts
│       └── app.config.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local
├── .env.development
├── .env.production
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## Environment Setup

### Environment Variables Configuration

#### `.env.local` (Development Secrets)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_VIDEO_API_URL=http://localhost:8080

# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://cdn-dev.example.com
NEXT_PUBLIC_VIDEO_CDN_URL=https://video-cdn-dev.example.com

# Analytics
NEXT_PUBLIC_ANALYTICS_ENDPOINT=http://localhost:3001/analytics
ANALYTICS_API_KEY=dev_analytics_key_here

# Features Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_SUBTITLES=true

# AWS S3 (for video storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-west-2
AWS_S3_BUCKET=video-storage-dev
```

#### `.env.development`

```bash
# Development-specific settings
NODE_ENV=development
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_LOG_LEVEL=debug

# Mock services
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_MOCK_LATENCY=1000
```

#### `.env.production`

```bash
# Production settings
NODE_ENV=production
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_LOG_LEVEL=error

# Production URLs
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
```

### Next.js Configuration

#### `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Video handling
  images: {
    domains: ['cdn.example.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for video streaming
  async headers() {
    return [
      {
        source: '/api/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Webpack configuration for Video.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'video.js$': 'video.js/dist/video.cjs.js',
      };
    }

    // Handle video files
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/videos/',
          outputPath: 'static/videos/',
          name: '[name].[hash].[ext]',
        },
      },
    });

    return config;
  },

  // Experimental features
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
```

### TypeScript Configuration

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"],
      "@/config/*": ["./src/config/*"],
      "@/services/*": ["./src/services/*"],
      "@/styles/*": ["./src/styles/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

## Local Development Workflow

### Development Scripts

#### `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug",
    "analyze": "ANALYZE=true next build",
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Git Hooks Configuration

#### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
```

#### `.lintstagedrc.js`

```javascript
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.css': ['prettier --write'],
  '*.scss': ['prettier --write'],
};
```

### Local Development Server

```bash
# Start development server
npm run dev

# Start with debug mode
npm run dev:debug

# Start with specific port
PORT=3001 npm run dev

# Start with HTTPS (for testing secure contexts)
HTTPS=true npm run dev
```

### Hot Module Replacement Setup

```typescript
// src/lib/videojs-setup.ts
import videojs from 'video.js';

if (typeof window !== 'undefined') {
  // HMR support for Video.js
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      // Cleanup Video.js instances on hot reload
      const players = videojs.getPlayers();
      Object.keys(players).forEach(id => {
        const player = players[id];
        if (player && !player.isDisposed()) {
          player.dispose();
        }
      });
    });
  }
}
```

## IDE Configuration

### Visual Studio Code

#### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.git": true,
    "**/.next": true,
    "**/node_modules": true,
    "**/.DS_Store": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/*.code-search": true,
    ".next": true,
    "out": true,
    "coverage": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

#### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--watchAll=false"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "styled-components.vscode-styled-components",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv",
    "csstools.postcss",
    "firefox-devtools.vscode-firefox-debug",
    "msjsdiag.debugger-for-chrome",
    "GitHub.copilot"
  ]
}
```

### WebStorm/IntelliJ IDEA

#### Run Configuration

```xml
<!-- .idea/runConfigurations/Next_js_Dev.xml -->
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Next.js Dev" type="npm">
    <package-json value="$PROJECT_DIR$/package.json" />
    <command value="run" />
    <scripts>
      <script value="dev" />
    </scripts>
    <node-interpreter value="project" />
    <envs />
    <method v="2" />
  </configuration>
</component>
```

## Debugging Setup

### Browser DevTools Configuration

#### Chrome DevTools

1. **Enable Source Maps**
   ```javascript
   // next.config.js
   module.exports = {
     productionBrowserSourceMaps: true,
     webpack: (config, { dev }) => {
       if (dev) {
         config.devtool = 'eval-source-map';
       }
       return config;
     },
   };
   ```

2. **Video.js Debug Mode**
   ```typescript
   // src/lib/videojs-setup.ts
   import videojs from 'video.js';

   // Enable debug logging in development
   if (process.env.NODE_ENV === 'development') {
     videojs.log.level('debug');
   }
   ```

### Node.js Debugging

#### Debug Configuration

```bash
# Start Next.js with Node.js inspector
NODE_OPTIONS='--inspect' npm run dev

# With specific port
NODE_OPTIONS='--inspect=9229' npm run dev

# Break on first line
NODE_OPTIONS='--inspect-brk' npm run dev
```

#### Debug Utility Functions

```typescript
// src/utils/debug.ts
export const debugLog = (...args: any[]) => {
  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
    console.log('[DEBUG]', new Date().toISOString(), ...args);
  }
};

export const debugError = (error: Error, context?: string) => {
  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
    console.error('[ERROR]', context || '', error);
    console.trace();
  }
};

export const debugPerformance = (label: string) => {
  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
    performance.mark(`${label}-start`);

    return () => {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`[PERF] ${label}: ${measure.duration.toFixed(2)}ms`);
    };
  }

  return () => {}; // No-op in production
};
```

### React Developer Tools

```typescript
// src/components/VideoPlayer/VideoPlayer.tsx
import { useDebugValue } from 'react';

export const VideoPlayer = () => {
  const player = useVideoPlayer();

  // Debug information in React DevTools
  useDebugValue(player ? 'Player initialized' : 'Player loading');

  return (
    // Component JSX
  );
};
```

## Common Setup Issues

### Issue 1: Video.js SSR Error

**Problem**: `window is not defined` error during build

**Solution**:
```typescript
// Use dynamic import with ssr: false
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(
  () => import('./VideoPlayer'),
  { ssr: false }
);
```

### Issue 2: TypeScript Types Missing

**Problem**: Cannot find types for Video.js plugins

**Solution**:
```typescript
// src/types/videojs-plugins.d.ts
declare module 'videojs-contrib-quality-levels' {
  const qualityLevels: any;
  export default qualityLevels;
}

declare module 'videojs-hls-quality-selector' {
  const hlsQualitySelector: any;
  export default hlsQualitySelector;
}
```

### Issue 3: CORS Issues with Video Sources

**Problem**: Videos fail to load due to CORS

**Solution**:
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/video/:path*',
        destination: 'https://external-video-source.com/:path*',
      },
    ];
  },
};
```

### Issue 4: Large Bundle Size

**Problem**: Video.js increases bundle size significantly

**Solution**:
```javascript
// Implement code splitting
const loadVideoJS = async () => {
  const [videojs, qualityLevels] = await Promise.all([
    import('video.js'),
    import('videojs-contrib-quality-levels'),
  ]);

  return { videojs: videojs.default, qualityLevels };
};
```

### Issue 5: Memory Leaks

**Problem**: Video.js instances not properly cleaned up

**Solution**:
```typescript
useEffect(() => {
  let player: videojs.Player | null = null;

  if (videoRef.current) {
    player = videojs(videoRef.current, options);
  }

  return () => {
    if (player && !player.isDisposed()) {
      player.dispose();
    }
  };
}, []);
```

## Development Best Practices

### Code Organization

1. **Separate concerns**: Keep Video.js logic separate from React components
2. **Use custom hooks**: Abstract Video.js functionality into reusable hooks
3. **Lazy load plugins**: Only load plugins when needed
4. **Type everything**: Ensure full TypeScript coverage

### Performance

1. **Optimize video sources**: Use appropriate formats and bitrates
2. **Implement lazy loading**: Load videos only when visible
3. **Use CDN**: Serve videos from a CDN in production
4. **Monitor bundle size**: Use bundle analyzer regularly

### Testing

1. **Mock Video.js in tests**: Create proper mocks for unit tests
2. **Use test videos**: Have sample videos for different scenarios
3. **Test error states**: Ensure error handling works correctly
4. **Performance testing**: Monitor memory and CPU usage

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Video.js Documentation](https://docs.videojs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)