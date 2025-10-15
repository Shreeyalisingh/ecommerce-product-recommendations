import mongoose from "mongoose";

const userInteractionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: 'anonymous',
    index: true
  },
  interactionType: {
    type: String,
    enum: ['query', 'view', 'click', 'search', 'recommendation_shown', 'recommendation_clicked'],
    required: true
  },
  query: {
    type: String,
    trim: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productTitle: String,
    relevanceScore: Number
  }],
  aiResponse: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for analytics
userInteractionSchema.index({ userId: 1, timestamp: -1 });
userInteractionSchema.index({ sessionId: 1, timestamp: -1 });
userInteractionSchema.index({ interactionType: 1, timestamp: -1 });

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

export default UserInteraction;
