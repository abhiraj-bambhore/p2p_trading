import sys
import os
import platform

print(f"Python version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Executable: {sys.executable}")
print(f"CWD: {os.getcwd()}")
print(f"Path: {sys.path}")

try:
    import copy
    print("Successfully imported copy")
    import web3
    print(f"Successfully imported web3 {web3.__version__}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
