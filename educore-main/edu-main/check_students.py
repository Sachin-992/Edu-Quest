import requests

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

print("=== Fetching Students ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/students?select=*", headers=headers)
if r.status_code == 200:
    for s in r.json():
        print(f"ID: {s.get('id')}, Name: {s.get('name')}, Class: {s.get('class')}-{s.get('section')}, UserID: {s.get('user_id')}")
else:
    print("Failed:", r.text)
