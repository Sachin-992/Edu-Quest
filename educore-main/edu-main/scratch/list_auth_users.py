import requests

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

print("=== Fetching Auth Users ===")
r = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers)
print("Response status:", r.status_code)
if r.status_code == 200:
    data = r.json()
    users = data.get('users', [])
    for u in users:
        print(f"Email: {u.get('email')}, ID: {u.get('id')}, Metadata: {u.get('user_metadata')}")
else:
    print("Failed:", r.text)
