from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime
import requests
import os

app = FastAPI(title="Certificate Verification API")

# ================== SheetBest Config ==================

SHEETBEST_API_URL = os.getenv(
    "SHEETBEST_API_URL",
    "https://api.sheetbest.com/sheets/d94dd875-2586-459c-8d6a-52a641569019
"
)

REQUEST_TIMEOUT = 10  # seconds

# ================== Helpers ==================

def parse_date(date_str: str):
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def check_expiration(exp_date_str: str):
    exp_date = parse_date(exp_date_str)
    if not exp_date:
        return "unknown"
    return "expired" if exp_date < datetime.today().date() else "valid"


def fetch_certificates():
    """
    Fetch all rows from SheetBest
    """
    response = requests.get(
        SHEETBEST_API_URL,
        timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()
    return response.json()

# ================== API ==================

@app.get("/api/check")
def check_certificate(
    certification_code: str = Query(..., min_length=3)
):
    try:
        rows = fetch_certificates()
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": "Data source unavailable"}
        )

    for row in rows:
        if str(row.get("CertificationCode", "")).strip() == certification_code.strip():

            status = check_expiration(row.get("ExpDate"))

            return {
                "found": True,
                "certificationCode": row.get("CertificationCode"),
                "nameFa": f"{row.get('FirstNameFa', '')} {row.get('LastNameFa', '')}",
                "nameEn": f"{row.get('FirstNameEn', '')} {row.get('LastNameEn', '')}",
                "course": row.get("Course"),
                "dateOfIssue": row.get("DateOfIssue"),
                "expirationDate": row.get("ExpDate"),
                "status": status
            }

    return {
        "found": False,
        "message": "Certificate not found"
    }

# ================== Mini App ==================

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
def mini_app():
    with open("static/index.html", encoding="utf-8") as f:
        return f.read()
