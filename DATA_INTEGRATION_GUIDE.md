# Integration Guide - Connecting Real Health Data

## Overview

The 3D visualization system is designed to work with mock data by default, but can be easily connected to real health data sources. This guide explains how to integrate with various APIs and data providers.

## Current Implementation (Mock Data)

The `useHealthMetrics` hook currently provides mock data that simulates real health metrics:

```typescript
// Current: Mock data with natural variations
const metrics = {
  stress: 45,
  bloodSugar: 102,
  heartRate: 72,
  sleepScore: 78,
  medicationRisk: 35,
};
```

## Integration Options

### Option 1: Backend Health Database (Recommended)

**Implementation**: Connect to your backend REST API

```typescript
// hooks/useHealthMetrics.ts
export const useHealthMetrics = (): HealthMetrics => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    stress: 0,
    bloodSugar: 0,
    heartRate: 0,
    sleepScore: 0,
    medicationRisk: 0,
  });

  useEffect(() => {
    // Fetch from your backend API
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/health-metrics`,
          {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
            },
          }
        );
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch health metrics:', error);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Real-time updates every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};
```

**Backend API Endpoint**:
```
GET /api/health-metrics
Response: {
  stress: number,
  bloodSugar: number,
  heartRate: number,
  sleepScore: number,
  medicationRisk: number
}
```

### Option 2: Google Fit API (Wearable Data)

**Setup**:
1. Install Google Fit dependencies: `npm install @react-oauth/google`
2. Get OAuth credentials from Google Cloud Console
3. Implement the integration:

```typescript
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

