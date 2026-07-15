import requests

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

r = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
if r.status_code == 200:
    spec = r.json()
    definitions = spec.get("definitions", {})
    
    for table in ["period_attendance", "attendance_periods", "attendance_summary"]:
        if table in definitions:
            print(f"\n=== Table: {table} ===")
            props = definitions[table].get("properties", {})
            for col, desc in props.items():
                print(f"  {col}: {desc.get('type')} (Format: {desc.get('format')}, Description: {desc.get('description')})")
        else:
            print(f"\n=== Table {table} NOT found in definitions ===")
else:
    print("Failed:", r.status_code)
