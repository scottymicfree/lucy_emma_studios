from .schemas import VRCommandSchema
import datetime

class VRCommandLayer:
    """
    Lucy -> VR Command Layer.
    Allows spawning objects, manipulating environments, triggering animations,
    controlling UI panels, adjusting lighting, and running simulation overlays.
    """
    def __init__(self):
        self.command_queue = []

    def dispatch_command(self, command_type: str, target_id: str, parameters: dict) -> VRCommandSchema:
        cmd = {
            "command_type": command_type,
            "target_id": target_id,
            "parameters": parameters,
            "timestamp": str(datetime.datetime.now())
        }
        self.command_queue.append(cmd)
        print(f"[VRCommand] Dispatched: {command_type} on {target_id}")
        return cmd

    def spawn_object(self, obj_id: str, position: dict):
        return self.dispatch_command("spawn_object", obj_id, {"position": position})

    def adjust_lighting(self, intensity: float, color: str):
        return self.dispatch_command("adjust_lighting", "global", {"intensity": intensity, "color": color})

    def trigger_animation(self, entity_id: str, animation_state: str):
        return self.dispatch_command("trigger_animation", entity_id, {"state": animation_state})

    def show_simulation_overlay(self, overlay_data: dict):
        return self.dispatch_command("show_overlay", "hud", {"data": overlay_data})
