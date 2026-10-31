import importlib.util
from pathlib import Path
import shlex
import unittest

root = Path(__file__).resolve().parents[2] / "environment-mcp"
spec = importlib.util.spec_from_file_location("tunnel", root / "tunnel.py")
tunnel = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tunnel)


class TunnelTest(unittest.TestCase):
    def test_existing_entrypoint_is_default_and_agent_mode_is_explicit(self):
        for remote in (False, True):
            config = tunnel.configuration(root, "/node with spaces", "tunnel_test", remote)
            args = shlex.split(config["mcp"]["commands"][0]["command"])
            self.assertEqual(args[:4], ["/usr/bin/env", "-u", "CONTROL_PLANE_API_KEY", "/node with spaces"])
            self.assertEqual(Path(args[-1]), root.parent / "remote-agent/server.mjs" if remote else root / "server.mjs")
            self.assertEqual(config["control_plane"]["api_key"], "env:CONTROL_PLANE_API_KEY")
            self.assertEqual(config["health"]["listen_addr"], "127.0.0.1:0")


if __name__ == "__main__":
    unittest.main()
