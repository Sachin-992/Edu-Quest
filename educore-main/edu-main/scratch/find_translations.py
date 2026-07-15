import json

with open("c:/Users/Ragu/Downloads/edu-core/edu-main/locales/en.json", "r", encoding="utf-8") as f:
    en = json.load(f)

def search_keys(d, prefix=""):
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            search_keys(v, full_key)
        else:
            if "attendance" in full_key.lower() or "attendance" in str(v).lower():
                print(f"  {full_key}: {v}")

print("=== Attendance translation keys in en.json ===")
search_keys(en)
