# Drug Interaction Detection API

FastAPI backend for detecting drug-drug interactions.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

## API Endpoints

### POST /interactions
Check for interactions between multiple drugs.

**Request:**
```json
{
  "drugs": ["Metformin", "Aspirin", "Warfarin"]
}
```

**Response:**
```json
{
  "interactions": [
    {
      "drugA": "Warfarin",
      "drugB": "Aspirin",
      "severity": "high",
      "note": "Significantly increased bleeding risk."
    }
  ]
}
```

### GET /drugs
Get list of all available drugs in database.

**Response:**
```json
{
  "drugs": ["Atorvastatin", "Amlodipine", "Metformin", ...]
}
```

### GET /stats
Get dataset statistics.

**Response:**
```json
{
  "total_interactions": 191541,
  "unique_drugs": 3000,
  "data_loaded": true
}
```

### GET /health
Health check endpoint.

## Features

- **Fast O(1) Lookup**: Dictionary-based interaction lookup
- **Rule-Based Severity Classification**: High/Medium/Low severity levels
- **CORS Enabled**: Ready for frontend integration
- **Bidirectional Matching**: "Drug A + Drug B" = "Drug B + Drug A"

## Severity Rules

- **High**: Contains "contraindicated", "severe", "fatal", "avoid", etc.
- **Medium**: Contains "increase", "decrease", "monitor", "risk", etc.
- **Low**: Everything else
