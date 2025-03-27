// services/authService.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const mongoose = require('mongoose');

// Initialize passport
const initializePassport = (app) => {
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

  // Configure Local Strategy for email/password login
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

  // Configure Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in our database
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ] 
      });

      if (user) {
        // If user exists but doesn't have googleId, update it
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
        // Generate random password for social login users
        password: mongoose.Types.ObjectId().toString(),
        avatar: profile.photos[0].value,
        isEmailVerified: true
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));

  // Configure Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email', 'first_name', 'last_name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in our database
      let user = await User.findOne({ 
        $or: [
          { facebookId: profile.id },
          { email: profile.emails && profile.emails[0] ? profile.emails[0].value : null }
        ] 
      });

      if (user) {
        // If user exists but doesn't have facebookId, update it
        if (!user.facebookId) {
          user.facebookId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Handle case where Facebook doesn't provide email
      if (!profile.emails || !profile.emails[0]) {
        return done(null, false, { message: 'Email is required. Please check your Facebook privacy settings.' });
      }

      // Create new user if doesn't exist
      const newUser = new User({
        facebookId: profile.id,
        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
        email: profile.emails[0].value,
        // Generate random password for social login users
        password: mongoose.Types.ObjectId().toString(),
        avatar: profile.photos[0].value,
        isEmailVerified: true
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));
};

module.exports = { initializePassport };