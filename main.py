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
    "https://sheet.best/api/sheets/YOUR_SHEET_ID" 
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

def fetch_certificates():
    try:
        response = requests.get(
            SHEETBEST_API_URL,
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return None

# ================== API ==================

@app.get("/api/check")
def check_certificate(certification_code: str = Query(..., min_length=3)):
    rows = fetch_certificates()
    
    if rows is None:
        return JSONResponse(
            status_code=503,
            content={"error": "Data source unavailable"}
        )

    for row in rows:
        db_code = str(row.get("CertificationCode", "")).strip()
        user_code = certification_code.strip()
        
        if db_code == user_code:
            return {
                "found": True,
                "certificationCode": row.get("CertificationCode"),
                "nameFa": f"{row.get('FirstNameFa', '')} {row.get('LastNameFa', '')}".strip(),
                "nameEn": f"{row.get('FirstNameEn', '')} {row.get('LastNameEn', '')}".strip(),
                "course": row.get("Course"),
                "dateOfIssue": row.get("DateOfIssue"),
                "expirationDate": row.get("ExpDate")
            }

    return {
        "found": False,
        "message": "Certificate not found"
    }

# ================== Static Files ==================
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
def mini_app():
    try:
        with open("static/index.html", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "فایل index.html در پوشه static پیدا نشد."
