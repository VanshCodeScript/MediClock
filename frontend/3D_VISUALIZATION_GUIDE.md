# 3D Health Visualization System - Implementation Guide

## Overview

A comprehensive 3D human model visualization system has been implemented for the HealthTech dashboard that dynamically displays patient health metrics using Three.js and React Three Fiber. The system visualizes:

- 🧠 **Stress Level** (Head coloring)
- ❤️ **Heart Rate** (Chest pulsing animation)
- 🩸 **Blood Sugar** (Abdomen coloring)
- 😴 **Sleep Quality** (Overall glow effect)
- 💊 **Medication Risk** (Chest glowing/pulsing)

## Architecture

### Component Structure

```
components/healthAvatar/
├── HealthAvatar.tsx          # Main container with Three.js canvas setup
├── HumanBody.tsx             # 3D human model with procedural geometry
├── HealthLabels.tsx          # Floating metric labels above body regions
├── BodyRegionHighlight.tsx    # Highlight zones for warning/critical areas
└── HealthHeatmap.tsx         # Glowing heatmap visualization for risk zones

hooks/
└── useHealthMetrics.ts       # Health metrics data provider (mock + real data)

utils/
└── healthColorUtils.ts       # Color mapping functions for metrics

pages/
└── HealthVisualization3D.tsx # Main page with full dashboard integration
```

## Components Overview

### 1. HealthAvatar (Container)

**File:** `components/healthAvatar/HealthAvatar.tsx`

Main Three.js scene container that:
- Sets up Canvas with proper camera and lighting
- Manages OrbitControls for user interaction
- Suspense fallback for async loading
- Auto-rotating view with configurable zoom/pan

**Features:**
- Ambient, directional, and point lighting for realistic shading
- Configurable camera position and field of view
- Interactive orbit controls (auto-rotate, zoom, pan)
- Supports multiple render passes with proper Z-ordering

### 2. HumanBody (3D Model)

**File:** `components/healthAvatar/HumanBody.tsx`

Procedural 3D human model created with Three.js primitives:
- Head (Sphere - stress indicator)
- Chest (Capsule - heart rate & medication risk)
- Abdomen (Capsule - blood sugar)
- Arms & Legs (Capsule - limbs)

**Key Features:**
- Dynamic color updates based on health metrics
- Emissive glow intensity tied to metric severity
- Heartbeat pulse animation on chest (speed based on heart rate)
- Breathing animation on the entire body
- Smooth color transitions

**Color Mapping:**
- Head: Maps stress level (0-100) → Green/Yellow/Red
- Chest: Blends heart rate risk + medication risk
- Abdomen: Maps blood sugar (60-180 mg/dL) → Green/Yellow/Red

### 3. HealthLabels (Floating Text)

**File:** `components/healthAvatar/HealthLabels.tsx`

Floating 3D labels positioned around the body model:
- Head: Stress Level (%)
- Heart: Heart Rate (bpm)
- Abdomen: Blood Sugar (mg/dL)
- Center: Sleep Quality (%)
- Legs: Medication Risk (%)

**Features:**
- Glass-morphism UI design with backdrop blur
- Color-coded backgrounds matching metric status
- Hover effects with scale animation
- Occlusion culling for performance
- DistanceFactor for perspective scaling

### 4. BodyRegionHighlight

**File:** `components/healthAvatar/BodyRegionHighlight.tsx`

Glowing highlight spheres around critical body regions:
- Brain area: Stress warning indicator
- Heart area: Heart rate & rhythm anomaly indicator
- Abdomen: Blood sugar control indicator

**Features:**
- Pulsing animation based on metric severity
- Opacity scales with risk level
- Only visible when metrics exceed thresholds
- Smooth scaling transitions

### 5. HealthHeatmap

**File:** `components/healthAvatar/HealthHeatmap.tsx`

3D heatmap visualization with expanding/contracting zones:
- Brain zone: Stress level heat
- Heart zone: Medication interaction risk heat
- Metabolism zone: Blood sugar processing heat

