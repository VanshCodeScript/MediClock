import express from 'express';
import Medication from '../models/Medication.js';
import CircadianProfile from '../models/CircadianProfile.js';
import MedicationScheduleRecommendation from '../models/MedicationScheduleRecommendation.js';
import { generateMedicationSchedule } from '../services/medicationScheduler.js';

const router = express.Router();

// Standard drug database with constraints
const drugDatabase = [
  {
    drugName: 'metformin',
    dosage: '500mg',
    frequency: 'twice daily',
    foodRule: 'after food',
    preferredCircadianWindow: ['morning', 'evening'],
    explanation:
      'Metformin should be taken with meals to reduce gastrointestinal side effects. Twice daily dosing helps maintain stable blood glucose levels throughout the day.',
    evidence: 'Clinical studies show metformin with meals reduces GI upset by 60%',
    spacingHours: 12,
  },
  {
    drugName: 'lisinopril',
    dosage: '10mg',
    frequency: 'once daily',
    foodRule: 'none',
    preferredCircadianWindow: ['morning'],
    explanation:
      'ACE inhibitors like lisinopril are typically taken in the morning. Morning dosing allows monitoring of blood pressure throughout the day and may reduce nighttime drops.',
    evidence: 'Morning dosing of ACE inhibitors shows better 24-hour BP control',
    halfLife: 12,
  },
  {
    drugName: 'atorvastatin',
    dosage: '20mg',
    frequency: 'once daily',
    foodRule: 'none',
    preferredCircadianWindow: ['night'],
    explanation:
      'Statins like atorvastatin are preferably taken at night because cholesterol synthesis peaks during nighttime. Evening/night dosing increases HMG-CoA reductase inhibition when needed most.',
    evidence: 'Studies show nocturnal cholesterol synthesis is 50-70% higher. Night dosing increases LDL reduction by 25%.',
    halfLife: 14,
  },
  {
    drugName: 'prednisone',
    dosage: '5mg',
    frequency: 'once daily',
    foodRule: 'with food',
    preferredCircadianWindow: ['morning'],
    explanation:
      'Corticosteroids should be taken with breakfast in the morning to mimic natural cortisol rhythm (highest in early morning) and reduce nighttime inflammation.',
    evidence: 'Morning corticosteroid dosing aligns with circadian cortisol peak',
    spacingHours: 24,
  },
  {
    drugName: 'furosemide',
    dosage: '40mg',
    frequency: 'once daily',
    foodRule: 'none',
    preferredCircadianWindow: ['morning'],
    explanation:
      'Loop diuretics should be taken in the morning to promote daytime diuresis and avoid nocturia (nighttime urination), which disrupts sleep quality.',
    evidence: 'Morning diuretic dosing reduces nighttime bathroom visits by 80%',
  },
  {
    drugName: 'amoxicillin',
    dosage: '500mg',
    frequency: 'three times daily',
    foodRule: 'none',
    preferredCircadianWindow: ['morning', 'afternoon', 'evening'],
    explanation:
      'Antibiotics require evenly spaced dosing (8-12 hours apart) to maintain therapeutic drug levels. This ensures continuous bacterial suppression.',
    evidence: 'Even spacing of antibiotics reduces resistance development',
    spacingHours: 8,
  },
  {
    drugName: 'levothyroxine',
    dosage: '75mcg',
    frequency: 'once daily',
    foodRule: 'empty stomach',
    preferredCircadianWindow: ['morning'],
    explanation:
      'Thyroid replacement must be taken on an empty stomach 30-60 minutes before breakfast. This maximizes absorption and prevents interactions with food and other medications.',
    evidence: 'Empty stomach absorption increases levothyroxine bioavailability by 30-40%',
  },
  {
    drugName: 'ibuprofen',
    dosage: '200mg',
    frequency: 'as needed',
    foodRule: 'with food',
    preferredCircadianWindow: ['afternoon', 'evening'],
    explanation:
      'NSAIDs should be taken with food to prevent gastric irritation. Evening dosing for post-workout pain is optimal as it aligns with recovery window.',
    evidence: 'NSAIDs with food reduce GI ulcer risk by 60-70%',
  },
  {
    drugName: 'omeprazole',
    dosage: '20mg',
    frequency: 'once daily',
    foodRule: 'before food',
    preferredCircadianWindow: ['morning'],
    explanation:
      'Proton pump inhibitors should be taken 30-60 minutes before breakfast to optimize hydrogen pump inhibition when gastric acid production peaks.',
    evidence: 'Pre-breakfast dosing maximizes acid suppression throughout the day',
  },
  {
    drugName: 'metoprolol',
    dosage: '50mg',
    frequency: 'once daily',
    foodRule: 'none',
    preferredCircadianWindow: ['morning'],
    explanation:
      'Beta-blockers like metoprolol are typically dosed in the morning. This aligns with daytime heart rate and blood pressure management.',
    evidence: 'Morning dosing provides better daytime BP and HR control',
    halfLife: 6,
  },
];

// Generate medication schedule recommendation
router.post('/generate-schedule', async (req, res) => {
  try {
    const { userId, medicationIds } = req.body;

    // Get user's circadian profile
    const circadianProfile = await CircadianProfile.findOne({ userId });
    if (!circadianProfile) {
      return res.status(400).json({ error: 'Circadian profile not found. Please complete your profile first.' });
    }

    // Get user's medications
    const medications = await Medication.find({
      _id: { $in: medicationIds },
      userId: userId,
    });

    if (medications.length === 0) {
      return res.status(400).json({ error: 'No medications found' });
    }

    // Generate schedule
    const result = generateMedicationSchedule(medications, circadianProfile, drugDatabase);

    // Save recommendation
    const recommendation = new MedicationScheduleRecommendation({
      userId,
      circadianProfileId: circadianProfile._id,
      medicationIds,
      ...result,
    });

    await recommendation.save();

    res.json({
      message: 'Schedule generated successfully',
      recommendation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest recommendation for user
router.get('/user/:userId/latest', async (req, res) => {
  try {
    const recommendation = await MedicationScheduleRecommendation.findOne({
      userId: req.params.userId,
    })
      .sort({ generatedAt: -1 })
      .populate('medicationIds');

    if (!recommendation) {
      return res.status(404).json({ error: 'No recommendations found' });
    }

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all recommendations for user
router.get('/user/:userId', async (req, res) => {
  try {
    const recommendations = await MedicationScheduleRecommendation.find({
      userId: req.params.userId,
    })
      .sort({ generatedAt: -1 })
      .populate('medicationIds');

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drug database
router.get('/drug-database/all', async (req, res) => {
  try {
    res.json({ drugs: drugDatabase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific drug info
router.get('/drug-database/:drugName', async (req, res) => {
  try {
    const drug = drugDatabase.find((d) => d.drugName.toLowerCase() === req.params.drugName.toLowerCase());

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found in database' });
    }

    res.json(drug);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
