import numpy as np
from typing import Dict, Any, Optional

try:
    import mss
except ImportError:
    mss = None

try:
    import pyaudio
except ImportError:
    pyaudio = None

try:
    import pyautogui
except ImportError:
    pyautogui = None

class SensoryEngine:
    """
    Sensory Engine — Lucy's "Body" (Eyes, Ears, Hands)
    Provides full physical actuation, visual capture, and auditory processing.
    """
    def __init__(self):
        self.vision_active = True
        self.audio_active = True
        self.sct = mss.mss() if mss else None
        self.audio = pyaudio.PyAudio() if pyaudio else None

    def capture_vision(self) -> Optional[np.ndarray]:
        """Eyes: Raw screen buffer capture."""
        if not self.sct:
            return None
        monitor = self.sct.monitors[1]
        sct_img = self.sct.grab(monitor)
        return np.array(sct_img)

    def process_audio(self, record_seconds: int = 3, rate: int = 44100, chunk: int = 1024) -> Optional[bytes]:
        """Ears: Real-time audio stream capture."""
        if not self.audio:
            return None
            
        stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=rate,
            input=True,
            frames_per_buffer=chunk
        )
        
        frames = []
        for _ in range(0, int(rate / chunk * record_seconds)):
            data = stream.read(chunk)
            frames.append(data)
            
        stream.stop_stream()
        stream.close()
        return b"".join(frames)

    def physical_actuation(self, action: str, coordinates: Dict[str, int] = None, keys: str = None):
        """Hands: Mouse/keyboard UI automation."""
        if not pyautogui:
            return
        
        if action == "move" and coordinates:
            pyautogui.moveTo(coordinates.get('x', 0), coordinates.get('y', 0), duration=0.25)
        elif action == "click" and coordinates:
            pyautogui.click(x=coordinates.get('x', 0), y=coordinates.get('y', 0))
        elif action == "type" and keys:
            pyautogui.write(keys, interval=0.05)
        elif action == "hotkey" and keys:
            pyautogui.hotkey(*keys.split(','))
