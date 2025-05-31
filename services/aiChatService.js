// services/aiChatService.js
const mongoose = require('mongoose');

// Import your models
const Product = require('../models/product');
const Category = require('../models/category');
const Order = require('../models/order');
const User = require('../models/user');

class AIChatService {
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
        this.model = process.env.OLLAMA_MODEL || 'llama2';
        this.storeContext = this.buildStoreContext();
        this.maxRetries = 2;
        this.timeout = 15000;
        this.isOllamaAvailable = null;
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
`;
    }

    async getDatabaseContext(userMessage, userId = null) {
        try {
            const searchTerms = this.extractSearchTerms(userMessage);
            let context = '';

            if (userId) {
                context += await this.getUserContext(userId);
            }

            if (searchTerms.length > 0) {
                const products = await this.searchProducts(searchTerms);
                if (products.length > 0) {
                    context += '\nSẢN PHẨM HIỆN CÓ:\n';
                    products.forEach(product => {
                        const priceVND = product.price ? Math.round(product.price * 25000) : 0;
                        const price = priceVND > 0 ? priceVND.toLocaleString('vi-VN') + '₫' : 'Liên hệ';
                        const stock = product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng';
                        const discount = product.isOnSale && product.discount ? ` -${product.discount}%` : '';
                        context += `- ${product.name}: ${price} (${stock})${discount}\n`;
                    });
                }
            }

            context += await this.getCurrentPromotions();
            return context;

        } catch (error) {
            console.error('Database context error:', error);
            return '';
        }
    }

    async getUserContext(userId) {
        try {
            const recentOrders = await Order.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(2)
                .lean();

            if (recentOrders.length > 0) {
                let context = '\nĐƠN HÀNG GẦN ĐÂY:\n';
                recentOrders.forEach(order => {
                    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
                    const totalVND = Math.round(order.total * 25000).toLocaleString('vi-VN');
                    const statusVN = this.translateOrderStatus(order.status);
                    context += `- ${order.orderNumber}: ${totalVND}₫ (${statusVN})\n`;
                });
                return context;
            }
        } catch (error) {
            console.error('User context error:', error);
        }
        return '';
    }

    async getUserPersonalInfo(userId) {
        try {
            const Address = require('../models/address');
            const user = await User.findById(userId).select('firstName lastName email phone').lean();
            const addresses = await Address.find({ user: userId }).lean();
            
            if (user) {
                let userInfo = `\n👤 ${user.firstName} ${user.lastName}\n📧 ${user.email}\n`;
                if (user.phone) userInfo += `📱 ${user.phone}\n`;
                
                if (addresses && addresses.length > 0) {
                    userInfo += '\n📍 ĐỊA CHỈ:\n';
                    addresses.forEach((addr, index) => {
                        const isDefault = addr.isDefault ? ' (Mặc định)' : '';
                        userInfo += `${index + 1}. ${addr.firstName} ${addr.lastName}${isDefault}\n`;
                        userInfo += `   ${addr.street}, ${addr.city}\n`;
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
            'cancelled': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    async searchProducts(searchTerms) {
        try {
            const searchQuery = {
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { name: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { description: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { brand: { $regex: searchTerms.join('|'), $options: 'i' } },
                            { tags: { $in: searchTerms.map(term => new RegExp(term, 'i')) } }
                        ]
                    }
                ]
            };

            const products = await Product.find(searchQuery)
                .select('name price stock brand isOnSale discount')
                .sort({ isFeatured: -1, isOnSale: -1, stock: -1 })
                .limit(3)
                .lean();

            return products;
        } catch (error) {
            console.error('Product search error:', error);
            return [];
        }
    }

    extractSearchTerms(message) {
        const msg = message.toLowerCase();
        const terms = [];

        const keywords = [
            'laptop', 'gaming', 'pc', 'monitor', 'màn hình', 'máy tính',
            'linh kiện', 'cpu', 'gpu', 'ram', 'ssd', 'rtx', '4060', '4070', '4080', '4090',
            'acer', 'asus', 'msi', 'dell', 'hp', 'lenovo', 'nvidia', 'intel', 'amd'
        ];

        keywords.forEach(keyword => {
            if (msg.includes(keyword)) {
                terms.push(keyword);
            }
        });

        return [...new Set(terms)];
    }

    async getCurrentPromotions() {
        try {
            const saleProducts = await Product.find({ 
                isOnSale: true, 
                isActive: true,
                discount: { $gt: 0 }
            })
            .select('name discount')
            .sort({ discount: -1 })
            .limit(2)
            .lean();

            let promotions = '\n🔥 KHUYẾN MÃI:\n';
            if (saleProducts.length > 0) {
                saleProducts.forEach(product => {
                    promotions += `- ${product.name}: -${product.discount}%\n`;
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
            const dbContext = await this.getDatabaseContext(userMessage, userId);
            const conversationHistory = this.getConversationHistory(session);
            const response = await this.getEnhancedFallbackResponse(userMessage, dbContext, userId, conversationHistory);
            
            console.log(`[AI Chat] Response time: ${Date.now() - startTime}ms`);
            return response;

        } catch (error) {
            console.error('AI Chat Service Error:', error.message);
            return 'Xin lỗi, em gặp sự cố. Anh/chị thử lại được không ạ?';
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
                return 'Tuyệt! Anh/chị dùng laptop để gaming, làm việc hay học tập ạ?';
            }
            
            if (intents.includes('gaming_preference')) {
                return 'Perfect for gaming! Anh/chị thường chơi game nào để em tư vấn cấu hình phù hợp ạ?';
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
            return `Chào anh/chị! ${hasHistory ? 'Em thấy anh/chị đã mua hàng rồi. ' : ''}Hôm nay cần tư vấn gì ạ?`;
        }
        
        // Product searches
        if (dbContext.includes('SẢN PHẨM HIỆN CÓ')) {
            const products = dbContext.split('SẢN PHẨM HIỆN CÓ:')[1].split('🔥 KHUYẾN MÃI:')[0];
            return `Perfect! Em tìm thấy:${products}Anh/chị quan tâm sản phẩm nào ạ?`;
        }
        
        // Laptop queries
        if (msg.includes('laptop')) {
            return 'Great choice! I\'d recommend laptop phù hợp với nhu cầu anh/chị. Dùng để gaming, làm việc hay học tập ạ?';
        }
        
        // Gaming queries
        if (msg.includes('gaming') || msg.includes('game')) {
            return 'Perfect for gaming! Anh/chị thích PC hay laptop gaming? Em sẽ tư vấn cấu hình phù hợp!';
        }
        
        // PC queries
        if (msg.includes(' pc ') || msg.includes('máy tính bàn')) {
            return 'Great choice! Gaming PC rất mạnh cho anh/chị. Budget khoảng bao nhiêu để em tư vấn ạ?';
        }
        
        // Price queries
        if (msg.includes('giá') || msg.includes('bao nhiêu')) {
            return 'Dạ em sẽ báo giá chính xác! Anh/chị cho em biết tên sản phẩm cụ thể nhé?';
        }
        
        // Order queries
        if (msg.includes('đơn hàng') || msg.includes('order')) {
            if (dbContext.includes('ĐƠN HÀNG GẦN ĐÂY')) {
                const orders = dbContext.split('ĐƠN HÀNG GẦN ĐÂY:')[1].split('🔥')[0];
                return `Dạ đây là đơn hàng gần đây:${orders}Cần check đơn nào cụ thể ạ?`;
            }
            return 'Để check đơn hàng, anh/chị cho em mã đơn hoặc email đặt hàng nhé?';
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

    async checkHealth() {
        try {
            const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
            return {
                status: 'healthy',
                model: this.model,
                database: dbStatus,
                version: 'concise-style'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = new AIChatService();