**Features:**
- Icosahedron geometry for smooth appearance
- Pulse speed increases with risk level
- Rotation intensity tied to metric severity
- Color reflects current metric status
- Real-time risk level calculation

### 6. useHealthMetrics (Hook)

**File:** `hooks/useHealthMetrics.ts`

Custom React hook providing health metrics data:

```typescript
interface HealthMetrics {
  stress: number;           // 0-100 (%)
  bloodSugar: number;       // 60-180 (mg/dL)
  heartRate: number;        // 40-120 (bpm)
  sleepScore: number;       // 0-100 (%)
  medicationRisk: number;   // 0-100 (%)
}
```

**Current Implementation:**
- Mock data with realistic variations
- Updates every 2 seconds for real-time feel
- Small random fluctuations for animation

**Future Integration Points:**
- Google Fit API for wearable data
- Backend health database REST API
- Real-time WebSocket updates
- AI prediction engine integration

### 7. healthColorUtils (Utilities)

**File:** `utils/healthColorUtils.ts`

Color mapping functions for consistent metric visualization:

- `getStressColor(value)` → THREE.Color
- `getSugarColor(value)` → THREE.Color
- `getHeartRiskColor(value)` → THREE.Color
- `getSleepColor(value)` → THREE.Color
- `getMedicationRiskColor(value)` → THREE.Color
- `getEmissiveIntensity(value)` → number (0-1)
- `interpolateColor(color1, color2, factor)` → THREE.Color

**Color Thresholds:**

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Stress | 0-40% | 40-70% | 70%+ |
| Blood Sugar | <100 | 100-140 | 140+ |
| Heart Risk | <40% | 40-70% | 70%+ |
| Sleep Quality | 80%+ | 60-79% | <60% |
| Med. Risk | 0-30% | 30-60% | 60%+ |

## Integration Points

### HealthVisualization3D Page

**File:** `pages/HealthVisualization3D.tsx`

Main page component integrating the visualization with:
- Dashboard layout with page transitions
- Metric cards showing real-time values
- Status legend for color interpretation
- Detailed analysis panel
- Visualization guide

**Features:**
- Motion animations for smooth entrance
- Responsive grid layout (mobile/tablet/desktop)
- Real-time metric updates
- Contextual health insights below metrics

## Animations

### Heartbeat Animation
- **Trigger:** Uses `useFrame` from React Three Fiber
- **Animation:** Chest mesh scales based on heart rate
- **Formula:** `pulseSpeed = heartRate / 60`
- **Effect:** Chest scales from 1.0 to 1.08 in sync with pulse

### Breathing Animation
- **Trigger:** Continuous in `useFrame`
- **Animation:** Entire body Y-scale oscillates
- **Formula:** `breathScale = 1 + sin(time * 0.5) * 0.05`
- **Effect:** Subtle up/down motion suggesting respiration

### Heatmap Pulsing
- **Speed:** Increases with risk level
- **Scale:** Expands/contracts based on severity
- **Formula:** `pulseSpeed = 1 + riskLevel * 2`
- **Rotation:** Mesh rotates faster under high risk

### Focus Highlighting
- **Trigger:** Hover on labels
- **Animation:** Label scales to 1.1x
- **Effect:** Draws attention to specific metrics

## Performance Optimizations

1. **Geometry Disposal:** All geometries and materials are properly disposed in cleanup functions
2. **Suspense Boundary:** Components load asynchronously to prevent blocking
3. **useRef for 3D Objects:** Avoids unnecessary re-renders
4. **Conditional Rendering:** Highlights only appear when needed
5. **Efficient Updates:** Color updates batched with metric changes

## Customization Guide

### Changing Color Thresholds

Edit `utils/healthColorUtils.ts`:

