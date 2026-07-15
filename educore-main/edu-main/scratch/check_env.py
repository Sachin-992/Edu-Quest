with open("c:/Users/Ragu/Downloads/edu-core/edu-main/.env", "r") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#"):
            key = line.split("=")[0]
            print(key)
