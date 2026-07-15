import os

def search_sql_files():
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.sql'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'exec_sql' in content:
                            print(f"Found 'exec_sql' in {filepath}")
                except Exception as e:
                    pass

if __name__ == '__main__':
    search_sql_files()
