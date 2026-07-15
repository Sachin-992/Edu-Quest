import os

search_dir = "c:/Users/Ragu/Downloads/edu-core/edu-main/components"
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "attendanceService" in content or "Attendance" in content or "markPeriodAttendance" in content:
                        print(f"File: {os.path.relpath(filepath, search_dir)}")
                        # Print some context where attendanceService is used
                        lines = content.splitlines()
                        for idx, line in enumerate(lines):
                            if "attendanceService" in line or "markPeriodAttendance" in line:
                                print(f"  Line {idx+1}: {line.strip()[:120]}")
            except Exception as e:
                pass
