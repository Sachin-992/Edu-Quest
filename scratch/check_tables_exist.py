import urllib.request
import json

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

def check_table(tbl):
    url = f"{SUPABASE_URL}/rest/v1/{tbl}?limit=1"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return "Exists"
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return "Missing (404)"
        return f"Error ({e.code}): {e.read().decode()}"
    except Exception as e:
        return f"Error: {str(e)}"

tables = [
    "users", "students", "parents", "teachers", "classes", "sections", "subjects",
    "timetables", "timetable_periods", "attendance_periods", "attendance_summary",
    "marks", "assignments", "remarks", "fee_records", "payments", "notifications",
    "notices", "daily_homework", "exams"
]

print("=" * 60)
print("TABLE CHECK IN LIVE SUPABASE")
print("=" * 60)
for t in tables:
    print(f"Table '{t}': {check_table(t)}")
print("=" * 60)
