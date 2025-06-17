// services/aiChatService.js
const mongoose = require('mongoose');
const Groq = require('groq-sdk');

// Import your actual models with correct paths
const Product = require('../models/product');
const Category = require('../models/category');
const Order = require('../models/order');
const User = require('../models/user');
const Address = require('../models/address');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');

class AIChatService {
    constructor() {
        // Initialize Groq instead of Ollama
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        this.model = 'llama-3.1-8b-instant';
        this.storeContext = this.buildStoreContext();
        this.maxRetries = 2;
        this.timeout = 15000;
        this.useGroq = !!process.env.GROQ_API_KEY;
    }

    buildStoreContext() {
        return `
Bạn là nhân viên tư vấn TechStore Vietnam - chuyên về máy tính và gaming gear.

RESPONSE STYLE:
- Keep responses to 2-3 sentences maximum
- Start with friendly greeting if new conversation
- Use "Great choice!" "Perfect for..." "I'd recommend..."
- Ask ONE specific question, not multiple
- Be enthusiastic but concise
- End with ONE action item

CRITICAL: No long paragraphs. Be brief and direct while staying friendly.

STORE INFO:
- TechStore Vietnam - TP.HCM
- Gaming laptops, PCs, components, monitors
- Free ship 500k+, 2-4h delivery HCMC
- 12-36 month warranty, 0% installment

Date: ${new Date().toLocaleDateString('vi-VN')}

IMPORTANT: Always respond in Vietnamese unless customer uses English.
`;
    }

    async getDatabaseContext(userMessage, userId = null) {
        try {
            console.log('[Database Context] Processing message:', userMessage);
            
            const searchTerms = this.extractSearchTerms(userMessage);
            let context = '';

            // Get user context if logged in
            if (userId) {
                context += await this.getUserContext(userId);
                context += await this.getCartContext(userId);
            }

            // Search for products and pass userMessage for better sorting
            if (searchTerms.length > 0 || this.isProductQuery(userMessage)) {
                console.log('[Database Context] Search terms found:', searchTerms);
                const products = await this.searchProducts(searchTerms, userMessage);
                
                if (products.length > 0) {
                    console.log('[Database Context] Products found:', products.length);
                    context += '\nSẢN PHẨM HIỆN CÓ:\n';
                    products.forEach(product => {
                        const priceVND = product.price ? Math.round(product.price * 25000) : 0;
                        const compareAtPriceVND = product.compareAtPrice ? Math.round(product.compareAtPrice * 25000) : 0;
                        
                        const price = priceVND > 0 ? priceVND.toLocaleString('vi-VN') + '₫' : 'Liên hệ';
                        const originalPrice = compareAtPriceVND > priceVND ? ` (Gốc: ${compareAtPriceVND.toLocaleString('vi-VN')}₫)` : '';
                        const stock = product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng';
                        const discount = product.isOnSale && product.discount ? ` -${product.discount}%` : '';
                        const rating = product.rating > 0 ? ` ⭐${product.rating}/5` : '';
                        
                        context += `- ${product.name}: ${price}${originalPrice} (${stock})${discount}${rating}\n`;
                        if (product.shortDescription) {
                            context += `  💡 ${product.shortDescription}\n`;
                        }
                    });
                } else {
                    console.log('[Database Context] No products found for terms:', searchTerms);
                }
            }

            // Always add promotions
            context += await this.getCurrentPromotions();
            
            console.log('[Database Context] Final context length:', context.length);
            return context;

        } catch (error) {
            console.error('Database context error:', error);
            return '';
        }
    }

    // New method to detect if user is asking about products
    isProductQuery(message) {
        const msg = message.toLowerCase();
        
        // Price-related queries
        if (msg.includes('giá') || msg.includes('price') || msg.includes('bao nhiêu')) {
            return true;
        }
        
        // Product name queries
        const productPatterns = [
            /lg.*27gn950/i,
            /acer.*predator/i,
            /helios.*300/i,
            /rtx.*4080/i,
            /nvidia.*rtx/i,
            /intel.*i9/i,
            /corsair.*vengeance/i,
            /samsung.*odyssey/i,
            /dell.*xps/i,
            /asus.*rog/i,
            /techstore.*titan/i,
            /techstore.*voyager/i
        ];
        
        return productPatterns.some(pattern => pattern.test(msg));
    }

