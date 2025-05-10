// updateLGMonitor.js
// Updates the LG UltraGear monitor with detailed information for product detail page
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Product = require('../models/product');

// Set your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techstore';

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateLGMonitor() {
  try {
    const monitorId = "681e3143bf1727e8bb3a3d81"; // Specific ID of the LG monitor
    console.log(`Updating LG UltraGear monitor with ID: ${monitorId}`);

    // LG UltraGear 27" 1ms 144Hz Gaming Monitor detailed information
    const lgMonitorUpdate = {
      brand: 'LG',
      modelNumber: '27GN950-B',
      sku: 'LG27GN950B',
      thumbnailUrl: '/images/product3.jpg',
      additionalImages: [
        '/images/product3-side.jpg',
        '/images/product3-back.jpg',
        '/images/product3-ports.jpg'
      ],
      detailedDescription: `
        <h4>Superior Gaming Display</h4>
        <p>The LG UltraGear 27GN950-B delivers exceptional gaming performance with its 27" Nano IPS display, 4K UHD resolution, and 144Hz refresh rate. Experience breathtaking clarity and smooth motion in the latest games.</p>
        
        <h4>Ultra-Fast Response Time</h4>
        <p>With a blazing-fast 1ms Gray-to-Gray (GtG) response time, this monitor eliminates motion blur and ghosting, ensuring clear images even in fast-paced action scenes.</p>
        
        <h4>VESA DisplayHDR 600</h4>
        <p>Experience greater contrast with deep blacks and bright highlights thanks to VESA DisplayHDR 600 certification. See games and content as creators intended with exceptional HDR quality.</p>
        
        <h4>Wide Color Gamut</h4>
        <p>The Nano IPS panel delivers 98% coverage of the DCI-P3 color space, providing rich, accurate colors. Whether you're gaming or creating content, colors appear vivid and true-to-life.</p>
        
        <h4>Adaptive Sync Technology</h4>
        <p>Compatible with both NVIDIA G-SYNC and AMD FreeSync Premium Pro, this monitor eliminates screen tearing and stuttering, delivering a fluid gaming experience regardless of your graphics card.</p>
        
        <h4>Sphere Lighting 2.0</h4>
        <p>The rear RGB lighting system creates an immersive atmosphere by projecting light that changes in harmony with the on-screen action. Customize the lighting effects to match your setup and preferences.</p>
      `,
      detailedSpecs: {
        display: {
          title: 'Display',
          details: [
            '27" Nano IPS Panel',
            '4K UHD Resolution (3840 x 2160)',
            '144Hz Refresh Rate',
            '1ms Gray-to-Gray Response Time',
            '98% DCI-P3 Color Gamut',
            '10-bit Color Depth (8-bit + FRC)',
            'VESA DisplayHDR 600 Certified'
          ]
        },
        connectivity: {
          title: 'Connectivity',
          details: [
            '2x HDMI 2.1',
            '1x DisplayPort 1.4',
            '3-port USB 3.0 Hub',
            'Headphone Out'
          ]
        },
        features: {
          title: 'Features',
          details: [
            'NVIDIA G-SYNC Compatible',
            'AMD FreeSync Premium Pro',
            'Sphere Lighting 2.0 (RGB)',
            'Black Stabilizer',
            'Dynamic Action Sync',
            'Crosshair',
            'Reader Mode',
            'Flicker-Free',
            'OnScreen Control Software'
          ]
        },
        ergonomics: {
          title: 'Ergonomics',
          details: [
            'Height Adjustable Stand (110mm)',
            'Tilt (-5° to 15°)',
            'Pivot (90°)',
            'VESA Mount Compatible (100 x 100mm)'
          ]
        },
        dimensions: {
          title: 'Dimensions',
          details: [
            'With Stand: 614.2 x 574.8 x 291.2 mm',
            'Without Stand: 614.2 x 364.8 x 56.3 mm',
            'Weight: 6.5 kg (with stand)'
          ]
        },
        power: {
          title: 'Power',
          details: [
            'Power Supply: 100-240V, 50/60Hz',
            'Power Consumption: 55W (Typical)',
            'Power Saving Mode: < 0.5W'
          ]
        }
      },
      faqs: [
        {
          question: 'Can this monitor display 4K at 144Hz?',
          answer: 'Yes, the monitor can display 4K at 144Hz using DisplayPort 1.4 with DSC (Display Stream Compression). Via HDMI 2.1, it can reach 4K at 120Hz.'
        },
        {
          question: 'Does this monitor work with both NVIDIA and AMD graphics cards?',
          answer: 'Yes, it is compatible with both NVIDIA G-SYNC and AMD FreeSync Premium Pro technologies for smooth gaming regardless of your graphics card manufacturer.'
        },
        {
          question: 'What cables are included in the box?',
          answer: 'The monitor comes with a DisplayPort cable, HDMI cable, USB upstream cable, and power cable.'
        },
        {
          question: 'Is this monitor good for content creation?',
          answer: 'Yes, with 98% DCI-P3 color gamut coverage and 10-bit color depth, this monitor is excellent for both gaming and content creation tasks like photo editing, video editing, and graphic design.'
        }
      ],
      shippingInfo: 'Free express shipping. 30-day return policy. 3-year manufacturer warranty included.'
    };

    // Update the product in the database using its specific _id
    const updatedMonitor = await Product.findByIdAndUpdate(
      monitorId,
      lgMonitorUpdate,
      { new: true } // Return the updated document
    );

    if (updatedMonitor) {
      console.log('✅ Monitor updated successfully:');
      console.log(`- Name: ${updatedMonitor.name}`);
      console.log(`- Brand: ${updatedMonitor.brand}`);
      console.log(`- Model: ${updatedMonitor.modelNumber}`);
    } else {
      console.log(`❌ Monitor with ID ${monitorId} not found`);
    }

  } catch (error) {
    console.error('Error updating LG monitor:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update function
updateLGMonitor();