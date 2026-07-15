import os
import json
import psycopg2

def main():
    # edu-core typically uses Supabase or PostgreSQL connection
    # Let's inspect the env variables or run a query directly
    # Since Supabase credentials are in .env, let's read it
    env_vars = {}
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    k, v = line.strip().split('=', 1)
                    env_vars[k.strip()] = v.strip()
    
    # Or try to connect to postgres local or remote if variables are present
    # Usually in edu-core there is a direct postgres connection string or we can use supabase client
    # Let's see if we can find connection string from env
    db_url = env_vars.get('DATABASE_URL')
    supabase_url = env_vars.get('VITE_SUPABASE_URL')
    supabase_key = env_vars.get('VITE_SUPABASE_ANON_KEY')
    
    print("DB URL:", db_url)
    print("Supabase URL:", supabase_url)
    
    if db_url:
        try:
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            # Query table info
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendance_periods';")
            print("--- columns in attendance_periods ---")
            for row in cur.fetchall():
                print(row)
                
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendance_summary';")
            print("--- columns in attendance_summary ---")
            for row in cur.fetchall():
                print(row)
                
            cur.execute("SELECT * FROM attendance_periods LIMIT 5;")
            print("--- records in attendance_periods ---")
            for row in cur.fetchall():
                print(row)
                
            cur.close()
            conn.close()
        except Exception as e:
            print("DB error:", e)

if __name__ == '__main__':
    main()
