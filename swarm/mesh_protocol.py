import socket
import threading
import json
import time
from typing import Dict, Any, List

class SwarmMeshEngine:
    """
    Distributed Communication Layer.
    Implements UDP broadcast for peer discovery, TCP for agent messaging,
    routing, presence beacons, heartbeats, and mesh-wide announcements.
    """
    def __init__(self, node_id: str = "lucy_node_1", port: int = 50505):
        self.node_id = node_id
        self.port = port
        self.broadcast_port = 50506
        self.running = False
        self.peers = {} # {ip: {last_seen, capabilities, load}}
        self.message_callbacks = {}

    def start(self):
        self.running = True
        threading.Thread(target=self._udp_beacon_loop, daemon=True).start()
        threading.Thread(target=self._udp_listen_loop, daemon=True).start()
        threading.Thread(target=self._tcp_listen_loop, daemon=True).start()
        threading.Thread(target=self._peer_cleanup_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def register_callback(self, action: str, callback):
        self.message_callbacks[action] = callback

    def _udp_beacon_loop(self):
        """Broadcasts presence beacons and heartbeats."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        
        while self.running:
            payload = json.dumps({
                "action": "presence_beacon", 
                "node_id": self.node_id, 
                "port": self.port,
                "timestamp": time.time(),
                "capabilities": ["compute", "memory", "tools"],
                "load": 0.5
            })
            try:
                sock.sendto(payload.encode(), ('<broadcast>', self.broadcast_port))
            except Exception:
                pass
            time.sleep(3)
        sock.close()

    def _udp_listen_loop(self):
        """Listens for peer beacons."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(('', self.broadcast_port))
        sock.settimeout(1.0)
        
        while self.running:
            try:
                data, addr = sock.recvfrom(2048)
                msg = json.loads(data.decode())
                if msg.get("action") == "presence_beacon" and msg.get("node_id") != self.node_id:
                    self.peers[addr[0]] = {
                        "last_seen": time.time(),
                        "capabilities": msg.get("capabilities", []),
                        "load": msg.get("load", 0.0),
                        "node_id": msg.get("node_id")
                    }
            except socket.timeout:
                continue
            except Exception:
                pass
        sock.close()

    def _peer_cleanup_loop(self):
        """Removes dead peers from the mesh."""
        while self.running:
            now = time.time()
            dead_peers = [ip for ip, data in self.peers.items() if now - data["last_seen"] > 10]
            for ip in dead_peers:
                del self.peers[ip]
            time.sleep(5)

    def _tcp_listen_loop(self):
        """TCP server for agent messaging and task routing."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(('', self.port))
        sock.listen(10)
        sock.settimeout(1.0)
        
        while self.running:
            try:
                conn, addr = sock.accept()
                threading.Thread(target=self._handle_client, args=(conn, addr), daemon=True).start()
            except socket.timeout:
                continue
            except Exception:
                pass
        sock.close()

    def _handle_client(self, conn: socket.socket, addr: tuple):
        try:
            data = conn.recv(8192)
            if data:
                msg = json.loads(data.decode())
                self._route_message(msg, addr[0])
        except Exception:
            pass
        finally:
            conn.close()

    def _route_message(self, msg: Dict[str, Any], source_ip: str):
        """Routes message to the correct local callback based on addressing."""
        action = msg.get("action")
        target_agent = msg.get("target_agent", "broadcast")
        
        if action in self.message_callbacks:
            self.message_callbacks[action](msg, source_ip)
        else:
            print(f"[SwarmMesh] Unhandled message action: {action} from {source_ip}")

    def send_message(self, target_ip: str, payload: Dict[str, Any]) -> bool:
        """Sends a direct TCP message to a peer."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2.0)
            sock.connect((target_ip, self.port))
            sock.sendall(json.dumps(payload).encode())
            sock.close()
            return True
        except Exception:
            return False

    def broadcast_announcement(self, payload: Dict[str, Any]):
        """Mesh-wide task announcements to all peers."""
        for peer_ip in list(self.peers.keys()):
            self.send_message(peer_ip, payload)

    def get_active_peers(self) -> Dict[str, Any]:
        return self.peers

