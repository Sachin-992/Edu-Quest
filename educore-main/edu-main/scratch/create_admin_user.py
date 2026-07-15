import requests

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 1. Insert into public.users
user_data = {
    "auth_id": "33c6e1a0-d743-4437-943b-3b2913b856ef",
    "email": "sachinchinnasamy2021@gmail.com",
    "name": "Sachin Admin",
    "role": "admin",
    "status": "active",
    "first_login": False
}

print("=== Creating Admin User in public.users ===")
r = requests.post(f"{SUPABASE_URL}/rest/v1/users", json=user_data, headers=headers)
print("Users Insert Response:", r.status_code)
print("Response body:", r.text)

# 2. Insert into public.user_roles (for gamification view compatibility)
role_data = {
    "user_id": "33c6e1a0-d743-4437-943b-3b2913b856ef",
    "role": "admin"
}

print("\n=== Creating Admin Role in public.user_roles ===")
r = requests.post(f"{SUPABASE_URL}/rest/v1/user_roles", json=role_data, headers=headers)
print("User Roles Insert Response:", r.status_code)
print("Response body:", r.text)
