import requests

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDg3NDUsImV4cCI6MjA4NDYyNDc0NX0.eYd0ZJmy3J9O4YQse8NMWvbC3QcN1bis9JneYtTdEZ8"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}"
}

print("=== Fetching all raw timetable_periods rows ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/timetable_periods?select=*", headers=headers)
if r.status_code == 200:
    data = r.json()
    print(f"Total periods: {len(data)}")
    for i, row in enumerate(data):
        print(f"Row {i}: ID: {row.get('id')}, Day: {row.get('day_of_week')}, Period: {row.get('period_number')}, SubjectCol: {repr(row.get('subject'))}, SubjectIdCol: {repr(row.get('subject_id'))}")
else:
    print("Failed:", r.text)
