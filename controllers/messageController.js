// controllers/messageController.js
const Message = require('../models/message');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');

/**
 * Submit contact form message
 * @route POST /api/messages/contact
 * @access Public
 */
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create new message
    const newMessage = await Message.create({
      name,
      email,
      phone,
      subject,
      message
    });

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });

    if (adminUsers.length > 0) {
      // Prepare email html content
      const htmlContent = `
        <h2>New Contact Form Message</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p>You can view and respond to this message in your <a href="${process.env.SITE_URL}/admin/messages">admin dashboard</a>.</p>
      `;

      // Prepare text content for email clients that don't support HTML
      const textContent = `
        New Contact Form Message
        
        From: ${name} (${email})
        ${phone ? `Phone: ${phone}` : ''}
        Subject: ${subject}
        
        Message:
        ${message}
        
        You can view and respond to this message in your admin dashboard:
        ${process.env.SITE_URL}/admin/messages
      `;

      // Send notification to all admin users
      const emailPromises = adminUsers.map(admin => {
        return sendEmail({
          to: admin.email,
          subject: `[TechStore] New Contact Form Message: ${subject}`,
          text: textContent,
          html: htmlContent
        });
      });

      // Wait for all emails to be sent
      await Promise.all(emailPromises);
    } else {
      console.warn('No admin users found to notify about new contact message');
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon!'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending your message. Please try again later.'
    });
  }
};

/**
 * Get all messages
 * @route GET /api/messages
 * @access Admin only
 */
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
};

/**
 * Get message by ID
 * @route GET /api/messages/:id
 * @access Admin only
 */
exports.getMessageById = async (req, res) => {
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
    
    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    
    // Handle invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching message'
    });
  }
};

/**
 * Update message
 * @route PUT /api/messages/:id
 * @access Admin only
 */
exports.updateMessage = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    
    // Find message
    let message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Update fields if provided
    if (status) message.status = status;
    if (assignedTo) message.assignedTo = assignedTo;
    
    // Save changes
    await message.save();
    
    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error updating message:', error);
    
    // Handle invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating message'
    });
  }
};

/**
 * Delete message
 * @route DELETE /api/messages/:id
 * @access Admin only
 */
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    await message.remove();
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    
    // Handle invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
};

/**
 * Reply to a message
 * @route POST /api/messages/:id/reply
 * @access Admin only
 */
exports.replyToMessage = async (req, res) => {
  try {
    const { replyText } = req.body;
    
    if (!replyText) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }
    
    // Find message
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Send reply email
    await sendEmail({
      to: message.email,
      subject: `Re: ${message.subject}`,
      text: replyText,
      html: `
        <p>Dear ${message.name},</p>
        <p>${replyText.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>TechStore Support Team</p>
        <hr>
        <p><em>This is in response to your message:</em></p>
        <p><strong>Subject:</strong> ${message.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.message.replace(/\n/g, '<br>')}</p>
      `
    });
    
    // Update message status to in-progress if it's new
    if (message.status === 'new') {
      message.status = 'in-progress';
      await message.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending reply'
    });
  }
};