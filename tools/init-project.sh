#!/bin/bash

# Video Player Project Initializer
# Bootstraps new video player projects from blueprints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROJECT_TYPE=""
PROJECT_NAME=""
PROJECT_PATH="."
INSTALL_DEPS=false
INIT_GIT=true
VERBOSE=false

# Blueprint source directory (relative to script location)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BLUEPRINT_BASE="${SCRIPT_DIR}/../projects"
AGENTS_BASE="${SCRIPT_DIR}/../.claude/agents"

# Available project types
declare -a PLAYER_TYPES=("web-player" "ios-player" "android-player")
declare -a SERVICE_TYPES=("streaming-service" "analytics-service" "chat-service" "drm-service")
declare -a ALL_TYPES=("${PLAYER_TYPES[@]}" "${SERVICE_TYPES[@]}")

# Usage function
usage() {
    echo "Video Player Project Initializer"
    echo ""
    echo "Usage: $0 --type=<type> --name=<name> [OPTIONS]"
    echo ""
    echo "Required Arguments:"
    echo "  --type=TYPE        Project type (see available types below)"
    echo "  --name=NAME        Project name"
    echo ""
    echo "Optional Arguments:"
    echo "  --path=PATH        Project path (default: current directory)"
    echo "  --install          Install dependencies after creation"
    echo "  --no-git           Don't initialize git repository"
    echo "  --verbose          Verbose output"
    echo "  --help             Show this help message"
    echo ""
    echo "Available Project Types:"
    echo ""
    echo "  Players:"
    for type in "${PLAYER_TYPES[@]}"; do
        echo "    - $type"
    done
    echo ""
    echo "  Services:"
    for type in "${SERVICE_TYPES[@]}"; do
        echo "    - $type"
    done
    echo ""
    echo "Example:"
    echo "  $0 --type=web-player --name=my-streaming-app --path=~/projects/ --install"
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type=*)
            PROJECT_TYPE="${1#*=}"
            shift
            ;;
        --name=*)
            PROJECT_NAME="${1#*=}"
            shift
            ;;
        --path=*)
            PROJECT_PATH="${1#*=}"
            shift
            ;;
        --install)
            INSTALL_DEPS=true
            shift
            ;;
        --no-git)
            INIT_GIT=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Validation functions
validate_type() {
    local valid=false
    for type in "${ALL_TYPES[@]}"; do
        if [[ "$type" == "$PROJECT_TYPE" ]]; then
            valid=true
            break
        fi
    done

    if [[ "$valid" == false ]]; then
        echo -e "${RED}Error: Invalid project type '$PROJECT_TYPE'${NC}"
        echo "Valid types are: ${ALL_TYPES[@]}"
        exit 1
    fi
}

validate_inputs() {
    if [[ -z "$PROJECT_TYPE" ]]; then
        echo -e "${RED}Error: Project type is required${NC}"
        usage
    fi

    if [[ -z "$PROJECT_NAME" ]]; then
        echo -e "${RED}Error: Project name is required${NC}"
        usage
    fi

    validate_type

    # Validate project name (alphanumeric, hyphens, underscores)
    if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo -e "${RED}Error: Project name can only contain letters, numbers, hyphens, and underscores${NC}"
        exit 1
    fi
}

# Determine blueprint source
get_blueprint_path() {
    local category=""

    for type in "${PLAYER_TYPES[@]}"; do
        if [[ "$type" == "$PROJECT_TYPE" ]]; then
            category="players"
            break
        fi
    done

    for type in "${SERVICE_TYPES[@]}"; do
        if [[ "$type" == "$PROJECT_TYPE" ]]; then
            category="services"
            break
        fi
    done

    echo "${BLUEPRINT_BASE}/${category}/${PROJECT_TYPE}/blueprint.md"
}

