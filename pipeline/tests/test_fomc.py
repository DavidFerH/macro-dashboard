from datetime import date

import pytest

from pipeline.fomc import parse_calendar


def test_official_markup_dates_and_projection_marker():
    html = """<h4><a>2026 FOMC Meetings</a></h4>
    <div class="fomc-meeting__month col-xs-5"><strong>September</strong></div>
    <div class="fomc-meeting__date col-xs-4">15-16*</div>"""
    events = parse_calendar(html, date(2026, 9, 9))
    assert len(events) == 1
    assert events[0]["date"] == "2026-09-16"
    assert events[0]["time"] is None


def test_cross_month_and_window():
    html = """<a>2024 FOMC Meetings</a>
    <div class="fomc-meeting__month">Apr/May</div>
    <div class="fomc-meeting__date">30-1</div>"""
    assert parse_calendar(html, date(2024, 4, 25))[0]["date"] == "2024-05-01"
    assert parse_calendar(html, date(2024, 5, 2)) == []


def test_changed_markup_fails_explicitly():
    with pytest.raises(ValueError):
        parse_calendar("<html>Unexpected content</html>", date(2026, 9, 9))
