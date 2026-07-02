import time
import json
import random
import requests
import psutil

# Configuration
NGROK_URL = "http://localhost:3000" # Replace with your actual ngrok URL pointing to the Lucy Core
TELEMETRY_ENDPOINT = f"{NGROK_URL}/api/telemetry"
UPDATE_INTERVAL = 1.0 # seconds

def get_os_telemetry():
    """
    Gathers local OS telemetry.
    In a real scenario, this would hook into Unreal Engine or deeper OS metrics.
    """
    cpu_load = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    
    # Mocking GPU and Thermal as psutil doesn't natively support them across all platforms easily
    gpu_load = random.uniform(10.0, 90.0)
    thermal = random.uniform(40.0, 85.0)

    return {
        "cpuLoad": cpu_load,
        "gpuLoad": gpu_load,
        "memoryUsage": memory.used / (1024 ** 3), # Convert to GB
        "thermal": thermal
    }

def run_bootstrap():
    print("=========================================")
    print("🚀 UNIFIED CORE BOOTSTRAP INITIALIZED 🚀")
    print("=========================================")
    print(f"Targeting Hyper-Lucy Core at: {NGROK_URL}")
    print("Bridging OS Telemetry Tunnel...")
    
    while True:
        try:
            telemetry = get_os_telemetry()
            response = requests.post(TELEMETRY_ENDPOINT, json=telemetry)
            
            if response.status_code == 200:
                print(f"[SUCCESS] Telemetry Synced: CPU {telemetry['cpuLoad']}% | Thermal {telemetry['thermal']:.1f}°C")
            else:
                print(f"[WARNING] Sync Failed. Status Code: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Tunnel Disconnected. Is ngrok running? Error: {e}")
            
        time.sleep(UPDATE_INTERVAL)

if __name__ == "__main__":
    try:
        run_bootstrap()
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Unified Core Bootstrap Terminated.")
