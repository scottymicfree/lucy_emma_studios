from .schemas import SpatialInteractionSchema

class SpatialInteractionSystem:
    """
    Handles Lucy's ability to spawn/manipulate objects, open timelines, 
    draw divergence maps, and highlight nodes.
    Tied to Orchestrator + Creative Engine.
    """
    def __init__(self):
        self.active_objects = []
        self.timeline_visible = False
        self.divergence_map_drawn = False
        self.highlighted_nodes = []

    def spawn_object(self, obj_id: str):
        print(f"[VRSpatial] Lucy spawned {obj_id} in VR space.")
        self.active_objects.append(obj_id)

    def toggle_timeline(self, visible: bool):
        print(f"[VRSpatial] Lucy {'opened' if visible else 'closed'} the 3D simulation timeline.")
        self.timeline_visible = visible

    def draw_divergence_map(self):
        print("[VRSpatial] Lucy is drawing the creative divergence map in space.")
        self.divergence_map_drawn = True

    def highlight_mesh_node(self, node_id: str):
        print(f"[VRSpatial] Lucy highlighted NodeMesh node: {node_id}")
        if node_id not in self.highlighted_nodes:
            self.highlighted_nodes.append(node_id)

    def get_interaction_state(self) -> SpatialInteractionSchema:
        return {
            "active_objects": self.active_objects,
            "timeline_visible": self.timeline_visible,
            "divergence_map_drawn": self.divergence_map_drawn,
            "highlighted_nodes": self.highlighted_nodes
        }
