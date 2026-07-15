import urllib.request
import json

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODgwNjcsImV4cCI6MjA5ODY2NDA2N30.DdstUAADhQibd3b5CecmiCRkM1ED7dvg9yLimLRiuS4"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

# Query using ANON key (subject to RLS, representing public/anonymous access)
req_anon = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/students?select=*",
    headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
)

# Query using SERVICE key (bypasses RLS)
req_service = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/students?select=*",
    headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
)

print("=" * 60)
print("QUERYING STUDENTS")
print("=" * 60)

try:
    with urllib.request.urlopen(req_anon, timeout=10) as resp:
        print("Using ANON key (subject to RLS):")
        print(resp.read().decode())
except Exception as e:
    print("ANON key query failed:", e)

try:
    with urllib.request.urlopen(req_service, timeout=10) as resp:
        print("\nUsing SERVICE key (bypasses RLS):")
        print(resp.read().decode())
except Exception as e:
    print("SERVICE key query failed:", e)
