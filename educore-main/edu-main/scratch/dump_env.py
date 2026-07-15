import os

def main():
    print("Environment variables:")
    for k, v in os.environ.items():
        # Mask potentially sensitive values
        if any(sec in k.lower() for sec in ['key', 'secret', 'pass', 'token']):
            v_masked = v[:5] + '...' + v[-5:] if len(v) > 10 else '...'
            print(f"  {k} = {v_masked}")
        else:
            print(f"  {k} = {v}")

if __name__ == '__main__':
    main()
