"""Build a public, validated snapshot. Never log request URLs containing API keys."""
from __future__ import annotations

import argparse
import copy
import json
import math
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from jsonschema import Draft7Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / "contracts/sources.json").read_text(encoding="utf-8"))
SCHEMA = json.loads((ROOT / "contracts/snapshot.schema.json").read_text(encoding="utf-8"))
CRITICAL = {"DGS10", "PCEPILFE", "UNRATE", "PAYEMS", "ICSA", "A191RL1Q225SBEA"}


def validate_snapshot(snapshot: dict) -> None:
    Draft7Validator(SCHEMA, format_checker=FormatChecker()).validate(snapshot)
    for key, series in snapshot["series"].items():
        if key != series["id"]:
            raise ValueError("Series ID mismatch")
        if snapshot["mode"] == "live" and series["status"] == "demo":
            raise ValueError("Demo observations cannot be published as live")
        if series["status"] == "unavailable" and series["observations"]:
            raise ValueError("Unavailable series cannot contain observations")
        previous = ""
        for point in series["observations"]:
            if point["date"] <= previous or point["date"] > snapshot["generatedAt"][:10]:
                raise ValueError("Duplicate, unordered or future observation")
            if point["value"] is not None and not math.isfinite(point["value"]):
                raise ValueError("Non-finite observation")
            previous = point["date"]


def blank_series(source: dict) -> dict:
    return {**{k: source[k] for k in ("id", "name", "unit", "frequency", "provider", "url")},
            **{k: source[k] for k in ("attribution", "notes") if k in source},
            "status": "unavailable", "fetchedAt": None, "observations": [],
            "reasonCode": source.get("reasonCode", "not_downloaded"),
            "reason": source.get("reason", "Fuente todavía no descargada.")}


def normalize_observations(rows: list[dict]) -> list[dict]:
    points = {}
    for row in rows:
        day = date.fromisoformat(row["date"]).isoformat()
        raw = row["value"]
        value = None if raw in (None, "", ".") else float(raw)
        if value is not None and not math.isfinite(value):
            raise ValueError("Invalid numeric observation")
        if day in points:
            raise ValueError("Duplicate source date")
        points[day] = value
    return [{"date": day, "value": value} for day, value in sorted(points.items())]


def get_json(client: httpx.Client, endpoint: str, params: dict) -> dict:
    for attempt in range(3):
        try:
            response = client.get("https://api.stlouisfed.org/fred/" + endpoint, params=params)
            if response.status_code == 429 or response.status_code >= 500:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
            response.raise_for_status()
            return response.json()
        except httpx.TransportError:
            if attempt == 2:
                raise RuntimeError("FRED network unavailable") from None
            time.sleep(2 ** attempt)
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(f"FRED HTTP {exc.response.status_code}") from None
    raise RuntimeError("FRED retries exhausted")


def acquire_series(source: dict, client: httpx.Client, key: str, now: str, previous: dict) -> dict:
    result = blank_series(source)
    if not source["enabled"] or source["provider"] != "FRED":
        return result
    try:
        response = get_json(client, "series/observations", {
            "api_key": key, "file_type": "json", "series_id": source["id"],
            "observation_start": "1900-01-01", "observation_end": now[:10], "limit": 100000,
        })
        points = normalize_observations(response["observations"])
        if not any(p["value"] is not None for p in points):
            raise ValueError("No numeric observations")
        if int(response.get("count", len(points))) > len(points):
            raise ValueError("Truncated observations")
        result.update(observations=points, fetchedAt=now, status="ok")
        result.pop("reason", None)
        result.pop("reasonCode", None)
    except (RuntimeError, ValueError, KeyError):
        # Only accept a previously validated real series, never a demo fallback.
        old = previous.get(source["id"])
        if old and old["status"] in ("ok", "stale") and old["observations"]:
            result.update(observations=copy.deepcopy(old["observations"]), fetchedAt=old["fetchedAt"])
            result.update(status="stale", reason="Falló la actualización; se conserva la última descarga válida.")
        else:
            result["reason"] = "No se pudo obtener la serie de FRED."
        result["reasonCode"] = "download_failed"
        print(f"WARNING {source['id']}: unavailable or retained; no credentials logged")
    return result


