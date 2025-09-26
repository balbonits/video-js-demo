#!/bin/bash

# Video Player Project Initializer
# Generated from video-js-demo-wiki blueprints

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIKI_ROOT="$(dirname "$SCRIPT_DIR")"
BLUEPRINTS_DIR="$WIKI_ROOT/blueprints"
AGENTS_DIR="$WIKI_ROOT/.claude/agents"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    echo
    print_color "$CYAN" "================================================"
    print_color "$CYAN" "    Video Player Project Initializer"
    print_color "$CYAN" "================================================"
    echo
}

# Function to print usage
print_usage() {
    cat << EOF
Usage: $0 [OPTIONS] <platform> <project-name> [target-directory]

Platforms:
  web       - Next.js web player with Video.js
  ios       - Native iOS player with AVKit
  android   - Native Android player with ExoPlayer
  service   - Backend API service for video streaming

Options:
  -h, --help           Show this help message
  -v, --verbose        Enable verbose output
  -s, --skip-git       Skip git repository initialization
  -i, --skip-install   Skip dependency installation
  -a, --all-agents     Copy all subagent configurations

Arguments:
  project-name         Name of your project (alphanumeric and hyphens only)
  target-directory     Where to create the project (default: current directory)

Examples:
  $0 web my-video-player
  $0 ios ios-player-app ~/projects
  $0 android streaming-app ./android-apps --skip-install
  $0 service video-api backend/

EOF
}

# Function to validate platform
validate_platform() {
    local platform=$1
    case $platform in
        web|ios|android|service)
            return 0
            ;;
        *)
            print_color "$RED" "Error: Invalid platform '$platform'"
            print_color "$YELLOW" "Valid platforms: web, ios, android, service"
            exit 1
            ;;
    esac
}

# Function to validate project name
validate_project_name() {
    local name=$1
    if [[ ! "$name" =~ ^[a-zA-Z0-9-]+$ ]]; then
        print_color "$RED" "Error: Invalid project name '$name'"
        print_color "$YELLOW" "Project name must contain only alphanumeric characters and hyphens"
        exit 1
    fi
}

# Function to create project directory
create_project_directory() {
    local project_dir=$1

    if [ -d "$project_dir" ]; then
        if [ "$(ls -A "$project_dir")" ]; then
            print_color "$RED" "Error: Directory '$project_dir' already exists and is not empty"
            exit 1
        fi
    else
        mkdir -p "$project_dir"
    fi

    print_color "$GREEN" "✓ Created project directory: $project_dir"
}