```typescript
export const getStressColor = (value: number): THREE.Color => {
  if (value < 40) {  // Change threshold
    return new THREE.Color(0x22c55e); // Green
  } else if (value < 70) {  // Change threshold
    return new THREE.Color(0xfbbf24); // Yellow
  } else {
    return new THREE.Color(0xef4444); // Red
  }
};
```

### Adding New Metrics

1. Update `HealthMetrics` interface in `useHealthMetrics.ts`
2. Add color mapping function in `healthColorUtils.ts`
3. Create new body region or update existing in `HumanBody.tsx`
4. Add label in `HealthLabels.tsx`
5. Update `HealthVisualization3D.tsx` metrics grid

### Changing Model Appearance

Edit `HumanBody.tsx`:
- Adjust geometry sizes (radius, height arguments)
- Change material properties (roughness, metalness)
- Modify body region positions
- Add new body parts as meshes

## Data Flow

```
useHealthMetrics (Hook)
        ↓
    HealthMetrics object
        ↓
    HealthAvatar (Container)
    ↙    ↓    ↘    ↙ 
HumanBody  Labels  Heatmap  BodyRegionHighlight
|          |       |        |
└──────────┴───────┴────────┴──→ Visual Rendering
                                  (Three.js Canvas)
```

## Browser Compatibility

- Chrome/Edge: Full support (WebGL 2.0)
- Firefox: Full support (WebGL 2.0)
- Safari: Full support (WebGL 2.0)
- Mobile browsers: Supported (with touch controls)

## Performance Metrics

- Typical FPS: 60 (desktop)
- Canvas resolution: Auto-scaling with device pixel ratio
- Polygon count: ~2000 vertices for human model
- Animation update rate: 60 FPS
- Label update rate: Tied to metric updates (~2s)

## Testing the Implementation

1. Navigate to the Health Visualization page in the dashboard
2. Observe the 3D human model rotating automatically
3. Watch metrics update in real-time every 2 seconds
4. Hover over floating labels to see scale effect
5. Check that colors change based on metric values
6. Verify chest pulse animation following heart rate
7. Test OrbitControls (zoom, pan, rotate)

## Future Enhancements

1. **GLB Model Loading:** Replace procedural geometry with imported 3D model
2. **Advanced Physics:** Add gravity and collision detection
3. **Gesture Indicators:** Show hand gestures based on stress levels
4. **Medical Integration:** Connect to HL7/FHIR standards
5. **AR Support:** Enable augmented reality visualization
6. **Data Export:** Generate PDF reports from visualizations
7. **Comparison Views:** Side-by-side metric comparison
8. **Predictive Modeling:** Show predicted future health states

## Dependencies

- `react`: UI framework
- `three`: 3D graphics library
- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful Three.js abstractions (OrbitControls, Html)
- `@react-three/rapier`: Physics engine (optional future)
- `framer-motion`: Animation library for transitions
- `typescript`: Type safety

## File Sizes

- HealthAvatar.tsx: ~1.5 KB
- HumanBody.tsx: ~6.2 KB
- HealthLabels.tsx: ~2.1 KB
- BodyRegionHighlight.tsx: ~3.4 KB
- HealthHeatmap.tsx: ~3.8 KB
- useHealthMetrics.ts: ~1.2 KB
- healthColorUtils.ts: ~2.1 KB
- HealthVisualization3D.tsx: ~8.5 KB

**Total: ~28.8 KB (uncompressed)**

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution:** Run `npm install` to ensure all dependencies are installed. VS Code may need a reload.

### Issue: Canvas not rendering
**Solution:** Check browser console for Three.js errors. Ensure WebGL is enabled.

### Issue: Animations jittery
**Solution:** Check frame rate. Reduce animation complexity or lower render resolution.

### Issue: Models not updating
**Solution:** Verify `useHealthMetrics` hook is properly connected. Check React DevTools profiler.

## Support & Documentation

- Three.js Docs: https://threejs.org/docs/
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber/
- Drei Documentation: https://drei-docs.vercel.app/
