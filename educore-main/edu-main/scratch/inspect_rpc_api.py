import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

print("=== Fetching OpenAPI Specs ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
if r.status_code == 200:
    specs = r.json()
    paths = specs.get("paths", {})
    rpc_paths = [p for p in paths.keys() if p.startswith("/rpc/")]
    print(f"Found {len(rpc_paths)} RPC paths:")
    for p in sorted(rpc_paths):
        print(p)
else:
    print("Failed:", r.status_code, r.text)
