#!/usr/bin/env bash
# Called from setup/linux/setup.sh when agent-workspace is selected in AppsToSetup.
# May also be run directly from a cloned agent-workspace repository.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

# Create the user-facing shortcut before installing dependencies, so failures
# during Node/Codex setup cannot silently prevent the shortcut from existing.
DEFAULT_WORKSPACE_LINK="$HOME/agent-workspace"
read -r -p "Workspace shortcut path [$DEFAULT_WORKSPACE_LINK]: " WORKSPACE_LINK
WORKSPACE_LINK="${WORKSPACE_LINK:-$DEFAULT_WORKSPACE_LINK}"
case "$WORKSPACE_LINK" in
    "~") WORKSPACE_LINK="$HOME" ;;
    "~/"*) WORKSPACE_LINK="$HOME/${WORKSPACE_LINK#\~/}" ;;
    /*) ;;
    *) WORKSPACE_LINK="$HOME/$WORKSPACE_LINK" ;;
esac

# Create parent directories, not the link itself; canonicalize before comparison.
mkdir -p -- "$(dirname -- "$WORKSPACE_LINK")"
LINK_PARENT="$(cd -- "$(dirname -- "$WORKSPACE_LINK")" && pwd -P)"
WORKSPACE_LINK="$LINK_PARENT/$(basename -- "$WORKSPACE_LINK")"
if [ -e "$WORKSPACE_LINK" ] || [ -L "$WORKSPACE_LINK" ]; then
    if [ -L "$WORKSPACE_LINK" ] && [ "$(realpath -e -- "$WORKSPACE_LINK" 2>/dev/null || true)" = "$SCRIPT_DIR" ]; then
        echo "Workspace shortcut already exists: $WORKSPACE_LINK"
    elif [ "$WORKSPACE_LINK" = "$SCRIPT_DIR" ]; then
        echo "Workspace is already at the chosen path; no shortcut needed: $WORKSPACE_LINK"
    else
        echo "Workspace path already exists and points elsewhere; leaving it untouched: $WORKSPACE_LINK" >&2
        exit 1
    fi
else
    ln -s -- "$SCRIPT_DIR" "$WORKSPACE_LINK"
fi

if [ "$(realpath -e -- "$WORKSPACE_LINK")" != "$SCRIPT_DIR" ]; then
    echo "Workspace shortcut verification failed: $WORKSPACE_LINK" >&2
    exit 1
fi
echo "Workspace path verified: $WORKSPACE_LINK -> $SCRIPT_DIR"

sudo apt-get update
sudo apt-get install -y curl ca-certificates

# Install Node.js LTS without changing the system's Node installation.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm alias default 'lts/*'
nvm use --lts

npm install -g @openai/codex@latest


echo
echo "Codex installed: $(codex --version)"
echo "Workspace: $SCRIPT_DIR"
echo "Next: open a new shell, cd \"$WORKSPACE_LINK\", run 'codex login', then 'codex'."
echo "Project instructions, tasks and handoff are tracked in this repository."
