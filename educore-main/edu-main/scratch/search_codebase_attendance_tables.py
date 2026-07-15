import os

search_dir = "c:/Users/Ragu/Downloads/edu-core/edu-main"
files_checked = 0
matches = []

for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or "dist" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".sql")):
            files_checked += 1
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "period_attendance" in content:
                        matches.append((filepath, "period_attendance"))
                    if "attendance_periods" in content:
                        matches.append((filepath, "attendance_periods"))
            except Exception as e:
                pass

print(f"Checked {files_checked} files.")
print(f"Found {len(matches)} table name occurrences:")
for filepath, tablename in matches:
    print(f"  - {os.path.relpath(filepath, search_dir)}: {tablename}")
