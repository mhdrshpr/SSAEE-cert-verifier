from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

app = FastAPI(title="Certificate Verification API")

# ---------- Google Sheets (فعلاً آماده اتصال) ----------
SHEET_NAME = "Certificates"  # اسم فایل Google Sheet

scope = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = Credentials.from_service_account_file(
    "credentials.json",
    scopes=scope
)

client = gspread.authorize(creds)
sheet = client.open(SHEET_NAME).sheet1


# ---------- Helpers ----------
def parse_date(date_str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except:
        return None


def check_expiration(exp_date_str):
    exp_date = parse_date(exp_date_str)
    if not exp_date:
        return "unknown"
    return "expired" if exp_date < datetime.today().date() else "valid"


# ---------- API ----------
@app.get("/api/check")
def check_certificate(
    certification_code: str = Query(..., min_length=3)
):
    records = sheet.get_all_records()

    for row in records:
        if str(row["CertificationCode"]).strip() == certification_code.strip():

            exp_status = check_expiration(row["ExpDate"])

            return JSONResponse({
                "found": True,
                "certificationCode": row["CertificationCode"],
                "nameFa": f"{row['FirstNameFa']} {row['LastNameFa']}",
                "nameEn": f"{row['FirstNameEn']} {row['LastNameEn']}",
                "course": row["Course"],
                "dateOfIssue": row["DateOfIssue"],
                "expirationDate": row["ExpDate"],
                "status": exp_status
            })

    return JSONResponse({
        "found": False,
        "message": "Certificate not found"
    })


# ---------- Mini App ----------
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
def mini_app():
    with open("static/index.html", encoding="utf-8") as f:
        return f.read()