def acquire_calendar(client: httpx.Client, key: str, today: date) -> list[dict]:
    releases = {
        10: ("IPC", 3), 50: ("Empleo", 3), 54: ("Renta, consumo y PCE", 3),
        53: ("PIB", 2), 9: ("Ventas minoristas", 2), 180: ("Solicitudes de desempleo", 2),
        192: ("Vacantes JOLTS", 2),
    }
    end = today + timedelta(days=14)
    events = []
    offset = 0
    while True:
        payload = get_json(client, "releases/dates", {
            "api_key": key, "file_type": "json", "realtime_start": today.isoformat(),
            "realtime_end": end.isoformat(), "include_release_dates_with_no_data": "true",
            "sort_order": "asc", "limit": 1000, "offset": offset,
        })
        rows = payload.get("release_dates", [])
        for row in rows:
            release_id = row["release_id"]
            if release_id in releases and today.isoformat() <= row["date"] < end.isoformat():
                title, importance = releases[release_id]
                events.append({"id": f"{release_id}-{row['date']}", "title": title, "date": row["date"],
                               "time": None, "importance": importance,
                               "url": f"https://fred.stlouisfed.org/release?rid={release_id}"})
        offset += len(rows)
        if not rows or offset >= payload.get("count", offset):
            break
    return list({event["id"]: event for event in events}.values())


