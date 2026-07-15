import requests

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

print("=== Fetching Schema Tables ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/import_schema_tables?select=*", headers=headers)
if r.status_code != 200:
    # Try direct RPC or check table list
    r = requests.get(f"{SUPABASE_URL}/rest/v1/students?select=count", headers=headers)
    print("Students count response status:", r.status_code)
    print("Students count response body:", r.text)
    
    r = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=count", headers=headers)
    print("Users count response status:", r.status_code)
    print("Users count response body:", r.text)
else:
    print("Tables:", r.json())
