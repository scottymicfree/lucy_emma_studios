class VRSafetyRails:
    """
    VR Safety Rails.
    Handles boundary detection, overload prevention, emotional drift protection,
    and creative entropy caps during VR immersion.
    """
    def __init__(self):
        self.entropy_cap = 0.85

    def check_boundaries(self, telemetry: dict):
        pose = telemetry.get("headset_pose", {})
        if pose.get("x", 0) > 1.8 or pose.get("x", 0) < -1.8:
            print("[VRSafety] Boundary warning triggered.")
            return False
        return True

    def enforce_entropy_cap(self, current_entropy: float):
        if current_entropy > self.entropy_cap:
            print(f"[VRSafety] Capping creative/emotional entropy at {self.entropy_cap}.")
            return self.entropy_cap
        return current_entropy

    def prevent_overload(self, simulation_intensity: float):
        if simulation_intensity > 0.9:
            print("[VRSafety] High intensity detected. Activating VR decompression safety net.")
            return True
        return False
