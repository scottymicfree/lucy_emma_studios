class SimulationRequestParser:
    def identify_domain(self, request_str: str):
        # Extract domain from request
        if "Run a future simulation of" in request_str:
            return request_str.replace("Run a future simulation of", "").strip().strip(".")
        return "General Domain"
