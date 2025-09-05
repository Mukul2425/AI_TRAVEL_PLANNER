import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'archived'],
    default: 'draft'
  },
  // AI-generated itinerary data
  plan: {
    summary: {
      destination: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        required: true
      },
      totalEstimatedCost: {
        type: String,
        required: true
      },
      highlights: [{
        type: String
      }]
    },
    dailyPlans: [{
      day: {
        type: Number,
        required: true
      },
      date: {
        type: String,
        required: true
      },
      morning: {
        activity: String,
        location: String,
        duration: String,
        cost: String,
        notes: String
      },
      afternoon: {
        activity: String,
        location: String,
        duration: String,
        cost: String,
        notes: String
      },
      evening: {
        activity: String,
        location: String,
        duration: String,
        cost: String,
        notes: String
      },
      meals: {
        breakfast: String,
        lunch: String,
        dinner: String
      },
      transportation: String,
      totalDayCost: String
    }],
    recommendations: {
      packing: [String],
      tips: [String],
      alternatives: [String]
    }
  },
  // Constraints and preferences used for generation
  constraintsUsed: {
    budget: String,
    timeLimits: String,
    weather: String,
    accessibility: String,
    groupSize: Number,
    interests: [String],
    selectedTransport: String,
    selectedAccommodation: String
  },
  // Metadata about the generation
  generationMetadata: {
    aiProvider: {
      type: String,
      default: 'gemini'
    },
    modelUsed: {
      type: String,
      default: 'gemini-1.5-flash'
    },
    generationTime: {
      type: Number, // in milliseconds
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    cacheHit: {
      type: Boolean,
      default: false
    }
  },
  // User customizations
  customizations: {
    modifiedActivities: [{
      day: Number,
      timeSlot: String, // 'morning', 'afternoon', 'evening'
      originalActivity: String,
      newActivity: String,
      modifiedAt: {
        type: Date,
        default: Date.now
      }
    }],
    addedNotes: [{
      day: Number,
      note: String,
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    budgetAdjustments: [{
      day: Number,
      originalCost: String,
      newCost: String,
      reason: String,
      modifiedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Ratings and feedback
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userFeedback: String,
  // Sharing and collaboration
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
itinerarySchema.index({ tripId: 1, userId: 1 });
itinerarySchema.index({ userId: 1, status: 1 });
itinerarySchema.index({ 'plan.summary.destination': 1 });
itinerarySchema.index({ generatedAt: -1 });

// Virtual for total cost calculation
itinerarySchema.virtual('totalCost').get(function() {
  if (!this.plan.dailyPlans) return '$0';
  
  const total = this.plan.dailyPlans.reduce((sum, day) => {
    const dayCost = parseFloat(day.totalDayCost.replace('$', '')) || 0;
    return sum + dayCost;
  }, 0);
  
  return `$${total}`;
});

// Virtual for trip duration
itinerarySchema.virtual('tripDuration').get(function() {
  if (!this.plan.dailyPlans) return 0;
  return this.plan.dailyPlans.length;
});

// Method to validate itinerary structure
itinerarySchema.methods.validateStructure = function() {
  const required = ['summary', 'dailyPlans', 'recommendations'];
  const summaryRequired = ['destination', 'duration', 'totalEstimatedCost', 'highlights'];
  const dayRequired = ['day', 'date', 'morning', 'afternoon', 'evening', 'meals', 'transportation', 'totalDayCost'];
  
  // Check top-level structure
  for (const field of required) {
    if (!this.plan[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Check summary structure
  for (const field of summaryRequired) {
    if (!this.plan.summary[field]) {
      return { valid: false, error: `Missing required summary field: ${field}` };
    }
  }
  
  // Check daily plans structure
  if (!Array.isArray(this.plan.dailyPlans) || this.plan.dailyPlans.length === 0) {
    return { valid: false, error: 'Daily plans must be a non-empty array' };
  }
  
  for (const day of this.plan.dailyPlans) {
    for (const field of dayRequired) {
      if (!day[field]) {
        return { valid: false, error: `Missing required day field: ${field}` };
      }
    }
  }
  
  return { valid: true };
};

// Method to get itinerary summary
itinerarySchema.methods.getSummary = function() {
  return {
    id: this._id,
    tripId: this.tripId,
    destination: this.plan.summary.destination,
    duration: this.plan.summary.duration,
    totalEstimatedCost: this.plan.summary.totalEstimatedCost,
    highlights: this.plan.summary.highlights,
    status: this.status,
    generatedAt: this.generatedAt,
    version: this.version,
    userRating: this.userRating
  };
};

// Method to get daily plan by day number
itinerarySchema.methods.getDayPlan = function(dayNumber) {
  return this.plan.dailyPlans.find(day => day.day === dayNumber);
};

// Method to update activity for a specific day and time slot
itinerarySchema.methods.updateActivity = function(dayNumber, timeSlot, newActivity) {
  const day = this.plan.dailyPlans.find(d => d.day === dayNumber);
  if (!day) {
    throw new Error(`Day ${dayNumber} not found`);
  }
  
  if (!day[timeSlot]) {
    throw new Error(`Time slot ${timeSlot} not found for day ${dayNumber}`);
  }
  
  // Store original activity in customizations
  this.customizations.modifiedActivities.push({
    day: dayNumber,
    timeSlot: timeSlot,
    originalActivity: day[timeSlot].activity,
    newActivity: newActivity,
    modifiedAt: new Date()
  });
  
  // Update the activity
  day[timeSlot].activity = newActivity;
  
  return this.save();
};

// Pre-save middleware to validate structure
itinerarySchema.pre('save', function(next) {
  const validation = this.validateStructure();
  if (!validation.valid) {
    return next(new Error(validation.error));
  }
  next();
});

export default mongoose.model('Itinerary', itinerarySchema);