    // Improved extractSearchTerms method
    extractSearchTerms(message) {
        const msg = message.toLowerCase();
        const terms = [];

        console.log('[Extract Search] Processing message:', msg);

        // Vietnamese to English translation mapping
        const vietnameseToEnglish = {
            'màn hình': 'monitor',
            'man hinh': 'monitor', 
            'màn': 'monitor',
            'máy tính': 'computer',
            'may tinh': 'computer',
            'laptop': 'laptop',
            'máy tính xách tay': 'laptop',
            'pc': 'pc',
            'chuột': 'mouse',
            'bàn phím': 'keyboard',
            'ban phim': 'keyboard',
            'tai nghe': 'headphone',
            'headphone': 'headphone',
            'loa': 'speaker',
            'ram': 'ram',
            'ssd': 'ssd',
            'ổ cứng': 'storage',
            'o cung': 'storage',
            'card đồ họa': 'graphics',
            'card do hoa': 'graphics',
            'gpu': 'gpu',
            'cpu': 'cpu',
            'bo mạch chủ': 'motherboard',
            'mainboard': 'motherboard'
        };

        // Price-related queries - should trigger product search
        const priceQueries = [
            'giá', 'price', 'bao nhiêu', 'rẻ nhất', 're nhat', 'cheapest', 
            'đắt nhất', 'dat nhat', 'expensive', 'mắc nhất', 'mac nhat',
            'giá rẻ', 'gia re', 'cheap', 'budget', 'tiền', 'tien'
        ];
        // Add this to the price queries section
const orderQueries = ['đặt gì', 'mua gì', 'order', 'đơn hàng', 'purchased', 'bought'];

orderQueries.forEach(orderWord => {
    if (msg.includes(orderWord)) {
        // Don't add product search terms for order queries
        return []; // Return empty to avoid product search
    }
});

        // Check for price queries and add relevant product terms
        let hasPriceQuery = false;
        priceQueries.forEach(priceWord => {
            if (msg.includes(priceWord)) {
                hasPriceQuery = true;
                
                // If asking about cheapest/most expensive, detect the product category
                if (msg.includes('laptop') || msg.includes('máy tính xách tay')) {
                    terms.push('laptop');
                } else if (msg.includes('màn') || msg.includes('monitor')) {
                    terms.push('monitor');
                } else if (msg.includes('pc') || msg.includes('máy tính')) {
                    terms.push('pc', 'computer');
                } else if (msg.includes('gaming') || msg.includes('game')) {
                    terms.push('gaming', 'laptop', 'pc');
                }
            }
        });

        // Translate Vietnamese terms to English
        Object.keys(vietnameseToEnglish).forEach(vietnamese => {
            if (msg.includes(vietnamese)) {
                terms.push(vietnameseToEnglish[vietnamese]);
                console.log('[Extract Search] Translated:', vietnamese, '→', vietnameseToEnglish[vietnamese]);
            }
        });

        // Enhanced keyword matching
        const keywords = [
            // Categories - English terms that match your database
            'laptop', 'gaming', 'pc', 'monitor', 'computer', 'desktop',
            'component', 'cpu', 'gpu', 'ram', 'ssd', 'storage',
            'mouse', 'keyboard', 'headphone', 'speaker',
            
            // GPU Models
            'rtx', '4060', '4070', '4080', '4090', 'nvidia', 'geforce',
            'gtx', 'rx', '6800', '7900',
            
            // Brands - check if these match your database
            'acer', 'asus', 'msi', 'dell', 'hp', 'lenovo', 'apple', 'samsung',
            'lg', 'corsair', 'logitech', 'razer', 'steelseries', 'nvidia', 
            'intel', 'amd', 'google', 'techstore',
            
            // Product lines
            'predator', 'helios', 'ultragear', 'rog', 'swift', 'odyssey',
            'vengeance', 'spectre', 'thinkpad', 'xps', 'pixelbook',
            'titan', 'voyager', 'scout', 'creator', 'maximus', 'artymis'
        ];

        // Check general keywords
        keywords.forEach(keyword => {
            if (msg.includes(keyword)) {
                terms.push(keyword);
            }
        });

        // Specific product model detection
        const productPatterns = [
            { pattern: /27gn950/i, term: '27gn950' },
            { pattern: /odyssey.*g9/i, term: 'odyssey' },
            { pattern: /dell.*xps/i, term: 'dell xps' },
            { pattern: /thinkpad/i, term: 'thinkpad' },
            { pattern: /predator.*helios/i, term: 'predator helios' },
            { pattern: /rog.*swift/i, term: 'rog swift' },
            { pattern: /ultragear/i, term: 'ultragear' },
            { pattern: /artymis/i, term: 'artymis' }
        ];

        productPatterns.forEach(({ pattern, term }) => {
            if (pattern.test(msg)) {
                terms.push(term);
                console.log('[Extract Search] Found product pattern:', term);
            }
        });

        // Extract model numbers and technical specs
        const words = msg.split(/\s+/);
        words.forEach(word => {
            // Model numbers with 4+ digits
            if (/\d{4,}/.test(word)) {
                terms.push(word);
            }
            // Technical specs
            if (/^(ddr[45]|pcie|nvme|sata|usb|hdmi|rtx|gtx)/i.test(word)) {
                terms.push(word);
            }
        });

        const uniqueTerms = [...new Set(terms)];
        console.log('[Extract Search] Final terms:', uniqueTerms);
        
        // If we detected a price query but no product terms, add generic search
        if (hasPriceQuery && uniqueTerms.length === 0) {
            console.log('[Extract Search] Price query detected, adding general terms');
            return ['laptop', 'monitor', 'pc']; // Search all main categories
        }
        
        return uniqueTerms;
    }

