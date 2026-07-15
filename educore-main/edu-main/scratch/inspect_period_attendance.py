import os

search_dir = "c:/Users/Ragu/Downloads/edu-core/edu-main"
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(".sql"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    rel_path = os.path.relpath(filepath, search_dir)
                    if "CREATE TABLE period_attendance" in content:
                        print(f"Table created in: {rel_path}")
                    elif "CREATE OR REPLACE VIEW period_attendance" in content or "CREATE VIEW period_attendance" in content:
                        print(f"View created in: {rel_path}")
                    elif "period_attendance" in content:
                        lines = content.splitlines()
                        for idx, line in enumerate(lines):
                            if "period_attendance" in line and not "period_attendance_status" in line:
                                print(f"{rel_path} (line {idx+1}): {line[:100]}")
            except Exception as e:
                pass
