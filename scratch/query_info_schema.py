import urllib.request
import json

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODA2NywiZXhwIjoyMDk4NjY0MDY3fQ.4kwXWTwDx-0ywwLAmfDhR8zIxt2nGZ5WzdssDX0CjCI"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

def rpc_query(sql):
    url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"
    payload = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error_code": e.code, "error_body": e.read().decode()}
    except Exception as e:
        return {"error": str(e)}

# Get list of all tables
print("=" * 80)
print("Listing all tables and columns in 'public' schema:")
print("=" * 80)
sql = """
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"""
res = rpc_query(sql)
if isinstance(res, list):
    current_table = ""
    for row in res:
        tbl = row.get("table_name")
        col = row.get("column_name")
        typ = row.get("data_type")
        if tbl != current_table:
            print(f"\nTable: {tbl}")
            current_table = tbl
        print(f"  - {col} ({typ})")
else:
    print("Error querying schema info:", res)
