// updateFeaturedProductDetails.js
// Updates the featured products with detailed information for product detail pages
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

async function updateFeaturedProductDetails() {
  try {
    console.log('Updating featured products with detailed information...');

    // 1. Acer Predator Helios 300 Gaming Laptop
    const acerPredatorUpdate = {
      brand: 'Acer',
      modelNumber: 'PH315-53-71HN',
      sku: 'ACR10750H3060',
      thumbnailUrl: 'frontend\images\acer3000.jpg',
      additionalImages: [
        '/images/product1-side.jpg',
        '/images/product1-back.jpg',
        '/images/product1-keyboard.jpg'
      ],
      detailedDescription: `
        <h4>Powerful Performance</h4>
        <p>Equipped with a 10th Gen Intel Core i7-10750H processor featuring 6 cores and 12 threads, this laptop delivers impressive processing power for gaming and multitasking. The NVIDIA GeForce RTX 3060 graphics card with 6GB GDDR6 memory enables realistic ray-traced graphics and cutting-edge AI features in games.</p>
        
        <h4>Immersive Display</h4>
        <p>Experience smooth, responsive gameplay on the 15.6" Full HD IPS display with a 144Hz refresh rate and 3ms response time. The display features a 72% NTSC color gamut for vibrant, accurate colors whether you're gaming or creating content.</p>
        
        <h4>Advanced Cooling</h4>
        <p>Acer's 4th Gen AeroBlade 3D Fan technology keeps the system cool even during extended gaming sessions. The custom-engineered fan design, strategically placed intake and exhaust vents, and heat pipes ensure optimal thermal performance.</p>
        
        <h4>Customizable RGB Keyboard</h4>
        <p>The 4-zone RGB backlit keyboard allows for customizable lighting effects. The WASD and arrow keys are highlighted for quick identification during intense gaming sessions.</p>
        
        <h4>Fast Storage and Memory</h4>
        <p>With 16GB of DDR4 3200MHz memory and a 512GB PCIe NVMe SSD, this laptop offers fast boot times, quick application launches, and smooth multitasking. The memory can be upgraded to 32GB, and there's room for additional storage drives.</p>
        
        <h4>Connectivity Options</h4>
        <p>Stay connected with a full range of ports including USB 3.2 Type-C, USB 3.2 Type-A, USB 2.0, HDMI 2.0, Mini DisplayPort 1.4, and an RJ-45 Ethernet port. Wireless connectivity includes Killer Wi-Fi 6 AX1650i and Bluetooth 5.1.</p>
      `,
      detailedSpecs: {
        processor: {
          title: 'Processor',
          details: [
            'Intel Core i7-10750H',
            '6 cores, 12 threads',
            '2.6GHz base frequency, up to 5.0GHz with Turbo Boost',
            '12MB Intel Smart Cache'
          ]
        },
        graphics: {
          title: 'Graphics',
          details: [
            'NVIDIA GeForce RTX 3060 Laptop GPU',
            '6GB GDDR6 VRAM',
            'Ray Tracing Cores, Tensor Cores, DLSS support'
          ]
        },
        memory: {
          title: 'Memory',
          details: [
            '16GB DDR4 3200MHz (2x8GB)',
            'Upgradable to 32GB (2x16GB)',
            'Dual-channel support'
          ]
        },
        storage: {
          title: 'Storage',
          details: [
            '512GB PCIe NVMe SSD',
            'Additional empty 2.5" drive bay for storage expansion'
          ]
        },
        display: {
          title: 'Display',
          details: [
            '15.6" Full HD (1920 x 1080) IPS',
            '144Hz refresh rate',
            '3ms response time',
            '72% NTSC color gamut',
            'ComfyView LED-backlit'
          ]
        },
        audio: {
          title: 'Audio',
          details: [
            'DTS:X Ultra Audio',
            'Dual speakers',
            'Acer TrueHarmony technology'
          ]
        },
        keyboard: {
          title: 'Keyboard',
          details: [
            '4-zone RGB backlit keyboard',
            'WASD and arrow keys highlighted',
            'Dedicated Turbo button',
            'NumPad'
          ]
        },
        connectivity: {
          title: 'Connectivity',
          details: [
            'Killer Wi-Fi 6 AX1650i (802.11ax)',
            'Bluetooth 5.1',
            '1x USB 3.2 Gen 2 Type-C',
            '3x USB 3.2 Gen 1 Type-A (one with power-off charging)',
            '1x HDMI 2.0 with HDCP support',
            '1x Mini DisplayPort 1.4',
            '1x RJ-45 Ethernet port',
            '1x 3.5mm headphone/microphone combo jack'
          ]
        },
        battery: {
          title: 'Battery',
          details: [
            '4-cell Li-ion, 59Wh',
            'Up to 6 hours of battery life',
            '230W power adapter'
          ]
        },
        operatingSystem: {
          title: 'Operating System',
          details: [
            'Windows 11 Home'
          ]
        },
        dimensions: {
          title: 'Dimensions',
          details: [
            '363.4 x 255 x 22.9 mm (14.31 x 10.04 x 0.90 inches)',
            'Weight: 2.2 kg (4.85 lbs)'
          ]
        }
      },
      faqs: [
        {
          question: 'Can the RAM be upgraded?',
          answer: 'Yes, the laptop has two RAM slots. It comes with 16GB (2x8GB) and can be upgraded to a maximum of 32GB (2x16GB) DDR4 memory.'
        },
        {
          question: 'Does this laptop have an additional storage bay?',
          answer: 'Yes, in addition to the 512GB NVMe SSD, there is an empty 2.5" drive bay for additional storage expansion.'
        },
        {
          question: 'What is the battery life like?',
          answer: 'Battery life varies depending on usage, but typically lasts up to 6 hours for regular tasks. For gaming, it\'s recommended to use the power adapter for optimal performance.'
        },
        {
          question: 'Does this laptop support external displays?',
          answer: 'Yes, you can connect external displays using the HDMI 2.0 port or Mini DisplayPort 1.4. The USB Type-C port also supports DisplayPort over USB-C.'
        }
      ],
      shippingInfo: 'Free shipping on orders over $50. Free returns.',
    };

    // 2. NVIDIA GeForce RTX 4070 Graphics Card
    const nvidiaRTXUpdate = {
      brand: 'NVIDIA',
      modelNumber: 'RTX 4070-FE',
      sku: 'NV4070-8GB',
      thumbnailUrl: 'frontend\images\acer4070.jpg',
      additionalImages: [
        '/images/product2-side.jpg',
        '/images/product2-back.jpg',
        '/images/product2-io.jpg'
      ],
      detailedDescription: `
        <h4>Next-Gen Gaming Performance</h4>
        <p>The NVIDIA GeForce RTX 4070 is powered by the NVIDIA Ada Lovelace architecture and delivers exceptional gaming performance. With 12GB GDDR6X memory and advanced ray tracing capabilities, this card pushes the boundaries of realism in modern games.</p>
        
        <h4>DLSS 3 Technology</h4>
        <p>Featuring DLSS 3 with Frame Generation, the RTX 4070 uses AI to generate entirely new frames, dramatically increasing game performance. Experience up to 2x performance in the latest games with ray tracing enabled.</p>
        
        <h4>Ray Tracing Excellence</h4>
        <p>3rd generation RT Cores provide realistic lighting, reflections, and shadows, bringing unprecedented levels of realism to your games. The specialized ray tracing hardware delivers up to 2x the ray tracing performance of the previous generation.</p>
        
        <h4>Efficient Power Design</h4>
        <p>The RTX 4070 features an efficient design that delivers high performance with optimized power consumption. The dual axial flow through cooling solution keeps temperatures low even during intensive gaming sessions.</p>
        
        <h4>NVIDIA Reflex</h4>
        <p>Gain a competitive edge with NVIDIA Reflex, which delivers the lowest latency and best responsiveness in competitive games. The combination of low latency rendering, reduced system latency, and enhanced response times gives you the ultimate competitive advantage.</p>
        
        <h4>Content Creation Accelerated</h4>
        <p>Beyond gaming, the RTX 4070 accelerates creative workflows. Take advantage of hardware-accelerated ray tracing, AI-assisted features, and NVIDIA Studio drivers to boost productivity in creative applications like video editing, 3D rendering, and graphic design.</p>
      `,
      detailedSpecs: {
        processor: {
          title: 'GPU Architecture',
          details: [
            'NVIDIA Ada Lovelace',
            '5888 CUDA Cores',
            '46 RT Cores',
            '184 Tensor Cores'
          ]
        },
        memory: {
          title: 'Memory',
          details: [
            '12GB GDDR6X',
            '192-bit memory interface',
            '21 Gbps memory speed',
            '504 GB/s memory bandwidth'
          ]
        },
        connectivity: {
          title: 'Connectivity',
          details: [
            'PCIe 4.0 x16',
            '3x DisplayPort 1.4a',
            '1x HDMI 2.1'
          ]
        },
        display: {
          title: 'Display Support',
          details: [
            'Maximum Resolution: 8K (7680 x 4320)',
            'Multi-monitor support: up to 4 displays',
            'HDR support'
          ]
        },
        dimensions: {
          title: 'Dimensions',
          details: [
            'Length: 267 mm (10.5 inches)',
            'Width: 112 mm (4.4 inches)',
            'Height: 2-slot design',
            'Weight: 900g'
          ]
        },
        power: {
          title: 'Power',
          details: [
            '200W Total Board Power',
            '650W recommended system power',
            '1x 16-pin power connector (adapter included)'
          ]
        }
      },
      faqs: [
        {
          question: 'Is this card suitable for 4K gaming?',
          answer: 'Yes, the RTX 4070 is excellent for 4K gaming with high frame rates in most modern titles, especially when using DLSS.'
        },
        {
          question: 'What power supply do I need?',
          answer: 'NVIDIA recommends at least a 650W power supply for systems using the RTX 4070.'
        },
        {
          question: 'Does this card support ray tracing?',
          answer: 'Yes, the RTX 4070 features 3rd generation RT cores specifically designed for ray tracing, delivering excellent ray tracing performance.'
        },
        {
          question: 'What kind of power connector does this card use?',
          answer: 'It uses the new 16-pin PCIe Gen 5 connector. An adapter is included in the box that connects to 8-pin PCIe power cables.'
        }
      ],
      shippingInfo: 'Free shipping on orders over $50. Free returns. 3-year manufacturer warranty included.'
    };

    // 3. LG UltraGear 27" 1ms 144Hz Gaming Monitor
    const lgMonitorUpdate = {
      brand: 'LG',
      modelNumber: '27GN950-B',
      sku: 'LG27GN950B',
      thumbnailUrl: 'frontend\images\lg27.jpg',
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

    // 4. TechStore Voyager Gaming PC
    const voyagerPCUpdate = {
      brand: 'TechStore',
      modelNumber: 'TS-VGR-2023',
      sku: 'TSVGR13700K4070',
      thumbnailUrl: 'frontend\images\voyage.jpg',
      additionalImages: [
        '/images/product4-side.jpg',
        '/images/product4-interior.jpg',
        '/images/product4-rear.jpg'
      ],
      detailedDescription: `
        <h4>Balanced Gaming Performance</h4>
        <p>The TechStore Voyager delivers exceptional gaming performance with the Intel Core i7-13700K processor and NVIDIA RTX 4070 graphics card. This powerful combination handles modern AAA games at high resolutions and frame rates with ease.</p>
        
        <h4>Advanced Cooling Solution</h4>
        <p>Featuring a 240mm AIO liquid cooler for the CPU and optimized airflow design, the Voyager maintains optimal temperatures even during extended gaming sessions. The strategically placed intake and exhaust fans create positive pressure to minimize dust buildup.</p>
        
        <h4>High-Speed DDR5 Memory</h4>
        <p>Equipped with 32GB of DDR5-5200 memory in dual-channel configuration, the Voyager excels at multitasking and memory-intensive applications. The high-speed memory ensures smooth performance in games and content creation tasks.</p>
        
        <h4>Fast Storage Configuration</h4>
        <p>The 1TB NVMe SSD delivers lightning-fast boot and load times, while the additional 2TB HDD provides ample storage for your game library and media files. Experience quick access to your most-used applications and plenty of space for everything else.</p>
        
        <h4>Customizable RGB Lighting</h4>
        <p>Express your personal style with the fully customizable RGB lighting system. Coordinate colors and effects across all compatible components using the included software. Create a unique look that matches your gaming setup.</p>
        
        <h4>Built for Expansion</h4>
        <p>The Voyager uses standardized components and includes extra drive bays, PCIe slots, and fan mounts, making future upgrades easy. As your needs evolve, your system can evolve with you.</p>
      `,
      detailedSpecs: {
        processor: {
          title: 'Processor',
          details: [
            'Intel Core i7-13700K',
            '16 Cores (8P + 8E), 24 Threads',
            '3.4GHz Base, 5.4GHz Max Turbo',
            '30MB Intel Smart Cache'
          ]
        },
        graphics: {
          title: 'Graphics',
          details: [
            'NVIDIA GeForce RTX 4070',
            '12GB GDDR6X Memory',
            'Ray Tracing Cores',
            'DLSS 3 Support'
          ]
        },
        memory: {
          title: 'Memory',
          details: [
            '32GB DDR5-5200MHz (2x16GB)',
            'Dual Channel',
            'Expandable to 64GB'
          ]
        },
        storage: {
          title: 'Storage',
          details: [
            '1TB NVMe PCIe 4.0 SSD (System Drive)',
            '2TB 7200RPM HDD (Data Drive)',
            'Additional M.2 and 2.5"/3.5" drive bays available'
          ]
        },
        motherboard: {
          title: 'Motherboard',
          details: [
            'Z690 Chipset',
            'WiFi 6 and Bluetooth 5.2',
            'Multiple M.2 slots',
            'USB 3.2 Gen 2 ports'
          ]
        },
        cooling: {
          title: 'Cooling',
          details: [
            '240mm AIO Liquid CPU Cooler',
            '3x 120mm RGB Front Fans',
            '1x 120mm Rear Exhaust Fan',
            'Mesh Front Panel for Optimal Airflow'
          ]
        },
        power: {
          title: 'Power Supply',
          details: [
            '850W 80+ Gold Certified',
            'Fully Modular',
            'Japanese Capacitors',
            'Protection Against Overvoltage, Undervoltage, Short Circuit'
          ]
        },
        case: {
          title: 'Case',
          details: [
            'Mid-Tower ATX Design',
            'Tempered Glass Side Panel',
            'Mesh Front Panel',
            'USB 3.2 Type-C Front Port',
            '2x USB 3.0 Front Ports',
            'Audio Jack',
            'RGB Controller'
          ]
        },
        operatingSystem: {
          title: 'Operating System',
          details: [
            'Windows 11 Home',
            'No Bloatware',
            'Latest Updates Installed'
          ]
        }
      },
      faqs: [
        {
          question: 'Is this PC good for content creation in addition to gaming?',
          answer: 'Yes, the Intel Core i7-13700K with 16 cores and the RTX 4070 graphics card make this PC excellent for content creation tasks like video editing, 3D rendering, and streaming alongside gaming.'
        },
        {
          question: 'Can I upgrade components in the future?',
          answer: 'Absolutely! The Voyager uses standard components and has additional drive bays and PCIe slots for future expansion. The 850W power supply also has headroom for more powerful components.'
        },
        {
          question: 'What kind of warranty is included?',
          answer: 'The TechStore Voyager comes with a 2-year warranty covering parts and labor. We also offer a 30-day satisfaction guarantee with free return shipping.'
        },
        {
          question: 'How quiet is this PC during gaming?',
          answer: 'The Voyager is designed with a balance of performance and acoustics in mind. During typical gaming sessions, the noise level is kept below 40dBA. The liquid cooling helps maintain low noise levels even under heavy load.'
        }
      ],
      shippingInfo: 'Free white-glove delivery service. 30-day satisfaction guarantee. 2-year warranty included.'
    };

    // Update products in database
    const updatePromises = [
      Product.findOneAndUpdate({ slug: 'acer-predator-helios-300' }, acerPredatorUpdate, { new: true }),
      Product.findOneAndUpdate({ slug: 'nvidia-geforce-rtx-4080' }, nvidiaRTXUpdate, { new: true }),
      Product.findOneAndUpdate({ slug: 'lg-27gn950-b-ultragear' }, lgMonitorUpdate, { new: true }),
      Product.findOneAndUpdate({ slug: 'techstore-voyager' }, voyagerPCUpdate, { new: true })
    ];

    const results = await Promise.all(updatePromises);
    
    // Log results
    results.forEach(product => {
      if (product) {
        console.log(`✅ Updated: ${product.name}`);
      } else {
        console.log(`❌ Product not found`);
      }
    });

    console.log('Featured product updates completed!');

  } catch (error) {
    console.error('Error updating featured products:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update function
updateFeaturedProductDetails();