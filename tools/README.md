# Video Player Knowledgebase Tools

This directory contains tools to help you quickly bootstrap new video player projects using the blueprints from this knowledgebase.

## Project Initializer (`init-project.sh`)

A comprehensive bash script that creates new video player projects from blueprints.

### Features

- **Instant Project Creation**: Bootstrap complete projects in seconds
- **Multiple Project Types**: Players (web, iOS, Android) and backend services
- **Complete Setup**: Copies code, configurations, and documentation
- **Subagent Integration**: Automatically includes relevant Claude agents
- **Git Initialization**: Sets up version control
- **Dependency Installation**: Optionally installs project dependencies

### Installation

Make the script executable:
```bash
chmod +x init-project.sh
```

### Usage

#### Basic Syntax
```bash
./init-project.sh --type=<type> --name=<name> [OPTIONS]
```

#### Required Arguments
- `--type=TYPE` - Project type (see available types below)
- `--name=NAME` - Your project name

#### Optional Arguments
- `--path=PATH` - Where to create the project (default: current directory)
- `--install` - Install dependencies after creation
- `--no-git` - Skip git repository initialization
- `--verbose` - Show detailed output
- `--help` - Display help message

### Available Project Types

#### Players
- `web-player` - Next.js + Video.js web application
- `ios-player` - Swift + AVKit iOS app
- `android-player` - Kotlin + ExoPlayer Android app

#### Backend Services
- `streaming-service` - HLS/DASH streaming server
- `analytics-service` - Event collection and metrics
- `chat-service` - WebSocket-based live chat
- `drm-service` - DRM token and license management

### Examples

#### Create a Web Player
```bash
./init-project.sh --type=web-player --name=my-streaming-app --path=~/projects/ --install
```

This will:
1. Create `~/projects/my-streaming-app/` directory
2. Extract the web player blueprint
3. Copy relevant subagents
4. Initialize git repository
5. Install npm dependencies

#### Create an iOS Player
```bash
./init-project.sh --type=ios-player --name=video-app --path=~/ios-projects/
```

#### Create a Backend Service
```bash
./init-project.sh --type=streaming-service --name=hls-server --install
```

### Project Structure

After initialization, your project will have:

```
my-project/
├── src/              # Source code (structure varies by type)
├── .claude/
│   └── agents/       # Relevant subagent definitions
├── CLAUDE.md         # Project-specific Claude documentation
├── README.md         # Project documentation
├── package.json      # Dependencies (for Node.js projects)
├── Dockerfile        # Container configuration (for services)
└── .gitignore        # Git ignore rules
```

### Subagents Included

The initializer automatically includes relevant subagents:

**All Projects Get:**
- `code-monkey` - Implementation
- `tester` - Testing
- `product-guy` - Documentation & specs
- `api-sdk-expert` - External integrations

**Player Projects Also Get:**
- `ux-guy` - UI/UX design
- `platform-specialist` - Platform optimization

**Service Projects Also Get:**
- `db-manager` - Database architecture

### Post-Creation Steps

#### Web Player
```bash
cd my-streaming-app
npm run dev
# Open http://localhost:3000
```

#### iOS Player
```bash
cd video-app
open *.xcodeproj
# Build and run in Xcode
```

#### Android Player
```bash
cd video-player
# Open in Android Studio
# Sync and run
```

#### Backend Services
```bash
cd hls-server
docker-compose up
# Service runs on configured port
```

### Troubleshooting

#### Permission Denied
```bash
chmod +x init-project.sh
```

#### Blueprint Not Found
Ensure you're running the script from the `tools/` directory or adjust the path.

#### Dependencies Not Installing
- Ensure npm/pip/pod is installed
- Use `--install` flag
- Or install manually after creation

#### Git Init Failed
- Check if git is installed
- Use `--no-git` to skip git initialization

### Advanced Usage

#### Custom Blueprint Location
Edit the script's `BLUEPRINT_BASE` variable to point to your blueprint directory:
```bash
BLUEPRINT_BASE="/path/to/your/blueprints"
```

#### Adding New Project Types
1. Create blueprint at `projects/[category]/[type]/blueprint.md`
2. Add type to appropriate array in script:
   - `PLAYER_TYPES` for players
   - `SERVICE_TYPES` for services

#### Customizing Subagent Selection
Modify the `copy_subagents()` function to include different agents based on your needs.

### Contributing

To improve the initializer:
1. Test with different project types
2. Report issues in the knowledgebase
3. Suggest new features or project types
4. Contribute blueprint improvements

### Related Tools

- **Blueprint Generator** - Create new blueprint templates
- **Knowledge Parser** - Extract specific knowledge sections
- **Subagent Manager** - Manage and update agent definitions

---

For more information, see the main [Knowledgebase Home](../Home.md) or check the [Project Blueprints](../projects/) directory.