# Function to copy blueprint files
copy_blueprint_files() {
    local platform=$1
    local project_dir=$2
    local project_name=$3

    local blueprint_dir="$BLUEPRINTS_DIR/$platform"

    if [ ! -d "$blueprint_dir" ]; then
        print_color "$RED" "Error: Blueprint directory not found for platform '$platform'"
        exit 1
    fi

    # Copy all files from blueprint
    cp -r "$blueprint_dir"/* "$project_dir/" 2>/dev/null || true
    cp -r "$blueprint_dir"/.[^.]* "$project_dir/" 2>/dev/null || true

    # Replace placeholders in files
    local project_name_lower=$(echo "$project_name" | tr '[:upper:]' '[:lower:]' | tr '-' '_')
    local current_date=$(date +"%Y-%m-%d")

    # Find and replace in all text files
    find "$project_dir" -type f \( -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" \
        -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.xml" \
        -o -name "*.gradle" -o -name "*.swift" -o -name "*.kt" -o -name "*.java" \
        -o -name "*.env*" -o -name "Podfile" -o -name "Package.swift" -o -name "Dockerfile" \) \
        -exec sed -i.bak "s/__PROJECT_NAME__/$project_name/g" {} \;

    find "$project_dir" -type f -name "*.bak" -delete

    # Replace lowercase version
    find "$project_dir" -type f \( -name "*.json" -o -name "*.gradle" -o -name "*.xml" \) \
        -exec sed -i.bak "s/__PROJECT_NAME_LOWER__/$project_name_lower/g" {} \;

    find "$project_dir" -type f -name "*.bak" -delete

    print_color "$GREEN" "✓ Copied $platform blueprint files"
}

# Function to create directory structure
create_directory_structure() {
    local platform=$1
    local project_dir=$2

    case $platform in
        web)
            mkdir -p "$project_dir"/{src/{app,components,lib,hooks,utils},public,tests,e2e}
            mkdir -p "$project_dir"/src/components/{player,ui,layout}
            mkdir -p "$project_dir"/src/app/{api,player}
            ;;
        ios)
            mkdir -p "$project_dir"/{Sources,Tests,Resources,Docs}
            mkdir -p "$project_dir"/Sources/{Models,Views,ViewModels,Services,Player}
            ;;
        android)
            mkdir -p "$project_dir"/app/src/{main,test,androidTest}
            mkdir -p "$project_dir"/app/src/main/{java,res/{layout,values,drawable}}
            ;;
        service)
            mkdir -p "$project_dir"/src/{api,services,models,middleware,utils,config}
            mkdir -p "$project_dir"/{tests,docs,scripts}
            ;;
    esac

    print_color "$GREEN" "✓ Created project structure for $platform"
}

# Function to copy subagent configurations
copy_subagent_configs() {
    local project_dir=$1
    local platform=$2
    local all_agents=$3

    mkdir -p "$project_dir/.claude/agents"

    if [ "$all_agents" = true ]; then
        # Copy all agents
        cp "$AGENTS_DIR"/*.md "$project_dir/.claude/agents/" 2>/dev/null || true
        print_color "$GREEN" "✓ Copied all subagent configurations"
    else
        # Copy platform-specific agents
        case $platform in
            web)
                cp "$AGENTS_DIR"/{code-monkey,tester,ux-guy,product-guy}.md "$project_dir/.claude/agents/" 2>/dev/null || true
                ;;
            ios|android)
                cp "$AGENTS_DIR"/{code-monkey,tester,platform-specialist,ux-guy}.md "$project_dir/.claude/agents/" 2>/dev/null || true
                ;;
            service)
                cp "$AGENTS_DIR"/{code-monkey,tester,api-sdk-expert,db-manager}.md "$project_dir/.claude/agents/" 2>/dev/null || true
                ;;
        esac
        print_color "$GREEN" "✓ Copied platform-specific subagent configurations"
    fi
}

# Function to generate CLAUDE.md
generate_claude_md() {
    local project_dir=$1
    local project_name=$2
    local platform=$3

    local claude_template="$BLUEPRINTS_DIR/CLAUDE.md.template"
    local claude_file="$project_dir/.claude/CLAUDE.md"

    mkdir -p "$project_dir/.claude"

    # Copy template
    cp "$claude_template" "$claude_file"

    # Replace placeholders
    sed -i.bak "s/__PROJECT_NAME__/$project_name/g" "$claude_file"
    sed -i.bak "s/__PLATFORM__/$platform/g" "$claude_file"
    sed -i.bak "s/__DATE__/$(date +%Y-%m-%d)/g" "$claude_file"

    # Add platform-specific content
    case $platform in
        web)
            sed -i.bak "s|__TECH_STACK__|Next.js 14+, React 18+, TypeScript 5+, Video.js 8+, Tailwind CSS|g" "$claude_file"
            sed -i.bak "s|__PREREQUISITES__|Node.js 18.17+, npm or yarn|g" "$claude_file"
            sed -i.bak "s|__INSTALL_COMMANDS__|npm install|g" "$claude_file"
            sed -i.bak "s|__DEV_COMMANDS__|npm run dev|g" "$claude_file"
            sed -i.bak "s|__TEST_COMMANDS__|npm test|g" "$claude_file"
            sed -i.bak "s|__BUILD_COMMANDS__|npm run build|g" "$claude_file"
            sed -i.bak "s|__PLATFORM_DOCS__|https://nextjs.org/docs|g" "$claude_file"
            ;;
        ios)
            sed -i.bak "s|__TECH_STACK__|Swift 5.9+, AVKit, SwiftUI/UIKit, CocoaPods/SPM|g" "$claude_file"
            sed -i.bak "s|__PREREQUISITES__|Xcode 15+, CocoaPods, Swift 5.9+|g" "$claude_file"
            sed -i.bak "s|__INSTALL_COMMANDS__|pod install|g" "$claude_file"
            sed -i.bak "s|__DEV_COMMANDS__|xcodebuild -workspace $project_name.xcworkspace -scheme $project_name|g" "$claude_file"
            sed -i.bak "s|__TEST_COMMANDS__|xcodebuild test -workspace $project_name.xcworkspace -scheme $project_name|g" "$claude_file"
            sed -i.bak "s|__BUILD_COMMANDS__|xcodebuild archive|g" "$claude_file"
            sed -i.bak "s|__PLATFORM_DOCS__|https://developer.apple.com/documentation/avkit|g" "$claude_file"
            ;;
        android)
            sed -i.bak "s|__TECH_STACK__|Kotlin 1.9+, ExoPlayer 2.19+, Android SDK 34, Gradle 8+|g" "$claude_file"
            sed -i.bak "s|__PREREQUISITES__|Android Studio, Java 11+, Android SDK|g" "$claude_file"
            sed -i.bak "s|__INSTALL_COMMANDS__|./gradlew build|g" "$claude_file"
            sed -i.bak "s|__DEV_COMMANDS__|./gradlew installDebug|g" "$claude_file"
            sed -i.bak "s|__TEST_COMMANDS__|./gradlew test|g" "$claude_file"
            sed -i.bak "s|__BUILD_COMMANDS__|./gradlew assembleRelease|g" "$claude_file"
            sed -i.bak "s|__PLATFORM_DOCS__|https://exoplayer.dev/|g" "$claude_file"
            ;;
        service)
            sed -i.bak "s|__TECH_STACK__|Node.js 20+, Express, TypeScript, Redis, Docker|g" "$claude_file"
            sed -i.bak "s|__PREREQUISITES__|Node.js 20+, Docker, Redis|g" "$claude_file"
            sed -i.bak "s|__INSTALL_COMMANDS__|npm install|g" "$claude_file"
            sed -i.bak "s|__DEV_COMMANDS__|npm run dev|g" "$claude_file"
            sed -i.bak "s|__TEST_COMMANDS__|npm test|g" "$claude_file"
            sed -i.bak "s|__BUILD_COMMANDS__|npm run build && docker build -t $project_name .|g" "$claude_file"
            sed -i.bak "s|__PLATFORM_DOCS__|https://expressjs.com/|g" "$claude_file"
            ;;
    esac

    # Add agent list
    local agents_list=""
    for agent_file in "$project_dir"/.claude/agents/*.md; do
        if [ -f "$agent_file" ]; then
            local agent_name=$(basename "$agent_file" .md)
            agents_list="$agents_list- $agent_name\n"
        fi
    done
    sed -i.bak "s|__AGENTS_LIST__|$agents_list|g" "$claude_file"

    # Clean up backup files
    rm -f "$claude_file.bak"

    print_color "$GREEN" "✓ Generated CLAUDE.md configuration"
}

# Function to initialize git repository
initialize_git() {
    local project_dir=$1
    local skip_git=$2

    if [ "$skip_git" = true ]; then
        print_color "$YELLOW" "⚠ Skipped git initialization"
        return
    fi

    cd "$project_dir"

    git init
    git add .
    git commit -m "Initial commit - Video player project initialized from blueprints"

    print_color "$GREEN" "✓ Initialized git repository"
}

# Function to install dependencies
install_dependencies() {
    local project_dir=$1
    local platform=$2
    local skip_install=$3

    if [ "$skip_install" = true ]; then
        print_color "$YELLOW" "⚠ Skipped dependency installation"
        return
    fi

    cd "$project_dir"

    case $platform in
        web|service)
            if command -v npm &> /dev/null; then
                print_color "$BLUE" "Installing npm dependencies..."
                npm install
                print_color "$GREEN" "✓ Installed npm dependencies"
            else
                print_color "$YELLOW" "⚠ npm not found. Please install Node.js and run 'npm install'"
            fi
            ;;
        ios)
            if command -v pod &> /dev/null; then
                print_color "$BLUE" "Installing CocoaPods dependencies..."
                pod install
                print_color "$GREEN" "✓ Installed CocoaPods dependencies"
            else
                print_color "$YELLOW" "⚠ CocoaPods not found. Please install CocoaPods and run 'pod install'"
            fi
            ;;
        android)
            if [ -f "./gradlew" ]; then
                print_color "$BLUE" "Setting up Gradle..."
                chmod +x ./gradlew
                ./gradlew wrapper
                print_color "$GREEN" "✓ Gradle wrapper configured"
            else
                print_color "$YELLOW" "⚠ Gradle wrapper not found"
            fi
            ;;
    esac
}

# Function to create sample files
create_sample_files() {
    local project_dir=$1
    local platform=$2

    case $platform in
        web)
            # Create sample video player component
            cat > "$project_dir/src/components/player/VideoPlayer.tsx" << 'EOF'
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, autoplay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay,
        preload: 'auto',
        fluid: true,
        sources: [{
          src,
          type: 'application/x-mpegURL'
        }],
        poster
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [src, poster, autoplay]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
};
EOF
            print_color "$GREEN" "✓ Created sample VideoPlayer component"
            ;;

        service)
            # Create sample API endpoint
            cat > "$project_dir/src/index.ts" << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Video metadata endpoint
app.get('/api/v1/videos/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    title: 'Sample Video',
    src: `https://example.com/videos/${id}.m3u8`,
    duration: 120,
    thumbnail: `https://example.com/thumbnails/${id}.jpg`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF
            print_color "$GREEN" "✓ Created sample API server"
            ;;
    esac
}

# Function to display next steps
display_next_steps() {
    local project_dir=$1
    local platform=$2
    local project_name=$3
    local skip_install=$4

    print_color "$CYAN" "\n================================================"
    print_color "$CYAN" "    Project Successfully Initialized!"
    print_color "$CYAN" "================================================"

    print_color "$GREEN" "\n✓ Project: $project_name"
    print_color "$GREEN" "✓ Platform: $platform"
    print_color "$GREEN" "✓ Location: $project_dir"

    print_color "$MAGENTA" "\n📝 Next Steps:"
    echo
    echo "1. Navigate to your project:"
    echo "   cd $project_dir"
    echo

    if [ "$skip_install" = true ]; then
        echo "2. Install dependencies:"
        case $platform in
            web|service)
                echo "   npm install"
                ;;
            ios)
                echo "   pod install"
                ;;
            android)
                echo "   ./gradlew build"
                ;;
        esac
        echo
    fi

    case $platform in
        web)
            echo "2. Start development server:"
            echo "   npm run dev"
            echo
            echo "3. Open browser:"
            echo "   http://localhost:3000"
            echo
            echo "4. Run tests:"
            echo "   npm test        # Unit tests"
            echo "   npm run e2e     # E2E tests"
            echo
            echo "5. Build for production:"
            echo "   npm run build"
            ;;
        ios)
            echo "2. Open in Xcode:"
            echo "   open $project_name.xcworkspace"
            echo
            echo "3. Select simulator or device"
            echo
            echo "4. Build and run (⌘+R)"
            ;;
        android)
            echo "2. Open in Android Studio:"
            echo "   studio ."
            echo
            echo "3. Sync Gradle files"
            echo
            echo "4. Run on emulator or device"
            ;;
        service)
            echo "2. Set up environment variables:"
            echo "   cp .env.example .env"
            echo "   # Edit .env with your configuration"
            echo
            echo "3. Start development server:"
            echo "   npm run dev"
            echo
            echo "4. Test API endpoint:"
            echo "   curl http://localhost:3001/health"
            echo
            echo "5. Build Docker image:"
            echo "   docker build -t $project_name ."
            ;;
    esac

    print_color "$CYAN" "\n📚 Documentation:"
    echo "- Project docs: $project_dir/.claude/CLAUDE.md"
    echo "- Wiki: $WIKI_ROOT"
    echo "- Agents: $project_dir/.claude/agents/"

    print_color "$YELLOW" "\n💡 Tips:"
    echo "- Use Claude agents for specialized tasks (@code-monkey, @tester, etc.)"
    echo "- Check .claude/CLAUDE.md for detailed project information"
    echo "- Refer to the wiki for video player implementation guides"

    print_color "$GREEN" "\n🎉 Happy coding!\n"
}

# Main function
main() {
    # Default values
    local verbose=false
    local skip_git=false
    local skip_install=false
    local all_agents=false
    local platform=""
    local project_name=""
    local target_dir=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                print_header
                print_usage
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -s|--skip-git)
                skip_git=true
                shift
                ;;
            -i|--skip-install)
                skip_install=true
                shift
                ;;
            -a|--all-agents)
                all_agents=true
                shift
                ;;
            -*)
                print_color "$RED" "Error: Unknown option $1"
                print_usage
                exit 1
                ;;
            *)
                if [ -z "$platform" ]; then
                    platform=$1
                elif [ -z "$project_name" ]; then
                    project_name=$1
                elif [ -z "$target_dir" ]; then
                    target_dir=$1
                else
                    print_color "$RED" "Error: Too many arguments"
                    print_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Validate required arguments
    if [ -z "$platform" ] || [ -z "$project_name" ]; then
        print_color "$RED" "Error: Missing required arguments"
        print_usage
        exit 1
    fi

    # Set default target directory
    if [ -z "$target_dir" ]; then
        target_dir="."
    fi

    # Resolve full path
    target_dir=$(cd "$target_dir" 2>/dev/null && pwd || echo "$target_dir")
    local project_dir="$target_dir/$project_name"

    # Print header
    print_header

    # Validate inputs
    validate_platform "$platform"
    validate_project_name "$project_name"

    print_color "$BLUE" "Initializing $platform project: $project_name"
    echo

    # Execute initialization steps
    create_project_directory "$project_dir"
    copy_blueprint_files "$platform" "$project_dir" "$project_name"
    create_directory_structure "$platform" "$project_dir"
    copy_subagent_configs "$project_dir" "$platform" "$all_agents"
    generate_claude_md "$project_dir" "$project_name" "$platform"
    create_sample_files "$project_dir" "$platform"
    initialize_git "$project_dir" "$skip_git"
    install_dependencies "$project_dir" "$platform" "$skip_install"

    # Display next steps
    display_next_steps "$project_dir" "$platform" "$project_name" "$skip_install"
}

# Run main function
main "$@"