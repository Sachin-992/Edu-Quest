import urllib.request
import json
import os

def load_env():
    env = {}
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    env[key.strip()] = val.strip().strip('"').strip("'")
    return env

def main():
    env = load_env()
    supabase_url = env.get('VITE_SUPABASE_URL')
    anon_key = env.get('VITE_SUPABASE_ANON_KEY')
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url:
        print("Missing environment variables.")
        return

    # Try service key first, fallback to anon key
    key = service_key or anon_key
    if not key:
        print("No API key found.")
        return

    url = f"{supabase_url}/rest/v1/"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            paths = data.get('paths', {})
            rpcs = [path for path in paths if path.startswith('/rpc/')]
            print("Exposed RPCs:")
            for rpc in sorted(rpcs):
                print(rpc)
    except Exception as e:
        print("Error fetching OpenAPI schema:", e)

if __name__ == '__main__':
    main()
