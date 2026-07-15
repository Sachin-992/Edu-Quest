import requests

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Prefer": "count=exact"
}

for table in ["period_attendance", "attendance_periods", "attendance", "attendance_summary"]:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*", headers=headers)
    print(f"Table: {table}")
    print(f"  Status code: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Count: {len(data)}")
        if len(data) > 0:
            print(f"  Sample row: {data[0]}")
    else:
        print(f"  Error: {r.text}")
