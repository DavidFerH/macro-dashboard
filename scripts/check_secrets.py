"""Check the staged source and public build without printing credential values."""
import re
import subprocess
from pathlib import Path

from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]
key = dotenv_values(ROOT / ".env").get("FRED_API_KEY")
listed = subprocess.run(
    ["git", "-c", f"safe.directory={ROOT.as_posix()}", "ls-files", "--cached", "-z"],
    cwd=ROOT, capture_output=True, check=True,
).stdout.decode().split("\0")
files = [ROOT / name for name in listed if name]
files += [path for path in (ROOT / "dist").rglob("*") if path.is_file()]
violations = []
for path in files:
    content = path.read_bytes()
    if (key and key.encode() in content) or re.search(rb"FRED_API_KEY\s*=\s*[a-z0-9]{32}", content):
        violations.append(path.relative_to(ROOT).as_posix())
    if path.name == ".env" or (path.name.startswith(".env.") and path.name != ".env.example"):
        violations.append(path.relative_to(ROOT).as_posix())
if violations:
    raise SystemExit("Secret check failed in: " + ", ".join(sorted(set(violations))))
print(f"Secret check passed: {len(files)} staged/public files; credential values not printed.")
