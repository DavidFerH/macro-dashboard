"""Best-effort retrieval of our last public snapshot for partial-source fallback."""
import os
from pathlib import Path

import httpx

from pipeline.build import validate_snapshot

repository = os.environ.get("GITHUB_REPOSITORY", "DavidFerH/macro-dashboard")
owner, name = repository.split("/")
destination = Path(".local/previous.json")
try:
    response = httpx.get(f"https://{owner.lower()}.github.io/{name}/data/snapshot.json", timeout=30)
    response.raise_for_status()
    snapshot = response.json()
    validate_snapshot(snapshot)
    if snapshot["mode"] != "live":
        raise ValueError("Demo fallback is not allowed")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(response.content)
    print("Previous public snapshot validated.")
except (httpx.HTTPError, ValueError):
    print("No previous snapshot available; this run requires fresh critical series.")
