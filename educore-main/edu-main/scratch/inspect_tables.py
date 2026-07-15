import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

tables = ["teachers", "subjects", "classes", "class_teacher_assignments"]
print("=== Fetching OpenAPI definitions for tables ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
if r.status_code == 200:
    definitions = r.json().get('definitions', {})
    for table in tables:
        if table in definitions:
            print(f"\nTable: {table}")
            props = definitions[table].get('properties', {})
            for col, prop in props.items():
                print(f"  - {col}: {prop.get('type')} (format: {prop.get('format')}, desc: {prop.get('description')})")
        else:
            print(f"\nTable: {table} NOT found in definitions.")
else:
    print("Failed to fetch definitions:", r.text)
