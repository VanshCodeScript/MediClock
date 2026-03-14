# MediClock Design Template

This document is the single source of truth for product, system, and UI design decisions in MediClock.

## 1) Project Identity

- Project Name: MediClock
- Version: 1.0.0
- Last Updated: 2026-03-14
- Owners: Product, Frontend, Backend
- Primary Goals:
  - PS1: Chronobiology-aware medication scheduling
  - PS2: Drug interaction safety and adherence support

Template fields to keep updated:
- Problem Statement:
- Target Users:
- Success Metrics:
- Release Scope:

## 2) Product Design Brief

### Problem
Patients miss doses, follow non-personalized schedules, and face avoidable medication interaction risks.

### Solution
MediClock delivers schedule intelligence, reminders, emergency escalation, and doctor-patient consultation with a safety-first workflow.

### Core Value Propositions
- Personalized timing aligned with sleep and circadian behavior
- Early warnings for risky drug combinations
- Continuous adherence tracking and reminder follow-up
- Fast emergency workflows with caregiver notifications

Template checklist:
- [ ] User pains validated
- [ ] Value proposition measurable
- [ ] Scope aligned to timeline

## 3) User Roles And Primary Journeys

### Roles
- Patient (user)
- Doctor
- Caregiver (notification target)

### Patient Journey
1. Register and login
2. Add medication with reminder times
3. Receive reminders and mark doses
4. Check interaction safety
5. Use SOS if emergency occurs
6. Join video consultation when needed

### Doctor Journey
1. Login as doctor
2. Start or receive call with patient
3. Review adherence and context
4. Guide patient care decisions

Template fields:
- Happy path:
- Edge cases:
- Accessibility notes:

## 4) Experience Principles

- Safety before speed: warnings and confirmations for high-risk actions
- Clarity over density: readable health data and actionable CTAs
- Low-friction workflows: minimum steps for reminders, SOS, and calls
- Trust signals: status, timestamps, delivery states, and logs
- Mobile-first reliability: flows must work on small screens

## 5) Information Architecture

### Frontend App Zones
- Authentication: login and register
- Dashboard: health summary and daily status
- Medication: add, list, and schedule
- Reminders: upcoming, taken, missed
- Drug Interactions: search and risk checks
- Nutrition and analytics pages
- SOS and emergency actions
- Video call page

### Backend Domains
- Auth and user profile
- Medication and reminder automation
- Adherence records and health metrics
- Interaction lookup and safety logic
- Emergency logs and contacts
- Video signaling and Twilio tokenization

Template fields:
- Navigation map:
- Route ownership:
- Dependencies:

## 6) System Design Snapshot

### Current Stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express + Socket.io
- Database: MongoDB (Mongoose)
- Realtime Video: Twilio Video + Socket signaling
- Notifications: Green API WhatsApp and Twilio SOS

### High-Level Data Flow
1. User action from frontend
2. API request to backend route
3. Validation and business logic
4. Persistence in MongoDB
5. External service call if needed
6. Response and UI state update

Template fields:
- Reliability constraints:
- Failure behavior:
- Retry policy:

## 7) UI Design System Template

### Brand Direction
- Tone: clinical, calm, and trustworthy
- Style: clean surfaces, high readability, explicit status colors

### Color Tokens (starter)
- `--color-bg`: #f6f8fb
- `--color-surface`: #ffffff
- `--color-text`: #1f2937
- `--color-primary`: #0f766e
- `--color-accent`: #1d4ed8
- `--color-success`: #15803d
- `--color-warning`: #b45309
- `--color-danger`: #b91c1c

### Typography
- Headings: Poppins
- Body: Source Sans 3
- Numeric/metrics: JetBrains Mono

### Component States
- Buttons: default, hover, active, disabled, loading
- Alerts: info, warning, critical
- Form fields: idle, focus, error, success
- Cards: base, elevated, interactive

Template fields:
- Spacing scale:
- Radius scale:
- Shadow scale:
- Motion duration and easing:

## 8) Key Feature Design Templates

### A) Medication Creation
- Goal: capture medication and reminder plan in one pass
- Inputs: medicine name, dosage, frequency, reminder times
- Validation: required fields + format checks
- Outcome: medication saved, reminders auto-generated, optional WhatsApp sent

### B) Reminder Center
- Goal: daily adherence clarity
- Inputs: today reminders and status updates
- States: pending, due, taken, missed
- Outcome: adherence log updated with timestamps

### C) Drug Interaction Check
- Goal: reduce unsafe combinations
- Inputs: selected medications
- States: no risk, moderate risk, high risk
- Outcome: actionable warning with recommendation path

### D) Video Consultation
- Goal: quick doctor-patient connection
- Inputs: logged-in user, counterpart selection, token request
- States: idle, calling, incoming, connected, ended
- Outcome: room joined, audio/video controls, call status persisted

### E) SOS Emergency
- Goal: fast escalation
- Inputs: trigger action and emergency context
- Outcome: emergency log + caregiver alerts + optional phone call

## 9) Security And Compliance Baseline

- JWT authentication for protected routes
- Hashed passwords with bcrypt
- Environment-based secret management
- CORS policy defined for frontend origin
- Audit-friendly logs for critical events

Template fields:
- Data retention policy:
- PII masking rules:
- Incident handling process:

## 10) API Contract Template

For each endpoint record:
- Route:
- Method:
- Auth required:
- Request schema:
- Response schema:
- Error codes:
- Observability (logs/metrics):

Example:
- Route: /api/v1/video/token
- Method: POST
- Auth required: yes
- Request schema: { identity, roomName? }
- Response schema: { token, room }

## 11) Quality Template

### Acceptance Criteria Format
- Given:
- When:
- Then:

### Non-Functional Targets
- Page load target:
- API p95 latency target:
- Error budget:
- Uptime target:

### Testing Matrix
- Unit: business logic and validators
- Integration: routes + DB
- E2E: login, medication, reminders, interaction check, call flow

## 12) Release And Change Log Template

For each release note:
- Date:
- Version:
- Features added:
- Breaking changes:
- Migration notes:
- Rollback plan:

## 13) Open Decisions

- Doctor onboarding flow finalization
- Interaction severity copy standardization
- Reminder escalation policy refinement
- Video call fallback behavior on weak network

---

## How To Use This File

1. Update section 1 and section 2 before every major sprint.
2. Add new feature templates in section 8 before implementation starts.
3. Keep section 10 updated whenever API contracts change.
4. Record unresolved items in section 13 and review weekly.
