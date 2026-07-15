import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDg3NDUsImV4cCI6MjA4NDYyNDc0NX0.eYd0ZJmy3J9O4YQse8NMWvbC3QcN1bis9JneYtTdEZ8"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}"
}

print("=== Fetching timetable_periods row ===")
# Fetch using: *,subject:subjects(name,code)
r = requests.get(f"{SUPABASE_URL}/rest/v1/timetable_periods?select=*,subject:subjects(name,code)&limit=1", headers=headers)
if r.status_code == 200:
    data = r.json()
    if data:
        row = data[0]
        for key, val in row.items():
            print(f"Key: {key} (type: {type(val).__name__}) => {val}")
    else:
        print("No rows found.")
else:
    print("Failed:", r.text)