    // Improved searchProducts method
    async searchProducts(searchTerms, userMessage = '') {
        try {
            console.log('[Product Search] Starting search with terms:', searchTerms);
            
            if (!searchTerms || searchTerms.length === 0) {
                console.log('[Product Search] No search terms provided');
                return [];
            }

            // Build comprehensive search query
            const searchQuery = {
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { name: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { description: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { shortDescription: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { brand: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { tags: { $in: searchTerms.map(term => new RegExp(term, 'i')) } },
                            { specs: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { modelNumber: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { sku: { $regex: searchTerms.join('|'), $options: 'i' } }
                        ]
                    }
                ]
            };

            console.log('[Product Search] Query:', JSON.stringify(searchQuery, null, 2));

            // Determine sorting based on user message
            let sortCriteria = { 
                isFeatured: -1,
                isOnSale: -1, 
                rating: -1,
                stock: -1
            };

            const msg = userMessage.toLowerCase();
            if (msg.includes('rẻ nhất') || msg.includes('re nhat') || msg.includes('cheapest') || msg.includes('giá rẻ')) {
                sortCriteria = { price: 1 }; // Sort by price ascending (cheapest first)
                console.log('[Product Search] Sorting by cheapest price');
            } else if (msg.includes('đắt nhất') || msg.includes('dat nhat') || msg.includes('mắc nhất') || msg.includes('expensive')) {
                sortCriteria = { price: -1 }; // Sort by price descending (most expensive first)
                console.log('[Product Search] Sorting by highest price');
            }

            const products = await Product.find(searchQuery)
                .select('name price compareAtPrice stock brand isOnSale discount shortDescription rating reviewCount modelNumber sku')
                .sort(sortCriteria)
                .limit(5)
                .lean();

            console.log('[Product Search] Found products:', products.length);
            
            if (products.length > 0) {
                console.log('[Product Search] Sample product:', products[0].name, 'Price:', products[0].price);
                
                // Log price range for debugging
                const prices = products.map(p => p.price).filter(p => p > 0);
                if (prices.length > 0) {
                    console.log('[Product Search] Price range:', Math.min(...prices), 'to', Math.max(...prices));
                }
            }

            return products;
        } catch (error) {
            console.error('Product search error:', error);
            return [];
        }
    }
async getUserContext(userId) {
    try {
        const recentOrders = await Order.find({ user: userId })
            .populate('items.product', 'name price') // Add this line to get product details
            .sort({ createdAt: -1 })
            .limit(2)
            .lean();

        if (recentOrders.length > 0) {
            let context = '\nĐƠN HÀNG GẦN ĐÂY:\n';
            recentOrders.forEach(order => {
                const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
                const totalVND = Math.round(order.total * 25000).toLocaleString('vi-VN');
                const statusVN = this.translateOrderStatus(order.status);
                context += `- ${order.orderNumber}: ${totalVND}₫ (${statusVN}) - ${orderDate}\n`;
                
                // Add order items details
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        const itemPrice = Math.round(item.price * 25000).toLocaleString('vi-VN');
                        context += `  * ${item.product?.name || 'Sản phẩm'}: ${itemPrice}₫ x${item.quantity}\n`;
                    });
                }
            });
            return context;
        }
    } catch (error) {
        console.error('User context error:', error);
    }
    return '';
}

