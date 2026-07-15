import json

def update_locales():
    # Load en.json
    en_path = "locales/en.json"
    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
    
    if "studentPortal" not in en_data:
        en_data["studentPortal"] = {}
    en_data["studentPortal"]["score"] = "score"
    en_data["studentPortal"]["overallScore"] = "Overall Score"
    en_data["studentPortal"]["recentResults"] = "Recent Results"
    
    with open(en_path, "w", encoding="utf-8") as f:
        json.dump(en_data, f, ensure_ascii=False, indent=2)
    print("Updated en.json")

    # Load ta.json
    ta_path = "locales/ta.json"
    with open(ta_path, "r", encoding="utf-8") as f:
        ta_data = json.load(f)
        
    if "studentPortal" not in ta_data:
        ta_data["studentPortal"] = {}
    ta_data["studentPortal"]["score"] = "மதிப்பெண்"
    ta_data["studentPortal"]["overallScore"] = "ஒட்டுமொத்த மதிப்பெண்"
    ta_data["studentPortal"]["recentResults"] = "சமீபத்திய முடிவுகள்"
    
    with open(ta_path, "w", encoding="utf-8") as f:
        json.dump(ta_data, f, ensure_ascii=False, indent=2)
    print("Updated ta.json")

if __name__ == "__main__":
    update_locales()
