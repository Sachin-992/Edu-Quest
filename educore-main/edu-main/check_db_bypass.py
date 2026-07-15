import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

print("=== Fetching Exams ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/exams?select=*", headers=headers)
if r.status_code == 200:
    exams = r.json()
    for e in exams:
        print(f"ID: {e.get('id')}, Title: {e.get('title')}, Status: {e.get('status')}, Start: {e.get('start_date')}")
else:
    print("Failed:", r.text)

print("\n=== Fetching Marks ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/marks?select=*", headers=headers)
if r.status_code == 200:
    marks = r.json()
    print(f"Found {len(marks)} marks records.")
    for m in marks[:10]:
        print(f"Student: {m.get('student_id')}, Subject: {m.get('subject')}, Exam: {m.get('exam_type')}, Marks: {m.get('marks')}/{m.get('max_marks')}")
else:
    print("Failed:", r.text)
