// models/reviewVote.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewVoteSchema = new Schema({
  review: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  guestId: {
    type: String
  },
  
  isHelpful: {
    type: Boolean,
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure either user or guestId is provided
ReviewVoteSchema.pre('validate', function(next) {
  if (!this.user && !this.guestId) {
    next(new Error('Either user or guestId must be provided'));
  } else {
    next();
  }
});

// Create compound index to ensure each user or guest can only vote once per review
ReviewVoteSchema.index({ review: 1, user: 1 }, { unique: true, sparse: true });
ReviewVoteSchema.index({ review: 1, guestId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ReviewVote', ReviewVoteSchema);