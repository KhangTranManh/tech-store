const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Prevents password from being returned in queries
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return v === '' || validator.isMobilePhone(v);
      },
      message: 'Invalid phone number'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  // Social login fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  facebookId: {
    type: String,
    sparse: true,
    unique: true
  },
  avatar: {
    type: String
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Add these fields for password reset functionality
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  // Preferences fields
  preferences: {
    type: Object,
    default: {
      orderUpdates: true,
      promotions: false,
      newsletter: false,
      productAlerts: false,
      currency: 'usd'
    }
  },
  // Security settings
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorPhone: {
      type: String
    },
    loginAlerts: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 60 // 1 hour in minutes
    },
    sessionToken: {
      type: String
    },
    lastLogin: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Helper method to check if user was created via social login
UserSchema.virtual('isSocialUser').get(function() {
  return !!(this.googleId || this.facebookId);
});

module.exports = mongoose.model('User', UserSchema);