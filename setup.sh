#!/usr/bin/env bash
# Called from setup/linux/setup.sh when agent-workspace is selected in AppsToSetup.
# May also be run directly from a cloned agent-workspace repository.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

# Keep diagnostics beside this script; save files only on failure.
LOG_DIRECTORY="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIRECTORY/setup-$(date +%Y%m%d-%H%M%S)-$.log"
INSTALL_STAGE="initialization"
OnFailure() {
    local status=$? line="${BASH_LINENO[0]}"
    trap - ERR
    mkdir -p -m 700 -- "$LOG_DIRECTORY" || true
    ( umask 077; printf '[%s] FAIL stage=%s line=%s exit=%s\n' "$(date -Is)" "$INSTALL_STAGE" "$line" "$status" >> "$LOG_FILE" ) || true
    printf 'FAILED: %s (exit %s). Diagnostics: %s\n' "$INSTALL_STAGE" "$status" "$LOG_FILE" >&2
    exit "$status"
}
trap OnFailure ERR


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

INSTALL_STAGE="system dependencies"
sudo apt-get update
sudo apt-get install -y curl ca-certificates

# Install Node.js LTS without changing the system's Node installation.
INSTALL_STAGE="nvm / Node.js"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm alias default 'lts/*'
nvm use --lts

INSTALL_STAGE="Codex npm installation"
# npm output helps diagnose registry/network failures, but persistent logs are
# written only on failure. Do not let a successful status message hide errors.
NPM_CAPTURE="$(mktemp)"
if npm install -g @openai/codex@latest > "$NPM_CAPTURE" 2>&1; then
    cat -- "$NPM_CAPTURE"
    rm -f -- "$NPM_CAPTURE"
else
    status=$?
    cat -- "$NPM_CAPTURE" >&2
    mkdir -p -m 700 -- "$LOG_DIRECTORY"
    ( umask 077; {
        printf '[%s] FAIL Codex npm installation (exit=%s)\n' "$(date -Is)" "$status"
        cat -- "$NPM_CAPTURE"
    } >> "$LOG_FILE" )
    rm -f -- "$NPM_CAPTURE"
    exit "$status"
fi

INSTALL_STAGE="Codex verification"
# The setup process must be able to invoke the installed CLI with nvm loaded.
command -v codex >/dev/null
codex --version
npm list -g --depth=0 @openai/codex >/dev/null


echo
echo "Codex verified: $(codex --version)"
echo "Workspace: $SCRIPT_DIR"
echo "Next: open a new zsh shell (nvm must be initialized), cd \"$WORKSPACE_LINK\", run 'codex login', then 'codex'."
echo "Project instructions, tasks and handoff are tracked in this repository."