    async getCartContext(userId) {
        try {
            const cart = await Cart.findOne({ userId }).lean();
            if (cart && cart.items && cart.items.length > 0) {
                const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
                return `\nGIỎ HÀNG: ${itemCount} sản phẩm\n`;
            }
        } catch (error) {
            console.error('Cart context error:', error);
        }
        return '';
    }

    async getUserPersonalInfo(userId) {
        try {
            const user = await User.findById(userId).select('firstName lastName email phone').lean();
            const addresses = await Address.find({ user: userId }).lean();
            
            if (user) {
                let userInfo = `\n👤 ${user.firstName} ${user.lastName}\n📧 ${user.email}\n`;
                if (user.phone) userInfo += `📱 ${user.phone}\n`;
                
                if (addresses && addresses.length > 0) {
                    userInfo += '\n📍 ĐỊA CHỈ:\n';
                    addresses.forEach((addr, index) => {
                        const isDefault = addr.isDefault ? ' (Mặc định)' : '';
                        const addressType = addr.addressType === 'home' ? 'Nhà riêng' : 
                                          addr.addressType === 'work' ? 'Công ty' : 'Khác';
                        userInfo += `${index + 1}. ${addressType}${isDefault}:\n`;
                        userInfo += `   ${addr.firstName} ${addr.lastName}\n`;
                        userInfo += `   ${addr.street}${addr.apartment ? ', ' + addr.apartment : ''}\n`;
                        userInfo += `   ${addr.city}, ${addr.state}, ${addr.country}\n`;
                        userInfo += `   SĐT: ${addr.phone}\n`;
                    });
                }
                return userInfo;
            }
        } catch (error) {
            console.error('User personal info error:', error);
        }
        return '';
    }

    translateOrderStatus(status) {
        const statusMap = {
            'pending': 'Đang xử lý',
            'processing': 'Đang chuẩn bị', 
            'shipped': 'Đã gửi',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy',
            'refunded': 'Đã hoàn tiền'
        };
        return statusMap[status] || status;
    }

