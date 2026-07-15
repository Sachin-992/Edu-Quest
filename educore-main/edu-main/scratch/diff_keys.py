import json

def get_keys(obj, prefix=''):
    keys = set()
    for k, v in obj.items():
        if isinstance(v, dict):
            keys.update(get_keys(v, prefix + k + '.'))
        else:
            keys.add(prefix + k)
    return keys

en = json.load(open('locales/en.json', encoding='utf-8'))
ta = json.load(open('locales/ta.json', encoding='utf-8'))

en_k = get_keys(en)
ta_k = get_keys(ta)

print('Keys in en but not in ta:', sorted(list(en_k - ta_k)))
print('Keys in ta but not in en:', sorted(list(ta_k - en_k)))
print('Number of keys in en:', len(en_k))
print('Number of keys in ta:', len(ta_k))
