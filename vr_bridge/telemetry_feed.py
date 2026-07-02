from .openxr_bindings import OpenXRBindings
from .schemas import VRTelemetrySchema

class VRTelemetryFeed:
    """
    VR -> Lucy Telemetry Feed.
    Pipes spatial and temporal VR events to Lucy's core engine.
    """
    def __init__(self, bindings: OpenXRBindings):
        self.bindings = bindings

    def get_latest_feed(self) -> VRTelemetrySchema:
        telemetry = self.bindings.poll_telemetry()
        print(f"[VRTelemetry] Ingested VR Telemetry. Headset Y: {telemetry['headset_pose']['y']:.2f}")
        return telemetry
