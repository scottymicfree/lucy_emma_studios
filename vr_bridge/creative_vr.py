from .command_layer import VRCommandLayer

class CreativeEngineVR:
    """
    Creative Engine VR Integration.
    Visualizes divergence maps spatially, shows reasoning chains as 3D graphs,
    and compares outcomes in VR panels.
    """
    def __init__(self, command_layer: VRCommandLayer):
        self.command = command_layer

    def visualize_divergence_spatially(self, divergence_map: dict):
        print("[CreativeVR] Spawning 3D divergence map branches in VR space.")
        self.command.dispatch_command("spawn_3d_graph", "divergence_map", divergence_map)

    def show_reasoning_chains(self, reasoning_chains: list):
        print("[CreativeVR] Extruding reasoning chains as 3D pathways.")
        self.command.dispatch_command("render_pathways", "reasoning", {"chains": len(reasoning_chains)})

    def compare_outcomes_vr(self, comparisons: list):
        print("[CreativeVR] Opening spatial UI panels for outcome comparison.")
        self.command.dispatch_command("open_ui_panels", "comparisons", {"count": len(comparisons)})
