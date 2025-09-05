import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    maxlength: [100, 'Destination cannot exceed 100 characters']
  },
  originStation: {
    type: String,
    required: [true, 'Origin station is required'],
    trim: true,
    maxlength: [100, 'Origin station cannot exceed 100 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  numTravelers: {
    type: Number,
    min: [1, 'Number of travelers must be at least 1'],
    default: 1
  },
  budget: {
    type: String,
    trim: true,
    maxlength: [50, 'Budget cannot exceed 50 characters'],
    default: 'moderate'
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'archived'],
    default: 'draft'
  },
  selections: {
    transport: {
      type: String,
      default: 'To be decided'
    },
    accommodation: {
      type: String,
      default: 'To be decided'
    },
    dining: {
      type: String,
      default: 'To be decided'
    }
  }
}, {
  timestamps: true
});

// Validate that end date is after start date
tripSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

export default mongoose.model('Trip', tripSchema);
