import os
import re

print("=== Searching for database password or connection strings ===")
exclude_dirs = { "node_modules", "dist", ".git", ".gemini", "brain" }
patterns = [
    re.compile(r"postgresql://", re.IGNORECASE),
    re.compile(r"postgres://", re.IGNORECASE),
    re.compile(r"db_pass", re.IGNORECASE),
    re.compile(r"database_private_key", re.IGNORECASE)
]

found = False
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file.endswith(('.ts', '.tsx', '.json', '.sql', '.py', '.md', '.env', '.example')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    for i, line in enumerate(f, 1):
                        for pattern in patterns:
                            if pattern.search(line):
                                print(f"Found match in {filepath}:{i} -> {line.strip()[:100]}")
                                found = True
            except Exception as e:
                pass

if not found:
    print("No database connection string or password found.")
