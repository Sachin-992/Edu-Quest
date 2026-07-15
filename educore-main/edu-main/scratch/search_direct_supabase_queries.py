import os

files = [
    "c:/Users/Ragu/Downloads/edu-core/edu-main/components/ParentDashboard.tsx",
    "c:/Users/Ragu/Downloads/edu-core/edu-main/components/student/StudentDashboard.tsx",
    "c:/Users/Ragu/Downloads/edu-core/edu-main/components/teacher/TeacherDashboard.tsx",
    "c:/Users/Ragu/Downloads/edu-core/edu-main/components/admin/modules/AnalyticsDashboard.tsx"
]

for filepath in files:
    if os.path.exists(filepath):
        print(f"\n=== File: {os.path.basename(filepath)} ===")
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for idx, line in enumerate(lines):
            if "attendance" in line.lower():
                # print line number and contents
                safe_line = line.strip().encode("ascii", errors="replace").decode("ascii")
                print(f"  Line {idx+1}: {safe_line[:120]}")
