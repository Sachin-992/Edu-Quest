import json

def update_locale(file_path, namespace, new_keys):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if namespace not in data:
        data[namespace] = {}
        
    for k, v in new_keys.items():
        data[namespace][k] = v
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Update overviewDashboard
en_overview_keys = {
    "active": "Active",
    "lastSync": "Last sync:"
}

ta_overview_keys = {
    "active": "செயலில்",
    "lastSync": "கடைசி ஒத்திசைவு:"
}

update_locale('c:/Users/Ragu/Downloads/edu-core/edu-main/locales/en.json', 'overviewDashboard', en_overview_keys)
update_locale('c:/Users/Ragu/Downloads/edu-core/edu-main/locales/ta.json', 'overviewDashboard', ta_overview_keys)

print("Overview Dashboard keys updated.")
