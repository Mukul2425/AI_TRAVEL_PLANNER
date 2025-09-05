import Trip from '../models/Trip.js';

const ALLOWED_TRIP_STATUSES = ['draft', 'finalized', 'archived'];

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private (requires JWT)
const createTrip = async (req, res) => {
  try {
    const { title, destination, originStation, startDate, endDate, selections, numTravelers, budget } = req.body;

    // Validate required fields
    if (!title || !destination || !originStation || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'All required fields (title, destination, originStation, startDate, endDate) must be provided' 
      });
    }

    // Create trip with userId from authenticated user
    const trip = await Trip.create({
      userId: req.user._id,
      title,
      destination,
      originStation,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      selections: selections || {},
      numTravelers: numTravelers !== undefined ? Number(numTravelers) : undefined,
      budget: budget !== undefined ? String(budget) : undefined
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    
    if (error.message === 'End date must be after start date') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update trip status (draft | finalized | archived)
// @route   PATCH /api/trips/:id/status
// @access  Private (requires JWT)
const updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !ALLOWED_TRIP_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Valid status is required (draft, finalized, archived)'
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Simple transition rules: cannot move from finalized back to draft
    // and cannot move from archived to other states
    const current = trip.status || 'draft';
    if ((current === 'finalized' && status === 'draft') ||
        (current === 'archived' && status !== 'archived')) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    trip.status = status;
    const updated = await trip.save();

    res.json({
      success: true,
      message: 'Trip status updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all trips for the authenticated user
// @route   GET /api/trips
// @access  Private (requires JWT)
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id })
      .sort({ createdAt: -1 }); // Most recent first
    
    res.json(trips);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get trip by ID (checking ownership)
// @route   GET /api/trips/:id
// @access  Private (requires JWT)
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
 
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Get trip by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update trip (checking ownership)
// @route   PATCH /api/trips/:id
// @access  Private (requires JWT)
const updateTrip = async (req, res) => {
  try {
    const { title, destination, originStation, startDate, endDate, selections, numTravelers, budget } = req.body;
    
    // Find trip and check ownership
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Update allowed fields with validation
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      trip.title = title;
    }
    if (destination !== undefined) {
      if (!destination.trim()) {
        return res.status(400).json({ message: 'Destination cannot be empty' });
      }
      trip.destination = destination;
    }
    if (originStation !== undefined) {
      if (!originStation.trim()) {
        return res.status(400).json({ message: 'Origin station cannot be empty' });
      }
      trip.originStation = originStation;
    }
    if (startDate !== undefined) trip.startDate = new Date(startDate);
    if (endDate !== undefined) trip.endDate = new Date(endDate);
    if (selections !== undefined) trip.selections = { ...trip.selections, ...selections };
    if (numTravelers !== undefined) {
      const parsed = Number(numTravelers);
      if (!Number.isInteger(parsed) || parsed < 1) {
        return res.status(400).json({ message: 'numTravelers must be an integer >= 1' });
      }
      trip.numTravelers = parsed;
    }
    if (budget !== undefined) {
      if (!String(budget).trim()) {
        return res.status(400).json({ message: 'Budget cannot be empty' });
      }
      trip.budget = String(budget).trim();
    }

    // Save the updated trip
    const updatedTrip = await trip.save();
    
    res.json(updatedTrip);
  } catch (error) {
    console.error('Update trip error:', error);
    
    if (error.message === 'End date must be after start date') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete trip (checking ownership)
// @route   DELETE /api/trips/:id
// @access  Private (requires JWT)
const deleteTrip = async (req, res) => {
  try {
    // Find trip and check ownership
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Delete the trip
    await Trip.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  updateTripStatus
};
