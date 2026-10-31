#!/usr/bin/env python3
"""Delete only reviewed, unchanged branches that are ancestors of the current base.

Dry run by default. Requires the human's authenticated GitHub CLI.
"""
import argparse
import json
import subprocess
from pathlib import Path
from urllib.parse import quote

def gh(*args):
    return subprocess.check_output(['gh', *args], text=True).strip()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    assert gh('api', 'user', '--jq', '.login') == 'natsume6075', 'Wrong GitHub account'
    manifest = Path(__file__).with_name('merged-branches-20261101.json')
    candidates = json.loads(manifest.read_text())
    approved = []
    for item in candidates:
        repo, branch = item['repo'], item['branch']
        default = gh('api', f'repos/{repo}', '--jq', '.default_branch')
        assert branch not in [default, 'main', 'master'], 'Refusing to delete a primary branch'
        current = json.loads(gh('api', f'repos/{repo}/git/ref/heads/{quote(branch, safe="")}'))
        assert current['object']['sha'] == item['sha'], f'Branch moved: {repo}:{branch}'
        compare = json.loads(gh('api', f'repos/{repo}/compare/{item["base"]}...{item["sha"]}'))
        assert compare['ahead_by'] == 0, f'Unmerged commits: {repo}:{branch}'
        approved.append(item)
        print('MERGED', repo, branch, item['sha'])
    if not args.apply:
        print(f'Dry run: {len(approved)} branches eligible. Use --apply to delete.')
        return
    for item in approved:
        repo, branch = item['repo'], item['branch']
        # Check again immediately before deleting; stop if anyone updated the branch.
        current = json.loads(gh('api', f'repos/{repo}/git/ref/heads/{quote(branch, safe="")}'))
        assert current['object']['sha'] == item['sha'], f'Branch moved: {repo}:{branch}'
        gh('api', '--method', 'DELETE', f'repos/{repo}/git/refs/heads/{quote(branch, safe="")}')
        print('DELETED', repo, branch)

if __name__ == '__main__':
    main()
