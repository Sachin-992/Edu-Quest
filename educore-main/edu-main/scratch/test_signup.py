import requests

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

payload = {
    "email": "test_dummy_student@gmail.com",
    "password": "password123",
    "data": {
        "full_name": "Test Student"
    }
}
r = requests.post(f"{SUPABASE_URL}/auth/v1/signup", json=payload, headers={"apikey": SERVICE_KEY})
print("Signup status:", r.status_code)
print("Signup response:", r.text)
