// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Chat functionality
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('chatContainer');
    const closeChat = document.getElementById('closeChat');
    const closeChatAI = document.getElementById('closeChatAI');
    const backToMenu = document.getElementById('backToMenu');

    // AI Chat elements
    const defaultHeader = document.getElementById('defaultHeader');
    const aiHeader = document.getElementById('aiHeader');
    const chatOptions = document.getElementById('chatOptions');
    const chatMessages = document.getElementById('chatMessages');
    const chatInputContainer = document.getElementById('chatInputContainer');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typingIndicator');

    let isAIMode = false;
    let isTyping = false;
    let sessionId = null; // Track session ID

    // Check if elements exist before adding event listeners
    if (chatToggle && chatContainer && closeChat) {
        chatToggle.addEventListener('click', function() {
            chatContainer.classList.add('open');
            chatToggle.classList.add('hidden');
        });

        closeChat.addEventListener('click', function() {
            closeChats();
        });

        if (closeChatAI) {
            closeChatAI.addEventListener('click', function() {
                closeChats();
            });
        }

        if (backToMenu) {
            backToMenu.addEventListener('click', function() {
                exitAIMode();
            });
        }

        // AI Chat input events
        if (sendBtn) {
            sendBtn.addEventListener('click', function() {
                sendMessage();
            });
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }

        // Auto-show chat after some time (optional)
        setTimeout(function() {
            if (!chatContainer.classList.contains('open')) {
                const dot = document.querySelector('.notification-dot');
                if (dot) {
                    dot.style.animation = 'pulse 1s infinite';
                }
            }
        }, 5000);

        // Hide chat when clicking outside (optional)
        document.addEventListener('click', function(event) {
            if (!chatContainer.contains(event.target) && !chatToggle.contains(event.target)) {
                if (chatContainer.classList.contains('open')) {
                    closeChats();
                }
            }
        });
    }

    function closeChats() {
        chatContainer.classList.remove('open');
        chatToggle.classList.remove('hidden');
        if (isAIMode) {
            exitAIMode();
        }
    }

    function exitAIMode() {
        isAIMode = false;
        chatContainer.classList.remove('ai-mode');
        
        // Hide AI elements
        if (aiHeader) aiHeader.style.display = 'none';
        if (chatMessages) chatMessages.classList.remove('show');
        if (chatInputContainer) chatInputContainer.classList.remove('show');
        
        // Show default elements
        if (defaultHeader) defaultHeader.style.display = 'block';
        if (chatOptions) chatOptions.style.display = 'block';
    }

    // Global functions
    window.startAIChat = function() {
        isAIMode = true;
        chatContainer.classList.add('ai-mode');
        
        // Hide default elements
        if (defaultHeader) defaultHeader.style.display = 'none';
        if (chatOptions) chatOptions.style.display = 'none';
        
        // Show AI elements
        if (aiHeader) aiHeader.style.display = 'flex';
        if (chatMessages) chatMessages.classList.add('show');
        if (chatInputContainer) chatInputContainer.classList.add('show');
        
        // Test AI connection
        testAIConnection();
        
        // Focus on input
        if (chatInput) {
            chatInput.focus();
        }
        
        scrollToBottom();
    };

    // FIXED: Updated sendMessage function with better validation
    window.sendMessage = async function() {
        const message = chatInput?.value.trim();
        
        // Validate message before sending
        if (!message) {
            console.log('Empty message, not sending');
            return;
        }
        
        if (isTyping) {
            console.log('Already processing a message');
            return;
        }

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        showTyping();

        try {
            // Call the real AI API
            const response = await generateAIResponse(message);
            hideTyping();
            addMessage(response, 'bot');
        } catch (error) {
            hideTyping();
            console.error('Error getting AI response:', error);
            addMessage('Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.', 'bot');
        }
    };

    window.sendQuickResponse = function(message) {
        if (chatInput && message?.trim()) {
            chatInput.value = message.trim();
            sendMessage();
        }
    };

    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = `message-avatar ${type}-avatar`;
        avatar.textContent = type === 'user' ? '👤' : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Handle line breaks in AI responses
        if (text.includes('\n')) {
            content.innerHTML = text.replace(/\n/g, '<br>');
        } else {
            content.textContent = text;
        }
        
        if (type === 'user') {
            messageDiv.appendChild(content);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
        }
        
        chatMessages?.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTyping() {
        isTyping = true;
        typingIndicator?.classList.add('show');
        scrollToBottom();
    }

    function hideTyping() {
        isTyping = false;
        typingIndicator?.classList.remove('show');
    }

    function scrollToBottom() {
        setTimeout(() => {
            chatMessages?.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // FIXED: Corrected AI Response function - removed timestamp field
    async function generateAIResponse(message) {
        try {
            console.log('Sending message to AI:', message);
            
            // Prepare request body - only send fields the backend expects
            const requestBody = {
                message: message.trim()
            };
            
            // Include sessionId if we have one
            if (sessionId) {
                requestBody.sessionId = sessionId;
            }
            
            console.log('Request body:', requestBody);
            
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            // Handle different response statuses
            if (response.status === 400) {
                const errorData = await response.json();
                console.error('Validation error:', errorData);
                throw new Error(errorData.reply || errorData.error || 'Invalid request');
            }

            if (response.status === 429) {
                const errorData = await response.json();
                console.error('Rate limit error:', errorData);
                throw new Error(errorData.reply || 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một chút.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.reply || errorData.error || 'Server error'}`);
            }

            const data = await response.json();
            console.log('AI Response data:', data);
            
            // Store sessionId for future requests
            if (data.sessionId) {
                sessionId = data.sessionId;
                console.log('Session ID stored:', sessionId);
            }
            
            if (data.success && data.reply) {
                return data.reply;
            } else {
                throw new Error(data.error || 'Invalid response from AI service');
            }
            
        } catch (error) {
            console.error('AI Chat Error:', error);
            
            // Return appropriate fallback based on error type
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.';
            }
            
            if (error.message.includes('500')) {
                return 'Hệ thống AI tạm thời gặp sự cố. Vui lòng liên hệ nhân viên hỗ trợ để được giúp đỡ.';
            }

            if (error.message.includes('400')) {
                return 'Tin nhắn không hợp lệ. Vui lòng thử lại với tin nhắn khác.';
            }

            if (error.message.includes('429')) {
                return error.message; // Use the rate limit message from server
            }
            
            // Provide contextual fallback responses
            return getFallbackResponse(message);
        }
    }

    // Fallback responses when AI is not available
    function getFallbackResponse(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('laptop') || msg.includes('máy tính xách tay')) {
            return `Chúng tôi có nhiều dòng laptop chất lượng:\n\n• Gaming Laptops: Acer Predator, ASUS ROG, MSI\n• Business Laptops: Dell XPS, ThinkPad\n• Budget Laptops: Từ 10-15 triệu\n\nVui lòng xem trang /laptops.html hoặc liên hệ nhân viên để được tư vấn chi tiết.`;
        }
        
        if (msg.includes('gaming') || msg.includes('game')) {
            return `TechStore chuyên gaming gear:\n\n• Gaming PCs: 20-80 triệu\n• Gaming Laptops: 15-50 triệu\n• Gaming Monitors: 5-25 triệu\n• Gaming Accessories\n\nXem thêm tại /gaming-pcs.html hoặc liên hệ tư vấn!`;
        }
        
        if (msg.includes('giá') || msg.includes('price') || msg.includes('bao nhiêu')) {
            return 'Để báo giá chính xác, vui lòng cung cấp:\n• Tên sản phẩm cụ thể\n• Cấu hình mong muốn\n• Ngân sách dự kiến\n\nNhân viên sẽ tư vấn giá tốt nhất!';
        }
        
        if (msg.includes('đơn hàng') || msg.includes('order')) {
            return 'Để kiểm tra đơn hàng, vui lòng cung cấp:\n• Mã đơn hàng\n• Email đặt hàng\n• Số điện thoại\n\nHoặc truy cập /orders.html để xem lịch sử đơn hàng.';
        }
        
        if (msg.includes('bảo hành') || msg.includes('warranty')) {
            return 'Chính sách bảo hành TechStore:\n\n• Laptop: 12-24 tháng\n• Desktop PC: 24-36 tháng\n• Linh kiện: 12-36 tháng\n• Hỗ trợ kỹ thuật miễn phí\n\nXem chi tiết tại trang chính sách bảo hành.';
        }
        
        if (msg.includes('giao hàng') || msg.includes('ship')) {
            return 'Chính sách giao hàng:\n\n• Miễn phí giao hàng đơn từ 500k\n• Giao nhanh 2-4h tại TP.HCM\n• Giao toàn quốc 1-3 ngày\n• Kiểm tra hàng trước thanh toán';
        }

        // Default response
        return 'Xin chào! Tôi có thể giúp bạn:\n\n• Tìm sản phẩm phù hợp\n• Tư vấn cấu hình\n• Kiểm tra đơn hàng\n• Thông tin bảo hành\n• Chính sách cửa hàng\n\nBạn cần hỗ trợ gì?';
    }

    // Add connection status indicator
    function updateConnectionStatus(isConnected) {
        const statusDot = document.querySelector('.ai-status-dot');
        if (statusDot) {
            if (isConnected) {
                statusDot.style.backgroundColor = '#4CAF50';
                statusDot.title = 'AI Online';
            } else {
                statusDot.style.backgroundColor = '#f44336';
                statusDot.title = 'AI Offline - Using fallback responses';
            }
        }
    }

    // Test if AI service is available
    async function testAIConnection() {
        try {
            console.log('Testing AI connection...');
            const response = await fetch('/api/ai/chat/health');
            const isHealthy = response.ok;
            
            if (isHealthy) {
                const data = await response.json();
                console.log('AI Health Check:', data);
            }
            
            updateConnectionStatus(isHealthy);
        } catch (error) {
            console.warn('AI service not available, using fallback responses:', error);
            updateConnectionStatus(false);
        }
    }

    // Clear session when chat is closed
    function closeChats() {
        chatContainer.classList.remove('open');
        chatToggle.classList.remove('hidden');
        
        // Reset session
        sessionId = null;
        
        if (isAIMode) {
            exitAIMode();
        }
    }
});

// Chat option functions (keeping your existing functions)
function startStaffChat() {
    alert('Đang kết nối với nhân viên tư vấn...');
    // Here you would typically open a chat widget or redirect to a chat page
}

function startCall() {
    // Replace with your actual phone number
    window.location.href = 'tel:+84123456789';
}