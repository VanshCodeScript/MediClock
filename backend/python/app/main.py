from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .models import InteractionCheckRequest, InteractionsListResponse, DrugsListResponse, InteractionResponse
from .interaction_engine import InteractionEngine

# Initialize FastAPI app
app = FastAPI(
    title="Drug Interaction API",
    description="API for detecting drug-drug interactions",
    version="1.0.0"
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",   # Alternative port
        "https://localhost:5173",
        "http://127.0.0.1:5173",
        "*"  # Allow all origins (secure this in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize interaction engine
csv_path = os.path.join(os.path.dirname(__file__), "../../data/db_drug_interactions.csv")
try:
    engine = InteractionEngine(csv_path)
    print("✓ Interaction engine initialized successfully")
except Exception as e:
    print(f"✗ Failed to initialize interaction engine: {e}")
    engine = None


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "status": "ok",
        "message": "Drug Interaction API is running",
        "timestamp": __import__("datetime").datetime.now().isoformat()
    }


@app.post("/interactions", response_model=InteractionsListResponse)
async def check_interactions(request: InteractionCheckRequest):
    """
    Check for drug-drug interactions.
    
    Args:
        request: InteractionCheckRequest with list of drugs
        
    Returns:
        InteractionsListResponse with detected interactions
    """
    if not engine:
        return InteractionsListResponse(interactions=[])
    
    # Remove duplicates and filter empty strings
    drugs = [d.strip() for d in request.drugs if d.strip()]
    drugs = list(set(drugs))
    
    if len(drugs) < 2:
        return InteractionsListResponse(interactions=[])
    
    # Get interactions
    interactions = engine.check_interactions(drugs)
    
    return InteractionsListResponse(interactions=interactions)


@app.get("/drugs", response_model=DrugsListResponse)
async def get_drugs():
    """
    Get list of all available drugs.
    
    Returns:
        DrugsListResponse with list of drug names
    """
    if not engine:
        return DrugsListResponse(drugs=[])
    
    drugs = engine.get_drugs_list()
    return DrugsListResponse(drugs=drugs)


@app.get("/stats")
async def get_statistics():
    """Get dataset statistics."""
    if not engine:
        return {"error": "Engine not initialized"}
    
    return engine.get_statistics()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if engine else "error",
        "engine_ready": engine is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
