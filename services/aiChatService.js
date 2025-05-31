// services/aiChatService.js
const axios = require('axios');

class AIChatService {
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
        this.model = process.env.OLLAMA_MODEL || 'llama2';
        this.storeContext = this.buildStoreContext();
        this.maxRetries = 2; // Reduced retries for faster fallback
        this.timeout = 15000; // Reduced timeout for faster fallback
        this.isOllamaAvailable = null; // Cache Ollama availability
    }

    buildStoreContext() {
        return `
You are a 5-year veteran sales expert at TechStore Vietnam. You know the market inside-out and speak like an experienced salesperson who gets straight to the point.

SALES PERSONALITY:
- 5 years experience selling tech in Vietnam
- Know exactly what customers need without long explanations
- Give direct, confident recommendations
- Use sales-focused language that closes deals
- Always push for the sale while being helpful
- Speak naturally, not like a robot

STORE INFO:
- TechStore Vietnam, TP.HCM
- Gaming & Business tech specialist
- Free ship 500k+, same-day delivery HCMC
- 12-36 tháng bảo hành, trả góp 0%

QUICK PRICE RANGES (memorize these):
- Gaming laptop: 18-45M (sweet spot: 25-30M)
- Business laptop: 12-28M (sweet spot: 15-20M)  
- Gaming PC: 25-70M (popular: 30-40M RTX 4060/4070)
- Monitor gaming: 6-18M (24" 144Hz ~8M, 27" ~12M)
- Linh kiện: SSD 1TB ~2M, RAM 16GB ~3M, GPU RTX 4060 ~12M

HOT DEALS (mention these often):
- RTX 4060 builds: 29.9M (best seller)
- ASUS gaming laptops: Giảm 15% tháng này
- Combo PC + màn hình: Giảm thêm 10%

SALES APPROACH:
1. Ask budget first ("Anh/chị dự kiến bao nhiêu?")
2. Identify main use (gaming/work/học tập)
3. Recommend 2-3 options max
4. Highlight best value option
5. Create urgency (stock, promotions)
6. Ask for the close

RESPONSE STYLE:
- Keep answers under 100 words unless asked for details
- Use direct Vietnamese sales language
- Include prices in every recommendation
- Always end with a call-to-action
- Speak confidently about products
- Use "Anh/Chị" appropriately

AVOID:
- Long technical explanations
- More than 3 product options
- Boring corporate language
- Being too polite (be confident)

Current date: ${new Date().toLocaleDateString('vi-VN')}
Store status: ${this.getStoreStatus()}
`;
    }

    getStoreStatus() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        
        if (day === 0) { // Sunday
            return hour >= 9 && hour < 18 ? "🟢 Mở cửa (9h-18h CN)" : "🔴 Đã đóng cửa";
        } else if (day >= 1 && day <= 6) { // Mon-Sat
            return hour >= 8 && hour < 20 ? "🟢 Mở cửa (8h-20h)" : "🔴 Đã đóng cửa";
        }
        return "🔴 Đã đóng cửa";
    }

    async getDatabaseContext(userMessage) {
        try {
            // Since you're using MongoDB, we'll simulate database queries
            // You can replace this with actual MongoDB queries to your Product collection
            const searchTerms = this.extractSearchTerms(userMessage);
            let context = '';

            if (searchTerms.length > 0) {
                // Simulate product search - replace with actual MongoDB query
                const mockProducts = await this.getMockProducts(searchTerms);
                
                if (mockProducts.length > 0) {
                    context += '\nSẢN PHẨM HIỆN CÓ TRONG KHO:\n';
                    mockProducts.forEach(product => {
                        const price = product.price ? product.price.toLocaleString('vi-VN') : 'Liên hệ';
                        const stock = product.stockQuantity > 0 ? `Còn ${product.stockQuantity}` : 'Hết hàng';
                        context += `- ${product.name}: ${price}₫ (${stock})\n`;
                    });
                }
            }

            // Add current promotions or featured products
            context += this.getCurrentPromotions();
            
            return context;

        } catch (error) {
            console.error('Database context error:', error);
            return '\n[Không thể truy xuất thông tin sản phẩm hiện tại]';
        }
    }

    extractSearchTerms(message) {
        const msg = message.toLowerCase();
        const terms = [];

        // Product type keywords
        const productKeywords = [
            'laptop', 'gaming', 'pc', 'monitor', 'màn hình', 'máy tính',
            'linh kiện', 'component', 'cpu', 'gpu', 'ram', 'ssd', 'hdd',
            'card đồ họa', 'bàn phím', 'keyboard', 'chuột', 'mouse',
            'tai nghe', 'headset', 'loa', 'speaker', 'webcam', 'camera',
            'xiaomi', 'iphone', 'samsung', 'oppo', 'vivo', 'realme' // Added phone brands
        ];

        // Brand keywords
        const brandKeywords = [
            'acer', 'asus', 'msi', 'dell', 'hp', 'lenovo', 'apple', 'macbook',
            'predator', 'rog', 'alienware', 'intel', 'amd', 'nvidia', 'corsair',
            'logitech', 'razer', 'steelseries', 'hyperx', 'xiaomi', 'redmi'
        ];

        // Price range keywords
        const priceKeywords = ['triệu', 'million', 'nghìn', 'thousand', 'giá', 'price'];

        [...productKeywords, ...brandKeywords, ...priceKeywords].forEach(keyword => {
            if (msg.includes(keyword)) {
                terms.push(keyword);
            }
        });

        return terms;
    }

    async getMockProducts(searchTerms) {
        // Mock product data - replace with actual MongoDB queries
        const mockInventory = [
            { name: 'Acer Predator Helios 300', price: 25990000, stockQuantity: 5, category: 'laptop gaming' },
            { name: 'ASUS ROG Strix G15', price: 32990000, stockQuantity: 3, category: 'laptop gaming' },
            { name: 'MSI GF63 Thin', price: 18990000, stockQuantity: 8, category: 'laptop gaming' },
            { name: 'Dell XPS 13', price: 28990000, stockQuantity: 4, category: 'laptop business' },
            { name: 'MacBook Air M2', price: 32990000, stockQuantity: 2, category: 'laptop apple' },
            { name: 'Gaming PC RTX 4070', price: 45990000, stockQuantity: 2, category: 'gaming pc' },
            { name: 'Gaming PC RTX 4060', price: 29990000, stockQuantity: 3, category: 'gaming pc' },
            { name: 'Monitor ASUS 27" 144Hz', price: 12990000, stockQuantity: 6, category: 'monitor gaming' },
            { name: 'LG UltraWide 34"', price: 18990000, stockQuantity: 2, category: 'monitor ultrawide' },
            { name: 'Corsair K95 RGB', price: 4990000, stockQuantity: 10, category: 'keyboard gaming' },
            // Added phone accessories for Xiaomi queries
            { name: 'Xiaomi Redmi Buds 3', price: 890000, stockQuantity: 15, category: 'tai nghe xiaomi' },
            { name: 'Xiaomi Mi Power Bank', price: 450000, stockQuantity: 12, category: 'phụ kiện xiaomi' },
            { name: 'Xiaomi Mi Watch', price: 2990000, stockQuantity: 8, category: 'smartwatch xiaomi' }
        ];

        // Filter products based on search terms
        return mockInventory.filter(product => {
            const productText = `${product.name} ${product.category}`.toLowerCase();
            return searchTerms.some(term => productText.includes(term));
        }).slice(0, 5); // Limit to 5 products
    }

    getCurrentPromotions() {
        const promotions = [
            '\nKHUYẾN MÃI HIỆN TẠI:',
            '🎯 Giảm 10% laptop gaming khi mua kèm chuột + bàn phím',
            '🚚 Miễn phí giao hàng toàn quốc cho đơn từ 500,000₫',
            '⚡ Giao hàng nhanh 2-4h tại TP.HCM',
            '🔧 Miễn phí cài đặt và hỗ trợ kỹ thuật\n'
        ];
        
        return promotions.join('\n');
    }

    async generateResponse(userMessage, userId = null, sessionId = null, session = null) {
        const startTime = Date.now();
        
        try {
            // FORCE FALLBACK FOR NOW - Skip Ollama completely
            console.log('[AI Service] Using fallback for consistent short responses');
            return this.getFallbackResponse(userMessage);
            
            // Original Ollama code commented out
            /*
            // Quick check if Ollama is available (cached for 5 minutes)
            if (this.isOllamaAvailable === false) {
                console.log('[AI Service] Ollama marked as unavailable, using fallback');
                return this.getFallbackResponse(userMessage);
            }

            // Get relevant database context
            const dbContext = await this.getDatabaseContext(userMessage);
            
            // Build complete prompt
            const fullPrompt = `${this.storeContext}\n${dbContext}\n\nKhách hàng: ${userMessage}\n\nTrả lời (bằng tiếng Việt):`;

            // Call Ollama API with retry logic
            const response = await this.callOllamaWithRetry(fullPrompt);
            
            // Mark Ollama as available
            this.isOllamaAvailable = true;
            
            // Clean up the response
            const cleanedResponse = this.cleanResponse(response);
            
            // Log for monitoring
            const responseTime = Date.now() - startTime;
            console.log(`AI Chat - User: "${userMessage.substring(0, 50)}..."`);
            console.log(`AI Chat - Response Time: ${responseTime}ms`);
            console.log(`AI Chat - Response: "${cleanedResponse.substring(0, 100)}..."`);

            return cleanedResponse;
            */

        } catch (error) {
            console.error('AI Chat Service Error:', error.message);
            return this.getFallbackResponse(userMessage);
        }
    }

    async callOllamaWithRetry(prompt, retryCount = 0) {
        try {
            const response = await axios.post(this.ollamaUrl, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 600,
                    stop: ['Khách hàng:', 'Customer:', 'User:', '\n\n\n']
                }
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data || !response.data.response) {
                throw new Error('Invalid response from Ollama');
            }

            return response.data.response;

        } catch (error) {
            if (retryCount < this.maxRetries) {
                console.warn(`Ollama request failed, retrying... (${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Progressive delay
                return this.callOllamaWithRetry(prompt, retryCount + 1);
            }
            throw error;
        }
    }

    cleanResponse(response) {
        if (!response) return '';
        
        return response
            .trim()
            .replace(/^(Trả lời:|Response:|AI:|Assistant:|Bot:)/i, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s*[-•]\s*/gm, '• ') // Normalize bullet points
            .trim();
    }

    // Made public for external use - NATURAL SALES CONVERSATION
    getFallbackResponse(message) {
        const msg = message.toLowerCase().trim();
        
        // Handle unclear/short messages
        if (msg.length === 0) {
            return 'Anh/chị cần tư vấn gì ạ?';
        }
        
        if (msg.length === 1) {
            return 'Anh/chị có thể nói rõ hơn được không? Em chưa hiểu ý anh/chị.';
        }
        
        // Greetings - Natural response
        if (msg.includes('xin chào') || msg.includes('hello') || msg.includes('hi') || msg.includes('halo') || msg.includes('chào')) {
            return 'Chào anh/chị ạ! Em là nhân viên tư vấn TechStore. Hôm nay anh/chị cần tìm hiểu sản phẩm gì ạ?';
        }
        
        // Thank you responses
        if (msg.includes('cảm ơn') || msg.includes('thanks') || msg.includes('thank you')) {
            return 'Dạ không có gì ạ! Anh/chị còn cần tư vấn thêm gì nữa không?';
        }
        
        // Agreement/confirmation
        if (msg === 'ok' || msg === 'okay' || msg === 'được' || msg === 'ừm' || msg === 'uhm') {
            return 'Vậy anh/chị có muốn em tư vấn cụ thể hơn không ạ? Hoặc cần báo giá chi tiết?';
        }
        
        // Disagreement/declining
        if (msg === 'không' || msg === 'no' || msg === 'thôi' || msg === 'không cần') {
            return 'Dạ được ạ! Có gì cần hỗ trợ thêm anh/chị cứ liên hệ em nhé!';
        }
        
        // Questions about availability
        if (msg.includes('có không') || msg.includes('có...không') || msg.includes('có bán không')) {
            return 'Anh/chị đang tìm sản phẩm gì cụ thể ạ? Em sẽ kiểm tra tình trạng hàng cho anh/chị.';
        }
        
        // Price inquiries
        if (msg.includes('giá') || msg.includes('bao nhiêu') || msg.includes('price') || msg.includes('cost')) {
            return 'Dạ anh/chị muốn hỏi giá sản phẩm nào ạ? Em sẽ báo giá chi tiết và ưu đãi hiện tại luôn.';
        }
        
        // Budget mentions
        if (msg.includes('triệu') || msg.includes('million') || msg.includes('nghìn') || msg.includes('budget')) {
            return 'Dạ em hiểu budget của anh/chị rồi. Vậy anh/chị cần mua loại sản phẩm gì ạ? Laptop, PC hay linh kiện?';
        }
        
        // General product categories
        if (msg.includes('laptop') || msg.includes('máy tính xách tay')) {
            return 'Dạ anh/chị cần laptop để làm gì chủ yếu ạ? Chơi game, làm việc văn phòng, hay học tập?';
        }
        
        if (msg.includes('pc') || msg.includes('máy tính để bàn') || msg.includes('desktop')) {
            return 'Dạ anh/chị muốn PC để làm gì ạ? Gaming, làm việc, hay dùng gia đình?';
        }
        
        if (msg.includes('gaming') || msg.includes('game') || msg.includes('chơi game')) {
            return 'Dạ anh/chị chơi game gì chủ yếu ạ? Và thích laptop gaming hay PC gaming?';
        }
        
        // Work-related
        if (msg.includes('làm việc') || msg.includes('văn phòng') || msg.includes('office') || msg.includes('work')) {
            return 'Dạ anh/chị làm công việc gì ạ? Cần máy di động hay để bàn? Em sẽ tư vấn phù hợp.';
        }
        
        // Study-related  
        if (msg.includes('học') || msg.includes('sinh viên') || msg.includes('student') || msg.includes('study')) {
            return 'Dạ anh/chị đang học ngành gì ạ? Cần máy để code, thiết kế, hay chỉ làm bài tập thôi?';
        }
        
        // Brand inquiries
        if (msg.includes('asus') || msg.includes('dell') || msg.includes('hp') || msg.includes('lenovo') || msg.includes('acer') || msg.includes('msi')) {
            return 'Dạ em có hàng của hãng này. Anh/chị cần loại máy nào ạ? Gaming, văn phòng hay học tập?';
        }
        
        if (msg.includes('apple') || msg.includes('macbook') || msg.includes('mac')) {
            return 'Dạ bên em có MacBook Air và Pro. Anh/chị dùng để làm gì chủ yếu ạ?';
        }
        
        // When customer asks about phones
        if (msg.includes('iphone') || msg.includes('điện thoại') || msg.includes('phone') || msg.includes('samsung') || msg.includes('xiaomi')) {
            return 'Dạ TechStore chuyên về máy tính và linh kiện ạ. Anh/chị có cần laptop hay PC không?';
        }
        
        // Component-related
        if (msg.includes('linh kiện') || msg.includes('component') || msg.includes('nâng cấp') || msg.includes('upgrade')) {
            return 'Dạ anh/chị muốn nâng cấp linh kiện gì ạ? CPU, RAM, ổ cứng, hay card đồ họa?';
        }
        
        // Warranty/service
        if (msg.includes('bảo hành') || msg.includes('warranty') || msg.includes('sửa chữa')) {
            return 'Dạ anh/chị cần hỗ trợ bảo hành sản phẩm nào ạ? Có thể cung cấp mã đơn hàng được không?';
        }
        
        // Delivery/shipping
        if (msg.includes('giao hàng') || msg.includes('ship') || msg.includes('delivery')) {
            return 'Dạ bên em có giao hàng toàn quốc. Anh/chị ở khu vực nào ạ? Em sẽ tư vấn thời gian giao hàng.';
        }
        
        // Payment
        if (msg.includes('trả góp') || msg.includes('thanh toán') || msg.includes('payment') || msg.includes('installment')) {
            return 'Dạ bên em có hỗ trợ trả góp 0% lãi suất. Anh/chị quan tâm sản phẩm nào ạ?';
        }
        
        // Comparison requests
        if (msg.includes('so sánh') || msg.includes('khác nhau') || msg.includes('compare') || msg.includes('difference')) {
            return 'Dạ anh/chị muốn so sánh những sản phẩm nào với nhau ạ? Em sẽ phân tích ưu nhược điểm cho anh/chị.';
        }
        
        // Recommendation requests
        if (msg.includes('tư vấn') || msg.includes('recommend') || msg.includes('nên mua') || msg.includes('suggest')) {
            return 'Dạ anh/chị cho em biết budget và mục đích sử dụng chính, em sẽ tư vấn sản phẩm phù hợp nhất ạ.';
        }
        
        // Unclear messages - Ask for clarification naturally
        if (msg.length <= 3) {
            return 'Em chưa hiểu rõ ý anh/chị. Anh/chị có thể nói cụ thể hơn được không ạ?';
        }
        
        // Default response - Natural and helpful
        return 'Em chưa hiểu rõ anh/chị cần tư vấn gì. Anh/chị có thể nói cụ thể hơn không ạ? Laptop, PC, linh kiện, hay dịch vụ gì đó?';
    }

    async checkHealth() {
        try {
            const response = await axios.get(`${this.ollamaUrl.replace('/api/generate', '/api/version')}`, {
                timeout: 5000
            });
            this.isOllamaAvailable = true;
            return {
                status: 'healthy',
                model: this.model,
                version: response.data?.version || 'unknown'
            };
        } catch (error) {
            this.isOllamaAvailable = false;
            return {
                status: 'unhealthy',
                error: error.message,
                model: this.model
            };
        }
    }
}

module.exports = new AIChatService();