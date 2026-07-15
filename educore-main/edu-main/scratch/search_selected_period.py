with open("c:/Users/Ragu/Downloads/edu-core/edu-main/components/teacher/TeacherDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "selectedPeriodId" in line:
        safe_line = line.strip().encode("ascii", errors="replace").decode("ascii")
        print(f"Line {idx+1}: {safe_line[:120]}")
