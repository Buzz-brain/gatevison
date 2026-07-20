import csv
import io
import json
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class ExportService:
    @staticmethod
    def export_csv(data: list[dict]) -> str:
        if not data:
            return ""
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        for row in data:
            cleaned = {}
            for k, v in row.items():
                if isinstance(v, (dict, list)):
                    cleaned[k] = json.dumps(v)
                elif v is None:
                    cleaned[k] = ""
                else:
                    cleaned[k] = str(v)
            writer.writerow(cleaned)
        return output.getvalue()

    @staticmethod
    def export_json(data: list[dict]) -> str:
        return json.dumps(data, indent=2, default=str)

    @staticmethod
    def export_excel(data: list[dict]) -> bytes:
        try:
            import openpyxl
        except ImportError:
            raise ImportError(
                "openpyxl is required for Excel export. "
                "Install with 'pip install openpyxl'"
            )

        wb = openpyxl.Workbook()
        ws = wb.active

        if data:
            headers = list(data[0].keys())
            ws.append(headers)
            for row in data:
                ws.append([
                    json.dumps(v) if isinstance(v, (dict, list)) else v
                    for v in row.values()
                ])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output.getvalue()

    async def export_report(
        self,
        data: list[dict],
        export_format: str = "csv",
    ) -> tuple[str, str, str]:
        if export_format == "csv":
            content = self.export_csv(data)
            filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            content_type = "text/csv"
        elif export_format == "json":
            content = self.export_json(data)
            filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            content_type = "application/json"
        elif export_format == "xlsx":
            content = self.export_excel(data)
            filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        else:
            raise ValueError(f"Unsupported export format: {export_format}")

        return content, filename, content_type
