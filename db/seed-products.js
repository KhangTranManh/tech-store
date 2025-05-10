// seedProducts.js - Create products for each category/subcategory
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Category = require('../models/category');
const Product = require('../models/product');

// Set your MongoDB connection string here
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techstore';

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding products'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function seedProducts() {
  try {
    // Get all categories first
    const allCategories = await Category.find();
    if (allCategories.length === 0) {
      console.error('No categories found. Please run seedCategories.js first.');
      process.exit(1);
    }

    console.log(`Found ${allCategories.length} categories`);

    // Create maps for easier lookup
    const categoryMap = {};
    const subcategoryMap = {};

    // Map for parent categories (main categories)
    allCategories.filter(cat => cat.level === 0).forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Map for subcategories
    allCategories.filter(cat => cat.level === 1).forEach(cat => {
      subcategoryMap[cat.slug] = {
        id: cat._id,
        parentId: cat.parent
      };
    });

    console.log('Category mapping completed');
    console.log('Main categories:', Object.keys(categoryMap));
    console.log('Subcategories:', Object.keys(subcategoryMap));

    // Delete existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Define products with all required fields based on the schema
    const products = [
      // LAPTOP PRODUCTS
      // Gaming Laptop
      {
        name: 'Acer Predator Helios 300',
        slug: 'acer-predator-helios-300',
        description: 'The Acer Predator Helios 300 features a 15.6" Full HD IPS display with 144Hz refresh rate, Intel Core i7-11800H processor, 16GB DDR4 RAM, 512GB NVMe SSD, and NVIDIA GeForce RTX 3060 graphics.',
        shortDescription: 'Powerful gaming laptop with RTX 3060 graphics',
        price: 1299.99,
        compareAtPrice: 1499.99,
        category: categoryMap['laptops'],
        subCategory: subcategoryMap['gaming-laptops'].id,
        stock: 15,
        specs: 'Intel Core i7-11800H, 16GB RAM, 512GB SSD, RTX 3060, 15.6" FHD 144Hz',
        features: ['144Hz Refresh Rate', 'RGB Backlit Keyboard', 'DTS:X Ultra Audio', 'PredatorSense Software'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 13,
        rating: 4.7,
        reviewCount: 128,
        tags: ['gaming', 'laptops', 'nvidia', 'rtx3060', 'acer', 'predator']
      },
      
      // Business Laptop
      {
        name: 'Lenovo ThinkPad X1 Carbon',
        slug: 'lenovo-thinkpad-x1-carbon',
        description: 'The Lenovo ThinkPad X1 Carbon is a premium business ultrabook designed for professionals. It features a 14" WQHD display, Intel Core i7 processor, 16GB RAM, and military-grade durability.',
        shortDescription: 'Premium business ultrabook with long battery life',
        price: 1699.99,
        compareAtPrice: 1899.99,
        category: categoryMap['laptops'],
        subCategory: subcategoryMap['business-laptops'].id,
        stock: 12,
        specs: 'Intel Core i7-1165G7, 16GB RAM, 512GB SSD, 14" WQHD, Windows 11 Pro',
        features: ['Fingerprint reader', 'ThinkShutter camera cover', 'Military-grade durability', 'Rapid charge technology'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 10,
        rating: 4.8,
        reviewCount: 92,
        tags: ['business', 'laptops', 'thinkpad', 'lenovo', 'ultrabook']
      },
      
      // Ultrabook
      {
        name: 'Dell XPS 13',
        slug: 'dell-xps-13',
        description: 'The Dell XPS 13 features a stunning 13.4" InfinityEdge display with virtually no bezels, 11th Gen Intel processors, and a compact design thats both powerful and portable.',
        shortDescription: 'Premium ultrabook with InfinityEdge display',
        price: 1299.99,
        compareAtPrice: 1399.99,
        category: categoryMap['laptops'],
        subCategory: subcategoryMap['ultrabooks'].id,
        stock: 14,
        specs: 'Intel Core i7-1185G7, 16GB RAM, 512GB SSD, 13.4" UHD+ Touch Display',
        features: ['InfinityEdge display', 'CNC machined aluminum chassis', 'Dolby Vision support', 'Thunderbolt 4 connectivity'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.9,
        reviewCount: 156,
        tags: ['ultrabook', 'laptops', 'dell', 'xps', 'premium']
      },
      
      // 2-in-1 Laptop
      {
        name: 'HP Spectre x360',
        slug: 'hp-spectre-x360',
        description: 'The HP Spectre x360 is a versatile convertible laptop with a stunning OLED display, gem-cut design, and powerful performance for creators and professionals.',
        shortDescription: 'Premium 2-in-1 convertible with OLED display',
        price: 1399.99,
        compareAtPrice: 1599.99,
        category: categoryMap['laptops'],
        subCategory: subcategoryMap['2-in-1-laptops'].id,
        stock: 9,
        specs: 'Intel Core i7-1165G7, 16GB RAM, 1TB SSD, 13.5" 3K2K OLED Touch Display',
        features: ['360° hinge design', 'HP MPP 2.0 Tilt Pen support', 'Bang & Olufsen audio', 'Webcam kill switch'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 12,
        rating: 4.7,
        reviewCount: 108,
        tags: ['2-in-1', 'convertible', 'laptops', 'hp', 'spectre', 'oled']
      },
      
      // Chromebook
      {
        name: 'Google Pixelbook Go',
        slug: 'google-pixelbook-go',
        description: 'The Google Pixelbook Go is a premium Chromebook featuring a 13.3" touchscreen display, up to 12 hours of battery life, and a lightweight, portable design perfect for on-the-go productivity.',
        shortDescription: 'Premium Chromebook with 12-hour battery life',
        price: 649.99,
        compareAtPrice: 699.99,
        category: categoryMap['laptops'],
        subCategory: subcategoryMap['chromebooks'].id,
        stock: 15,
        specs: 'Intel Core i5, 8GB RAM, 128GB SSD, 13.3" Full HD Touchscreen',
        features: ['Hush Keys for quiet typing', 'Titan C security chip', 'Quick Charge technology', 'HD webcam'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.6,
        reviewCount: 87,
        tags: ['chromebook', 'laptops', 'google', 'pixelbook', 'chrome os']
      },
      
      // COMPONENT PRODUCTS
      // Graphics Card
      {
        name: 'NVIDIA GeForce RTX 4080',
        slug: 'nvidia-geforce-rtx-4080',
        description: 'The NVIDIA GeForce RTX 4080 delivers extreme gaming performance with 16GB of high-speed GDDR6X memory, DLSS 3 with AI frame generation, and advanced ray tracing capabilities.',
        shortDescription: 'High-end gaming graphics card with 16GB GDDR6X',
        price: 1199.99,
        compareAtPrice: 1299.99,
        category: categoryMap['components'],
        subCategory: subcategoryMap['graphics-cards'].id,
        stock: 8,
        specs: '16GB GDDR6X, 9728 CUDA Cores, PCIe 4.0, 2.5 Slot Design',
        features: ['DLSS 3 with frame generation', 'Ray tracing cores', 'NVIDIA Reflex low latency', 'AV1 encode & decode'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.9,
        reviewCount: 94,
        tags: ['graphics card', 'gpu', 'nvidia', 'rtx', 'gaming']
      },
      
      // Processor
      {
        name: 'Intel Core i9-13900K',
        slug: 'intel-core-i9-13900k',
        description: 'The Intel Core i9-13900K is a high-performance desktop processor featuring 24 cores (8 P-cores + 16 E-cores), 32 threads, up to 5.8GHz boost clock, and support for DDR5 memory and PCIe 5.0.',
        shortDescription: 'Flagship desktop processor with 24 cores',
        price: 599.99,
        compareAtPrice: 649.99,
        category: categoryMap['components'],
        subCategory: subcategoryMap['processors'].id,
        stock: 10,
        specs: '24 Cores (8P+16E), 32 Threads, 5.8GHz Max Turbo, 36MB Cache, LGA 1700',
        features: ['Hybrid architecture', 'Intel Thermal Velocity Boost', 'Intel Thread Director', 'Integrated Intel UHD 770 graphics'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.9,
        reviewCount: 128,
        tags: ['processor', 'cpu', 'intel', 'core i9', 'desktop']
      },
      
      // Motherboard
      {
        name: 'ASUS ROG Maximus Z790 Hero',
        slug: 'asus-rog-maximus-z790-hero',
        description: 'The ASUS ROG Maximus Z790 Hero motherboard offers premium features for Intel 12th and 13th Gen processors, including advanced power delivery, high-speed connectivity, and extensive RGB lighting and customization options.',
        shortDescription: 'Premium Intel Z790 motherboard for enthusiasts',
        price: 599.99,
        compareAtPrice: 649.99,
        category: categoryMap['components'],
        subCategory: subcategoryMap['motherboards'].id,
        stock: 7,
        specs: 'Intel Z790 Chipset, ATX Form Factor, DDR5 Memory, LGA 1700 Socket',
        features: ['20+1 power stages', 'PCIe 5.0 support', 'Thunderbolt 4 connectivity', 'Aura Sync RGB lighting'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.8,
        reviewCount: 64,
        tags: ['motherboard', 'intel', 'z790', 'asus', 'rog']
      },
      
      // RAM
      {
        name: 'Corsair Vengeance RGB Pro 32GB DDR4',
        slug: 'corsair-vengeance-rgb-pro-32gb-ddr4',
        description: 'Corsair Vengeance RGB Pro 32GB (2x16GB) DDR4 memory delivers premium performance and dynamic multi-zone RGB lighting for custom PC builds, with support for XMP 2.0 for easy overclocking.',
        shortDescription: 'High-performance RGB memory for gaming PCs',
        price: 129.99,
        compareAtPrice: 149.99,
        category: categoryMap['components'],
        subCategory: subcategoryMap['memory-ram'].id,
        stock: 20,
        specs: '32GB (2x16GB), DDR4-3600MHz, CL18, 1.35V',
        features: ['Ten-zone RGB lighting', 'Custom performance PCB', 'Aluminum heat spreader', 'XMP 2.0 support'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 13,
        rating: 4.9,
        reviewCount: 256,
        tags: ['memory', 'ram', 'ddr4', 'corsair', 'rgb']
      },
      
      // Storage
      {
        name: 'Samsung 990 PRO 2TB NVMe SSD',
        slug: 'samsung-990-pro-2tb-nvme-ssd',
        description: 'The Samsung 990 PRO 2TB NVMe SSD delivers exceptional performance for gaming and content creation with sequential read speeds up to 7,450 MB/s and nickel-coated controller for optimal thermal control.',
        shortDescription: 'Ultra-fast PCIe 4.0 NVMe SSD for gaming',
        price: 249.99,
        compareAtPrice: 279.99,
        category: categoryMap['components'],
        subCategory: subcategoryMap['storage'].id,
        stock: 18,
        specs: '2TB Capacity, PCIe 4.0 x4, NVMe 2.0, M.2 2280',
        features: ['7,450 MB/s read, 6,900 MB/s write', 'Samsung V-NAND technology', 'Samsung Magician software', 'Dynamic Thermal Guard'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 10,
        rating: 4.9,
        reviewCount: 187,
        tags: ['storage', 'ssd', 'nvme', 'samsung', 'm.2']
      },
      
      // GAMING PC PRODUCTS
      // High-End Gaming PC
      {
        name: 'TechStore Titan X',
        slug: 'techstore-titan-x',
        description: 'The TechStore Titan X is our flagship gaming PC featuring the latest NVIDIA RTX 4090 graphics card, Intel Core i9-13900K processor, 64GB DDR5 RAM, and advanced liquid cooling in a premium case with extensive RGB lighting.',
        shortDescription: 'Ultimate gaming PC with RTX 4090 and i9-13900K',
        price: 3999.99,
        compareAtPrice: 4299.99,
        category: categoryMap['gaming-pcs'],
        subCategory: subcategoryMap['high-end-gaming-pcs'].id,
        stock: 5,
        specs: 'Intel Core i9-13900K, RTX 4090 24GB, 64GB DDR5-6000, 2TB NVMe SSD + 4TB HDD',
        features: ['Custom RGB liquid cooling', 'Premium tempered glass case', 'WiFi 6E connectivity', '1200W Platinum PSU'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 5.0,
        reviewCount: 42,
        tags: ['gaming pc', 'high-end', 'custom pc', 'rtx 4090', 'intel', 'liquid cooling']
      },
      
      // Mid-Range Gaming PC
      {
        name: 'TechStore Voyager',
        slug: 'techstore-voyager',
        description: 'The TechStore Voyager delivers exceptional gaming performance at a reasonable price, featuring the Intel Core i7-13700K processor, NVIDIA RTX 4070 graphics, and 32GB of DDR5 memory in a stylish mid-tower case.',
        shortDescription: 'Balanced gaming PC with RTX 4070 and i7',
        price: 2299.99,
        compareAtPrice: 2499.99,
        category: categoryMap['gaming-pcs'],
        subCategory: subcategoryMap['mid-range-gaming-pcs'].id,
        stock: 8,
        specs: 'Intel Core i7-13700K, RTX 4070 12GB, 32GB DDR5-5200, 1TB NVMe SSD + 2TB HDD',
        features: ['240mm AIO liquid cooling', 'RGB lighting system', 'WiFi 6 and Bluetooth 5.2', '850W Gold PSU'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 8,
        rating: 4.8,
        reviewCount: 64,
        tags: ['gaming pc', 'mid-range', 'custom pc', 'rtx 4070', 'intel']
      },
      
      // Entry-Level Gaming PC
      {
        name: 'TechStore Scout',
        slug: 'techstore-scout',
        description: 'The TechStore Scout provides excellent entry-level gaming performance with the Intel Core i5-13600K processor, NVIDIA RTX 4060 graphics card, and 16GB of DDR5 memory at a budget-friendly price point.',
        shortDescription: 'Affordable gaming PC with RTX 4060',
        price: 1299.99,
        compareAtPrice: 1399.99,
        category: categoryMap['gaming-pcs'],
        subCategory: subcategoryMap['entry-level-gaming-pcs'].id,
        stock: 12,
        specs: 'Intel Core i5-13600K, RTX 4060 8GB, 16GB DDR5-4800, 1TB NVMe SSD',
        features: ['Air cooling with RGB', 'Compact case design', 'WiFi 6 support', '650W Bronze PSU'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.7,
        reviewCount: 86,
        tags: ['gaming pc', 'entry-level', 'budget pc', 'rtx 4060', 'intel']
      },
      
      // Custom Build PC
      {
        name: 'TechStore Custom Creator PC',
        slug: 'techstore-custom-creator-pc',
        description: 'The TechStore Custom Creator PC is optimized for content creation, video editing, and 3D rendering with powerful components that can be customized to your specific needs and workflow requirements.',
        shortDescription: 'Customizable workstation for content creators',
        price: 2599.99,
        compareAtPrice: 2799.99,
        category: categoryMap['gaming-pcs'],
        subCategory: subcategoryMap['custom-build-pcs'].id,
        stock: 3,
        specs: 'Customizable, base config: Intel Core i9-13900K, RTX 4080 16GB, 64GB DDR5-5600, 2TB NVMe SSD',
        features: ['Customizable components', 'Professional-grade cooling', 'Clean professional aesthetic', 'Optional upgrades available'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.9,
        reviewCount: 28,
        tags: ['custom pc', 'workstation', 'content creation', 'video editing', 'professional']
      },
      
      // MONITOR PRODUCTS
      // Gaming Monitor
      {
        name: 'ASUS ROG Swift 360Hz PG259QN',
        slug: 'asus-rog-swift-360hz-pg259qn',
        description: 'The ASUS ROG Swift PG259QN features a 24.5" Full HD IPS panel with a 360Hz refresh rate, 1ms response time, and NVIDIA G-SYNC technology, designed for competitive gamers who need the absolute fastest display.',
        shortDescription: 'Ultra-fast 360Hz gaming monitor for esports',
        price: 699.99,
        compareAtPrice: 799.99,
        category: categoryMap['monitors'],
        subCategory: subcategoryMap['gaming-monitors'].id,
        stock: 10,
        specs: '24.5" IPS, 1920x1080, 360Hz, 1ms GTG, G-SYNC, DisplayHDR 400',
        features: ['360Hz refresh rate', 'NVIDIA Reflex Latency Analyzer', 'ASUS Fast IPS technology', 'NVIDIA G-SYNC processor'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 12,
        rating: 4.8,
        reviewCount: 86,
        tags: ['monitor', 'gaming', 'high refresh rate', 'esports', 'asus']
      },
      
      // Ultrawide Monitor
      {
        name: 'Samsung Odyssey G9 Neo',
        slug: 'samsung-odyssey-g9-neo',
        description: 'The Samsung Odyssey G9 Neo features a massive 49" 1000R curved screen with Quantum Mini LED technology, 240Hz refresh rate, and 1ms response time, creating an incredibly immersive gaming experience.',
        shortDescription: 'Massive 49" curved gaming monitor with mini-LED',
        price: 1799.99,
        compareAtPrice: 1999.99,
        category: categoryMap['monitors'],
        subCategory: subcategoryMap['ultrawide-monitors'].id,
        stock: 5,
        specs: '49" VA, 5120x1440 (32:9), 240Hz, 1ms, Quantum Mini LED, HDR2000',
        features: ['1000R curved screen', 'Quantum Mini LED backlighting', 'CoreSync ambient lighting', 'Picture-by-Picture'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 10,
        rating: 4.9,
        reviewCount: 48,
        tags: ['monitor', 'ultrawide', 'curved', 'gaming', 'samsung']
      },
      
      // 4K Monitor
      {
        name: 'LG 27GN950-B UltraGear',
        slug: 'lg-27gn950-b-ultragear',
        description: 'The LG 27GN950-B UltraGear is a 27" 4K gaming monitor with 144Hz refresh rate, 1ms response time, and outstanding color performance with VESA DisplayHDR 600 certification and 98% DCI-P3 color gamut.',
        shortDescription: '4K gaming monitor with 144Hz refresh rate',
        price: 799.99,
        compareAtPrice: 899.99,
        category: categoryMap['monitors'],
        subCategory: subcategoryMap['4k-monitors'].id,
        stock: 9,
        specs: '27" Nano IPS, 3840x2160, 144Hz, 1ms, HDR600, DCI-P3 98%',
        features: ['Sphere Lighting 2.0', 'VESA DisplayHDR 600', 'G-Sync Compatible', 'AMD FreeSync Premium Pro'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 11,
        rating: 4.8,
        reviewCount: 92,
        tags: ['monitor', '4k', 'gaming', 'hdr', 'lg']
      },
      
      // Professional Monitor
      {
        name: 'Dell UltraSharp U2720Q',
        slug: 'dell-ultrasharp-u2720q',
        description: 'The Dell UltraSharp U2720Q is a 27" 4K monitor designed for professional work with excellent color accuracy, USB-C connectivity, and VESA DisplayHDR 400 certification for content creators.',
        shortDescription: '4K monitor for professional content creation',
        price: 649.99,
        compareAtPrice: 699.99,
        category: categoryMap['monitors'],
        subCategory: subcategoryMap['professional-monitors'].id,
        stock: 12,
        specs: '27" IPS, 3840x2160, 60Hz, 5ms, 100% sRGB, 95% DCI-P3',
        features: ['USB-C with 90W power delivery', 'Factory calibrated', 'VESA DisplayHDR 400', 'InfinityEdge design'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 7,
        rating: 4.8,
        reviewCount: 104,
        tags: ['monitor', 'professional', '4k', 'content creation', 'dell']
      },
      
      // Curved Monitor
      {
        name: 'MSI MPG ARTYMIS 343CQR',
        slug: 'msi-mpg-artymis-343cqr',
        description: 'The MSI MPG ARTYMIS 343CQR features an aggressive 1000R curvature on a 34" ultrawide panel with 165Hz refresh rate, 1ms response time, and AI-powered optimization for an incredibly immersive gaming experience.',
        shortDescription: '34" ultra-curved gaming monitor',
        price: 899.99,
        compareAtPrice: 999.99,
        category: categoryMap['monitors'],
        subCategory: subcategoryMap['curved-monitors'].id,
        stock: 8,
        specs: '34" VA, 3440x1440, 165Hz, 1ms, HDR400, 1000R Curve',
        features: ['1000R super-curved panel', 'Gaming Intelligence AI', 'KVM built-in', 'Mystic Light RGB'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        discount: 10,
        rating: 4.7,
        reviewCount: 56,
        tags: ['monitor', 'curved', 'gaming', 'ultrawide', 'msi']
      }
    ];

    // Insert all products
    const insertedProducts = await Product.insertMany(products);
    console.log(`Successfully inserted ${insertedProducts.length} products`);

    console.log('Products by category:');
    const laptopCount = products.filter(p => p.category.equals(categoryMap['laptops'])).length;
    const componentCount = products.filter(p => p.category.equals(categoryMap['components'])).length;
    const pcCount = products.filter(p => p.category.equals(categoryMap['gaming-pcs'])).length;
    const monitorCount = products.filter(p => p.category.equals(categoryMap['monitors'])).length;
    
    console.log(`- Laptops: ${laptopCount}`);
    console.log(`- Components: ${componentCount}`);
    console.log(`- Gaming PCs: ${pcCount}`);
    console.log(`- Monitors: ${monitorCount}`);

  } catch (error) {
    console.error('Error seeding products:', error);
    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedProducts();