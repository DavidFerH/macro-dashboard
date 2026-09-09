"""Read scheduled meeting dates directly from the Federal Reserve calendar."""
import re
from datetime import date, timedelta
from html.parser import HTMLParser

URL = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm"
MONTHS = {name.lower(): i + 1 for i, name in enumerate(
    ["January", "February", "March", "April", "May", "June",
     "July", "August", "September", "October", "November", "December"])}
MONTHS.update({name[:3]: number for name, number in list(MONTHS.items())})


class CalendarParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.year = None
        self.month = None
        self.field = None
        self.depth = 0
        self.buffer = []
        self.meetings = []
        self.years = set()

    def handle_starttag(self, tag, attrs):
        classes = dict(attrs).get("class", "").split()
        if self.field:
            self.depth += 1
        elif "fomc-meeting__month" in classes or "fomc-meeting__date" in classes:
            self.field = "month" if "fomc-meeting__month" in classes else "date"
            self.depth = 1
            self.buffer = []

    def handle_data(self, data):
        match = re.fullmatch(r"\s*(\d{4}) FOMC Meetings\s*", data)
        if match:
            self.year = int(match.group(1))
            self.years.add(self.year)
        if self.field:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if not self.field:
            return
        self.depth -= 1
        if self.depth:
            return
        text = "".join(self.buffer).strip()
        if self.field == "month":
            # Cross-month meetings use the second month for the decision date.
            self.month = MONTHS.get(text.split("/")[-1].strip().lower())
        elif self.year and self.month:
            match = re.fullmatch(r"(\d{1,2})(?:-(\d{1,2}))?\*?", text)
            if match:
                self.meetings.append(date(self.year, self.month, int(match.group(2) or match.group(1))))
        self.field = None


def parse_calendar(html: str, today: date) -> list[dict]:
    parser = CalendarParser()
    parser.feed(html)
    if today.year not in parser.years:
        raise ValueError("FOMC calendar structure or year missing")
    end = today + timedelta(days=14)
    return [{"id": "fomc-" + day.isoformat(), "title": "FOMC · decisión de tipos",
             "date": day.isoformat(), "time": None, "importance": 3, "url": URL}
            for day in sorted(set(parser.meetings)) if today <= day < end]
