import urllib.request
import json

SUPABASE_URL = "https://oeaowgbycenftvhwonyb.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYW93Z2J5Y2VuZnR2aHdvbnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODgwNjcsImV4cCI6MjA5ODY2NDA2N30.DdstUAADhQibd3b5CecmiCRkM1ED7dvg9yLimLRiuS4"

def query_anon(table):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}?select=*",
        headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return len(json.loads(resp.read()))
    except Exception as e:
        return str(e)

for tbl in ["students", "teachers", "parents", "classes"]:
    print(f"Table '{tbl}' count via ANON key: {query_anon(tbl)}")
