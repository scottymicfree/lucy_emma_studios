from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class WeatherNodeProperties(BaseModel):
    station_id: str
    barometric_pressure_mb: float
    sea_surface_temp_c: Optional[float] = None
    atmospheric_moisture_pct: float
    historical_baseline_deviation: float

class SeismicNodeProperties(BaseModel):
    event_id: str
    magnitude: float
    depth_km: float
    fault_line_proximity: float
    tectonic_plate: str

class VolcanoNodeProperties(BaseModel):
    volcano_id: str
    current_alert_level: str
    ash_plume_height_ft: Optional[float] = 0.0
    magma_viscosity_index: int
    last_major_eruption_year: int

class SpaceWeatherProperties(BaseModel):
    kp_index: int = Field(..., ge=0, le=9)
    solar_proton_flux: float
    geomagnetic_storm_class: str # G1 to G5
    impact_radius_km: float

class SchemaLLMPathExtractor(BaseModel):
    """
    Extracted path validation rules and graph nodes to capture earth/space weather telemetry structures
    """
    weather: Optional[WeatherNodeProperties] = None
    seismic: Optional[SeismicNodeProperties] = None
    volcano: Optional[VolcanoNodeProperties] = None
    space_weather: Optional[SpaceWeatherProperties] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
