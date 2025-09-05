import CartItem from '../models/Cart.js';
import Trip from '../models/Trip.js';

// @desc    Add item to cart
// @route   POST /api/cart/:tripId/add
// @access  Private (requires JWT)
const addItemToCart = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { 
      itemType, 
      itemName, 
      itemId, 
      price, 
      quantity = 1, 
      duration = '1 day',
      date,
      details = {}
    } = req.body;

    // Validate required fields
    if (!itemType || !itemName || !itemId || !price || !date) {
      return res.status(400).json({
        message: 'Missing required fields: itemType, itemName, itemId, price, and date are required'
      });
    }

    // Validate item type
    const validItemTypes = ['hotel', 'transport', 'activity', 'restaurant', 'attraction'];
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({
        message: `Invalid item type. Must be one of: ${validItemTypes.join(', ')}`
      });
    }

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Check if item already exists in cart for this trip
    const existingItem = await CartItem.findOne({
      tripId,
      userId: req.user._id,
      itemId,
      itemType
    });

    if (existingItem) {
      return res.status(400).json({
        message: 'Item already exists in cart for this trip'
      });
    }

    // Create cart item
    const cartItem = new CartItem({
      userId: req.user._id,
      tripId,
      itemType,
      itemName,
      itemId,
      price: {
        amount: parseFloat(price.amount),
        currency: price.currency || 'USD'
      },
      quantity: parseInt(quantity),
      duration,
      date: new Date(date),
      details
    });

    await cartItem.save();

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartItem
    });
  } catch (error) {
    console.error('Add item to cart error:', error);
    res.status(500).json({
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// @desc    Get cart items for a trip
// @route   GET /api/cart/:tripId
// @access  Private (requires JWT)
const getCartItems = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { itemType, status } = req.query;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Build query
    const query = {
      tripId,
      userId: req.user._id
    };

    if (itemType) query.itemType = itemType;
    if (status) query.status = status;

    // Get cart items
    const cartItems = await CartItem.find(query)
      .sort({ addedAt: -1 });

    // Calculate totals
    const totalBudget = cartItems.reduce((sum, item) => {
      return sum + (item.price.amount * item.quantity);
    }, 0);

    // Group by item type
    const breakdown = cartItems.reduce((acc, item) => {
      const type = item.itemType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          total: 0,
          items: []
        };
      }
      acc[type].count += 1;
      acc[type].total += (item.price.amount * item.quantity);
      acc[type].items.push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          title: trip.title,
          destination: trip.destination,
          originStation: trip.originStation
        },
        cartItems,
        totalBudget: {
          amount: totalBudget,
          currency: cartItems.length > 0 ? cartItems[0].price.currency : 'USD'
        },
        breakdown,
        itemCount: cartItems.length
      }
    });
  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({
      message: 'Failed to fetch cart items',
      error: error.message
    });
  }
};