    async getCurrentPromotions() {
        try {
            const saleProducts = await Product.find({ 
                isOnSale: true, 
                isActive: true,
                discount: { $gt: 0 }
            })
            .select('name discount price')
            .sort({ discount: -1, isFeatured: -1 })
            .limit(2)
            .lean();

            let promotions = '\n🔥 KHUYẾN MÃI:\n';
            if (saleProducts.length > 0) {
                saleProducts.forEach(product => {
                    const priceVND = Math.round(product.price * 25000).toLocaleString('vi-VN');
                    promotions += `- ${product.name}: -${product.discount}% (${priceVND}₫)\n`;
                });
            }
            promotions += '🚚 Free ship 500k+ | ⚡ Giao 2-4h TPHCM\n';
            return promotions;
        } catch (error) {
            return '\n🔥 Nhiều ưu đãi hấp dẫn!\n';
        }
    }

    async generateResponse(userMessage, userId = null, sessionId = null, session = null) {
        const startTime = Date.now();
        
        try {
            // Get database context (your existing logic)
            const dbContext = await this.getDatabaseContext(userMessage, userId);
            const conversationHistory = this.getConversationHistory(session);
            
            // Try Groq first if available
            if (this.useGroq) {
                try {
                    const groqResponse = await this.getGroqResponse(userMessage, dbContext, conversationHistory);
                    if (groqResponse) {
                        console.log(`[AI Chat] Groq response time: ${Date.now() - startTime}ms`);
                        return groqResponse;
                    }
                } catch (groqError) {
                    console.error('Groq API error, falling back:', groqError.message);
                }
            }
            
            // Fallback to enhanced responses if Groq fails
            const response = await this.getEnhancedFallbackResponse(userMessage, dbContext, userId, conversationHistory);
            
            console.log(`[AI Chat] Fallback response time: ${Date.now() - startTime}ms`);
            return response;

        } catch (error) {
            console.error('AI Chat Service Error:', error.message);
            return 'Xin lỗi, em gặp sự cố. Anh/chị thử lại được không ạ?';
        }
    }

