import json
import os

def add_translations(filepath, new_keys):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for section, keys in new_keys.items():
        if section not in data:
            data[section] = {}
        for k, v in keys.items():
            data[section][k] = v
            
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully updated {filepath}")

en_keys = {
    "studentPortal": {
        "unit": "Unit / Chapter",
        "unitPlaceholder": "e.g. Unit 1: Cell Biology",
        "generalNotes": "General Notes",
        "otherNotes": "Other Resources",
        "subjectWiseNotes": "Subject-wise Notes"
    },
    "teacherPortal": {
        "unit": "Unit / Chapter",
        "unitPlaceholder": "e.g. Unit 1: Cell Biology"
    },
    "parentPortal": {
        "unit": "Unit / Chapter",
        "generalNotes": "General Notes",
        "otherNotes": "Other Resources"
    }
}

ta_keys = {
    "studentPortal": {
        "unit": "அலகு / பாடம்",
        "unitPlaceholder": "எ.கா. அலகு 1: செல் உயிரியல்",
        "generalNotes": "பொதுவான குறிப்புகள்",
        "otherNotes": "பிற வளங்கள்",
        "subjectWiseNotes": "பாடம் வாரியான குறிப்புகள்"
    },
    "teacherPortal": {
        "unit": "அலகு / பாடம்",
        "unitPlaceholder": "எ.கா. அலகு 1: செல் உயிரியல்"
    },
    "parentPortal": {
        "unit": "அலகு / பாடம்",
        "generalNotes": "பொதுவான குறிப்புகள்",
        "otherNotes": "பிற வளங்கள்"
    }
}

add_translations("locales/en.json", en_keys)
add_translations("locales/ta.json", ta_keys)
