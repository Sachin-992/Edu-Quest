import sys

with open("c:/Users/Ragu/Downloads/edu-core/edu-main/sql/timetable_attendance_schema.sql", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "period_attendance" in line:
        print(f"--- Line {i+1} ---")
        start = max(0, i-5)
        end = min(len(lines), i+15)
        for idx in range(start, end):
            # safe print for Windows console
            safe_line = lines[idx].encode("ascii", errors="replace").decode("ascii")
            print(f"{idx+1}: {safe_line}", end="")
