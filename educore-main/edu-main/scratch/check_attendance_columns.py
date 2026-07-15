import requests

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Prefer": "count=exact"
}

print("=== Checking period_attendance ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/period_attendance?select=*&limit=1", headers=headers)
print("Status:", r.status_code)
if r.status_code == 200:
    print("Columns in period_attendance:", list(r.json()[0].keys()) if r.json() else "Empty table")
    print("Sample record:", r.json()[0] if r.json() else "None")
else:
    print("Failed period_attendance:", r.text)

print("\n=== Checking attendance_periods ===")
r2 = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_periods?select=*&limit=1", headers=headers)
print("Status:", r2.status_code)
if r2.status_code == 200:
    print("Columns in attendance_periods:", list(r2.json()[0].keys()) if r2.json() else "Empty table")
else:
    print("Failed attendance_periods:", r2.text)
