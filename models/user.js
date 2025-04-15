const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const Schema = mongoose.Schema;

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
    required: function() {
      // Password is only required for regular users, not social login users
      return !this.googleId && !this.facebookId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Prevents password from being returned in queries
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isMobilePhone(v);
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
  // Only hash the password if it has been modified and exists
  if (!this.isModified('password') || !this.password) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  // If no password (social login), return false
  if (!this.password) return false;
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

// Method to handle social login data
UserSchema.statics.findOrCreateSocialUser = async function(profile, provider) {
  const User = this;
  
  // Determine which ID field to use based on provider
  const idField = provider === 'google' ? 'googleId' : 'facebookId';
  const query = {};
  query[idField] = profile.id;
  
  try {
    // First try to find user by social ID
    let user = await User.findOne(query);
    
    // If user exists, return it
    if (user) {
      // Update last login time
      if (user.security) {
        user.security.lastLogin = new Date();
        await user.save();
      }
      return user;
    }
    
    // If not found, try to find by email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // User exists but hasn't connected this social account yet
      user[idField] = profile.id;
      // Update avatar if not already set
      if (!user.avatar && profile.photos && profile.photos[0]) {
        user.avatar = profile.photos[0].value;
      }
      await user.save();
      return user;
    }
    
    // Create new user if not exists
    const newUser = new User({
      [idField]: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName || profile.displayName.split(' ')[0],
      lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
      avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
      isEmailVerified: true // Social logins are considered verified
    });
    
    return await newUser.save();
  } catch (err) {
    console.error('Error in findOrCreateSocialUser:', err);
    throw err;
  }
};

module.exports = mongoose.model('User', UserSchema);