export const useHealthMetrics = (): HealthMetrics => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    stress: 0,
    bloodSugar: 0,
    heartRate: 0,
    sleepScore: 0,
    medicationRisk: 0,
  });

  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      try {
        const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources', {
          headers: {
            Authorization: `Bearer ${credentialResponse.access_token}`,
          },
        });

        const data = await response.json();
        
        // Calculate metrics from Google Fit data
        const heartRate = await fetchHeartRate(credentialResponse.access_token);
        const sleepData = await fetchSleepData(credentialResponse.access_token);

        setMetrics({
          stress: calculateStress(data),
          bloodSugar: 0, // Not available from Google Fit directly
          heartRate: heartRate,
          sleepScore: calculateSleepScore(sleepData),
          medicationRisk: 0, // Requires additional data sources
        });
      } catch (error) {
        console.error('Failed to fetch Google Fit data:', error);
      }
    },
  });

  return metrics;
};
```

### Option 3: WebSocket Real-Time Updates

**Implementation**: For real-time data from wearable devices

```typescript
export const useHealthMetrics = (): HealthMetrics => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    stress: 0,
    bloodSugar: 0,
    heartRate: 0,
    sleepScore: 0,
    medicationRisk: 0,
  });

  useEffect(() => {
    const ws = new WebSocket(
      `wss://${import.meta.env.VITE_BACKEND_URL}/ws/health-metrics`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as HealthMetrics;
      setMetrics(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return metrics;
};
```

### Option 4: Healthcare Interoperability (HL7/FHIR)

**Implementation**: Connect to FHIR-compliant healthcare systems

```typescript
// hooks/useHealthMetrics.ts
import * as fhir from 'fhirpath';

export const useHealthMetrics = (): HealthMetrics => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    stress: 0,
    bloodSugar: 0,
    heartRate: 0,
    sleepScore: 0,
    medicationRisk: 0,
  });

  useEffect(() => {
    const fetchFHIRData = async () => {
      try {
        // Fetch observations from FHIR server
        const response = await fetch(
          `${import.meta.env.VITE_FHIR_SERVER}/Observation`,
          {
            headers: {
              Authorization: `Bearer ${getFHIRToken()}`,
              Accept: 'application/fhir+json',
            },
          }
        );

        const bundle = await response.json();
        const observations = bundle.entry?.map((e: any) => e.resource) || [];

        // Extract metrics from FHIR observations
        const heartRateObs = observations.find(
          (o: any) => o.code?.coding?.[0]?.code === '8867-4'
        );
        const bloodSugarObs = observations.find(
          (o: any) => o.code?.coding?.[0]?.code === '2345-7'
        );

        setMetrics({
          stress: calculateFromObservations(observations, 'stress-level'),
          bloodSugar: heartRateObs?.valueQuantity?.value || 0,
          heartRate: bloodSugarObs?.valueQuantity?.value || 0,
          sleepScore: calculateFromObservations(observations, 'sleep-duration'),
          medicationRisk: calculateMedicationRisk(
            await fetchMedications()
          ),
        });
      } catch (error) {
        console.error('Failed to fetch FHIR data:', error);
      }
    };

    fetchFHIRData();
    const interval = setInterval(fetchFHIRData, 60000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};
```

### Option 5: AI Prediction Engine

**Implementation**: Use ML models to predict health metrics

```typescript
// hooks/useHealthMetrics.ts
import * as tf from '@tensorflow/tfjs';

export const useHealthMetrics = (): HealthMetrics => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    stress: 0,
    bloodSugar: 0,
    heartRate: 0,
    sleepScore: 0,
    medicationRisk: 0,
  });

  useEffect(() => {
    const predictMetrics = async () => {
      try {
        // Load historical data
        const historicalData = await fetchHistoricalData();

        // Use TensorFlow model for predictions
        const model = await tf.loadLayersModel(
          'indexeddb://health-metrics-model'
        );

        const input = tf.tensor2d([historicalData]);
        const predictions = model.predict(input) as tf.Tensor;
        const values = await predictions.data();

        setMetrics({
          stress: values[0],
          bloodSugar: values[1],
          heartRate: values[2],
          sleepScore: values[3],
          medicationRisk: values[4],
        });

        // Cleanup
        input.dispose();
        predictions.dispose();
      } catch (error) {
        console.error('Failed to predict metrics:', error);
      }
    };

    predictMetrics();
    const interval = setInterval(predictMetrics, 60000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};
```

## Environment Configuration

Create a `.env.local` file in the frontend directory:

```env
# Backend API
VITE_BACKEND_URL=http://localhost:3001

# Google Fit
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_SCOPES=https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read

# FHIR Server
VITE_FHIR_SERVER=https://your-fhir-server.com
VITE_FHIR_CLIENT_ID=your-fhir-client-id

# Feature Flags
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_GOOGLE_FIT=true
VITE_ENABLE_FHIR=false
VITE_ENABLE_WEBSOCKET=true
```

## Backend Implementation Example (Node.js Express)

```typescript
// backend/routes/health-metrics.ts
import express from 'express';

const router = express.Router();

router.get('/health-metrics', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch latest metrics from database
    const metrics = await db.HealthMetrics.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      stress: metrics?.stressLevel || 0,
      bloodSugar: metrics?.bloodSugar || 0,
      heartRate: metrics?.heartRate || 0,
      sleepScore: metrics?.sleepScore || 0,
      medicationRisk: calculateMedicationRisk(userId),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
```

## Database Schema

```sql
CREATE TABLE health_metrics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  stress_level INT CHECK (stress_level >= 0 AND stress_level <= 100),
  blood_sugar INT CHECK (blood_sugar >= 0),
  heart_rate INT CHECK (heart_rate >= 0),
  sleep_score INT CHECK (sleep_score >= 0 AND sleep_score <= 100),
  medication_risk INT CHECK (medication_risk >= 0 AND medication_risk <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX idx_health_metrics_created_at ON health_metrics(created_at);
```

## Error Handling Best Practices

```typescript
export const useHealthMetrics = (): HealthMetrics => {
  const [metrics, setMetrics] = useState<HealthMetrics>({...});
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await fetchHealthData();
        setMetrics(data);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        // Optionally show toast notification
        toast.error(`Failed to fetch metrics: ${error.message}`);
        // Fall back to cached data or mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return metrics;
};
```

## Testing Integration

```typescript
// __tests__/useHealthMetrics.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useHealthMetrics } from '../useHealthMetrics';

describe('useHealthMetrics Integration', () => {
  it('should fetch metrics from backend', async () => {
    const { result } = renderHook(() => useHealthMetrics());

    await waitFor(() => {
      expect(result.current.stress).toBeGreaterThanOrEqual(0);
      expect(result.current.bloodSugar).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('API Error'))
    );

    const { result } = renderHook(() => useHealthMetrics());

    await waitFor(() => {
      // Should still return valid default metrics
      expect(result.current).toBeDefined();
    });
  });
});
```

## Security Considerations

1. **Authentication**: Always require valid tokens/authentication
2. **Data Encryption**: Use HTTPS/WSS for all data transmission
3. **HIPAA Compliance**: If handling PHI, ensure HIPAA compliance
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Data Validation**: Validate all incoming metric values
6. **Token Refresh**: Implement automatic token refresh for long sessions
7. **Audit Logging**: Log all health data access for compliance

## Performance Optimization

1. **Caching**: Cache metrics locally for 30 seconds before refreshing
2. **Debouncing**: Debounce frequent API calls
3. **Lazy Loading**: Load visualization components on demand
4. **Data Pagination**: For historical data, use pagination
5. **Connection Pooling**: Reuse database connections

## Monitoring & Analytics

```typescript
// Track data fetching performance
const fetchMetrics = async () => {
  const startTime = performance.now();
  
  try {
    const data = await fetchHealthData();
    const endTime = performance.now();
    
    // Log performance metrics
    analytics.track('health_metrics_fetch', {
      duration: endTime - startTime,
      success: true,
    });
    
    return data;
  } catch (error) {
    const endTime = performance.now();
    
    analytics.track('health_metrics_fetch', {
      duration: endTime - startTime,
      success: false,
      error: error.message,
    });
    
    throw error;
  }
};
```

## Migration Path

To switch from mock data to real data:

1. **Phase 1**: Implement with mock data (current state) ✓
2. **Phase 2**: Add real data source alongside mock (feature flag)
3. **Phase 3**: Switch to real data by default
4. **Phase 4**: Remove mock data implementation

```typescript
const useHealthMetrics = (): HealthMetrics => {
  if (import.meta.env.VITE_ENABLE_MOCK_DATA) {
    return useMockHealthMetrics();
  } else {
    return useRealHealthMetrics();
  }
};
```

---

**Next Step**: Choose an integration option above and implement based on your available health data source.