// @desc    Update cart item
// @route   PATCH /api/cart/:tripId/items/:itemId
// @access  Private (requires JWT)
const updateCartItem = async (req, res) => {
  try {
    const { tripId, itemId } = req.params;
    const { quantity, status, details } = req.body;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Find and update cart item
    const cartItem = await CartItem.findOneAndUpdate(
      {
        _id: itemId,
        tripId,
        userId: req.user._id
      },
      {
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(status !== undefined && { status }),
        ...(details !== undefined && { details: { ...details } })
      },
      { new: true }
    );

    if (!cartItem) {
      return res.status(404).json({
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cartItem
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:tripId/items/:itemId
// @access  Private (requires JWT)
const removeCartItem = async (req, res) => {
  try {
    const { tripId, itemId } = req.params;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Find and delete cart item
    const cartItem = await CartItem.findOneAndDelete({
      _id: itemId,
      tripId,
      userId: req.user._id
    });

    if (!cartItem) {
      return res.status(404).json({
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        removedItem: cartItem,
        tripId,
        itemId
      }
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      message: 'Failed to remove cart item',
      error: error.message
    });
  }
};

// @desc    Clear entire cart for a trip
// @route   DELETE /api/cart/:tripId/clear
// @access  Private (requires JWT)
const clearCart = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Delete all cart items for this trip
    const result = await CartItem.deleteMany({
      tripId,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: `Cart cleared successfully. Removed ${result.deletedCount} items.`,
      data: {
        tripId,
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// @desc    Get budget summary for a trip
// @route   GET /api/cart/:tripId/budget
// @access  Private (requires JWT)
const getBudgetSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Get all cart items for this trip
    const cartItems = await CartItem.find({
      tripId,
      userId: req.user._id
    });

    // Calculate totals
    const totalBudget = cartItems.reduce((sum, item) => {
      return sum + (item.price.amount * item.quantity);
    }, 0);

    // Group by item type
    const breakdown = cartItems.reduce((acc, item) => {
      const type = item.itemType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          total: 0,
          percentage: 0
        };
      }
      acc[type].count += 1;
      acc[type].total += (item.price.amount * item.quantity);
      return acc;
    }, {});

    // Calculate percentages
    Object.keys(breakdown).forEach(type => {
      breakdown[type].percentage = totalBudget > 0 
        ? ((breakdown[type].total / totalBudget) * 100).toFixed(1)
        : 0;
    });

    // Get currency (use first item's currency or default)
    const currency = cartItems.length > 0 ? cartItems[0].price.currency : 'USD';

    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          title: trip.title,
          destination: trip.destination,
          originStation: trip.originStation
        },
        budget: {
          total: totalBudget,
          currency,
          itemCount: cartItems.length,
          breakdown
        },
        summary: {
          totalItems: cartItems.length,
          confirmedItems: cartItems.filter(item => item.status === 'confirmed').length,
          pendingItems: cartItems.filter(item => item.status === 'pending').length
        }
      }
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      message: 'Failed to get budget summary',
      error: error.message
    });
  }
};

// @desc    Get all user's carts summary
// @route   GET /api/cart/summary
// @access  Private (requires JWT)
const getUserCartsSummary = async (req, res) => {
  try {
    // Get all trips for the user
    const trips = await Trip.find({ userId: req.user._id });

    // Get cart summary for each trip
    const cartsSummary = await Promise.all(
      trips.map(async (trip) => {
        const cartItems = await CartItem.find({
          tripId: trip._id,
          userId: req.user._id
        });

        const totalBudget = cartItems.reduce((sum, item) => {
          return sum + (item.price.amount * item.quantity);
        }, 0);

        return {
          tripId: trip._id,
          tripTitle: trip.title,
          destination: trip.destination,
          originStation: trip.originStation,
          itemCount: cartItems.length,
          totalBudget: {
            amount: totalBudget,
            currency: cartItems.length > 0 ? cartItems[0].price.currency : 'USD'
          },
          status: cartItems.length > 0 ? 'active' : 'empty'
        };
      })
    );

    // Calculate overall summary
    const totalTrips = trips.length;
    const activeCarts = cartsSummary.filter(cart => cart.status === 'active').length;
    const totalOverallBudget = cartsSummary.reduce((sum, cart) => {
      return sum + cart.totalBudget.amount;
    }, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalTrips,
          activeCarts,
          totalOverallBudget: {
            amount: totalOverallBudget,
            currency: 'USD' // Assuming all in same currency for now
          }
        },
        carts: cartsSummary
      }
    });
  } catch (error) {
    console.error('Get user carts summary error:', error);
    res.status(500).json({
      message: 'Failed to get user carts summary',
      error: error.message
    });
  }
};

export {
  addItemToCart,
  getCartItems,
  updateCartItem,
  removeCartItem,
  clearCart,
  getBudgetSummary,
  getUserCartsSummary
};
