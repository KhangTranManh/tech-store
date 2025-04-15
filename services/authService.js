const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const User = require('../models/user');
const nodemailer = require('nodemailer');

// Create email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Verify email transporter connection
const verifyEmailTransporter = (transporter) => {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Nodemailer configuration error:', error);
    } else {
      console.log('Nodemailer is ready to send emails');
    }
  });
};

// Initialize passport configuration
function initializePassport(app) {
  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Local Strategy for email/password login
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ] 
      });

      if (user) {
        // Update googleId if not present
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Create new user if doesn't exist
      const newUser = new User({
        googleId: profile.id,
        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
        email: profile.emails[0].value,
        // Generate secure random password
        password: crypto.randomBytes(20).toString('hex'),
        avatar: profile.photos[0]?.value,
        isEmailVerified: true
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));

  // Facebook OAuth Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email', 'first_name', 'last_name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 
        $or: [
          { facebookId: profile.id },
          { email: profile.emails && profile.emails[0] ? profile.emails[0].value : null }
        ] 
      });

      if (user) {
        // Update facebookId if not present
        if (!user.facebookId) {
          user.facebookId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Ensure email is available
      if (!profile.emails || !profile.emails[0]) {
        return done(null, false, { 
          message: 'Email is required. Please check your Facebook privacy settings.' 
        });
      }

      // Create new user if doesn't exist
      const newUser = new User({
        facebookId: profile.id,
        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
        email: profile.emails[0].value,
        // Generate secure random password
        password: crypto.randomBytes(20).toString('hex'),
        avatar: profile.photos[0]?.value,
        isEmailVerified: true
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));

  // Create and verify email transporter
  const emailTransporter = createEmailTransporter();
  verifyEmailTransporter(emailTransporter);

  return emailTransporter;
}

// Export initialization function and email transporter creator
module.exports = { 
  initializePassport,
  createEmailTransporter
};