    // Improved Groq response method
    async getGroqResponse(userMessage, dbContext, conversationHistory = '') {
        try {
            let systemPrompt = this.storeContext;
            
            if (dbContext && dbContext.trim()) {
                systemPrompt += `\n\nDỮ LIỆU HIỆN TẠI:\n${dbContext}`;
                systemPrompt += `\n\nCRITICAL: ONLY use exact product names and prices from DỮ LIỆU HIỆN TẠI above. DO NOT make up or guess any product information. If order data shows specific products, use those exact names.`;            }
            
            if (conversationHistory && conversationHistory.lastBotMessage) {
                systemPrompt += `\n\nTIN NHẮN TRƯỚC: ${conversationHistory.lastBotMessage}`;
            }
            
            systemPrompt += `\n\nHÃY TRẢ LỜI NGẮN GỌN (1-2 câu) VÀ CHỈ DỰA VÀO DỮ LIỆU ĐƯỢC CUNG CẤP.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: systemPrompt 
                    },
                    { 
                        role: "user", 
                        content: userMessage 
                    }
                ],
                model: this.model,
                max_tokens: 150,
                temperature: 0.3, // Lower temperature for more accuracy
                top_p: 0.8,
                stream: false
            });

            const response = completion.choices[0]?.message?.content?.trim();
            
            if (response && response.length > 10) {
                return response;
            }
            
            return null;
            
        } catch (error) {
            console.error('Groq API error:', error.message);
            throw error;
        }
    }

    getConversationHistory(session) {
        if (!session || !session.messages) {
            return { lastBotMessage: '', lastUserMessage: '', context: '' };
        }
        
        const recentMessages = session.messages.slice(-4);
        let lastBotMessage = '';
        
        for (let i = recentMessages.length - 1; i >= 0; i--) {
            if (recentMessages[i].role === 'assistant' && !lastBotMessage) {
                lastBotMessage = recentMessages[i].content;
                break;
            }
        }
        
        return { lastBotMessage, lastUserMessage: '', context: '' };
    }

    extractIntentFromBotMessage(botMessage) {
        const msg = botMessage.toLowerCase();
        const intents = [];
        
        if (msg.includes('muốn thêm địa chỉ') || msg.includes('thêm địa chỉ')) {
            intents.push('add_address');
        }
        if (msg.includes('quan tâm sản phẩm nào') || msg.includes('sản phẩm nào')) {
            intents.push('product_interest');
        }
        if (msg.includes('budget') || msg.includes('bao nhiêu')) {
            intents.push('budget_question');
        }
        if (msg.includes('laptop để làm gì') || msg.includes('mục đích')) {
            intents.push('usage_purpose');
        }
        if (msg.includes('chơi game gì') || msg.includes('game nào')) {
            intents.push('gaming_preference');
        }
        if (msg.includes('pc hay laptop') || msg.includes('lựa chọn')) {
            intents.push('device_choice');
        }
        if (msg.includes('vào giỏ hàng') || msg.includes('thêm vào giỏ')) {
            intents.push('add_to_cart');
        }
        if (msg.includes('wishlist') || msg.includes('yêu thích')) {
            intents.push('add_to_wishlist');
        }
        
        return intents;
    }

    generateContextualResponse(userMessage, intents) {
        const msg = userMessage.toLowerCase().trim();
        
        // Positive responses
        if (msg.includes('muốn') || msg.includes('có') || msg.includes('được') || 
            msg.includes('yes') || msg.includes('ok') || msg.includes('đồng ý')) {
            
            if (intents.includes('add_address')) {
                return 'Perfect! Anh/chị vào Tài khoản → Địa chỉ → Thêm mới để thêm địa chỉ nhé. Có cần em hướng dẫn thêm không ạ?';
            }
            
            if (intents.includes('product_interest')) {
                return 'Great choice! Em sẽ tư vấn chi tiết cho anh/chị. Anh/chị cho em biết tên sản phẩm hoặc budget dự kiến nhé?';
            }
            
            if (intents.includes('usage_purpose')) {
                return 'Tuyệt! Anh/chị dùng để gaming, làm việc hay học tập ạ?';
            }
            
            if (intents.includes('gaming_preference')) {
                return 'Perfect for gaming! Anh/chị thường chơi game nào để em tư vấn cấu hình phù hợp ạ?';
            }

            if (intents.includes('add_to_cart')) {
                return 'Great! Sản phẩm đã thêm vào giỏ hàng. Anh/chị muốn tiếp tục mua sắm hay thanh toán luôn ạ?';
            }
            
            return 'Great! Em sẵn sàng hỗ trợ anh/chị. Anh/chị cần tư vấn gì cụ thể ạ?';
        }
        
        // Negative responses
        if (msg.includes('không') || msg.includes('thôi') || msg.includes('no')) {
            return 'Dạ được ạ! Anh/chị có cần hỗ trợ gì khác không? Em luôn sẵn sàng tư vấn!';
        }
        
        return null;
    }

    async getEnhancedFallbackResponse(message, dbContext, userId, conversationHistory = '') {
        const msg = message.toLowerCase().trim();
        
        if (msg.length <= 1) {
            return 'Em chưa hiểu rõ ý anh/chị. Anh/chị nói cụ thể hơn được không ạ?';
        }
        
        // Context-aware responses
        if (conversationHistory && conversationHistory.lastBotMessage) {
            const intents = this.extractIntentFromBotMessage(conversationHistory.lastBotMessage);
            if (intents.length > 0) {
                const contextualResponse = this.generateContextualResponse(message, intents);
                if (contextualResponse) return contextualResponse;
            }
        }

        // Cart queries
        if (msg.includes('giỏ hàng') || msg.includes('cart')) {
            if (userId) {
                if (dbContext.includes('GIỎ HÀNG')) {
                    const cartInfo = dbContext.split('GIỎ HÀNG:')[1].split('\n')[0];
                    return `Dạ giỏ hàng hiện có${cartInfo}. Anh/chị muốn xem chi tiết hay thanh toán ạ?`;
                } else {
                    return 'Giỏ hàng của anh/chị đang trống. Anh/chị muốn xem sản phẩm nào ạ?';
                }
            }
            return 'Anh/chị cần đăng nhập để xem giỏ hàng ạ. Em có thể tư vấn sản phẩm nào khác không?';
        }
        
        // Personal info queries
        if (msg.includes('thông tin') && (msg.includes('tôi') || msg.includes('account'))) {
            if (userId) {
                const userInfo = await this.getUserPersonalInfo(userId);
                if (userInfo) {
                    return `Dạ đây là thông tin của anh/chị:${userInfo}Cần cập nhật gì không ạ?`;
                }
            }
            return 'Anh/chị cần đăng nhập để xem thông tin tài khoản ạ. Em có thể hỗ trợ gì khác không?';
        }
        
        // Address queries
        if (msg.includes('địa chỉ')) {
            if (userId) {
                const userInfo = await this.getUserPersonalInfo(userId);
                if (userInfo && userInfo.includes('ĐỊA CHỈ')) {
                    return `Dạ đây là địa chỉ đã lưu:${userInfo.split('📍 ĐỊA CHỈ:')[1]}Anh/chị muốn thêm địa chỉ mới không ạ?`;
                } else {
                    return 'Anh/chị chưa có địa chỉ nào được lưu. Muốn thêm địa chỉ mới không ạ?';
                }
            }
            return 'Anh/chị cần đăng nhập để xem địa chỉ đã lưu ạ. Cần hỗ trợ gì về giao hàng không?';
        }
        
        // Greetings
        if (msg.includes('chào') || msg.includes('hello') || msg.includes('hi')) {
            const hasHistory = dbContext.includes('ĐƠN HÀNG');
            const hasCart = dbContext.includes('GIỎ HÀNG');
            let greeting = `Chào anh/chị! ${hasHistory ? 'Em thấy anh/chị đã mua hàng rồi. ' : ''}`;
            if (hasCart) greeting += 'Có sản phẩm trong giỏ hàng rồi. ';
            return greeting + 'Hôm nay cần tư vấn gì ạ?';
        }
        
        // Product searches - PRIORITY CHECK
        if (dbContext.includes('SẢN PHẨM HIỆN CÓ')) {
            const products = dbContext.split('SẢN PHẨM HIỆN CÓ:')[1].split('🔥 KHUYẾN MÃI:')[0];
            return `Perfect! Em tìm thấy:${products}Anh/chị quan tâm sản phẩm nào ạ?`;
        }

        // Price queries with product search
        if (msg.includes('giá') || msg.includes('bao nhiêu')) {
            if (dbContext.includes('SẢN PHẨM HIỆN CÓ')) {
                const products = dbContext.split('SẢN PHẨM HIỆN CÓ:')[1].split('🔥 KHUYẾN MÃI:')[0];
                return `Perfect! Đây là giá sản phẩm anh/chị hỏi:${products}Cần tư vấn thêm về sản phẩm nào ạ?`;
            }
            return 'Dạ em sẽ báo giá chính xác! Anh/chị cho em biết tên sản phẩm cụ thể nhé?';
        }
        
        // Specific product name queries
        if (msg.includes('lg') || msg.includes('ultragear') || msg.includes('27gn950') ||
            msg.includes('acer') || msg.includes('predator') || msg.includes('helios') ||
            msg.includes('rtx') || msg.includes('nvidia') || msg.includes('asus') ||
            msg.includes('samsung') || msg.includes('dell') || msg.includes('hp') ||
            msg.includes('techstore') || msg.includes('titan') || msg.includes('voyager')) {
            
            if (dbContext.includes('SẢN PHẨM HIỆN CÓ')) {
                const products = dbContext.split('SẢN PHẨM HIỆN CÓ:')[1].split('🔥 KHUYẾN MÃI:')[0];
                return `Great choice! Em tìm thấy sản phẩm này:${products}Anh/chị muốn tìm hiểu thêm gì ạ?`;
            }
            return `Em đang tìm sản phẩm đó cho anh/chị. Anh/chị có thể nói rõ hơn tên sản phẩm không ạ?`;
        }

        // Category queries (only if no products found)
        if (msg.includes('laptop') && !dbContext.includes('SẢN PHẨM HIỆN CÓ')) {
            return 'Great choice! Anh/chị dùng laptop để gaming, làm việc hay học tập ạ? Em sẽ tư vấn phù hợp!';
        }
        
        if ((msg.includes('gaming') || msg.includes('game')) && !dbContext.includes('SẢN PHẨM HIỆN CÓ')) {
            return 'Perfect for gaming! Anh/chị thích PC hay laptop gaming? Em sẽ tư vấn cấu hình phù hợp!';
        }
        
        if ((msg.includes(' pc ') || msg.includes('máy tính bàn')) && !dbContext.includes('SẢN PHẨM HIỆN CÓ')) {
            return 'Great choice! Gaming PC rất mạnh cho anh/chị. Budget khoảng bao nhiêu để em tư vấn ạ?';
        }
        // Order queries - IMPROVED
if (msg.includes('đơn hàng') || msg.includes('order') || msg.includes('đặt gì') || msg.includes('mua gì')) {
    if (dbContext.includes('ĐƠN HÀNG GẦN ĐÂY')) {
        const orders = dbContext.split('ĐƠN HÀNG GẦN ĐÂY:')[1].split('🔥')[0];
        return `Dạ đây là đơn hàng gần đây của anh/chị:${orders}Cần hỗ trợ gì về đơn hàng này ạ?`;
    }
    return 'Để xem chi tiết đơn hàng, anh/chị cho em mã đơn hoặc đăng nhập vào tài khoản nhé?';
}
        
        // Warranty
        if (msg.includes('bảo hành')) {
            return 'TechStore bảo hành 12-36 tháng tùy sản phẩm. Anh/chị cần bảo hành sản phẩm nào ạ?';
        }
        
        // Shipping
        if (msg.includes('giao hàng') || msg.includes('ship')) {
            return 'Free ship từ 500k, giao 2-4h tại TPHCM! Anh/chị ở khu vực nào ạ?';
        }
        
        // Thanks
        if (msg.includes('cảm ơn') || msg.includes('thanks')) {
            return 'Dạ không có gì! Anh/chị còn cần tư vấn gì nữa không ạ?';
        }
        
        // Default response
        const promotions = dbContext.includes('🔥 KHUYẾN MÃI:') ? 
            dbContext.split('🔥 KHUYẾN MÃI:')[1] : '🔥 Nhiều ưu đãi hấp dẫn!';
        
        return `Em chưa hiểu rõ ý anh/chị. TechStore chuyên gaming laptop, PC, linh kiện!${promotions}Anh/chị cần tư vấn gì ạ?`;
    }

    // Keep the original fallback for emergencies
    getFallbackResponse(message) {
        return 'Dạ anh/chị có thể nói rõ hơn được không ạ? Em sẽ tư vấn tốt nhất cho anh/chị!';
    }

    async checkHealth() {
        try {
            const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
            let groqStatus = 'disabled';
            
            if (this.useGroq) {
                try {
                    // Quick test of Groq API
                    await this.groq.chat.completions.create({
                        messages: [{ role: "user", content: "test" }],
                        model: this.model,
                        max_tokens: 1
                    });
                    groqStatus = 'connected';
                } catch {
                    groqStatus = 'error';
                }
            }
            
            return {
                status: 'healthy',
                model: this.useGroq ? 'groq-llama-3.1-8b-instant' : 'enhanced-fallback',
                database: dbStatus,
                groq: groqStatus,
                version: 'groq-integration-v3'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    // Test method for Groq (optional)
    async testGroq() {
        if (!this.useGroq) {
            return 'Groq not configured - missing API key';
        }
        
        try {
            const response = await this.getGroqResponse("xin chào", "", "");
            console.log("Groq test response:", response);
            return response;
        } catch (error) {
            console.error("Groq test failed:", error.message);
            return null;
        }
    }
}

module.exports = new AIChatService();