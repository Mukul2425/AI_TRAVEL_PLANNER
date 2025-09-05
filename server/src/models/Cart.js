import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required']
  },
  itemType: {
    type: String,
    enum: ['hotel', 'transport', 'activity', 'restaurant', 'attraction'],
    required: [true, 'Item type is required']
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  itemId: {
    type: String,
    required: [true, 'Item ID is required']
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'],
      uppercase: true
    }
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1']
  },
  duration: {
    type: String,
    default: '1 day'
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  details: {
    description: String,
    location: String,
    provider: String,
    cancellationPolicy: String,
    amenities: [String],
    specialRequests: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cartItemSchema.index({ tripId: 1, userId: 1 });
cartItemSchema.index({ tripId: 1, itemType: 1 });
cartItemSchema.index({ userId: 1, status: 1 });
cartItemSchema.index({ date: 1 });

// Virtual for total price calculation
cartItemSchema.virtual('totalPrice').get(function() {
  return this.price.amount * this.quantity;
});

// Method to get formatted price
cartItemSchema.methods.getFormattedPrice = function() {
  return `${this.price.currency} ${this.totalPrice.toFixed(2)}`;
};

// Method to get item summary
cartItemSchema.methods.getItemSummary = function() {
  return {
    id: this._id,
    itemType: this.itemType,
    itemName: this.itemName,
    price: this.price,
    totalPrice: this.totalPrice,
    quantity: this.quantity,
    date: this.date,
    status: this.status,
    addedAt: this.addedAt
  };
};

export default mongoose.model('CartItem', cartItemSchema);
