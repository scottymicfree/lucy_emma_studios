import numpy as np
import time
from typing import Dict, Any, Optional

try:
    import mss
except ImportError:
    mss = None

class SensoryVisionCore:
    """
    Production implementation of Lucy's local visual cortex.
    Captures raw screen buffers directly from the OS GPU pipeline.
    """
    def __init__(self):
        self.sct = mss.mss() if mss else None
        
    def capture_primary_display(self) -> Optional[np.ndarray]:
        """Captures the main monitor frame as a raw numpy array."""
        if not self.sct:
            raise RuntimeError("mss library required for visual capture.")
            
        monitor = self.sct.monitors[1] # Monitor 1 is primary
        sct_img = self.sct.grab(monitor)
        
        # Convert to numpy array (BGRA to RGB conversion usually follows)
        img_array = np.array(sct_img)
        return img_array

    def detect_motion(self, frame_a: np.ndarray, frame_b: np.ndarray, threshold: float = 0.05) -> bool:
        """Calculates pixel delta to determine if screen state has changed."""
        difference = np.abs(frame_a.astype(int) - frame_b.astype(int))
        changed_pixels = np.count_nonzero(difference > 30)
        total_pixels = frame_a.size
        
        change_ratio = changed_pixels / total_pixels
        return change_ratio > threshold
