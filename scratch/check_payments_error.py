import urllib.request
import json

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODgwNjcsImV4cCI6MjA5ODY2NDA2N30.DdstUAADhQibd3b5CecmiCRkM1ED7dvg9yLimLRiuS4"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

def check_error(table):
    # Using ANON key
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    req = urllib.request.Request(url, headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return "Success: " + resp.read().decode()
    except urllib.error.HTTPError as e:
        return f"Error {e.code}: {e.read().decode()}"
    except Exception as e:
        return f"Exception: {str(e)}"

print("payments table check:")
print(check_error("payments"))
print("\nexam_marks_approvals table check:")
print(check_error("exam_marks_approvals"))
