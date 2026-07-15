import urllib.request
import json

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

# Fetch all classes first
req_get = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/classes?select=id,name,grade_level",
    headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }
)

try:
    with urllib.request.urlopen(req_get, timeout=10) as resp:
        classes = json.loads(resp.read())
        print(f"Fetched {len(classes)} classes.")
        
        # We will update each class to have section = 'A' and status = 'active'
        for cls in classes:
            class_id = cls["id"]
            update_payload = json.dumps({
                "section": "A",
                "status": "active"
            }).encode()
            
            req_update = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/classes?id=eq.{class_id}",
                data=update_payload,
                headers={
                    "apikey": SERVICE_KEY,
                    "Authorization": f"Bearer {SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                method="PATCH"
            )
            
            with urllib.request.urlopen(req_update, timeout=10) as resp_up:
                print(f"Updated class {cls['name']} (ID: {class_id}) successfully.")
                
except Exception as e:
    print("Error during update:", e)