# Extract code from blueprint
extract_from_blueprint() {
    local blueprint_file="$1"
    local target_dir="$2"

    if [[ ! -f "$blueprint_file" ]]; then
        echo -e "${RED}Error: Blueprint file not found: $blueprint_file${NC}"
        exit 1
    fi

    echo -e "${BLUE}Extracting blueprint to project...${NC}"

    # Parse blueprint and create files
    local in_code_block=false
    local current_file=""
    local file_content=""
    local file_language=""

    while IFS= read -r line; do
        # Check for file path headers
        if [[ "$line" =~ ^###\ Path:\ (.+)$ ]]; then
            # Save previous file if exists
            if [[ -n "$current_file" ]] && [[ -n "$file_content" ]]; then
                create_file "$target_dir" "$current_file" "$file_content"
            fi

            current_file="${BASH_REMATCH[1]}"
            file_content=""
            in_code_block=false
            continue
        fi

        # Check for code block start
        if [[ "$line" =~ ^\`\`\`(.*)$ ]]; then
            if [[ "$in_code_block" == true ]]; then
                # End of code block
                in_code_block=false
            else
                # Start of code block
                in_code_block=true
                file_language="${BASH_REMATCH[1]}"
            fi
            continue
        fi

        # Accumulate file content
        if [[ "$in_code_block" == true ]]; then
            if [[ -z "$file_content" ]]; then
                file_content="$line"
            else
                file_content="$file_content"$'\n'"$line"
            fi
        fi
    done < "$blueprint_file"

    # Save last file if exists
    if [[ -n "$current_file" ]] && [[ -n "$file_content" ]]; then
        create_file "$target_dir" "$current_file" "$file_content"
    fi
}

# Create file with content
create_file() {
    local base_dir="$1"
    local file_path="$2"
    local content="$3"

    local full_path="${base_dir}${file_path}"
    local dir_path=$(dirname "$full_path")

    # Create directory if needed
    mkdir -p "$dir_path"

    # Write file
    echo "$content" > "$full_path"

    if [[ "$VERBOSE" == true ]]; then
        echo -e "  ${GREEN}✓${NC} Created: $file_path"
    fi
}

# Copy subagents
copy_subagents() {
    local target_dir="$1"
    local agents_dir="${target_dir}/.claude/agents"

    echo -e "${BLUE}Copying subagent definitions...${NC}"

    mkdir -p "$agents_dir"

    # Shared agents for all projects
    local shared_agents=("code-monkey" "tester" "product-guy" "api-sdk-expert")

    # Player-specific agents
    local player_agents=("ux-guy" "platform-specialist")

    # Service-specific agents
    local service_agents=("db-manager")

    # Copy shared agents
    for agent in "${shared_agents[@]}"; do
        if [[ -f "${AGENTS_BASE}/${agent}.md" ]]; then
            cp "${AGENTS_BASE}/${agent}.md" "${agents_dir}/"
            if [[ "$VERBOSE" == true ]]; then
                echo -e "  ${GREEN}✓${NC} Copied agent: $agent"
            fi
        fi
    done

    # Copy type-specific agents
    for type in "${PLAYER_TYPES[@]}"; do
        if [[ "$type" == "$PROJECT_TYPE" ]]; then
            for agent in "${player_agents[@]}"; do
                if [[ -f "${AGENTS_BASE}/${agent}.md" ]]; then
                    cp "${AGENTS_BASE}/${agent}.md" "${agents_dir}/"
                    if [[ "$VERBOSE" == true ]]; then
                        echo -e "  ${GREEN}✓${NC} Copied agent: $agent"
                    fi
                fi
            done
            break
        fi
    done

    for type in "${SERVICE_TYPES[@]}"; do
        if [[ "$type" == "$PROJECT_TYPE" ]]; then
            for agent in "${service_agents[@]}"; do
                if [[ -f "${AGENTS_BASE}/${agent}.md" ]]; then
                    cp "${AGENTS_BASE}/${agent}.md" "${agents_dir}/"
                    if [[ "$VERBOSE" == true ]]; then
                        echo -e "  ${GREEN}✓${NC} Copied agent: $agent"
                    fi
                fi
            done
            break
        fi
    done
}

# Initialize git repository
init_git() {
    local target_dir="$1"

    if [[ "$INIT_GIT" == true ]]; then
        echo -e "${BLUE}Initializing git repository...${NC}"
        cd "$target_dir"
        git init --quiet
        git add .
        git commit -m "Initial commit: $PROJECT_TYPE project from blueprint" --quiet
        echo -e "${GREEN}✓${NC} Git repository initialized"
    fi
}

# Install dependencies
install_dependencies() {
    local target_dir="$1"

    if [[ "$INSTALL_DEPS" == true ]]; then
        echo -e "${BLUE}Installing dependencies...${NC}"
        cd "$target_dir"

        # Check for package.json (Node.js projects)
        if [[ -f "package.json" ]]; then
            if command -v npm &> /dev/null; then
                npm install
                echo -e "${GREEN}✓${NC} npm dependencies installed"
            else
                echo -e "${YELLOW}⚠${NC} npm not found, skipping dependency installation"
            fi
        fi

        # Check for requirements.txt (Python projects)
        if [[ -f "requirements.txt" ]]; then
            if command -v pip &> /dev/null; then
                pip install -r requirements.txt
                echo -e "${GREEN}✓${NC} Python dependencies installed"
            else
                echo -e "${YELLOW}⚠${NC} pip not found, skipping dependency installation"
            fi
        fi

        # Check for Podfile (iOS projects)
        if [[ -f "Podfile" ]]; then
            if command -v pod &> /dev/null; then
                pod install
                echo -e "${GREEN}✓${NC} CocoaPods dependencies installed"
            else
                echo -e "${YELLOW}⚠${NC} CocoaPods not found, skipping dependency installation"
            fi
        fi

        # Check for build.gradle (Android projects)
        if [[ -f "build.gradle" ]] || [[ -f "build.gradle.kts" ]]; then
            echo -e "${YELLOW}ℹ${NC} Android project detected. Open in Android Studio to sync dependencies."
        fi
    fi
}

# Main execution
main() {
    validate_inputs

    # Create full project path
    local full_project_path="${PROJECT_PATH}/${PROJECT_NAME}"

    # Check if directory exists
    if [[ -d "$full_project_path" ]]; then
        echo -e "${RED}Error: Directory already exists: $full_project_path${NC}"
        exit 1
    fi

    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}     Video Player Project Initializer${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Project Type: ${BLUE}$PROJECT_TYPE${NC}"
    echo -e "Project Name: ${BLUE}$PROJECT_NAME${NC}"
    echo -e "Project Path: ${BLUE}$full_project_path${NC}"
    echo ""

    # Create project directory
    echo -e "${BLUE}Creating project directory...${NC}"
    mkdir -p "$full_project_path"

    # Get blueprint path
    local blueprint_path=$(get_blueprint_path)

    # Extract blueprint
    extract_from_blueprint "$blueprint_path" "$full_project_path"

    # Copy subagents
    copy_subagents "$full_project_path"

    # Initialize git
    init_git "$full_project_path"

    # Install dependencies
    install_dependencies "$full_project_path"

    # Success message
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✨ Project created successfully!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. cd $full_project_path"

    case "$PROJECT_TYPE" in
        web-player)
            echo "  2. npm run dev"
            echo "  3. Open http://localhost:3000"
            ;;
        ios-player)
            echo "  2. open *.xcodeproj in Xcode"
            echo "  3. Build and run on simulator"
            ;;
        android-player)
            echo "  2. Open in Android Studio"
            echo "  3. Sync project and run"
            ;;
        *-service)
            echo "  2. docker-compose up"
            echo "  3. Check service at configured port"
            ;;
    esac

    echo ""
    echo "Read CLAUDE.md for detailed documentation."
}

# Run main function
main