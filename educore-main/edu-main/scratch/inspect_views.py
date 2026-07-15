import requests

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

# Query information_schema via standard REST (some of it might be exposed if security is lax, or we can use pg_catalog if exposed, but REST usually exposes tables/views only)
# Alternatively, we can check by querying table contents or trying to insert/select.
# Let's check if period_attendance is a table by trying to fetch its column schema.
# Since we fetched definitions from the PostgREST openapi spec, let's write a python script to run a query on `rpc/` if any generic query functions exist, or check the definitions of the views.
# Wait, let's see if we can read the view definition from information_schema if there is an endpoint. Usually postgrest doesn't expose information_schema.
# Let's check if there is an rpc function we can use. We can list all functions by looking at the swagger spec under "paths".
r = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
if r.status_code == 200:
    spec = r.json()
    paths = spec.get("paths", {})
    print("Available RPC paths:")
    for path in sorted(paths.keys()):
        if path.startswith("/rpc/"):
            print(f"  {path}")
else:
    print("Failed to get OpenAPI spec:", r.status_code)
