import requests
import json

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Fetch a valid student and period
r = requests.get(f"{SUPABASE_URL}/rest/v1/students?select=id&limit=1", headers=headers)
student_id = r.json()[0]['id'] if r.json() else None

r_p = requests.get(f"{SUPABASE_URL}/rest/v1/timetable_periods?select=id&limit=1", headers=headers)
period_id = r_p.json()[0]['id'] if r_p.json() else None

print(f"Student: {student_id}, Period: {period_id}")

if student_id and period_id:
    # Try to insert medical_leave
    data = {
        "student_id": student_id,
        "timetable_period_id": period_id,
        "attendance_date": "2026-06-01",
        "status": "medical_leave",
        "remarks": "Test check constraint"
    }
    r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_periods", headers=headers, data=json.dumps(data))
    print("Insert Status Code:", r_ins.status_code)
    print("Insert Response:", r_ins.text)
else:
    print("Could not find student or period for testing.")
