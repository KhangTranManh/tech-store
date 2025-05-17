// frontend/js/email.js
const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * @returns {Object} Nodemailer transporter
 */
function createEmailTransporter() {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'khangjaki12@gmail.com',
            pass: process.env.EMAIL_PASSWORD // Use EMAIL_PASSWORD instead of EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

/**
 * Send order confirmation email
 * @param {Object} user - User object
 * @param {Object} order - Order object
 * @returns {Promise} Promise resolving to email send result
 */
async function sendOrderConfirmationEmail(user, order) {
    try {
        // Create email transporter
        const transporter = createEmailTransporter();
        
        // Format order items for email
        const orderItemsHtml = order.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');
        
        // Determine payment method text
        const paymentMethodText = order.paymentType === 'cod' 
            ? 'Pay on Delivery (Cash or Card)' 
            : `Credit Card (Last 4 digits: ${order.paymentLast4 || '****'})`;
        
        // Prepare email options
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Tech Store" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Order Confirmation #${order.orderNumber}`,
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
                    .order-details { background-color: #fff; padding: 20px; border: 1px solid #ddd; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    table, th, td { border: 1px solid #ddd; }
                    th, td { padding: 10px; text-align: left; }
                    .total { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Confirmation</h1>
                        <p>Thank you for your purchase!</p>
                    </div>
                    
                    <div class="order-details">
                        <h2>Order Details</h2>
                        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                        
                        <h3>Items</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderItemsHtml}
                            </tbody>
                        </table>
                        
                        <h3>Order Summary</h3>
                        <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
                        <p><strong>Shipping:</strong> ${order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`}</p>
                        <p><strong>Tax:</strong> $${order.tax.toFixed(2)}</p>
                        <p class="total"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                        
                        <h3>Shipping Information</h3>
                        <p><strong>Payment Method:</strong> ${paymentMethodText}</p>
                        
                        <p>You can track your order status by logging into your account.</p>
                    </div>
                    
                    <div class="footer" style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #666;">
                        <p>© ${new Date().getFullYear()} Tech Store. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Order confirmation email sent to ${user.email}. Message ID: ${info.messageId}`);
        
        return info;
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        // Re-throw the error so we can handle it in the calling function
        throw error;
    }
}

module.exports = {
    createEmailTransporter,
    sendOrderConfirmationEmail
};