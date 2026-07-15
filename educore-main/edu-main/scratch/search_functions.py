import os

def search_functions():
    print("Searching for database functions in SQL files...")
    for root, dirs, files in os.walk('sql'):
        for file in files:
            if file.endswith('.sql'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_no, line in enumerate(f, 1):
                            if 'create' in line.lower() and 'function' in line.lower():
                                print(f"{filepath}:{line_no}: {line.strip()}")
                except Exception as e:
                    pass

if __name__ == '__main__':
    search_functions()
