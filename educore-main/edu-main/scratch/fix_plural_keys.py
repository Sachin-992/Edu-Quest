import json

def update_keys(file_path, keys_to_update):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'alertsPanel' not in data:
        data['alertsPanel'] = {}
        
    for k, v in keys_to_update.items():
        data['alertsPanel'][k] = v
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_updates = {
    "countNotifications": "{{count}} notifications",
    "countNotifications_one": "{{count}} notification",
    "countNotifications_other": "{{count}} notifications"
}

ta_updates = {
    "countNotifications": "{{count}} அறிவிப்புகள்",
    "countNotifications_one": "{{count}} அறிவிப்பு",
    "countNotifications_other": "{{count}} அறிவிப்புகள்"
}

update_keys('c:/Users/Ragu/Downloads/edu-core/edu-main/locales/en.json', en_updates)
update_keys('c:/Users/Ragu/Downloads/edu-core/edu-main/locales/ta.json', ta_updates)

print("Plural keys fixed successfully.")
