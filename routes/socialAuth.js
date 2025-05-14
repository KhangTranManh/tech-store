// Modified socialAuth.js with role-based redirects

const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');

// Google OAuth Strategy Configuration
function configureGoogleStrategy() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    passReqToCallback: true,
    scope: ['profile', 'email']
  }, 
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Comprehensive user lookup
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
      
      // Create new user if not exists
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
        profileImage: profile.photos[0]?.value,
        isEmailVerified: true
      });
      
      await user.save();
      return done(null, user);
    } catch (err) {
      console.error('Google OAuth Error:', err);
      return done(err);
    }
  }));
}

// Facebook OAuth Strategy Configuration
function configureFacebookStrategy() {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback", // This matches the URL you've configured
    profileFields: ['id', 'emails', 'name', 'displayName', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Validate email presence
      if (!profile.emails || !profile.emails[0]) {
        return done(null, false, { 
          message: 'Email is required. Please adjust Facebook privacy settings.' 
        });
      }

      // Comprehensive user lookup
      let user = await User.findOne({ 
        $or: [
          { facebookId: profile.id },
          { email: profile.emails[0].value }
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
      
      // Create new user if not exists
      user = new User({
        facebookId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
        profileImage: profile.photos[0]?.value,
        isEmailVerified: true
      });
      
      await user.save();
      return done(null, user);
    } catch (err) {
      console.error('Facebook OAuth Error:', err);
      return done(err);
    }
  }));
}

// Google Authentication Routes
function googleAuthRoutes() {
  // Initiate Google OAuth
  router.get('/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account' // Allows user to choose account
    })
  );

  // Google OAuth Callback - MODIFIED to check admin role
  router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
    (req, res) => {
      // Check if user is admin and redirect accordingly
      if (req.user && req.user.role === 'admin') {
        console.log(`Google OAuth: Admin user ${req.user.email} detected, redirecting to admin tracking`);
        return res.redirect('/admintrack.html');
      } else {
        console.log(`Google OAuth: Regular user ${req.user.email} detected, redirecting to homepage`);
        return res.redirect('/');
      }
    }
  );
}

// Facebook Authentication Routes
function facebookAuthRoutes() {
  // Initiate Facebook OAuth
  router.get('/facebook', 
    passport.authenticate('facebook', { 
      scope: ['email'] 
    })
  );

  // Facebook OAuth Callback - MODIFIED to check admin role
  router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login', failureFlash: true }),
    (req, res) => {
      // Check if user is admin and redirect accordingly
      if (req.user && req.user.role === 'admin') {
        console.log(`Facebook OAuth: Admin user ${req.user.email} detected, redirecting to admin tracking`);
        return res.redirect('/admintrack.html');
      } else {
        console.log(`Facebook OAuth: Regular user ${req.user.email} detected, redirecting to homepage`);
        return res.redirect('/');
      }
    }
  );
}

// Initialize all OAuth strategies and routes
function initializeSocialAuth() {
  configureGoogleStrategy();
  configureFacebookStrategy();
  
  googleAuthRoutes();
  facebookAuthRoutes();
}

// Initialize social authentication
initializeSocialAuth();

module.exports = router;