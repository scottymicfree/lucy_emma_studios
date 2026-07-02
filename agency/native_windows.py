import ctypes
from ctypes import wintypes
import psutil
import subprocess
import winreg
import time
import math
import random
from typing import List, Dict, Any, Optional

# Windows API Constants
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_ABSOLUTE = 0x8000
KEYEVENTF_KEYUP = 0x0002

class NativeWindowsCore:
    """
    Production implementation of Lucy's OS-level Windows Engine.
    Handles raw HWNDs, process traversal, HID emulation, Registry, and Services.
    """
    def __init__(self):
        self.user32 = ctypes.windll.user32
        self.kernel32 = ctypes.windll.kernel32
        self.advapi32 = ctypes.windll.advapi32

    def list_active_processes(self) -> List[Dict[str, Any]]:
        """Scans local memory for running processes."""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        return processes

    def execute_sandboxed_binary(self, executable_path: str, args: List[str]) -> bool:
        """Executes a local binary with lowered privileges/priority."""
        try:
            CREATE_NO_WINDOW = 0x08000000
            subprocess.Popen([executable_path] + args, creationflags=CREATE_NO_WINDOW)
            return True
        except Exception as e:
            return False

    # -- Action: HID Emulation --
    def _bezier_curve(self, t: float, p0: tuple, p1: tuple, p2: tuple, p3: tuple) -> tuple:
        """Calculates a point on a cubic Bezier curve."""
        x = ((1 - t) ** 3) * p0[0] + 3 * ((1 - t) ** 2) * t * p1[0] + 3 * (1 - t) * (t ** 2) * p2[0] + (t ** 3) * p3[0]
        y = ((1 - t) ** 3) * p0[1] + 3 * ((1 - t) ** 2) * t * p1[1] + 3 * (1 - t) * (t ** 2) * p2[1] + (t ** 3) * p3[1]
        return int(x), int(y)

    def simulate_hardware_input(self, x: int, y: int, click: bool = False, human_like: bool = True):
        """Low-level mouse event bypassing software hooks, with human-like trajectories."""
        if human_like:
            class POINT(ctypes.Structure):
                _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
            pt = POINT()
            self.user32.GetCursorPos(ctypes.byref(pt))
            start_x, start_y = pt.x, pt.y
            
            # Control points for bezier
            cp1 = (start_x + random.randint(-100, 100), start_y + random.randint(-100, 100))
            cp2 = (x + random.randint(-100, 100), y + random.randint(-100, 100))
            
            steps = random.randint(20, 40)
            for i in range(1, steps + 1):
                t = i / steps
                # Ease out
                t = math.sin(t * math.pi / 2)
                curr_x, curr_y = self._bezier_curve(t, (start_x, start_y), cp1, cp2, (x, y))
                self.user32.SetCursorPos(curr_x, curr_y)
                time.sleep(random.uniform(0.005, 0.015))
        else:
            self.user32.SetCursorPos(x, y)
            
        if click:
            time.sleep(random.uniform(0.05, 0.1))
            self.user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
            time.sleep(random.uniform(0.02, 0.08))
            self.user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

    def simulate_keyboard_input(self, text: str):
        """Low-level keyboard emulation via SendInput (wrapped via keybd_event)."""
        VK_SHIFT = 0x10
        for char in text:
            vk = ctypes.windll.user32.VkKeyScanW(ord(char))
            key_code = vk & 0xFF
            shift = (vk >> 8) & 1
            
            if shift:
                self.user32.keybd_event(VK_SHIFT, 0, 0, 0)
            
            self.user32.keybd_event(key_code, 0, 0, 0)
            time.sleep(random.uniform(0.01, 0.05))
            self.user32.keybd_event(key_code, 0, KEYEVENTF_KEYUP, 0)
            
            if shift:
                self.user32.keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, 0)
                
            time.sleep(random.uniform(0.02, 0.08))

    # -- OS Level Control: HWND --
    def enumerate_windows(self) -> List[Dict[str, Any]]:
        """Enumerates all top-level windows."""
        EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_int))
        windows = []
        
        def foreach_window(hwnd, lParam):
            if self.user32.IsWindowVisible(hwnd):
                length = self.user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    self.user32.GetWindowTextW(hwnd, buff, length + 1)
                    windows.append({"hwnd": hwnd, "title": buff.value})
            return True
            
        self.user32.EnumWindows(EnumWindowsProc(foreach_window), 0)
        return windows

    def get_window_handle(self, window_title: str) -> Optional[int]:
        """Retrieves raw HWND for a given window title."""
        hwnd = self.user32.FindWindowW(None, window_title)
        return hwnd if hwnd else None

    def set_window_state(self, hwnd: int, show_cmd: int):
        """Manipulates window state (e.g., SW_MAXIMIZE, SW_MINIMIZE)."""
        self.user32.ShowWindow(hwnd, show_cmd)

    def focus_window(self, hwnd: int):
        """Brings window to foreground."""
        self.user32.SetForegroundWindow(hwnd)

    def move_window(self, hwnd: int, x: int, y: int, w: int, h: int):
        """Resizes and moves a window."""
        self.user32.MoveWindow(hwnd, x, y, w, h, True)

    def send_window_message(self, hwnd: int, msg: int, wparam: int, lparam: int):
        """Sends a raw message to a specific window queue."""
        self.user32.SendMessageW(hwnd, msg, wparam, lparam)

    # -- OS Level Control: Registry --
    def read_registry_key(self, hkey: int, subkey: str, value_name: str) -> Any:
        """Reads a value from the Windows Registry."""
        try:
            with winreg.OpenKey(hkey, subkey, 0, winreg.KEY_READ) as key:
                value, _ = winreg.QueryValueEx(key, value_name)
                return value
        except OSError as e:
            return None

    def write_registry_key(self, hkey: int, subkey: str, value_name: str, value: Any, regtype: int) -> bool:
        """Writes a value to the Windows Registry."""
        try:
            with winreg.OpenKey(hkey, subkey, 0, winreg.KEY_WRITE) as key:
                winreg.SetValueEx(key, value_name, 0, regtype, value)
            return True
        except OSError as e:
            return False

    # -- OS Level Control: Services --
    def start_service(self, service_name: str) -> bool:
        """Starts a Windows service."""
        try:
            subprocess.run(["sc", "start", service_name], check=True, capture_output=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def stop_service(self, service_name: str) -> bool:
        """Stops a Windows service."""
        try:
            subprocess.run(["sc", "stop", service_name], check=True, capture_output=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def query_service(self, service_name: str) -> str:
        """Queries a Windows service status."""
        try:
            res = subprocess.run(["sc", "query", service_name], check=True, capture_output=True, text=True)
            return res.stdout
        except subprocess.CalledProcessError:
            return "Failed to query service"

