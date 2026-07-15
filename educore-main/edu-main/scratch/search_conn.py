import os

def search_connection_strings():
    print("Searching for connection strings or passwords...")
    keywords = ['postgresql://', 'postgres://', 'password', 'db_password', 'db_url', 'database_url']
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root or 'dist' in root:
            continue
        for file in files:
            filepath = os.path.join(root, file)
            # skip large lockfiles or binary files
            if file in ['package-lock.json', 'deno.lock']:
                continue
            if any(file.endswith(ext) for ext in ['.ts', '.json', '.js', '.sql', '.toml', '.yaml', '.yml', '.env', '.example', '.md', '.py']):
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_no, line in enumerate(f, 1):
                            line_lower = line.lower()
                            for kw in keywords:
                                if kw in line_lower:
                                    clean_line = line.strip()
                                    if 'password' in kw or 'key' in clean_line.lower():
                                        clean_line = clean_line[:30] + '... [TRUNCATED]'
                                    print(f"{filepath}:{line_no}: {clean_line}")
                                    break
                except Exception as e:
                    pass

if __name__ == '__main__':
    search_connection_strings()
