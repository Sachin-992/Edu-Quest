import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDg3NDUsImV4cCI6MjA4NDYyNDc0NX0.eYd0ZJmy3J9O4YQse8NMWvbC3QcN1bis9JneYtTdEZ8"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}"
}

print("=== Fetching attendance_periods ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_periods?select=*,timetable_periods(*,subjects(*))&limit=5", headers=headers)
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2))
else:
    print("Failed periods:", r.text)

print("\n=== Fetching attendance_summary ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_summary?select=*&limit=5", headers=headers)
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2))
else:
    print("Failed summary:", r.text)