def demo_snapshot(today: date = date(2026, 9, 1)) -> dict:
    """Synthetic, deterministic fixture: never an automatic live-data fallback."""
    snapshot = {"schemaVersion": 1, "mode": "demo", "generatedAt": today.isoformat() + "T12:00:00Z",
                "series": {}, "events": [], "calendarStatus": "demo"}
    levels = {"PAYEMS": 135000, "ICSA": 230000, "UNEMPLOY": 6500, "JTSJOL": 8000,
              "WALCL": 7000000, "GDP": 20000, "NCBEILQ027S": 42000000, "TNWMVBSNNCB": 30000000,
              "CPATAX": 2500, "SH_P": 2500, "SH_E": 100, "SH_D": 45, "SH_CPI": 240,
              "SH_CAPE": 26, "SH_TRCAPE": 25, "SH_GS10": 3.5, "DEXUSEU": 1.1,
              "HOUST": 1400, "PERMIT": 1450, "AWHAETP": 34.5, "AWHMAN": 40.5,
              "VIXCLS": 19, "SP500": 4000, "BOGZ1FL153064486Q": 35, "GASREGW": 3.4,
              "DCOILWTICO": 70, "UNRATE": 4.2, "SAHMREALTIME": .2,
              "BAMLH0A0HYM2": 3.5, "BAMLC0A0CM": 1.2, "BAMLC0A4CBBB": 1.5}
    for index, source in enumerate(SOURCES):
        series = blank_series(source)
        series.update(status="demo", fetchedAt=snapshot["generatedAt"], reason="Serie sintética para pruebas.")
        series.pop("reasonCode", None)
        step = 1 if source["frequency"] == "daily" else 7 if source["frequency"] == "weekly" else 0
        cursor = date(2000, 1, 1)
        points = []
        while cursor <= today:
            t = (cursor - date(2000, 1, 1)).days / 365.25
            wave = math.sin(t * 1.35 + index * .6)
            base = levels.get(source["id"], 3.2 if source["unit"] in ("%", "pp") else 150)
            if source["id"] in ("NFCI", "CFNAI", "CFNAIMA3", "T10Y3M", "T10Y2Y", "THREEFYTP10"):
                value = wave * .6
            elif source["id"].startswith("ISM"):
                value = 51 + wave * 5
            elif source["id"] in ("GACDISA066MSFRBNY", "GACDFSA066MSFRBPHI"):
                value = 4 + wave * 15
            elif source["id"] == "PAYEMS":
                value = base + t * 1650 + wave * 250
            elif source["unit"] == "índice" or source["id"] in ("SH_P", "SH_E", "SH_D", "SH_CPI", "RSAFS", "GDP"):
                value = base * math.exp(.025 * t) * (1 + wave * .009)
            else:
                value = base * (1 + wave * .12)
            if source["frequency"] != "daily" or cursor.weekday() < 5:
                points.append({"date": cursor.isoformat(), "value": round(value, 5)})
            if step:
                cursor += timedelta(days=step)
            else:
                increment = 3 if source["frequency"] == "quarterly" else 1
                month = cursor.month - 1 + increment
                cursor = date(cursor.year + month // 12, month % 12 + 1, 1)
        series["observations"] = points
        snapshot["series"][source["id"]] = series
    return snapshot


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--demo", action="store_true")
    parser.add_argument("--output", type=Path, default=ROOT / "public/data/snapshot.json")
    parser.add_argument("--previous", type=Path)
    args = parser.parse_args()
    load_dotenv(ROOT / ".env")
    if args.demo:
        snapshot = demo_snapshot()
    else:
        key = os.getenv("FRED_API_KEY", "")
        if not re.fullmatch(r"[a-z0-9]{32}", key):
            print("FRED_API_KEY ausente o inválida. Configúrala en .env; no la publiques.", file=sys.stderr)
            return 2
        previous_snapshot = None
        previous_path = args.previous or args.output
        if previous_path.exists():
            previous_snapshot = json.loads(previous_path.read_text(encoding="utf-8"))
            validate_snapshot(previous_snapshot)
            if previous_snapshot["mode"] != "live":
                previous_snapshot = None
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        snapshot = {"schemaVersion": 1, "mode": "live", "generatedAt": now,
                    "series": {}, "events": [], "calendarStatus": "unavailable"}
        with httpx.Client(timeout=30, follow_redirects=False) as client:
            previous = previous_snapshot["series"] if previous_snapshot else {}
            with ThreadPoolExecutor(max_workers=3) as pool:
                for series in pool.map(lambda source: acquire_series(source, client, key, now, previous), SOURCES):
                    snapshot["series"][series["id"]] = series
            try:
                snapshot["events"] = acquire_calendar(client, key, date.fromisoformat(now[:10]))
                snapshot["calendarStatus"] = "ok"
            except (RuntimeError, ValueError, KeyError):
                if previous_snapshot:
                    snapshot["events"] = previous_snapshot["events"]
                    snapshot["calendarStatus"] = "stale"
            from pipeline.fomc import URL as FOMC_URL, parse_calendar
            try:
                calendar_response = client.get(FOMC_URL)
                calendar_response.raise_for_status()
                fomc_events = parse_calendar(calendar_response.text, date.fromisoformat(now[:10]))
                snapshot["events"] = [e for e in snapshot["events"] if not e["id"].startswith("fomc-")] + fomc_events
            except (httpx.HTTPError, ValueError):
                if snapshot["calendarStatus"] == "ok":
                    snapshot["calendarStatus"] = "partial"
                print("WARNING FOMC: calendar unavailable")
        from pipeline.shiller import acquire_shiller
        snapshot["series"].update(acquire_shiller(
            now, previous, approved=os.getenv("SHILLER_PUBLICATION_APPROVED") == "true",
            local_file=os.getenv("SHILLER_FILE") or None,
        ))
        if any(not snapshot["series"][key]["observations"] for key in CRITICAL):
            print("No se publica: faltan series críticas. Se conserva el archivo anterior.", file=sys.stderr)
            return 3
        if not any(s["status"] == "ok" for s in snapshot["series"].values()):
            print("No se publica: ninguna fuente actualizada.", file=sys.stderr)
            return 3
    validate_snapshot(snapshot)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(".tmp")
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    temporary.replace(args.output)
    counts = {status: sum(s["status"] == status for s in snapshot["series"].values())
              for status in ("ok", "stale", "unavailable", "demo")}
    print(json.dumps({"mode": snapshot["mode"], "series": counts, "calendar": snapshot["calendarStatus"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
