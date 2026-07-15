import subprocess

print("=== Checking git history for passwords or db credentials ===")
try:
    # Get all commits that mention password or db or env
    out = subprocess.check_output(["git", "log", "-p", "-S", "password", "--", ".env"], text=True)
    print("Git commits modifying password in .env:")
    print(out[:2000])
except Exception as e:
    print("Failed to run git log:", e)

try:
    # Just list recent commits
    out = subprocess.check_output(["git", "log", "-n", "10", "--oneline"], text=True)
    print("\nRecent commits:")
    print(out)
except Exception as e:
    print("Failed to run git log oneline:", e)
