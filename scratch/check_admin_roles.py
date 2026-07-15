import urllib.request
import json

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

def get_data(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

print("=" * 70)
print("Users in users table:")
print("=" * 70)
users = get_data("users", "select=id,auth_id,email,role,status")
print(json.dumps(users, indent=2))

print("=" * 70)
print("User Roles in user_roles table:")
print("=" * 70)
roles = get_data("user_roles", "select=*")
print(json.dumps(roles, indent=2))
