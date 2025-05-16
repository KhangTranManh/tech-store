// routes/message.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const Message = require('../models/message');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');

/**
 * @route   POST /api/messages/contact
 * @desc    Submit a new contact message
 * @access  Public
 */
router.post('/contact', async (req, res) => {
  console.log('Contact form submission received:', req.body);
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create new message document
    const newMessage = new Message({
      name,
      email,
      phone,
      subject,
      message,
      status: 'new'
    });

    // Save to database
    await newMessage.save();
    console.log('Message saved successfully:', newMessage._id);

    // Try to find admin users to notify
    try {
      const adminUsers = await User.find({ role: 'admin' });
      console.log(`Found ${adminUsers.length} admin users to notify`);

      // If we have admin users, notify them
      if (adminUsers.length > 0) {
        for (const admin of adminUsers) {
          try {
            // Only attempt to send if sendEmail exists
            if (typeof sendEmail === 'function') {
              await sendEmail({
                to: admin.email,
                subject: `New Contact Form Message: ${subject}`,
                text: `
                  New message from ${name} (${email}):
                  
                  Subject: ${subject}
                  
                  ${message}
                  
                  Phone: ${phone || 'Not provided'}
                `
              });
              console.log(`Notification sent to admin: ${admin.email}`);
            } else {
              console.log('sendEmail function not available, skipping notification');
            }
          } catch (emailError) {
            // Log but continue - we don't want to fail the request if email fails
            console.error(`Failed to send notification to ${admin.email}:`, emailError);
          }
        }
      }
    } catch (notifyError) {
      // Log but continue - still return success to user
      console.error('Error notifying admins:', notifyError);
    }

    // Return success to client
    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon!'
    });
  } catch (error) {
    console.error('Error processing contact submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while processing your message. Please try again later.'
    });
  }
});

/**
 * @route   GET /api/messages
 * @desc    Get all messages
 * @access  Admin only
 */
router.get('/', isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Optional filter by status
    const filter = status ? { status } : {};
    
    // Get messages, newest first
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');
    
    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching messages'
    });
  }
});

/**
 * @route   GET /api/messages/:id
 * @desc    Get message by ID and mark as read
 * @access  Admin only
 */
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Mark as read if not already
    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }
    
    return res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching message'
    });
  }
});

/**
 * @route   PUT /api/messages/:id
 * @desc    Update message status
 * @access  Admin only
 */
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }
    
    // Validate status value
    if (!['new', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: new, in-progress, or resolved'
      });
    }
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Update status
    message.status = status;
    await message.save();
    
    return res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while updating message'
    });
  }
});

/**
 * @route   POST /api/messages/:id/reply
 * @desc    Reply to message
 * @access  Admin only
 */
router.post('/:id/reply', isAdmin, async (req, res) => {
  try {
    const { replyText } = req.body;
    
    if (!replyText) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Try to send reply email
    try {
      if (typeof sendEmail === 'function') {
        await sendEmail({
          to: message.email,
          subject: `Re: ${message.subject}`,
          text: `
            Dear ${message.name},
            
            ${replyText}
            
            Best regards,
            TechStore Support Team
            
            ---
            This is in response to your message:
            Subject: ${message.subject}
            
            ${message.message}
          `
        });
      } else {
        console.warn('sendEmail function not available, skipping email');
      }
    } catch (emailError) {
      console.error('Error sending reply email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send reply email. Please try again.'
      });
    }
    
    // Update message status to in-progress if it's currently new
    if (message.status === 'new') {
      message.status = 'in-progress';
      await message.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while sending reply'
    });
  }
});

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete message
 * @access  Admin only
 */
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    await message.deleteOne();
    
    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting message'
    });
  }
});

// Simple test route to verify the API is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Message API is operational'
  });
});

module.exports = router;