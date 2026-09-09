"""Import an explicitly supplied workbook; never download or republish it implicitly."""
from datetime import date, datetime
from pathlib import Path


def parse_rows(rows: list, now: str) -> dict:
    from pipeline.build import SOURCES, blank_series, normalize_observations
    aliases = {"P": "SH_P", "D": "SH_D", "E": "SH_E", "CPI": "SH_CPI",
               "GS10": "SH_GS10", "CAPE": "SH_CAPE", "TR_CAPE": "SH_TRCAPE"}
    header_index = next((i for i, row in enumerate(rows[:30])
                         if "Date" in row and "P" in row and "CPI" in row), None)
    if header_index is None:
        raise ValueError("Shiller: expected columns Date, P, D, E, CPI, GS10, CAPE, TR_CAPE")
    header = rows[header_index]
    date_index = header.index("Date")
    columns = {i: aliases[str(name).strip()] for i, name in enumerate(header) if str(name).strip() in aliases}
    series = {source["id"]: blank_series(source) for source in SOURCES if source["id"] in columns.values()}
    for row in rows[header_index + 1:]:
        raw_date = row[date_index]
        if raw_date is None:
            continue
        if isinstance(raw_date, (date, datetime)):
            day = raw_date.strftime("%Y-%m-%d")
        else:
            try:
                numeric = float(raw_date)
            except (ValueError, TypeError):
                continue
            year = int(numeric)
            month = round((numeric - year) * 100)
            day = date(year, month, 1).isoformat()
        if day > now[:10]:
            continue
        for index, key in columns.items():
            value = row[index] if index < len(row) else None
            series[key]["observations"].append({"date": day, "value": value})
    for entry in series.values():
        entry["observations"] = normalize_observations(entry["observations"])
        entry.update(status="ok", fetchedAt=now)
        entry.pop("reason", None)
    return series


def import_workbook(path: Path, now: str) -> dict:
    if path.suffix.lower() == ".xls":
        import xlrd
        workbook = xlrd.open_workbook(path)
        sheet = workbook.sheet_by_name("Data") if "Data" in workbook.sheet_names() else workbook.sheet_by_index(0)
        rows = [sheet.row_values(i) for i in range(sheet.nrows)]
    else:
        import openpyxl
        workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
        sheet = workbook["Data"] if "Data" in workbook.sheetnames else workbook.active
        rows = list(sheet.values)
        workbook.close()
    return parse_rows(rows, now)
