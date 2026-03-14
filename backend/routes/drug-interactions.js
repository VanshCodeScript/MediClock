import express from 'express';
import DrugInteraction from '../models/DrugInteraction.js';

const router = express.Router();

// Add drug interaction (for admin)
router.post('/', async (req, res) => {
  try {
    const interaction = new DrugInteraction(req.body);
    await interaction.save();
    res.status(201).json({ message: 'Drug interaction added', interaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check interaction between two drugs
router.get('/check', async (req, res) => {
  try {
    const { drugA, drugB } = req.query;

    if (!drugA || !drugB) {
      return res.status(400).json({ error: 'Both drugA and drugB are required' });
    }

    const interaction = await DrugInteraction.findOne({
      $or: [
        { drugA: drugA.toLowerCase(), drugB: drugB.toLowerCase() },
        { drugA: drugB.toLowerCase(), drugB: drugA.toLowerCase() },
      ],
    });

    if (!interaction) {
      return res.json({ hasInteraction: false, message: 'No known interactions' });
    }

    res.json({ hasInteraction: true, interaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check interactions for multiple drugs
router.post('/check-multiple', async (req, res) => {
  try {
    const { drugs } = req.body;

    if (!Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({ error: 'At least 2 drugs required' });
    }

    const interactions = [];

    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const interaction = await DrugInteraction.findOne({
          $or: [
            { drugA: drugs[i].toLowerCase(), drugB: drugs[j].toLowerCase() },
            { drugA: drugs[j].toLowerCase(), drugB: drugs[i].toLowerCase() },
          ],
        });

        if (interaction) {
          interactions.push(interaction);
        }
      }
    }

    res.json({ interactions, count: interactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all interactions
router.get('/', async (req, res) => {
  try {
    const interactions = await DrugInteraction.find({}).limit(100);
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update interaction
router.put('/:id', async (req, res) => {
  try {
    const interaction = await DrugInteraction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    res.json({ message: 'Interaction updated', interaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete interaction
router.delete('/:id', async (req, res) => {
  try {
    const interaction = await DrugInteraction.findByIdAndDelete(req.params.id);
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    res.json({ message: 'Interaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
