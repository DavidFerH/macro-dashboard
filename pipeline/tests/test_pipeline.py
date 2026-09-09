import copy
from datetime import date
from unittest.mock import Mock

import httpx
import pytest
from jsonschema import ValidationError

from pipeline.build import SOURCES, acquire_series, blank_series, demo_snapshot, get_json, normalize_observations, validate_snapshot
from pipeline.shiller import parse_rows


def minimal():
    source = next(s for s in SOURCES if s["id"] == "DGS10")
    series = blank_series(source)
    series.update(status="ok", fetchedAt="2026-09-09T12:00:00Z",
                  observations=[{"date": "2026-09-01", "value": 4.0}])
    return {"schemaVersion": 1, "mode": "live", "generatedAt": "2026-09-09T12:00:00Z",
            "series": {"DGS10": series}, "events": [], "calendarStatus": "ok"}


def test_contract_valid():
    validate_snapshot(minimal())


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -float("inf")])
def test_reject_nonfinite(value):
    snapshot = minimal()
    snapshot["series"]["DGS10"]["observations"][0]["value"] = value
    with pytest.raises((ValueError, ValidationError)):
        validate_snapshot(snapshot)


def test_reject_duplicate_future_and_demo():
    for mutate in [
        lambda s: s["observations"].append(s["observations"][0]),
        lambda s: s["observations"][0].update(date="2027-01-01"),
        lambda s: s.update(status="demo"),
    ]:
        snapshot = minimal()
        mutate(snapshot["series"]["DGS10"])
        with pytest.raises(ValueError):
            validate_snapshot(snapshot)


def test_normalization_preserves_nulls_and_sorts():
    assert normalize_observations([{"date": "2025-01-02", "value": "."}, {"date": "2025-01-01", "value": "2.5"}]) == [
        {"date": "2025-01-01", "value": 2.5}, {"date": "2025-01-02", "value": None}]


def test_duplicate_source_date_rejected():
    with pytest.raises(ValueError):
        normalize_observations([{"date": "2025-01-01", "value": "1"}] * 2)


def test_failed_source_retains_previous_without_mutating(monkeypatch):
    from pipeline import build
    monkeypatch.setattr(build, "get_json", Mock(side_effect=RuntimeError("network")))
    original = minimal()["series"]
    before = copy.deepcopy(original)
    source = next(s for s in SOURCES if s["id"] == "DGS10")
    result = acquire_series(source, Mock(), "test", "2026-09-09T12:00:00Z", original)
    assert result["status"] == "stale"
    assert result["observations"] == original["DGS10"]["observations"]
    assert original == before


def test_demo_never_becomes_real_fallback(monkeypatch):
    from pipeline import build
    monkeypatch.setattr(build, "get_json", Mock(side_effect=RuntimeError("network")))
    previous = minimal()["series"]
    previous["DGS10"]["status"] = "demo"
    source = next(s for s in SOURCES if s["id"] == "DGS10")
    result = acquire_series(source, Mock(), "test", "2026-09-09T12:00:00Z", previous)
    assert result["status"] == "unavailable"
    assert result["observations"] == []


def test_http_error_never_leaks_secret():
    request = httpx.Request("GET", "https://api.stlouisfed.org/fred/series?api_key=DO_NOT_PRINT")
    client = Mock()
    client.get.return_value = httpx.Response(400, request=request)
    with pytest.raises(RuntimeError) as error:
        get_json(client, "series", {"api_key": "DO_NOT_PRINT"})
    assert str(error.value) == "FRED HTTP 400"
    assert "DO_NOT_PRINT" not in str(error.value)


def test_retries_are_bounded(monkeypatch):
    from pipeline import build
    monkeypatch.setattr(build.time, "sleep", lambda _: None)
    client = Mock()
    client.get.side_effect = httpx.ConnectError("failure")
    with pytest.raises(RuntimeError):
        get_json(client, "series", {})
    assert client.get.call_count == 3


def test_disabled_source_never_calls_network():
    source = next(s for s in SOURCES if s["id"] == "ISM_PMI")
    client = Mock()
    result = acquire_series(source, client, "test", "2026-09-09T12:00:00Z", {})
    assert result["status"] == "unavailable"
    client.get.assert_not_called()


def test_shiller_headers_and_month_ten():
    rows = [["Date", "P", "D", "E", "CPI", "GS10", "CAPE"],
            [2024.10, 5000, 70, 200, 310, 4, 30]]
    result = parse_rows(rows, "2026-09-09T12:00:00Z")
    assert result["SH_P"]["observations"] == [{"date": "2024-10-01", "value": 5000.0}]
    assert "SH_TRCAPE" not in result


def test_shiller_unknown_layout_fails_closed():
    with pytest.raises(ValueError):
        parse_rows([["not", "the", "expected", "sheet"]], "2026-09-09T12:00:00Z")


def test_demo_deterministic_and_explicit():
    a, b = demo_snapshot(date(2000, 2, 1)), demo_snapshot(date(2000, 2, 1))
    assert a == b
    assert a["mode"] == "demo"
    assert all(s["status"] == "demo" for s in a["series"].values())
    validate_snapshot(a)
