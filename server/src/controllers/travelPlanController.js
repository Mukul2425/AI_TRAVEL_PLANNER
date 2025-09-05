import { generateCompleteTravelPlan } from '../services/travelPlanService.js';

// @desc    Generate complete travel plan (AI itinerary + external API data)
// @route   POST /api/travel-plans/generate
// @access  Private (requires JWT)
const generateCompleteTravelPlanForTrip = async (req, res) => {
  try {
    const { tripId, preferences } = req.body;

    // Validate required fields
    if (!tripId) {
      return res.status(400).json({ 
        message: 'Trip ID is required' 
      });
    }

    // Generate complete travel plan
    const completePlan = await generateCompleteTravelPlan(tripId, req.user._id, preferences);

    res.status(201).json({
      success: true,
      message: 'Complete travel plan generated successfully',
      data: {
        itinerary: completePlan,
        note: 'AI generated the structure, external APIs provided booking options'
      }
    });
  } catch (error) {
    console.error('Generate complete travel plan error:', error);
    res.status(500).json({ 
      message: 'Failed to generate complete travel plan',
      error: error.message 
    });
  }
};

export {
  generateCompleteTravelPlanForTrip
};
