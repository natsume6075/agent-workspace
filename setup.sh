#!/usr/bin/env bash
# Called from setup/linux/setup.sh when agent-workspace is selected in AppsToSetup.
# May also be run directly from a cloned agent-workspace repository.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

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
echo "Next: open a new shell, cd into your agent-workspace clone, run 'codex login', then 'codex'."
echo "Project instructions, tasks and handoff are tracked in this repository."
