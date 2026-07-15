import json

def inspect():
    with open('locales/en.json', 'r', encoding='utf-8') as f:
        en = json.load(f)
    print("Top-level keys in en.json:", list(en.keys()))
    if 'financeFees' in en:
        print("financeFees keys:", list(en['financeFees'].keys()))
    if 'common' in en:
        print("common keys:", list(en['common'].keys()))

if __name__ == '__main__':
    inspect()
