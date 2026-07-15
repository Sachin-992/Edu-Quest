import requests

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

# Try querying tables in information_schema or pg_catalog if exposed
# Sometimes Supabase exposes a view or we can find it by trying to fetch table details
for endpoint in ["pg_catalog_pg_class", "information_schema_tables", "information_schema_columns"]:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{endpoint}?select=*", headers=headers)
    print(f"Endpoint: {endpoint}, Status: {r.status_code}")
    if r.status_code == 200:
        print(r.json()[:2])
