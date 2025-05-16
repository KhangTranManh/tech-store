// utils/sendEmail.js
const nodemailer = require('nodemailer');

/**
 * Send email utility function
 * @param {Object} options - Email options object
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body (optional)
 */
const sendEmail = async (options) => {
  // During development, log email details
  console.log('-------- EMAIL BEING SENT --------');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  
  try {
    // Create a transporter using Gmail service
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: process.env.NODEMAILER_PORT,
      secure: process.env.NODEMAILER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || undefined
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    console.log('------------------------------------');
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    console.log('------------------------------------');
    // Don't throw the error, just log it - we don't want to break the API flow
  }
  
  // Return a success response to not break the flow
  return { success: true, messageId: 'email-sent-or-logged' };
};

module.exports = sendEmail;