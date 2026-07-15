import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

print("=== Fetching one feedback record to inspect schema ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/feedback?select=*&limit=1", headers=headers)
if r.status_code == 200:
    feedback = r.json()
    if feedback:
        print("Columns present in existing feedback records:")
        print(json.dumps(feedback[0], indent=2))
    else:
        print("No feedback records found. Let's inspect OpenAPI schema if possible, or try to insert/select.")
        # Try a POST to /rest/v1/feedback with empty object (usually gives bad request but lists fields)
        r2 = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        if r2.status_code == 200:
            print("API response keys:")
            print(list(r2.json().get('definitions', {}).get('feedback', {}).get('properties', {}).keys()))
else:
    print("Failed:", r.status_code, r.text)
