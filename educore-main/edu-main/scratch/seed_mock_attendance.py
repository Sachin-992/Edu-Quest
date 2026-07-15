import requests
import json
import random
from datetime import datetime, timedelta

SUPABASE_URL = "https://aszxjvvelshyuaipuwwn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenhqdnZlbHNoeXVhaXB1d3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0ODc0NSwiZXhwIjoyMDg0NjI0NzQ1fQ.HGntccPnwIbNcbpw4tBhUrA2M9qecIZ80vnN1lixDMg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

def seed():
    print("=== STARTING ATTENDANCE SEEDING ===")
    
    # 1. Fetch Students
    r_students = requests.get(f"{SUPABASE_URL}/rest/v1/students?select=id,name,class,section", headers=headers)
    if r_students.status_code != 200:
        print("Failed to fetch students:", r_students.text)
        return
    students = r_students.json()
    print(f"Found {len(students)} students.")
    
    # 2. Fetch Timetable Periods
    r_periods = requests.get(f"{SUPABASE_URL}/rest/v1/timetable_periods?select=id,subject,day_of_week", headers=headers)
    if r_periods.status_code != 200:
        print("Failed to fetch periods:", r_periods.text)
        return
    periods = r_periods.json()
    print(f"Found {len(periods)} timetable periods.")
    
    if not students or not periods:
        print("Missing students or periods, aborting.")
        return
        
    # Get a marker user
    r_users = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id&role=eq.teacher&limit=1", headers=headers)
    marker_id = r_users.json()[0]['id'] if r_users.status_code == 200 and r_users.json() else None
    if not marker_id:
        r_admins = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id&role=eq.admin&limit=1", headers=headers)
        marker_id = r_admins.json()[0]['id'] if r_admins.status_code == 200 and r_admins.json() else None
        
    print(f"Using marked_by user: {marker_id}")

    # Dates from June 1, 2026 to June 10, 2026
    start_date = datetime(2026, 6, 1)
    end_date = datetime(2026, 6, 10)
    
    current_date = start_date
    records_to_insert = []
    
    # Status options with weights
    # 0 = Sunday, 6 = Saturday. Let's skip Sundays (June 7 is Sunday)
    statuses = [
        'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present',
        'absent', 'absent',
        'late', 'late',
        'medical_leave',
        'on_duty',
        'half_day',
        'excused_leave',
        'holiday',
        'special_permission',
        'transfer_pending'
    ]
    
    # Let's seed records
    days_seeded = 0
    while current_date <= end_date:
        # Skip Sundays
        if current_date.weekday() == 6: 
            current_date += timedelta(days=1)
            continue
            
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"Generating for {date_str}...")
        
        # We'll seed 3 random periods per day for each student
        for student in students:
            # Let's pick 3 random periods
            daily_periods = random.sample(periods, min(3, len(periods)))
            
            # Risk grouping (some students have lower attendance)
            # Student "Balan" - let's make him high risk (below 75% or 60%) to test risk lists
            is_balan = "balan" in student['name'].lower()
            # Student "Arun" - let's make him moderate risk (below 90%)
            is_arun = "arun" in student['name'].lower()
            
            for period in daily_periods:
                if is_balan:
                    # high risk: 40% absent, 20% leave, 40% present
                    status = random.choice(['absent', 'absent', 'medical_leave', 'half_day', 'late', 'present', 'present'])
                elif is_arun:
                    # moderate risk: 20% absent/late, 80% present
                    status = random.choice(['present', 'present', 'present', 'present', 'late', 'absent', 'present'])
                else:
                    # regular: 90% present
                    status = random.choice(statuses)
                    
                records_to_insert.append({
                    "student_id": student['id'],
                    "timetable_period_id": period['id'],
                    "attendance_date": date_str,
                    "status": status,
                    "marked_by": marker_id,
                    "marked_at": datetime.now().isoformat(),
                    "remarks": f"Seeded {status} attendance"
                })
                
        current_date += timedelta(days=1)
        days_seeded += 1
        
    print(f"Generated {len(records_to_insert)} total records to insert.")
    
    # Bulk insert in chunks of 100
    chunk_size = 100
    success_count = 0
    for i in range(0, len(records_to_insert), chunk_size):
        chunk = records_to_insert[i:i+chunk_size]
        # We use POST with Upsert header to avoid conflicts
        r_ups = requests.post(
            f"{SUPABASE_URL}/rest/v1/attendance_periods", 
            headers={
                **headers,
                "Prefer": "resolution=merge-duplicates"
            }, 
            data=json.dumps(chunk)
        )
        if r_ups.status_code in [200, 201]:
            success_count += len(chunk)
        else:
            print(f"Failed chunk {i // chunk_size}: {r_ups.status_code} - {r_ups.text[:200]}")
            
    print(f"Successfully upserted {success_count} / {len(records_to_insert)} attendance records.")

if __name__ == "__main__":
    seed()
