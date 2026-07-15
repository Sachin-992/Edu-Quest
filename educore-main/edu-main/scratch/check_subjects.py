import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDg3NDUsImV4cCI6MjA4NDYyNDc0NX0.eYd0ZJmy3J9O4YQse8NMWvbC3QcN1bis9JneYtTdEZ8"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}"
}

print("=== Fetching all subjects ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/subjects?select=*", headers=headers)
if r.status_code == 200:
    data = r.json()
    for row in data:
        print(f"ID: {row.get('id')} => Name: {repr(row.get('name'))}, Code: {repr(row.get('code'))}")
else:
    print("Failed:", r.text)
