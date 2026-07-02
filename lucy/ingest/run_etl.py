from lucy.ingest.sources.ai_source import AISourceETL
from lucy.ingest.sources.economy_source import EconomySourceETL
from lucy.ingest.sources.climate_source import ClimateSourceETL

def main():
    print("Starting historical data ingestion pipeline...")
    
    ai_etl = AISourceETL()
    ai_etl.run()
    
    econ_etl = EconomySourceETL()
    econ_etl.run()
    
    climate_etl = ClimateSourceETL()
    climate_etl.run()
    
    print("Ingestion pipeline complete.")

if __name__ == "__main__":
    main()
