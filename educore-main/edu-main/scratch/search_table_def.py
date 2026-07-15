import os

def search_table_def():
    print("Searching for TABLE fee_records in SQL files...")
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith('.sql'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        if 'fee_records' in content:
                            print(f"Found reference in {filepath}")
                            # Print lines around the definition
                            lines = content.split('\n')
                            for i, line in enumerate(lines):
                                if 'create table' in line.lower() and 'fee_records' in line.lower():
                                    print(f"--- Definition in {filepath} at line {i+1} ---")
                                    for j in range(max(0, i-5), min(len(lines), i+30)):
                                        print(f"{j+1}: {lines[j]}")
                except Exception as e:
                    pass

if __name__ == '__main__':
    search_table_def()
