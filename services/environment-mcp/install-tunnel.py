#!/usr/bin/env python3
"""Install official latest tunnel-client locally, checking the release digest."""
import hashlib
import io
import json
import platform
from pathlib import Path
import urllib.request
import zipfile

root = Path(__file__).resolve().parent
machine = {"x86_64": "amd64", "aarch64": "arm64"}.get(platform.machine())
if platform.system() != "Linux" or not machine:
    raise SystemExit("This installer supports Linux amd64/arm64 only.")

def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "agent-workspace-environment-mcp"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()

release = json.loads(fetch("https://api.github.com/repos/openai/tunnel-client/releases/latest"))
name = f"tunnel-client-{release['tag_name']}-linux-{machine}.zip"
asset = next(item for item in release["assets"] if item["name"] == name)
url = asset["browser_download_url"]
if not url.startswith("https://github.com/openai/tunnel-client/releases/download/"):
    raise SystemExit("Unexpected release URL")
data = fetch(url)
digest = "sha256:" + hashlib.sha256(data).hexdigest()
if asset.get("digest") != digest:
    raise SystemExit("Release SHA-256 mismatch or missing digest; refusing installation")
with zipfile.ZipFile(io.BytesIO(data)) as archive:
    entry = next(item for item in archive.namelist() if Path(item).name == "tunnel-client")
    target = root / ".local/bin/tunnel-client"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(archive.read(entry))
    target.chmod(0o700)
receipt = {"release": release["tag_name"], "asset": name, "sha256": digest}
(root / ".local/tunnel-release.json").write_text(json.dumps(receipt, indent=2) + "\n")
print(f"Installed {release['tag_name']} with verified SHA-256 under .local/bin/")
