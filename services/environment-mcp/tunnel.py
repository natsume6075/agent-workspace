#!/usr/bin/env python3
"""Foreground Secure MCP Tunnel; prompt secrets locally without persisting them."""
import argparse
import getpass
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import urllib.request
import warnings


def configuration(root, node, tunnel_id, remote_agent=False):
    # The MCP child does not need the tunnel credential.
    entrypoint = root.parent / "remote-agent/server.mjs" if remote_agent else root / "server.mjs"
    command = shlex.join(["/usr/bin/env", "-u", "CONTROL_PLANE_API_KEY", node, str(entrypoint)])
    return {
        "config_version": 1,
        "control_plane": {
            "base_url": "https://api.openai.com", "tunnel_id": tunnel_id,
            "api_key": "env:CONTROL_PLANE_API_KEY",
        },
        "health": {"listen_addr": "127.0.0.1:0", "url_file": str(root / ".local/health.url")},
        "admin_ui": {"open_browser": False},
        "log": {"level": "info", "format": "json"},
        "mcp": {"commands": [{"channel": "main", "command": command}]},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--doctor-only", action="store_true", help="Validate without starting the foreground daemon")
    parser.add_argument("--status", action="store_true", help="Check the running tunnel's loopback /readyz endpoint")
    parser.add_argument("--remote-agent", action="store_true", help="Opt in to task delegation, file editing and agent execution (keeps the environment tool)")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    if args.status:
        try:
            url = (root / ".local/health.url").read_text().strip()
            if not re.fullmatch(r"http://127\.0\.0\.1:[0-9]+", url):
                raise ValueError("Unexpected health URL")
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(url + "/readyz", timeout=5) as response:
                if response.status != 200:
                    raise ValueError("Not ready")
            print("Tunnel /readyz: HTTP 200. Local admin UI: " + url + "/ui")
        except (OSError, ValueError):
            raise SystemExit("Tunnel is not ready. Check the foreground terminal.") from None
        return
    binary = root / ".local/bin/tunnel-client"
    node = shutil.which("node")
    if not binary.is_file() or not node:
        raise SystemExit("Run install-tunnel.py and make Node available on PATH first.")
    service_root = root.parent / "remote-agent" if args.remote_agent else root
    if not (service_root / "node_modules/@modelcontextprotocol/sdk").is_dir():
        raise SystemExit("Run npm ci --ignore-scripts --no-audit --no-fund first.")
    tunnel_id = input("Tunnel ID (not an API key): ").strip()
    if not re.fullmatch(r"tunnel_[A-Za-z0-9_-]+", tunnel_id):
        raise SystemExit("Invalid tunnel ID")
    # getpass must not fall back to echoed stdin when no controlling terminal exists.
    if not os.isatty(0):
        raise SystemExit("Run this script in an interactive WSL terminal.")
    with warnings.catch_warnings():
        warnings.simplefilter("error", getpass.GetPassWarning)
        try:
            key = getpass.getpass("Runtime API key (hidden, never saved): ").strip()
        except getpass.GetPassWarning:
            raise SystemExit("Secure hidden input is unavailable; use an interactive WSL terminal.") from None
    if not key:
        raise SystemExit("No key entered")
    runtime_env = {key: os.environ[key] for key in ("PATH", "HOME", "LANG", "SSL_CERT_FILE", "SSL_CERT_DIR", "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY") if key in os.environ}
    runtime_env["CONTROL_PLANE_API_KEY"] = key
    os.umask(0o077)
    path = root / ".local/tunnel-config.json"
    path.write_text(json.dumps(configuration(root, node, tunnel_id, args.remote_agent), indent=2) + "\n")
    if args.remote_agent:
        print("Remote agent mode: this tunnel accepts tasks that can edit workspace files. Existing approvals still apply.", flush=True)
    print("Checking tunnel configuration. No API key is stored in the config.", flush=True)
    try:
        result = subprocess.run([str(binary), "doctor", "--config", str(path), "--explain"], env=runtime_env, timeout=60)
    except subprocess.TimeoutExpired:
        raise SystemExit("Doctor timed out; check network and tunnel permissions.") from None
    if result.returncode:
        raise SystemExit(result.returncode)
    if args.doctor_only:
        return
    (root / ".local/health.url").unlink(missing_ok=True)
    print("Starting foreground tunnel. Keep this terminal open; Ctrl+C stops it.", flush=True)
    print("Health URL is written to .local/health.url. Verify /readyz before ChatGPT registration.", flush=True)
    os.execve(binary, [str(binary), "run", "--config", str(path)], runtime_env)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        raise SystemExit(130) from None
