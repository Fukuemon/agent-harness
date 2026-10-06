#!/usr/bin/env python3
"""Print a GitLab or GitHub blob URL for a file (and line range) in the current git repository.

The host, repository path and commit SHA come from git, so the link keeps
pointing at the same lines after the branch moves.

Usage:
  blob_link.py <path> [<start>[-<end>]] [--remote origin] [--ref <commit>]

Exit codes:
  0  printed the URL
  1  git failed (not a repository, unknown remote or ref, path outside the repository)
  2  bad arguments
  3  printed the URL, but the commit is not on any remote-tracking branch, so the link may 404
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote


def git(*args: str, cwd: Path) -> str:
    return subprocess.run(
        ["git", *args], cwd=cwd, check=True, capture_output=True, text=True
    ).stdout.strip()


def web_base(remote_url: str) -> tuple[str, str]:
    """Return (https base URL, host) for ssh://, scp-like and http(s) remote URLs."""
    url = remote_url.strip()
    m = re.match(r"^(?:ssh|git)://(?:[^@/]+@)?([^/:]+)(?::\d+)?/(.+)$", url)
    if not m:
        m = re.match(r"^https?://(?:[^@/]+@)?([^/]+)/(.+)$", url)
    if not m:
        m = re.match(r"^(?:[^@/]+@)?([^/:]+):(.+)$", url)
    if not m:
        raise ValueError(f"unsupported remote URL: {remote_url}")
    host, path = m.group(1), m.group(2)
    path = re.sub(r"\.git/?$", "", path).strip("/")
    return f"https://{host}/{path}", host


def build_url(base: str, host: str, sha: str, rel: str, start: int | None, end: int | None) -> str:
    github = "github" in host.lower()
    url = f"{base}/blob/{sha}/{quote(rel)}" if github else f"{base}/-/blob/{sha}/{quote(rel)}"
    if start is None:
        return url
    if end is None or end == start:
        return f"{url}#L{start}"
    return f"{url}#L{start}-L{end}" if github else f"{url}#L{start}-{end}"


def parse_lines(value: str | None) -> tuple[int | None, int | None]:
    if value is None:
        return None, None
    m = re.fullmatch(r"(\d+)(?:-(\d+))?", value)
    if not m:
        raise argparse.ArgumentTypeError(f"lines must be N or N-M: {value}")
    start, end = int(m.group(1)), int(m.group(2)) if m.group(2) else None
    if end is not None and end < start:
        raise argparse.ArgumentTypeError(f"end line is before start line: {value}")
    return start, end


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("path", help="file path (absolute or relative to the current directory)")
    parser.add_argument("lines", nargs="?", help="line or range, e.g. 12 or 12-30")
    parser.add_argument("--remote", default="origin", help="git remote to take the host from")
    parser.add_argument("--ref", default="HEAD", help="commit to link to (resolved to a full SHA)")
    args = parser.parse_args()
    try:
        start, end = parse_lines(args.lines)
    except argparse.ArgumentTypeError as e:
        parser.error(str(e))

    target = Path(args.path).resolve()
    cwd = target.parent if target.is_file() else target
    try:
        root = Path(git("rev-parse", "--show-toplevel", cwd=cwd))
        rel = target.relative_to(root).as_posix()
        sha = git("rev-parse", "--verify", f"{args.ref}^{{commit}}", cwd=root)
        base, host = web_base(git("remote", "get-url", args.remote, cwd=root))
        pushed = git("branch", "-r", "--contains", sha, cwd=root)
    except (subprocess.CalledProcessError, ValueError, OSError) as e:
        detail = e.stderr.strip() if isinstance(e, subprocess.CalledProcessError) else str(e)
        print(f"blob_link: {detail}", file=sys.stderr)
        return 1

    print(build_url(base, host, sha, rel, start, end))
    if not pushed:
        print(f"blob_link: {sha} is not on any remote-tracking branch", file=sys.stderr)
        return 3
    return 0


def _selftest() -> None:
    assert web_base("ssh://git@gitlab.example.com:11022/grp/sub/repo.git") == ("https://gitlab.example.com/grp/sub/repo", "gitlab.example.com")
    assert web_base("git@github.com:owner/repo.git") == ("https://github.com/owner/repo", "github.com")
    assert web_base("https://github.com/owner/repo") == ("https://github.com/owner/repo", "github.com")
    assert build_url("https://gitlab.example.com/g/r", "gitlab.example.com", "abc", "src/a b.ts", 3, 9) == "https://gitlab.example.com/g/r/-/blob/abc/src/a%20b.ts#L3-9"
    assert build_url("https://github.com/o/r", "github.com", "abc", "a.py", 3, 9) == "https://github.com/o/r/blob/abc/a.py#L3-L9"
    assert build_url("https://github.com/o/r", "github.com", "abc", "a.py", 3, None) == "https://github.com/o/r/blob/abc/a.py#L3"


if __name__ == "__main__":
    if sys.argv[1:] == ["--selftest"]:
        _selftest()
        print("ok")
        sys.exit(0)
    sys.exit(main())
