with open("c:/Users/Ragu/Downloads/edu-core/edu-main/services/academicService.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "getTodayPeriods" in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print next 15 lines
        for i in range(idx+1, idx+20):
            if i < len(lines):
                print(f"  {i+1}: {lines[i]}", end="")
