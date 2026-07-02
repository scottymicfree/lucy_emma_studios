import requests
import json
import os
import sqlite3
from datetime import datetime

class PlanetaryTelemetryIngest:
    def __init__(self, neo4j_tool=None):
        self.graph = neo4j_tool or MockNeo4jTool()
        self.user_agent = {"User-Agent": "LucySovereignAlpha/2.4.0 (contact@lucy-engine.local)"}
        self.db_path = os.environ.get("LUCY_DB_DIR", "/tmp") + "/emma_history.db"

    def _log_timeseries(self, entity_id: str, domain: str, metric_name: str, value: float, unit: str, source: str):
        """Helper to log fetched telemetry metrics directly into local history SQLite"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO history_timeseries (timestamp, entity_id, domain, metric_name, value, unit, source, quality_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (datetime.utcnow().isoformat(), entity_id, domain, metric_name, value, unit, source, 0.98))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[SQLite Log Error] Failed to write to history timeseries: {e}")

    def _log_event(self, entity_id: str, domain: str, event_name: str, description: str, tags: str):
        """Helper to log environment alerts and event triggers into local history SQLite"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO history_events (timestamp, entity_id, domain, event_name, description, tags)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (datetime.utcnow().isoformat(), entity_id, domain, event_name, description, tags))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[SQLite Log Error] Failed to write to history events: {e}")

    def fetch_live_seismic_activity(self):
        """Ingest real-time global quakes from USGS FDSN catalog"""
        url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5"
        try:
            res = requests.get(url, headers=self.user_agent, timeout=10)
            if res.status_code == 200:
                data = res.json()
                features = data.get('features', [])
                print(f"[Telemetry Ingest] Harvested {len(features)} active global quakes.")
                
                # Update timeseries with count
                self._log_timeseries("USGS_SEISMIC", "planetary", "active_quakes_count", float(len(features)), "count", "USGS FDSN")
                
                for feature in features[:10]: # Process top 10 for performance and detail
                    props = feature['properties']
                    coords = feature['geometry']['coordinates']
                    
                    # Graph traverse simulation
                    self.graph.execute_grounded_traversal(
                        """
                        MERGE (q:SEISMIC_EVENT {id: $event_id})
                        SET q.magnitude = $mag, q.depth_km = $depth, q.place = $place, q.timestamp = $time
                        WITH q
                        MATCH (l:GEOGRAPHIC_LOCATION) WHERE distance(point({latitude: l.lat, longitude: l.lon}), point({latitude: $lat, longitude: $lon})) < 500000
                        MERGE (q)-[:IMPACTS {radius_km: 500}]->(l)
                        """,
                        {
                            "event_id": feature['id'], "mag": props['mag'], "depth": coords[2],
                            "place": props['place'], "time": props['time'], "lat": coords[1], "lon": coords[0]
                        }
                    )
                    
                    # Persist event in history DB
                    self._log_event(
                        entity_id=feature['id'],
                        domain="seismic",
                        event_name="EARTHQUAKE",
                        description=f"Magnitude {props['mag']} quake at {props['place']}. Depth: {coords[2]}km.",
                        tags=f"USGS,seismic,mag_{props['mag']}"
                    )
                    
                    # Log peak magnitude
                    self._log_timeseries(feature['id'], "seismic", "magnitude", float(props['mag']), "M", "USGS FDSN")
        except Exception as e:
            print(f"[Ingest Error] Failed to harvest USGS seismic feeds: {e}")

    def fetch_space_weather_telemetry(self):
        """Harvest real-time NOAA SWPC 3-day geomagnetic lookaheads and Kp-index readings"""
        url = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                latest_kp = res.json()[-1] # Grabs freshest chronological element
                kp_val = latest_kp.get('kp_index', 0)
                status_str = latest_kp.get('status', 'NOMINAL')
                print(f"[Telemetry Ingest] Harvested space weather telemetry. Kp-Index: {kp_val}, Status: {status_str}")
                
                self.graph.execute_grounded_traversal(
                    """
                    MERGE (sw:SPACE_WEATHER_NODE {observed_at: $time})
                    SET sw.kp_index = toInteger($kp), sw.status = $status
                    WITH sw
                    MATCH (infra:INFRASTRUCTURE_NODE) WHERE infra.type = 'TELEMETRY_LINK' OR infra.type = 'POWER_GRID'
                    MERGE (sw)-[:INFLUENCES_PROPAGATION {risk_factor: sw.kp_index * 0.1}]->(infra)
                    """,
                    {"time": latest_kp['time_tag'], "kp": round(kp_val), "status": status_str}
                )
                
                # Persist in history DB
                self._log_timeseries("NOAA_SPACE_WEATHER", "space", "kp_index", float(kp_val), "index", "NOAA SWPC")
                if kp_val >= 5:
                    self._log_event(
                        entity_id="NOAA_SWPC_STORM",
                        domain="space",
                        event_name="GEOMAGNETIC_STORM",
                        description=f"Active Geomagnetic Storm detected with Kp-Index of {kp_val}.",
                        tags="NOAA,space_weather,geomagnetic"
                    )
        except Exception as e:
            print(f"[Ingest Error] Space weather tracking drop: {e}")

    def fetch_weather_anomalies(self):
        """Harvest weather anomalies, barometric pressure shifts, and rainfall telemetry"""
        url = "https://api.open-meteo.com/v1/forecast?latitude=39.0&longitude=-94.0&current_weather=true"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                weather_data = res.json().get('current_weather', {})
                temp = weather_data.get('temperature', 20.0)
                windspeed = weather_data.get('windspeed', 10.0)
                weathercode = weather_data.get('weathercode', 0)
                
                print(f"[Telemetry Ingest] Weather parameters updated. Temp: {temp}C, Wind: {windspeed}km/h")
                
                self._log_timeseries("METEO_STATION", "weather", "temperature_c", float(temp), "C", "Open-Meteo")
                self._log_timeseries("METEO_STATION", "weather", "wind_speed_kmh", float(windspeed), "km/h", "Open-Meteo")
                
                # Weather alerts if severe code (e.g. storms/snow)
                if weathercode in [3, 95, 96, 99]:
                    self._log_event(
                        entity_id="METEO_ALERT",
                        domain="weather",
                        event_name="SEVERE_WEATHER_ALERT",
                        description=f"Severe storm activity (code {weathercode}) tracked near target watershed.",
                        tags="meteo,weather,storm"
                    )
        except Exception as e:
            print(f"[Ingest Error] Weather anomaly tracking drop: {e}")

    def fetch_crime_telemetry(self):
        """Simulate or pull safety / emergency dispatch alert counts for macro tracing"""
        try:
            import random
            incident_types = ["Power Grid Intrusion Attempt", "Cybernetic Core Scan Alert", "Substation Physical Disruption", "Byzantine Node Signal Jam"]
            count = random.randint(0, 3)
            
            print(f"[Telemetry Ingest] Core safety / crime tracking scan: {count} active alerts.")
            self._log_timeseries("SOVEREIGN_SECURITY", "crime", "incident_rate", float(count), "count", "Sovereign Dispatch")
            
            if count > 0:
                incident = random.choice(incident_types)
                self._log_event(
                    entity_id=f"CRIME_{random.randint(1000, 9999)}",
                    domain="safety",
                    event_name="SECURITY_BREACH_ALERT",
                    description=f"{incident} successfully contained at outer perimeter bounds.",
                    tags="safety,cyber,incident"
                )
        except Exception as e:
            print(f"[Ingest Error] Crime/Safety feed trace drop: {e}")

class MockNeo4jTool:
    """Mock Neo4j graph tool to handle execute_grounded_traversal in non-neo4j environments"""
    def execute_grounded_traversal(self, query: str, params: dict):
        # Graceful logging or routing
        pass
